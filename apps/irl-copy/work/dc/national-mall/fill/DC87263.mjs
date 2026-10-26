import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87263";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 33, D = 34;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const STOREY = 3;

// ---- footprint + lidar record --------------------------------------------
const map = new Map();
for (const [x, z, gr, ro] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  map.set(key(x, z), {
    x, z,
    ground: Math.max(0, Math.round(gr)),
    roof: Math.round(ro),
  });
}

// ---- depth from outside: 1 = exterior wall ring, >=2 = interior ----------
const depth = new Map();
const queue = [];
for (const c of map.values()) {
  const exposed = NB.some(([dx, dz]) => !map.has(key(c.x + dx, c.z + dz)));
  if (exposed) { depth.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of NB) {
    const k = key(c.x + dx, c.z + dz);
    if (map.has(k) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push(map.get(k));
    }
  }
}

// ---- smooth lidar roof noise, then quantise to a flat 3-block tier grid --
const minGround = Math.min(...[...map.values()].map(c => c.ground));
for (const c of map.values()) {
  let sum = 2 * c.roof, wsum = 2;
  for (const [dx, dz] of NB) {
    const n = map.get(key(c.x + dx, c.z + dz));
    if (n) { sum += n.roof; wsum += 1; }
  }
  const avg = sum / wsum;
  let top = STOREY * Math.round(avg / STOREY);
  top = Math.max(top, c.ground + STOREY);
  top = Math.min(top, H - 5);
  c.top = top;
}

// ---- entrance: exterior cell on the lowest-z edge nearest mean x ---------
const exteriorCells = [...map.values()].filter(c => depth.get(key(c.x, c.z)) === 1);
const minZ = Math.min(...exteriorCells.map(c => c.z));
const northEdge = exteriorCells.filter(c => c.z === minZ);
const meanX = northEdge.reduce((s, c) => s + c.x, 0) / northEdge.length;
const doorCell = northEdge.reduce((best, c) =>
  Math.abs(c.x - meanX) < Math.abs(best.x - meanX) ? c : best, northEdge[0]);
const doorKey = key(doorCell.x, doorCell.z);
const doorSideKeys = new Set([
  key(doorCell.x - 1, doorCell.z), key(doorCell.x + 1, doorCell.z),
]);

// ---- roof equipment: one plant room near the centre of the roof ----------
const cx = [...map.values()].reduce((s, c) => s + c.x, 0) / map.size;
const cz = [...map.values()].reduce((s, c) => s + c.z, 0) / map.size;
const plantCandidates = [...map.values()]
  .filter(c => depth.get(key(c.x, c.z)) >= 3 && c.top >= Math.max(...[...map.values()].map(m => m.top)) - STOREY)
  .sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
const plant = plantCandidates[0];
const plantKeys = new Set();
if (plant) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = key(plant.x + dx, plant.z + dz);
    if (map.has(k)) plantKeys.add(k);
  }
}

// ---- build ---------------------------------------------------------------
const GLASS_PROPS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const c of map.values()) {
  const k = key(c.x, c.z);
  const d = depth.get(k);
  const wall = d === 1;
  const { x, z, ground, top } = c;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y <= top; y++) {
    const rel = y - ground;

    if (y === top) {
      if (wall) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (rel % STOREY === 0) {
      // base course at grade and storey lines (floor slab / spandrel)
      if (wall) g.set(x, y, z, rel === 0 ? "stone_bricks" : "smooth_stone");
      else g.set(x, y, z, "smooth_stone");
      continue;
    }

    // storey body: rel % 3 in {1,2}
    if (!wall) continue; // interior air gap behind the glass

    const isGround = rel < STOREY;

    if (k === doorKey && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
    } else if (doorSideKeys.has(k) && isGround) {
      // stone surround flanking the entrance
      g.set(x, y, z, "stone_bricks");
    } else if ((x + z) % 3 === 0) {
      // brick pier between window bays
      g.set(x, y, z, isGround ? "stone_bricks" : "bricks");
    } else {
      g.set(x, y, z, "glass_pane", GLASS_PROPS);
    }
  }

  // Warm light behind a few upper-storey windows (sparse)
  if (d === 2 && c.top - ground >= 2 * STOREY) {
    for (let y = ground + STOREY + 1; y < top - 1; y += STOREY) {
      if ((x * 3 + z * 5 + y) % 23 === 0) g.set(x, y, z, "glowstone");
    }
  }

  // Roof plant room: one block mass with a cap, on the roof deck
  if (plantKeys.has(k) && top + 2 <= H - 1) {
    g.set(x, top + 1, z, "stone_bricks");
    g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
