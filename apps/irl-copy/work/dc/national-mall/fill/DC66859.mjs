// DC66859: a two-storey Neoclassical office block on the Mall's north side. Footprint from the cells file (an 8-wide
// front block over z 0..2, a 6-wide body over z 3..11). Massing: solid foundation at y0 under every footprint cell,
// walls to the lidar roof (7), floor slabs at y0, y3 and y6, two storeys of 2-block clear height between them.
// Walls are hollow behind the facade: an air gap behind the glass, interior storeys left open.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66859.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66859.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));           // [x, z, ground, roof]
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const TOP = Math.max(...cells.map(([, , , roof]) => roof));       // 7: the lidar roof height above y0
const SX = 8, SZ = 12, SY = 19;

// Facade layout. Front is z = 0 (the entry face), the body runs back to z = 11.
const key = (x, y, z) => `${x},${y},${z}`;
const STOREYS = [1, 2, 4, 5];                                      // the two storeys' clear heights
const panes = new Set();
for (const y of STOREYS) {
  for (const x of [1, 2, 5, 6]) panes.add(key(x, y, 0));           // front bays either side of the entry
  panes.add(key(0, y, 1)); panes.add(key(7, y, 1));                // front block flanks
  for (const z of [4, 6, 8, 10]) { panes.add(key(1, y, z)); panes.add(key(6, y, z)); }   // body flanks
  for (const x of [2, 5]) panes.add(key(x, y, 11));                // rear
}
// Warm light behind some panes, in the air gap.
const lights = new Map([
  [key(1, 1, 1), { block: "glowstone" }],
  [key(6, 4, 1), { block: "glowstone" }],
  [key(2, 4, 8), { block: "glowstone" }],
  [key(5, 2, 10), { block: "shroomlight" }],
]);
const entry = new Set([key(3, 1, 1), key(3, 2, 1), key(4, 1, 1), key(4, 2, 1)]);   // doors, in the wall plane
const recess = new Set([key(3, 1, 0), key(3, 2, 0), key(4, 1, 0), key(4, 2, 0)]);  // the recessed porch: air

const grid = new Map();
const put = (x, y, z, block, state) => grid.set(key(x, y, z), state ? { block, state } : { block });

for (const [x, z] of foot.keys().map((k) => k.split(",").map(Number))) {
  const w = !inF(x - 1, z), e = !inF(x + 1, z), n = !inF(x, z - 1), s = !inF(x, z + 1);
  const exterior = w || e || n || s;
  const corner = (w || e) && (n || s);
  const quoin = corner || (z === 3 && exterior) ;                    // the corner piers and the body's shoulder
  for (let y = 0; y < TOP; y++) {
    const k = key(x, y, z);
    if (y === 0) { put(x, y, z, exterior ? "stone_bricks" : "smooth_stone"); continue; }     // base course
    if (y === 3 || y === 6) {                                          // floor slabs; the stringcourse and cornice outside
      put(x, y, z, exterior ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (!exterior) {                                                    // interior storey: the air gap
      if (entry.has(k)) put(x, y, z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 3 ? "left" : "right", open: "false", powered: "false" });
      else if (lights.has(k)) put(x, y, z, lights.get(k).block);
      continue;
    }
    if (recess.has(k)) { if (x === 3 && y === 2) put(x, y, z, "lantern", { hanging: "true" }); continue; }   // the porch: air, one lantern
    if (panes.has(k)) continue;                                        // glass, placed below
    if ((x === 3 || x === 4) && z === 0 && y >= 4) { put(x, y, z, "chiseled_quartz_block"); continue; }    // carved panel over the entry
    put(x, y, z, quoin ? "smooth_quartz" : "calcite");
  }
}

// Glass panes, each connected to the neighbours that are solid: the frames read as stone around them.
const solidAt = (x, y, z) => grid.has(key(x, y, z)) || panes.has(key(x, y, z));
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const c = (dx, dz) => solidAt(x + dx, y, z + dz) ? "true" : "false";
  put(x, y, z, "glass_pane", { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" });
}

const g = new Voxels([SX, SY, SZ]);
for (const [k, v] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const r = g.save(OUT);
console.log(`DC66859: ${r.blocks} blocks, ${r.palette} palette entries -> ${OUT}`);
