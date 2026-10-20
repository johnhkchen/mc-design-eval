import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001382";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 29, D = 14;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const K = (x, z) => `${x},${z}`;
const raw = new Map();
for (const c of cells) {
  const [x, z, ground, roof] = c;
  raw.set(K(x, z), { x, z, gr: Math.max(0, Math.round(ground)), roof: Number(roof) });
}
const has = (x, z) => raw.has(K(x, z));

// Smooth the lidar roof over a 3x3 neighbourhood into clean flat tiers
const cellMap = new Map();
for (const c of raw.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(K(c.x + dx, c.z + dz));
    if (o) { sum += o.roof; n++; }
  }
  let T = Math.round(sum / n);
  T = Math.max(T, c.gr + 6);
  T = Math.min(T, H - 6);
  cellMap.set(K(c.x, c.z), { x: c.x, z: c.z, gr: c.gr, T });
}

const perimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: street-facing (low z) perimeter cell nearest the middle along its wall
const doorCands = [];
for (const c of cellMap.values()) {
  if (!has(c.x, c.z - 1) && perimeter(c.x, c.z)) doorCands.push(c);
}
let doorKey = null;
if (doorCands.length) {
  doorCands.sort((a, b) => a.x - b.x);
  const mid = doorCands[Math.floor(doorCands.length / 2)];
  doorKey = K(mid.x, mid.z);
}
const doorFacing = (x, z) =>
  !has(x, z - 1) ? "north" : !has(x, z + 1) ? "south" : !has(x - 1, z) ? "west" : "east";

// Pass 1: foundations, interior core, facades
for (const c of cellMap.values()) {
  const { x, z, gr, T } = c;
  const per = perimeter(x, z);

  for (let y = 0; y < gr; y++) put(x, y, z, per ? "stone_bricks" : "stone");

  if (!per) {
    for (let y = gr; y < T; y++) put(x, y, z, y === T - 1 ? "smooth_stone" : "bricks");
    continue;
  }

  const xMiss = !has(x - 1, z) || !has(x + 1, z);
  const zMiss = !has(x, z - 1) || !has(x, z + 1);
  const index = xMiss && !zMiss ? z : zMiss && !xMiss ? x : x + z;
  // Stone piers every 3rd column, brick spandrel infill; corners always piers
  const pier = index % 3 === 0 || (xMiss && zMiss);
  const isDoor = K(x, z) === doorKey;
  // Door surround: cells flanking the door are stone jambs
  const jamb = doorKey && !isDoor && (() => {
    const [dx0, dz0] = doorKey.split(",").map(Number);
    return z === dz0 && Math.abs(x - dx0) === 1;
  })();
  const facing = doorFacing(x, z);

  for (let y = gr; y < T; y++) {
    const h = y - gr;

    if (h === 0) {
      put(x, y, z, "polished_granite");
    } else if (y === T - 1) {
      // Parapet cap
      put(x, y, z, "smooth_stone");
    } else if (y === T - 2) {
      // Cornice band with dentil-like alternation
      put(x, y, z, index % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks");
    } else if (h <= 2) {
      // Shopfront
      if (isDoor) {
        put(x, y, z, "dark_oak_door", {
          facing,
          half: h === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (jamb || pier) {
        put(x, y, z, "stone_bricks");
      } else {
        put(x, y, z, "glass");
      }
    } else if (h === 3) {
      // Fascia; over the door a dark lintel marks the entrance
      put(x, y, z, isDoor || jamb ? "dark_oak_planks" : "smooth_stone");
    } else {
      // Upper storeys, 3-block bays: stone string course, then window rows
      const r = (h - 4) % 3;
      if (r === 0) {
        put(x, y, z, "smooth_stone");
      } else if (pier) {
        put(x, y, z, "stone_bricks");
      } else if (r === 1) {
        // Window head: stone lintel row above the glass
        put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      } else {
        // Glass, with the occasional warm lit window behind it
        const lit = (index * 5 + y * 3 + x) % 13 === 0;
        put(x, y, z, lit ? "glowstone" : "glass");
      }
    }
  }
}

// Pass 2: one water tower on an interior roof cell (sits on the roof surface)
for (const c of cellMap.values()) {
  const { x, z, T } = c;
  if (perimeter(x, z)) continue;
  if (x === 4 && z === 6 && T + 3 < H) {
    put(x, T, z, "spruce_planks");
    put(x, T + 1, z, "spruce_planks");
    put(x, T + 2, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
