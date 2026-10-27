// Chelsea House, Auckland (way 534543092): a 1970s concrete-framed office block. A stone podium and wings step up
// to a tower whose roof the lidar puts at about 56 blocks (47 m). Each footprint cell is a column from its own ground
// (solid foundation below) up to its roof, snapped to a 4-block storey grid on lines 8, 12, 16 ... so every tier stands
// on the one below. The walls are the one-block perimeter of exposed cells; the interior is air with a floor slab per
// storey, and the glass has air behind it except where a glowstone sits in a few windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_534543092.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_534543092.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 31, D = 29, H = 69;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const STOREY0 = 8, STOREY = 4, TOP_MIN = 12, TOP_MAX = 56;

// the storey lines: floor slabs sit on y = 8, 12, 16 ...
const isLine = (y) => y >= STOREY0 && (y - STOREY0) % STOREY === 0;

const grid = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) grid[z][x] = { x, z, g, r };
const at2 = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? grid[z][x] : null);
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// roof top: the lidar roof median-smoothed over the 3x3, snapped to the storey grid, clamped to a 2-storey minimum
for (const c of cells.map(([x, z]) => at2(x, z))) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at2(c.x + dx, c.z + dz); if (n) near.push(n.r); }
  c.T = Math.min(TOP_MAX, Math.max(TOP_MIN, STOREY0 + STOREY * Math.round((median(near) - STOREY0) / STOREY)));
}
for (const c of cells.map(([x, z]) => at2(x, z))) {
  // an edge cell has a parapet: outside the footprint, or next to a lower roof
  c.edge = DIRS.some(([dx, dz]) => { const n = at2(c.x + dx, c.z + dz); return !n || n.T < c.T; });
}

// the sides of a cell at height y that face air: outside the footprint, or above the neighbour's roof
const exposed = (c, y) => DIRS.filter(([dx, dz]) => { const n = at2(c.x + dx, c.z + dz); return !n || y >= n.T; });

// the block a footprint cell holds at height y (null = air)
function skin(c, y) {
  const { g, T } = c;
  if (y > T + 1) return null;
  if (y === T + 1) return c.edge ? "stone_bricks" : null;      // parapet
  if (y === T) return "gray_concrete";                         // roof slab
  if (y < g) return "stone";                                   // foundation under the ground
  if (y === g) return exposed(c, y).length ? "stone_bricks" : "gray_concrete"; // base course / ground floor slab
  if (isLine(y)) return "light_gray_concrete";                 // floor slab per storey
  const sides = exposed(c, y);
  if (!sides.length) return null;                              // interior air
  const [dx] = sides[0];
  const idx = dx ? c.z : c.x;                                  // along the facade
  const pier = c.T <= 20 ? "stone_bricks" : "white_concrete";  // podium piers and spandrels in stone
  if (idx % 3 === 0) return pier;
  if (y < STOREY0) return y === STOREY0 - 1 ? pier : "light_blue_stained_glass";  // shopfront glass under a lintel
  return (y - STOREY0) % STOREY === 3 ? pier : "light_blue_stained_glass";         // two glass rows, one spandrel
}

const vol = new Voxels([W, H, D]);
const glass = [];
for (const c of cells.map(([x, z]) => at2(x, z))) {
  for (let y = 0; y <= c.T + 1; y++) {
    const b = skin(c, y);
    if (b) vol.set(c.x, y, c.z, b);
    if (b === "light_blue_stained_glass") glass.push([c, y]);
  }
}

// warm light: glowstone on the inside of a few windows, where the room behind is air
for (const [c, y] of glass) {
  if ((c.x * 5 + c.z * 7 + y * 3) % 19 !== 0) continue;
  const [dx, dz] = exposed(c, y)[0];
  const ix = c.x - dx, iz = c.z - dz;
  if (at2(ix, iz) && !vol.get(ix, y, iz)) vol.set(ix, y, iz, "glowstone");
}

// entrance: a door in the lowest south-facing wall, near the middle, with a stone lintel over it
const south = cells.map(([x, z]) => at2(x, z)).filter((c) => !at2(c.x, c.z + 1));
const door = south.sort((a, b) => a.g - b.g || Math.abs(a.x - 15) - Math.abs(b.x - 15))[0];
const dstate = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
vol.set(door.x, door.g + 1, door.z, "dark_oak_door", dstate("lower"));
vol.set(door.x, door.g + 2, door.z, "dark_oak_door", dstate("upper"));
for (const x of [door.x - 1, door.x + 1]) {
  const n = at2(x, door.z);
  if (n && !at2(x, door.z + 1)) vol.set(x, door.g + 3, door.z, "stone_bricks");
}
vol.set(door.x, door.g + 3, door.z, "stone_bricks");

// roof: a plant box on the tower's roof with a lightning rod, and small units on the mid tiers
const maxT = Math.max(...cells.map(([x, z]) => at2(x, z).T));
// the plant box: a 2x2 of the tallest tower cells, each sitting on its own roof
const sq = [];
for (const c of cells.map(([x, z]) => at2(x, z))) {
  const four = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at2(c.x + dx, c.z + dz));
  if (four.every((n) => n)) sq.push(four);
}
const plant = sq.sort((a, b) => Math.min(...b.map((n) => n.T)) - Math.min(...a.map((n) => n.T)) || b.reduce((s, n) => s + n.T, 0) - a.reduce((s, n) => s + n.T, 0))[0];
for (const n of plant) for (let y = n.T + 1; y <= n.T + 2; y++) vol.set(n.x, y, n.z, "iron_block");
vol.set(plant[0].x, plant[0].T + 3, plant[0].z, "lightning_rod");
for (const c of cells.map(([x, z]) => at2(x, z))) {
  if (c.edge || c.T === maxT || c.T < 32 || (c.x * 2 + c.z * 3) % 9 !== 0) continue;
  vol.set(c.x, c.T + 1, c.z, "light_gray_concrete");
  vol.set(c.x, c.T + 2, c.z, "light_gray_concrete");
}

// the foundation stays solid under its own ground; the rest is air or the building above
const info = vol.save(OUT);
console.log(`way_534543092: ${info.blocks} blocks, ${info.palette} palette entries, roof top ${maxT}, door at ${door.x},${door.z}`);
