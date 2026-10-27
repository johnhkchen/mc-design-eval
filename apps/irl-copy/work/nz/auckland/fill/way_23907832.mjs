// Symphony House, Auckland CBD: an 18-storey glass-and-concrete office tower of the 1980s on a stone podium.
// Massing follows the lidar roof, smoothed into flat tiers (20 podium, 40 and 56 setbacks, 64 shoulder, 72 tower,
// 76 plant crown). Every cell is a column: foundation to its ground, then storeys on absolute 4-block lines, a slab
// at each storey's base, a roof cap, and the envelope on the cell's exposed faces. Interiors are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907832.cells.json", "utf8"));

// lidar roof height (blocks above y 0) -> flat tier top, a multiple of the 4-block storey
const tierOf = (r) => (r >= 73 ? 76 : r >= 69 ? 72 : r >= 60 ? 64 : r >= 52 ? 56 : r >= 30 ? 40 : 20);

const cellAt = new Map();
for (const [x, z, gr, r] of cells) cellAt.set(`${x},${z}`, { g: gr, T: tierOf(r) });

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const PERP = { north: [1, 0], south: [1, 0], west: [0, 1], east: [0, 1] };
// the faces of cell (x, z) at height y that see air: outside the footprint, or above a lower neighbour's tier
const exposure = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; const n = cellAt.get(`${x + dx},${z + dz}`);
  return !n || y >= n.T;
});

// the envelope materials: a stone podium and mid-rise, then glass and concrete above
const mats = (T) => (T <= 40
  ? { spandrel: "stone_bricks", pier: "polished_andesite", glass: "light_blue_stained_glass", cap: "smooth_stone", parapet: "stone_brick_wall" }
  : { spandrel: "light_gray_concrete", pier: "white_concrete", glass: "cyan_stained_glass", cap: "light_gray_concrete", parapet: "polished_andesite_wall" });

// the entrance: the longest straight run of street-facing wall at storey 0, its middle cell
const candidates = {};
for (const [k, c] of cellAt) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposure(x, z, 1);
  if (ex.length !== 1) continue;
  const d = ex[0], [px, pz] = PERP[d];
  const ok = [-1, 1].every((s) => { const n = cellAt.get(`${x + s * px},${z + s * pz}`); return n && exposure(x + s * px, z + s * pz, 1).includes(d); });
  if (ok) (candidates[d] ||= []).push([x, z, d]);
}
const [entryDir, entryRun] = Object.entries(candidates).sort((a, b) => b[1].length - a[1].length)[0];
const sorted = entryRun.sort((a, b) => (PERP[entryDir][0] ? a[0] - b[0] : a[1] - b[1]));
const [dX, dZ, dD] = sorted[Math.floor(sorted.length / 2)];
const doorKey = `${dX},${dZ}`;

const g = new Voxels([64, 88, 42]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [k, { g: gr, T }] of cellAt) {
  const [x, z] = k.split(",").map(Number);
  const M = mats(T);
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");          // foundation to the lowest-ground datum
  for (let y = gr; y < T; y++) {
    const ex = exposure(x, z, y), o = y % 4, st = y >> 2;
    if (y === T - 1) { put(x, y, z, M.cap); continue; }                    // roof slab (tier top)
    if (o === 0) { put(x, y, z, !ex.length ? "light_gray_concrete" : st === 0 ? "polished_andesite" : M.spandrel); continue; }   // floor slab, or the storey line on the envelope
    if (!ex.length) continue;                                              // interior: air, behind the envelope
    if (o === 3) { put(x, y, z, M.spandrel); continue; }                   // head band under the next floor
    if (st === 0 && x === dX && z === dZ && y <= 2) {                      // door, two halves
      put(x, y, z, "dark_oak_door", { facing: dD === "north" ? "south" : dD === "south" ? "north" : dD === "west" ? "east" : "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const along = ex.includes("north") || ex.includes("south") ? x : z;
    put(x, y, z, ex.length > 1 || along % 4 === 0 ? M.pier : M.glass);   // window grid, mullions every 4th cell
  }
  // parapet on the roof edge
  if (exposure(x, z, T - 1).length) put(x, T, z, M.parapet);
}

// warm light behind some glass: a glowstone in the interior cell inside a window, on its floor
for (const [k, { g: gr, T }] of cellAt) {
  const [x, z] = k.split(",").map(Number);
  for (let y = gr; y < T - 1; y++) {
    if (y % 4 !== 1) continue;
    const ex = exposure(x, z, y);
    if (ex.length !== 1 || (x * 7 + z * 3 + (y >> 2) * 5) % 6 !== 0) continue;
    const [dx, dz] = DIRS[ex[0]];
    const n = cellAt.get(`${x - dx},${z - dz}`);
    if (!n || y < n.g || y >= n.T - 1 || exposure(x - dx, z - dz, y).length) continue;
    put(x - dx, y, z - dz, "glowstone");
  }
}

// the entrance canopy: a slab on three outward cells, held by posts at the ends, a lantern hung in the middle
{
  const [dx, dz] = DIRS[dD], [px, pz] = PERP[dD];
  for (const s of [-1, 0, 1]) put(dX + dx + s * px, 3, dZ + dz + s * pz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  for (const s of [-1, 1]) for (let y = 0; y <= 2; y++) put(dX + dx + s * px, y, dZ + dz + s * pz, "polished_andesite");
  put(dX + dx, 2, dZ + dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof plant on the podium and the tower crown; a lightning-rod mast on the crown's centre cell
for (const [k, { T }] of cellAt) {
  const [x, z] = k.split(",").map(Number);
  if (T === 20 && x % 6 === 3 && z % 6 === 3 && !exposure(x, z, 19).length) { put(x, 20, z, "iron_block"); put(x, 21, z, "iron_block"); }
  if (T === 76 && x % 5 === 2 && z % 5 === 2 && !exposure(x, z, 75).length) { put(x, 76, z, "iron_block"); put(x, 77, z, "iron_block"); }
}
{
  const crown = [...cellAt].filter(([, c]) => c.T === 76).map(([k]) => k.split(",").map(Number));
  const cx = crown.reduce((s, c) => s + c[0], 0) / crown.length, cz = crown.reduce((s, c) => s + c[1], 0) / crown.length;
  const [mx, mz] = crown.filter(([x, z]) => !exposure(x, z, 75).length).sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))[0];
  for (let y = 76; y <= 81; y++) put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907832.nbt");
console.log("way_23907832: %d blocks, tiers %j", g.count(), [...new Set([...cellAt.values()].map((c) => c.T))].sort((a, b) => a - b));
