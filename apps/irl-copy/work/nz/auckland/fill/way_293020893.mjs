// Assurant, Auckland: a late-1980s office tower on a stone base, the Queen Street kind. Its roof tiers come from the lidar
// (a 50-block crown on the core, a 44-block body, a 40-block shoulder on the west and south, a 12 to 16-block wing on the
// north-west), smoothed by a majority vote over each cell and its neighbours. Floors sit at y = 3 + 4n, white piers every
// 3 blocks, light-grey spandrels, blue glass ribbons, a cornice and a parapet, a plant room on the body's roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020893.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([50, 63, 46]);

const k = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                                    // E, W, S, N
const INWARD = [[-1, 0], [1, 0], [0, -1], [0, 1]];                                  // the cell behind a face exposed E, W, S, N
const ground = new Map(cells.map(([x, z, gr]) => [k(x, z), gr]));

// Lidar roof to tier top (blocks above y 0)
const tierOf = (r) => (r >= 47 ? 50 : r >= 42 ? 44 : r >= 21 ? 40 : r >= 15 ? 16 : 12);
let top = new Map(cells.map(([x, z, , r]) => [k(x, z), tierOf(r)]));
for (let pass = 0; pass < 2; pass++) {                                              // majority vote over the 3 x 3 block, ties keep the cell's own tier
  const next = new Map();
  for (const [key, t] of top) {
    const [x, z] = key.split(",").map(Number), votes = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const v = top.get(k(x + dx, z + dz)); if (v !== undefined) votes.set(v, (votes.get(v) || 0) + 1);
    }
    let best = t, n = votes.get(t) || 0;
    for (const [v, c] of votes) if (c > n) { best = v; n = c; }
    next.set(key, best);
  }
  top = next;
}

const topAt = (x, z) => top.get(k(x, z));                                           // undefined outside the footprint
// a face is exposed at height y when the neighbour outside the footprint, or lower than y, has no block there
const exposed = (x, z, y) => DIRS.map(([dx, dz]) => { const t = topAt(x + dx, z + dz); return t === undefined || t <= y; });
const isExt = (x, z, y) => exposed(x, z, y).some(Boolean);

const glassAt = (x, z, t, storey) => (t === 50 ? "gray_stained_glass"
  : (Math.floor(x / 3) + Math.floor(z / 3) + storey) % 4 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");

for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  // foundation: solid from y 0 up to the cell's ground, and to the datum (y 3) so the body stands level on a slope
  for (let y = 0; y < Math.max(ground.get(key), 3); y++) g.set(x, y, z, y === 2 ? "polished_andesite" : "stone_bricks");
  for (let y = 3; y < t; y++) {
    const storey = Math.floor((y - 3) / 4), off = (y - 3) % 4, ext = isExt(x, z, y);
    if (y === t - 1) { g.set(x, y, z, ext ? "stone_bricks" : "gray_concrete"); continue; }   // parapet cap, roof deck
    if (ext && y === t - 2) { g.set(x, y, z, "polished_andesite"); continue; }                 // cornice
    if (!ext) { if (off === 0) g.set(x, y, z, "light_gray_concrete"); continue; }            // interior: floor slab only, air behind the glass
    const pier = x % 3 === 0 || z % 3 === 0;                                        // a grid of 3, not corners: a stepped edge exposes every cell on two axes
    let m;
    if (storey === 0) m = off === 0 ? "polished_andesite" : off === 3 ? "stone_bricks" : pier ? "stone_bricks" : "light_blue_stained_glass";
    else if (off === 0) m = pier ? "white_concrete" : "light_gray_concrete";           // spandrel course, the storey line
    // glass ribbon over the other three rows (the head is glazed too: office glass, not punched holes)
    else m = pier ? "white_concrete" : glassAt(x, z, t, storey);
    g.set(x, y, z, m);
  }
}

// Entrance: the south face of the body, the bay nearest the middle of the lobby. A dark oak door under an awning band.
const south = [...top.keys()].map((s) => s.split(",").map(Number))
  .filter(([x, z]) => topAt(x, z + 1) === undefined && topAt(x, z) >= 40);
const [ex, ez] = south.sort((a, b) => Math.abs(a[0] - 20) - Math.abs(b[0] - 20))[0] || [];
if (ex !== undefined) {
  g.set(ex, 4, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, 5, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const ax of [ex - 1, ex, ex + 1]) if (topAt(ax, ez) !== undefined && isExt(ax, ez, 6)) g.set(ax, 6, ez, "dark_oak_planks");
}

// Warm lamps: a lantern on the floor slab just inside some lit bays, seen through the glass
for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  if (x % 3 === 0 || z % 3 === 0) continue;                                         // piers only, no lamps
  for (let y = 4; y < t - 2; y += 4) {                                              // the glass row of each storey
    if (!isExt(x, z, y) || (x * 7 + z * 3 + y) % 5 !== 0) continue;
    const i = exposed(x, z, y).indexOf(true);
    const [dx, dz] = INWARD[i], ix = x + dx, iz = z + dz;
    if (topAt(ix, iz) === undefined || isExt(ix, iz, y)) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Crown mast: a lightning rod on the core's roof, near its middle
const crown = [...top].filter(([, t]) => t === 50).map(([key]) => key.split(",").map(Number));
const cx = crown.reduce((s, [x]) => s + x, 0) / crown.length, cz = crown.reduce((s, [, z]) => s + z, 0) / crown.length;
const [mx, mz] = crown.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))[0];
for (let y = 50; y < 56; y++) g.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Plant room on the body's roof: a 6 x 4 box, louvred at the walls (y 45), capped at 47
for (let x = 8; x <= 13; x++) for (let z = 30; z <= 33; z++) {
  if (topAt(x, z) !== 44) continue;
  const edge = x === 8 || x === 13 || z === 30 || z === 33;
  g.set(x, 44, z, "gray_concrete");
  if (edge) { g.set(x, 45, z, "iron_bars"); g.set(x, 46, z, "light_gray_concrete"); }
  g.set(x, 47, z, "smooth_stone");
}

g.save(`${DIR}/way_293020893.nbt`);
