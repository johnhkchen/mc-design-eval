// TMACS Backpackers (OSM way 291058273): a three-storey brick block with white-render bands, the kind of inter-war
// commercial-and-residential building that lines Eden Terrace and Newton's main streets. Red brick walls, white
// string courses and window lintels, a stone plinth, a dark shopfront band at street level, a parapet with a cornice,
// a rooftop plant room. Walls are a one-block shell with an air gap behind the glass and a floor slab per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_291058273.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const X = 36, D = 45, Y = 25;

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { x, z, g: ground, roof });
const inF = (x, z) => cell.has(`${x},${z}`);
const outward = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inF(x + dx, z + dz));
const isEdge = (x, z) => outward(x, z).length > 0;

// the lidar's roof is stair-stepped noise: a 3x3 median over the footprint gives flat tiers (12 main, 11 the wings)
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
for (const c of cell.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(`${c.x + dx},${c.z + dz}`); if (n) near.push(n.roof); }
  c.top = median(near);                                  // T: the top of the wall, the cornice course sits at T-1, the parapet at T
}

const v = new Voxels([X, Y, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const pane = (out) => {                                  // a glass pane connects along the face it sits in
  const ew = out.some(([, dz]) => dz !== 0), ns = out.some(([dx]) => dx !== 0);
  return { north: String(ns), south: String(ns), east: String(ew), west: String(ew), waterlogged: "false" };
};
const hash = (...n) => n.reduce((a, b) => (a * 31 + b * 7 + 13) >>> 0, 17) % 5;

// 1. foundation: solid from y 0 up to each cell's ground, so nothing floats on the slope
for (const c of cell.values()) for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");

// 2. walls and floors, storey by storey from each cell's own ground (4 blocks a storey: string, glass, glass, spandrel)
for (const c of cell.values()) {
  const { x, z, g, top: T } = c, edge = isEdge(x, z), out = outward(x, z);
  const along = out.some(([, dz]) => dz !== 0) ? x : z;                               // bays count along the face they sit in
  if (!edge) {
    for (let y = g; y <= T - 2; y += 4) put(x, y, z, "smooth_stone");                  // interior floor slab per storey
    continue;
  }
  for (let y = g; y <= T - 2; y++) {
    const rel = y - g, k = Math.floor(rel / 4), r = rel % 4, p = along % 4;
    const win = p === 1 || p === 2, shopGlass = k === 0 && p !== 0;
    if (r === 0) put(x, y, z, k === 0 ? "stone_bricks" : "white_concrete");           // base course, then string courses
    else if (r === 3) put(x, y, z, k === 0 ? "dark_oak_planks" : win ? "white_concrete" : "bricks");   // fascia / lintels / spandrel
    else if (k === 0 ? shopGlass : win) put(x, y, z, "glass_pane", pane(out));
    else put(x, y, z, "bricks");
  }
  put(x, T - 1, z, "white_concrete");                                                  // cornice band under the parapet
  put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });        // parapet coping
}

// 3. the roof deck over every footprint cell, one below the top (smooth stone: no gravel falling through the air gap)
for (const c of cell.values()) if (!isEdge(c.x, c.z)) put(c.x, c.top - 1, c.z, "smooth_stone");

// 4. entrance on the north front (x 12, z 0): a two-high door on the base course, a canopy slab over it, a lantern beside
const door = cell.get("12,0");
if (door) {
  put(12, door.g + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(12, door.g + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const x of [12, 13]) put(x, door.g + 3, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(13, door.g + 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// 5. warm light behind some glass (the air gap inside the shell); the shopfront gets it on half its panes
for (const c of cell.values()) {
  const { x, z, g, top: T } = c, out = outward(x, z), along = out.some(([, dz]) => dz !== 0) ? x : z;
  if (!out.length || out.length > 1) continue;
  const [dx, dz] = out[0], ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || isEdge(ix, iz)) continue;
  for (let k = 0; g + 4 * k + 1 <= T - 2; k++) {                                    // row 1 of each storey: the lamp stands 1 in, behind the pane
    const y = g + 4 * k + 1, p = along % 4, h = hash(x, z, k);
    const glass = k === 0 ? p !== 0 : p === 1 || p === 2;
    if (glass && (h === 0 || (k === 0 && h < 2))) put(ix, y, iz, "glowstone");
  }
}

// 6. rooftop plant room on the top deck (only the 4x4 block over cells whose top is 12): brick walls, a stone lid, air inside
for (let z = 19; z <= 22; z++) for (let x = 16; x <= 19; x++) {
  const c = cell.get(`${x},${z}`);
  if (!c || c.top !== 12) continue;
  const wall = x === 16 || x === 19 || z === 19 || z === 22;
  for (const y of [12, 13]) if (wall) put(x, y, z, "bricks");
  put(x, 14, z, "stone_bricks");
}

const info = v.save(`${DIR}/way_291058273.nbt`);
console.log(`way_291058273: ${info.blocks} blocks, ${info.palette} palette entries`);
