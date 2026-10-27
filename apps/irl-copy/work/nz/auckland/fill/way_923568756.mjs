// Abstract Residence: a ten-storey residential block (cream concrete, blue-tinted glazing, 1980s-90s Auckland apartments)
// on a stone plinth. Roof heights from the lidar snap to storey lines (4 blocks a storey, slabs on rows 1, 5, ... 41); the
// top two storeys of the 41-block core step back 3 cells from the edge, so the core rises out of a terrace at 33.
// Interiors are air behind the glass, with a slab per storey; only shell cells (a neighbour missing or lower) get walls.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_923568756.cells.json", "utf8"));

// ground g and storey-snapped top T per footprint cell; a cell's first stack row is max(g, 1) so every floor shares y = 1 + 4k
const foot = new Map();
const snapTop = (roof) => (roof <= 1 ? 1 : 1 + 4 * Math.floor((roof - 1) / 4 + 0.5));
for (const [x, z, g, roof] of cells) foot.set(`${x},${z}`, { x, z, g, T: snapTop(roof) });
const cell = (x, z) => foot.get(`${x},${z}`);

// inside distance from the outline (1 = edge cell), to find the setback ring of the 41-block core
const dist = new Map();
const queue = [];
for (const c of foot.values()) {
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !cell(c.x + dx, c.z + dz));
  if (edge) { dist.set(`${c.x},${c.z}`, 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = dist.get(`${c.x},${c.z}`);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = cell(c.x + dx, c.z + dz), key = n && `${n.x},${n.z}`;
    if (n && !dist.has(key)) { dist.set(key, d + 1); queue.push(n); }
  }
}
for (const c of foot.values()) if (c.T === 41 && dist.get(`${c.x},${c.z}`) <= 3) c.T = 33;   // the setback terrace

// a neighbour blocks the exposure at row y if its foundation or its stack reaches that row
const present = (x, z, y) => { const n = cell(x, z); return !!n && (y < n.g || y <= n.T); };
const isShell = (x, z, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !present(x + dx, z + dz, y));

const g = new Voxels([58, 54, 39]);
const CONCRETE = "light_gray_concrete", SILL = "white_concrete", GLASS = "light_blue_stained_glass";
const PLINTH = "stone_bricks", LIGHT = "glowstone";

for (const c of foot.values()) {
  const { x, z, g: ground, T } = c;
  // foundation from y 0 up to the cell's ground, so the storeys stand on it on the downhill side too
  for (let y = 0; y < Math.max(ground, 1); y++) g.set(x, y, z, PLINTH);
  for (let y = Math.max(ground, 1); y <= T; y++) {
    if ((y - 1) % 4 === 0) { g.set(x, y, z, CONCRETE); continue; }   // floor slab, the storey line; the roof's top row too
    if (!isShell(x, z, y)) continue;                                  // interior: air behind the glass
    const k = Math.floor((y - 1) / 4), r = (y - 1) % 4;                // r = 1 sill row, 2 and 3 glazed rows
    if (k === 0 && r === 1) g.set(x, y, z, PLINTH);                   // ground-floor base course
    else if (r === 1) g.set(x, y, z, SILL);
    else if ((x + z) % 3 === 0) g.set(x, y, z, SILL);                 // mullion
    else if (r === 2 && (x * 7 + z * 13 + k * 5) % 17 === 0) g.set(x, y, z, LIGHT);   // a lit flat behind the glass
    else g.set(x, y, z, GLASS);
  }
  // parapet on the top edge of the shell
  if (isShell(x, z, T + 1)) g.set(x, T + 1, z, PLINTH);
}

// lobby door on the north face, in the ground-floor glazing, with a concrete lintel above
const LOBBY = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(8, 2, 0, "dark_oak_door", { ...LOBBY, half: "lower" });
g.set(8, 3, 0, "dark_oak_door", { ...LOBBY, half: "upper" });
g.set(8, 4, 0, SILL);

// roof plant on the core: a grid of 2x2 mechanical boxes, two rows high, set in from the parapet
for (const c of foot.values()) {
  const d = dist.get(`${c.x},${c.z}`);
  if (c.T === 41 && d >= 6 && c.x % 7 >= 2 && c.x % 7 <= 3 && c.z % 7 >= 2 && c.z % 7 <= 3) {
    g.set(c.x, 42, c.z, "gray_concrete");
    g.set(c.x, 43, c.z, "iron_block");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_923568756.nbt";
console.log(g.save(out));
