import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738133.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738133.nbt";

const W = 21, H = 33, D = 19;
const ROOF = 21;          // roof deck y (lidar: roof about 21 above lowest ground)
const TOP_WALL = ROOF - 1;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(key(x, z), Math.max(0, Math.min(ROOF - 6, Math.round(gr))));
}
const has = (x, z) => G.has(key(x, z));

// Facade directions: S (front, +z) first, then N, E, W
const DIRS = [
  { name: "south", dx: 0, dz: 1 },
  { name: "north", dx: 0, dz: -1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];
const exposed = (x, z, d) => !has(x + d.dx, z + d.dz);
const faceOf = (x, z) => DIRS.find(d => exposed(x, z, d)) || null;

// Pick the entrance: front-most exposed face, cell nearest its middle
const doorDir = DIRS.find(d => cells.some(([x, z]) => exposed(x, z, d))) || DIRS[0];
const doorCands = cells.filter(([x, z]) => exposed(x, z, doorDir));
const tOf = (x, z, d) => (d.dz !== 0 ? x : z);
const midT = doorCands.reduce((s, [x, z]) => s + tOf(x, z, doorDir), 0) / Math.max(1, doorCands.length);
let door = null, best = Infinity;
for (const [x, z] of doorCands) {
  const dist = Math.abs(tOf(x, z, doorDir) - midT);
  if (dist < best) { best = dist; door = { x, z }; }
}

// 1. Foundations, interior storey slabs (hidden behind the facade), roof deck
for (const [x, z] of cells) {
  const gr = G.get(key(x, z));
  for (let y = 0; y < gr; y++) g.set(x, y, z, "gray_concrete");
  for (const k of [5, 10, 15]) {
    const y = gr + k;
    if (y < ROOF) g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, ROOF, z, "light_gray_concrete");
}

// 2. Facade walls: plinth, shopfront, storey lines, window grid with piers
for (const [x, z] of cells) {
  const gr = G.get(key(x, z));
  const isDoor = door && x === door.x && z === door.z;
  const f = isDoor ? doorDir : faceOf(x, z);
  if (!f) continue;
  const t = tOf(x, z, f);

  for (let y = gr; y <= TOP_WALL; y++) {
    const rel = y - gr;
    let id = null, props = undefined;

    if (rel === 0) {
      id = "polished_granite";                       // base course
    } else if (rel < 5) {                            // ground floor shopfront
      if (rel === 4) id = "smooth_quartz";           // transom
      else if (t % 3 === 0) id = "quartz_block";     // piers
      else id = "light_blue_stained_glass";          // shopfront glass
    } else {                                         // upper storeys
      if (rel % 5 === 0) id = "white_concrete";      // storey line / spandrel
      else if (t % 3 === 0) id = "quartz_block";     // piers
      else id = "light_blue_stained_glass";          // window glass
    }

    if (isDoor) {
      if (rel === 1) { id = "oak_door"; props = { facing: f.name, half: "lower", hinge: "left", open: "false", powered: "false" }; }
      else if (rel === 2) { id = "oak_door"; props = { facing: f.name, half: "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (rel === 3) id = "black_concrete";     // entrance canopy lintel
    }

    // warm lights behind some glass panes
    if (id === "light_blue_stained_glass" && (t + y) % 6 === 0) id = "glowstone";

    g.set(x, y, z, id, props);
  }
}

// 3. Parapet / cornice around the roof edge
for (const [x, z] of cells) {
  const perimeter = DIRS.some(d => exposed(x, z, d));
  if (perimeter) g.set(x, ROOF + 1, z, "white_concrete");
}

// 4. Rooftop penthouse with stone-brick frame and slab cap
const RX0 = 6, RX1 = 14, RZ0 = 5, RZ1 = 13;
for (const [x, z] of cells) {
  if (x < RX0 || x > RX1 || z < RZ0 || z > RZ1) continue;
  const border = x === RX0 || x === RX1 || z === RZ0 || z === RZ1;
  g.set(x, ROOF + 1, z, "light_gray_concrete");
  if (border) {
    g.set(x, ROOF + 2, z, "stone_bricks");
    g.set(x, ROOF + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
