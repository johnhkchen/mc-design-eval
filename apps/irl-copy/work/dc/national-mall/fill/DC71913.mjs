// DC71913: 500 North Capitol Street NW, a 1980s Commercial-Office-Large block as a 1.21.1 module.
// Read from the lidar record: a 15 x 30 footprint with a 17-block tower in the middle, 15-block shoulders on the east
// and south, and a 13-block wing on the far east edge. The ground is flat to within one block. Heights are 3x3 median
// smoothed, then each cell takes a whole number of storeys, 2 blocks each (a floor line of pale precast and a window
// band), with a parapet block on top: 17 -> 8 storeys, 15-16 -> 7, 13 -> 6. Every column is solid from y 0 to its top,
// so the storeys stand on each other and nothing floats. The shell carries a glazed window grid with mullions;
// interiors are air behind the glass, with one floor line per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71913.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71913.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell.
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
const storeys = (h) => Math.floor((h - 1) / 2);   // 17 -> 8, 15-16 -> 7, 13 -> 6

// Palette: pale precast floor lines, tinted glazing in mullioned bays, a granite plinth, a parapet on every roof edge.
const FLOOR = "smooth_quartz";
const BASE = "polished_granite";
const GLASS = "light_blue_stained_glass";
const MULLION = "polished_andesite";
const PARAPET = "stone_brick_wall";
const ROOF = "smooth_stone";
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const LANTERN = "lantern";
const CANOPY = "polished_andesite_slab";
const PLANT = "iron_block";
const CORE = "light_gray_concrete";

const g = new Voxels([15, 29, 30]);

const outwardOf = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isShell = (x, z) => outwardOf(x, z).length > 0;

for (const c of F.values()) {
  const N = storeys(smooth.get(key(c.x, c.z)));
  const top = 2 * N;                          // the roof is the block at this height; above it is parapet or roof membrane
  const out = outwardOf(c.x, c.z);
  const b = out.length > 0;
  const corner = out.length > 1;
  const along = out.some(([dx]) => dx !== 0) ? c.z : c.x;   // position along the face the cell sits on

  for (let y = 0; y <= top; y++) {
    const s = y >> 1, r = y & 1;
    if (y === top) { g.set(c.x, y, c.z, b ? PARAPET : ROOF); continue; }
    if (r === 0) { g.set(c.x, y, c.z, y === 0 && b ? BASE : FLOOR); continue; }   // floor line; plinth at the foot of the shell
    if (!b) continue;                                                              // interior window band is air
    if (corner || along % 2 === 1) { g.set(c.x, y, c.z, MULLION); continue; }
    g.set(c.x, y, c.z, GLASS);
    // A warm room behind some panes: glowstone on the inboard cell (interior) at the same height.
    const [ox, oz] = out[0];
    const ix = c.x - ox, iz = c.z - oz;
    if ((c.x * 7 + c.z * 13 + s * 5) % 9 === 0 && inF(ix, iz) && !isShell(ix, iz)) g.set(ix, y, iz, LAMP);
  }
}

// Lobby on the west street front (the x = 0 face): a dark oak door with a glazed bay either side, and a canopy
// over the door carried by the floor line at the storey above.
g.set(0, 1, 11, DOOR, { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, 11, DOOR, { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
// Door surround: granite piers either side of the door so the entrance reads from the street.
for (const z of [10, 12]) for (let y = 1; y <= 2; y++) g.set(0, y, z, BASE);
for (let z = 9; z <= 13; z++) for (let x = 0; x <= 1; x++) g.set(x, 3, z, CANOPY, { type: "bottom", waterlogged: "false" });
g.set(1, 1, 11, LANTERN, { hanging: "false" });
g.set(1, 1, 9, LANTERN, { hanging: "false" });
g.set(1, 1, 13, LANTERN, { hanging: "false" });

// Roof plant on the tower: a service core and a row of air-handling units on the roof membrane.
for (let x = 4; x <= 6; x++) for (let z = 13; z <= 15; z++) {
  g.set(x, 17, z, CORE); g.set(x, 18, z, CORE);
}
g.set(4, 19, 14, PLANT); g.set(6, 19, 14, PLANT);
for (const [x, z] of [[3, 7], [7, 7], [3, 21], [7, 21]]) g.set(x, 17, z, PLANT);

const r = g.save(OUT);
console.log(`saved ${OUT}: ${r.blocks} blocks, palette ${r.palette}`);
