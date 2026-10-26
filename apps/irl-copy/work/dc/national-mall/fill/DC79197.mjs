// 1919 M Street NW: a Classical Revival office block. A dark granite base course, cream stone walls with quoin piers,
// a podium at 12 blocks, the tower at 16 with two roof pods, and a shopfront lobby on the north (street) face.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79197.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const key = (x, z) => `${x},${z}`;
const key3 = (x, y, z) => `${x},${y},${z}`;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Clean flat tiers from the lidar roof: 15+ is the tower (16), 11-14 the podium (12), 3 and under the low wing (3).
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, g, t: Math.max(r >= 15 ? 16 : r >= 11 ? 12 : 3, g + 3) });   // a wing is at least a storey and a cap above its ground
// Two mechanical pods on the tower roof, two blocks above its cap.
for (const c of cell.values()) {
  if (c.t === 16 && c.x >= 7 && c.x <= 10 && ((c.z >= 9 && c.z <= 12) || (c.z >= 19 && c.z <= 22))) c.t = 18;
}
for (const c of cell.values()) if (c.t - c.g < 3) throw new Error(`cell ${c.x},${c.z} too short`);

// Exposed faces: a side with no footprint cell, or a lower tier beside it (a setback).
const faces = (c) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = cell.get(key(c.x + dx, c.z + dz)); return !n || n.t < c.t; }).map(([f]) => f);

// The plan: one entry per block, so the glow and pane passes can read neighbours before anything is written.
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const panes = new Map();   // key -> face the pane is on
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const c of cell.values()) {
  const { x, z, g: G, t: T } = c;
  const fs = faces(c), E = fs.length > 0, corner = fs.length >= 2, face = fs[0];
  const idx = face === "N" || face === "S" ? x : z;      // position along the exposed face
  const pier = corner || idx % 3 === 0;
  const onRow = (y) => y - G;                              // 0 = base, odd = floor line, even = window band
  for (let y = 0; y < T; y++) {
    if (y < G) { put(x, y, z, "stone"); continue; }                              // foundation under the ground
    if (y === G) { put(x, y, z, E ? "polished_granite" : "smooth_stone"); continue; }  // base course
    if (y === T - 1) { put(x, y, z, E ? "quartz_slab" : "smooth_stone", E ? { type: "top", waterlogged: "false" } : undefined); continue; }  // cornice / roof
    const shop = (y === G + 1 && y <= T - 2) || (y === G + 2 && y <= T - 3);     // ground-floor shopfront band
    if (!E) {
      // inside: floors and the ceiling are solid, the storey between them is air
      const floor = onRow(y) % 2 === 1 && y <= T - 3;
      if (y === T - 2 || floor) put(x, y, z, "smooth_stone");
      continue;
    }
    if (shop) {
      put(x, y, z, pier ? "quartz_pillar" : "light_blue_stained_glass", pier ? { axis: "y" } : undefined);
      continue;
    }
    if (y === T - 2 || (onRow(y) % 2 === 1 && y <= T - 3)) { put(x, y, z, "quartz_block"); continue; }   // spandrel / storey line
    if (onRow(y) % 2 === 0 && onRow(y) >= 2 && y <= T - 3) {                                                // window band
      if (pier) put(x, y, z, "quartz_pillar", { axis: "y" });
      else { put(x, y, z, "light_blue_stained_glass_pane"); panes.set(key3(x, y, z), face); }
    }
  }
}

// Entrance on the north (street) face: a double door, piers either side, and a dark canopy band over the door.
for (const c of cell.values()) {
  if (c.z === 0 && (c.x === 8 || c.x === 9)) {
    const hinge = c.x === 8 ? "left" : "right";
    const door = (half) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
    put(c.x, c.g + 1, c.z, "dark_oak_door", door("lower"));
    put(c.x, c.g + 2, c.z, "dark_oak_door", door("upper"));
    panes.delete(key3(c.x, c.g + 2, c.z));
  }
  if ((c.z === 0 || c.z === 1) && c.x >= 6 && c.x <= 11 && cell.has(key(c.x, c.z))) {
    put(c.x, c.g + 3, c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pane connections: a pane joins the neighbouring panes in its own wall plane.
const isPane = (x, y, z) => plan.get(`${x},${y},${z}`)?.block === "light_blue_stained_glass_pane";
for (const [k, face] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  if (!isPane(x, y, z)) continue;
  const across = face === "N" || face === "S"
    ? { east: isPane(x + 1, y, z), west: isPane(x - 1, y, z), north: false, south: false }
    : { north: isPane(x, y, z - 1), south: isPane(x, y, z + 1), east: false, west: false };
  const st = Object.fromEntries(Object.entries(across).map(([d, v]) => [d, v ? "true" : "false"]));
  plan.set(k, { block: "light_blue_stained_glass_pane", state: { ...st, waterlogged: "false" } });
}

// Warm light: a glowstone behind every seventh window bay, on the air side of the glass.
let n = 0;
for (const [k, face] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  if (!isPane(x, y, z) || y < 4 || ++n % 7 !== 3) continue;
  const [dx, dz] = inward[face], tx = x + dx, tz = z + dz;
  if (cell.has(key(tx, tz)) && !plan.has(`${tx},${y},${tz}`)) put(tx, y, tz, "glowstone");
}

const g = new Voxels([20, 28, 32]);
for (const [k, b] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const out = g.save(`${DIR}/DC79197.nbt`);
console.log(`DC79197: ${out.blocks} blocks, ${out.palette} palette entries, ${cell.size} cells`);
