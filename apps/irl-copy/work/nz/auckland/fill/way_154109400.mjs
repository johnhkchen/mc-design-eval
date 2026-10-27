// Mt Eden-view office tower, 1970s reinforced-concrete block (13 storeys, 4-block storeys, 1.2 blocks/m).
// Footprint from the cells file; ground floor level at y 5 (the highest ground under it), storeys every 4 blocks above.
// Main block tops out at y 53 (12 storeys); a one-storey core (roof ~57) rises where the lidar roof is 55 or more.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154109400.cells.json", "utf8"));
const W = 24, D = 17, FLOOR = 5, MAIN_TOP = 53, CORE_TOP = 57;

// footprint and lidar roof per cell
const raw = new Map(), key = (x, z) => `${x},${z}`;
for (const [x, z, g, r] of cells) raw.set(key(x, z), { g, r });
const inFoot = (x, z) => raw.has(key(x, z));

// smooth the roof: median over the 3x3 neighbourhood of footprint cells (kills the 16 and 28 spikes)
const roof = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) vals.push(raw.get(key(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b); roof.set(k, vals[vals.length >> 1]);
}
const isCore = (x, z) => roof.get(key(x, z)) >= 55;

// faces that look outside the footprint
const outside = (x, z) => [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dx, dz]) => !inFoot(x + dx, z + dz));
// ring of a region: its cells with any face outside the region
const inRegion = (region) => (x, z) => inFoot(x, z) && region(x, z);
const ringOf = (region) => (x, z) => inRegion(region)(x, z) && [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !inRegion(region)(x + dx, z + dz));
const allCells = () => true;
const mainRing = ringOf(allCells), coreRing = ringOf(isCore);

const g = new Voxels([W, 69, D]);
const put = (x, y, z, b, s) => { if (inFoot(x, z)) g.set(x, y, z, b, s); };
const WIN = "light_blue_stained_glass_pane", PIER = "white_concrete", SPAN = "light_gray_concrete", BASE = "smooth_stone";

// 1. foundation: solid from y 0 to the floor level under every cell (plinth ring of stone bricks)
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < FLOOR; y++) put(x, y, z, mainRing(x, z) ? "stone_bricks" : "stone");
}

// 2. floor slabs: one per storey, across the whole footprint, the top one (y 53) being the main roof
for (let y = FLOOR; y <= MAIN_TOP; y += 4) for (const [k] of raw) { const [x, z] = k.split(",").map(Number); put(x, y, z, "smooth_stone"); }

// 3. storeys: pier bays on the faces, glass between, spandrel at each storey line; the ground storey is a shopfront base
const faceIndex = (x, z, outs) => (outs.some(([dx]) => dx) ? z : x);     // along-face position for a wall cell
const ENTRY = new Set(["18,0", "19,0"]);                                  // the street door, on the north face
function facade(region, ring, y0, storey) {
  for (const [k] of raw) {
    const [x, z] = k.split(",").map(Number);
    if (!region(x, z) || !ring(x, z)) continue;
    const outs = outside(x, z), corner = outs.length >= 2, pier = corner || faceIndex(x, z, outs) % 3 === 0;
    const yf = y0;                                                        // the slab under the storey
    if (storey === 0) {                                                  // ground: shopfront glass, a base band, the door
      put(x, yf + 1, z, BASE); put(x, yf + 3, z, BASE);
      if (ENTRY.has(k)) { put(x, yf + 1, z, "oak_door", { facing: "north", half: "lower", hinge: x === 18 ? "left" : "right", open: "false", powered: "false" }); put(x, yf + 2, z, "oak_door", { facing: "north", half: "upper", hinge: x === 18 ? "left" : "right", open: "false", powered: "false" }); }
      else put(x, yf + 2, z, pier ? BASE : WIN);
      continue;
    }
    put(x, yf + 1, z, pier ? PIER : WIN);
    put(x, yf + 2, z, pier ? PIER : WIN);
    put(x, yf + 3, z, pier ? PIER : SPAN);
  }
}
for (let s = 0; s < 12; s++) facade(allCells, mainRing, FLOOR + 4 * s, s);
// the core's storey (its ring stands on the main roof at y 53)
facade(isCore, coreRing, MAIN_TOP, 12);

// the base course and canopy over the entrance: smooth stone at the head of the shopfront
for (const k of ENTRY) { const [x, z] = k.split(",").map(Number); put(x, FLOOR + 3, z, "stone_brick_slab", { type: "top" }); }

// 4. roof: parapet on the main ring and the core's ring, core cap, plant
for (const [k] of raw) { const [x, z] = k.split(",").map(Number);
  if (!isCore(x, z) && mainRing(x, z)) put(x, MAIN_TOP + 1, z, PIER);
  if (isCore(x, z) && coreRing(x, z)) put(x, CORE_TOP + 1, z, PIER);
}
for (const [k] of raw) { const [x, z] = k.split(",").map(Number); if (isCore(x, z)) put(x, CORE_TOP, z, "gray_concrete"); }
// plant boxes on the main roof, away from the core
for (let z = 1; z <= 4; z++) for (let x = 2; x <= 5; x++) if (!isCore(x, z)) { put(x, MAIN_TOP + 1, z, SPAN); put(x, MAIN_TOP + 2, z, SPAN); }
// lights: glowstone behind some windows on the first floors and the core
let n = 0;
for (const [k] of raw) { const [x, z] = k.split(",").map(Number); if (!mainRing(x, z) && !coreRing(x, z)) continue;
  n++; if (n % 7 !== 3) continue;
  const inward = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dz]) => [x - dx, z - dz]).find(([ix, iz]) => inFoot(ix, iz) && !mainRing(ix, iz) && !coreRing(ix, iz));
  if (!inward) continue;
  for (let s = 0; s < 12; s++) { const y = FLOOR + 4 * s + 1; if (!g.get(inward[0], y, inward[1])) g.set(inward[0], y, inward[1], "glowstone"); }
}
// the ground-floor lantern inside the entrance
if (inFoot(18, 1) && !g.get(18, FLOOR + 1, 1)) g.set(18, FLOOR + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// 5. panes connect to their neighbours
for (let y = 0; y < 69; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const b = g.get(x, y, z); if (!b || b.block !== `minecraft:${WIN}`) continue;
  const conn = (dx, dz) => { const o = g.get(x + dx, y, z + dz); return o && !o.block.includes("air") ? "true" : "false"; };
  g.set(x, y, z, WIN, { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" });
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154109400.nbt");
console.log("core cells", [...raw.keys()].filter(k => isCore(...k.split(",").map(Number))).length, "blocks", g.count());
