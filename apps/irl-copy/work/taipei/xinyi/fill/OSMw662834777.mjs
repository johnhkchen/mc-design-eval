import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834777";
const W = 20, H = 33, D = 22;

// Footprint: [x, z, ground]. Shift so the lowest ground is y 0.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr - minG))));
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Outward faces.
const FACES = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
];

// Distance from the outer edge (1 = perimeter), 4-neighbour BFS.
const dist = new Map();
const queue = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (FACES.some(f => !ground.has(`${x + f.dx},${z + f.dz}`))) {
    dist.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(`${x},${z}`);
  for (const f of FACES) {
    const nx = x + f.dx, nz = z + f.dz, key = `${nx},${nz}`;
    if (ground.has(key) && !dist.has(key)) {
      dist.set(key, d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Entrance: a south-facing perimeter cell nearest the middle of the width.
let entrance = null;
{
  const cands = [];
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (dist.get(k) !== 1) continue;
    const f = FACES.find(f => !ground.has(`${x + f.dx},${z + f.dz}`));
    if (f && f.dz === 1) cands.push({ x, z, gr, f });
  }
  if (cands.length === 0) {
    for (const [k, gr] of ground) {
      const [x, z] = k.split(",").map(Number);
      if (dist.get(k) !== 1) continue;
      const f = FACES.find(f => !ground.has(`${x + f.dx},${z + f.dz}`));
      if (f) cands.push({ x, z, gr, f });
    }
  }
  cands.sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2));
  entrance = cands[0] ?? null;
}

// Find the deepest interior cell for the roof mast.
let mastCell = null, mastD = -1;
for (const [k, d] of dist) {
  if (d > mastD) { mastD = d; mastCell = k.split(",").map(Number); }
}

const ROOF_DECK = 20;   // roof slab top sits at y 20
const TOP_FLOOR_END = 19;

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof deck over the whole footprint.
  put(x, ROOF_DECK, z, "smooth_stone");

  // Interior floor slabs at storey lines (skip where below ground).
  if (d > 1) {
    for (const y of [5, 10, 15]) {
      if (y >= gr) put(x, y, z, "light_gray_concrete");
    }
  }

  // Facade on perimeter cells.
  if (d === 1) {
    const face = FACES.find(f => !ground.has(`${x + f.dx},${z + f.dz}`));
    const u = face.dz !== 0 ? x : z;   // position along the face
    for (let y = gr; y <= TOP_FLOOR_END; y++) {
      const floor = Math.floor(y / 5);
      const l = y % 5;
      let id;
      if (y === TOP_FLOOR_END) {
        id = "quartz_block";                       // cornice
      } else if (floor === 0) {
        if (y === 0) id = "polished_granite";      // base course
        else if (y === 4) id = "black_concrete";   // shop sign band
        else id = (u % 3 === 0) ? "white_concrete" : "light_blue_stained_glass";
      } else {
        if (l === 0 || l === 4) id = "white_concrete";          // spandrels
        else if (u % 3 === 0) id = "white_concrete";            // piers
        else if (l === 2 && (u + floor * 2) % 9 === 0) id = "glowstone"; // warm lit bay
        else id = "light_blue_stained_glass";
      }
      put(x, y, z, id);
    }
    // Parapet on the roof edge.
    put(x, ROOF_DECK + 1, z, "stone_bricks");
  }

  // Crown setback: solid core from distance 5 inward, with a glass band on the ring.
  if (d >= 5) {
    for (let y = ROOF_DECK + 1; y <= ROOF_DECK + 3; y++) {
      let id = "light_gray_concrete";
      if (d === 5) id = (y === ROOF_DECK + 2) ? "light_blue_stained_glass" : "quartz_block";
      put(x, y, z, id);
    }
    put(x, ROOF_DECK + 4, z, "smooth_stone");
  } else if (d > 1) {
    // Roof terrace in the gap between parapet and crown: low planters.
    if ((x + z) % 4 === 0) put(x, ROOF_DECK + 1, z, "moss_block");
  }
}

// Entrance: door on the south face, flanked by piers already in the shopfront.
if (entrance && entrance.gr <= 3) {
  const { x, z, gr, f } = entrance;
  const facing = f.facing;
  put(x, gr, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof mast on the deepest interior cell.
if (mastCell) {
  const [mx, mz] = mastCell;
  for (let y = ROOF_DECK + 5; y <= ROOF_DECK + 7; y++) {
    put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
