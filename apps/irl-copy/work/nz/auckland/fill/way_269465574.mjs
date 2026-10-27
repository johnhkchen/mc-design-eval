// Auckland, 1930s brick-and-plaster commercial block (Mt Eden / Eden Terrace fabric): a stone plinth, brick walls on
// cream string courses, glass shopfronts and sash-like window grids, a cornice and parapet, a recessed entrance with a
// lintel canopy and lanterns, flat roofs with plant units, and a three-storey corner tower on the uphill (north-west) side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465574.cells.json", "utf8"));

const W = 30, D = 51, H = 16;
// Lidar roof heights (y 0 = lowest ground) snap to storey tiers of 4 blocks: 4, 8, 12 (the parapet adds one more course).
// Roofs at or below 2 are yard, not building.
const tier = (r) => (r <= 2 ? 0 : r <= 6 ? 4 : r <= 10 ? 8 : 12);
// Lidar noise: each roof is the median of its footprint's 5 x 5 neighbourhood before the tier snap, so single cells do
// not jump a storey and leave fins (a 3 x 3 median still did).
const raw = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { g: ground, roof }]));
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const cell = new Map();
for (const [k, { g: ground, roof }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = raw.get(`${x + dx},${z + dz}`); if (n) near.push(n.roof); }
  cell.set(k, { g: ground, T: tier(median(near)) });
}
const at = (x, z) => cell.get(`${x},${z}`);
// A cell is building where its tier stands above its ground; body occupies [ground, tier).
const built = (x, z) => { const c = at(x, z); return !!c && c.T > c.g; };
const body = (x, z, y) => { const c = at(x, z); return !!c && c.T > c.g && y >= c.g && y < c.T; };
// A face is exposed where a neighbour is not body at this height (yard, lower roof, or still inside its own foundation).
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const exposed = (x, z, y) => DIRS.some(([dx, dz]) => !body(x + dx, z + dz, y));

const g = new Voxels([W, H, D]);

// Foundation: solid from y 0 up to each cell's ground, so nothing floats on the slope.
for (const [x, z, ground] of cells) for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

// Body: exterior shell with articulation, interior as one air gap per storey with a floor slab per storey.
for (const [x, z] of cells) {
  const c = at(x, z);
  if (!built(x, z)) continue;
  for (let y = c.g; y < c.T; y++) {
    const k = (y - c.g) % 4;              // 0 base/string course, 1-2 glazing band, 3 spandrel
    if (exposed(x, z, y)) {
      let mat;
      if (y === c.T - 1) mat = "smooth_quartz";                       // cornice
      else if (k === 0) mat = y === c.g ? "stone_bricks" : "smooth_quartz"; // plinth / string course
      else if (k === 3) mat = "bricks";                               // spandrel
      else if ((x + z) % 3 === 0) mat = "smooth_quartz";              // window mullion
      else mat = (x * 5 + z * 3 + y) % 17 === 0 ? "glowstone" : "glass"; // a few lit windows
      g.set(x, y, z, mat);
    } else if (y === c.T - 1) g.set(x, y, z, "gray_concrete");        // roof deck
    else if (k === 0) g.set(x, y, z, "stone");                        // storey floor slab
  }
  // Parapet on the outer edge of the roof.
  if (exposed(x, z, c.T - 1)) g.set(x, c.T, z, "smooth_quartz");
}

// Roof plant: air-conditioning units on the mid roof, a lift overrun on the tower.
const interiorRoof = (x, z, T) => built(x, z) && at(x, z).T === T && !exposed(x, z, T - 1);
for (const [x, z] of cells) {
  const c = at(x, z);
  if (!built(x, z) || !interiorRoof(x, z, c.T)) continue;
  if (c.T === 8 && (x * 7 + z * 3) % 9 === 0) g.set(x, c.T, z, "iron_block");
  if (c.T === 12 && (x * 3 + z * 5) % 7 === 0) g.set(x, c.T, z, "iron_block");
}
// Lift overrun: a 2x2 block on the tower's interior roof, nearest its middle.
{
  const tower = cells.filter(([x, z]) => interiorRoof(x, z, 12));
  const mx = tower.reduce((s, [x]) => s + x, 0) / tower.length, mz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
  const ok = (x, z) => interiorRoof(x, z, 12);
  const [ox, oz] = tower.map(([x, z]) => [x, z]).filter(([x, z]) => ok(x, z) && ok(x + 1, z) && ok(x, z + 1) && ok(x + 1, z + 1))
    .sort((a, b) => Math.hypot(a[0] - mx, a[1] - mz) - Math.hypot(b[0] - mx, b[1] - mz))[0] ?? [];
  if (ox !== undefined) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) for (let y = 12; y < 14; y++) g.set(ox + dx, y, oz + dz, "stone_bricks");
}

// Entrance: a doorway in the west face (the face toward Mt Eden), mid-run, with a lintel canopy and two hanging lanterns.
{
  const west = cells.filter(([x, z]) => built(x, z) && !built(x - 1, z) && at(x, z).T >= 8).sort((a, b) => a[1] - b[1]);
  const [x, z] = west[Math.floor(west.length / 2)];
  const base = at(x, z).g;
  const door = (y, half) => g.set(x, y, z, "oak_door", { facing: "west", half, hinge: "left", open: "false", powered: "false" });
  door(base + 1, "lower"); door(base + 2, "upper");
  for (let dz = -1; dz <= 1; dz += 2) if (built(x, z + dz)) g.set(x, base + 3, z + dz, "smooth_quartz");
  g.set(x, base + 3, z, "smooth_quartz");
  for (const dz of [-1, 1]) g.set(x, base + 2, z + dz, "lantern", { hanging: "true" });
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465574.nbt");
console.log(`way_269465574: ${blocks} blocks, palette ${palette}`);
