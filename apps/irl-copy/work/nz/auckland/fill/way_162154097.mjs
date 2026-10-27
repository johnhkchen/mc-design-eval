// Maota Sāmoa, Auckland (OSM way 162154097): a 1980s reinforced-concrete community and office block. The lidar roof
// is a stepped massing (two to seven storeys, the tall part toward the south), so each cell's roof is smoothed and
// quantized to whole 4-block storeys: a terraced silhouette with setbacks, every tier standing on the one below.
// White precast panels, light-grey frames and bands, tinted blue glazing, a stone plinth, grey roofs with parapets,
// and a dark timber entrance. Floors are slabs; the facade is one block thick, with air behind it and a few
// glowstone lamps set behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162154097.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162154097.nbt";

const W = 36, D = 70, YMAX = 40, TOP_CAP = 28;
const key = (x, z) => x * 100 + z;
const foot = new Map(), ground = new Map(), roofH = new Map();
for (const [x, z, gr, roof] of cells) { const k = key(x, z); foot.set(k, true); ground.set(k, gr); roofH.set(k, roof); }
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && foot.has(key(x, z));

// roof: a 5x5 mean of the lidar roof heights, quantized to whole storeys (4 blocks), at least two storeys above the ground
const top = new Map();
for (const [k, h0] of roofH) {
  const x = Math.floor(k / 100), z = k % 100;
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (has(x + dx, z + dz)) { s += roofH.get(key(x + dx, z + dz)); n++; }
  const gr = ground.get(k);
  const h = s / n;
  top.set(k, Math.min(TOP_CAP, Math.max(4 * Math.ceil((gr + 4) / 4), 4 * Math.round(h / 4))));
}
const T = (x, z) => top.get(key(x, z));
// a cell is solid from y 0 up to and including its deck (y = T); beyond that it is air
const occ = (x, z, y) => has(x, z) && y <= T(x, z);
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];              // outward: north, south, east, west
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !occ(x + dx, z + dz, y));

const v = new Voxels([W, YMAX, D]);
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// the facade of a shell cell: plinth, floor lines, window bands with mullions, spandrels, quoins at the corners
function facade(x, z, y, ex) {
  const k = Math.floor(y / 4), r = y % 4;
  const ew = ex.some(([dx]) => dx !== 0), ns = ex.some(([, dz]) => dz !== 0);
  const bay = ew ? z : x;                                       // along the face: a mullion every third block
  let b;
  if (ew && ns) b = "light_gray_concrete";                      // quoin
  else if (r === 0) b = k === 0 ? "stone_bricks" : "light_gray_concrete";
  else if (r === 3) b = k === 0 ? "light_gray_concrete" : "smooth_quartz";
  else b = bay % 3 === 0 ? "light_gray_concrete" : "light_blue_stained_glass";
  // the entrance on the north front: a dark oak double-height door in the ground bay, the second leaf is glass
  if (x === 31 && z === 0 && y <= 1) {
    v.set(x, y, z, "dark_oak_door", { ...DOOR, half: y === 0 ? "lower" : "upper" });
    return;
  }
  v.set(x, y, z, b);
  // a warm lamp behind some windows: the air cell one step inside, sparse and staggered by storey
  if (b === "light_blue_stained_glass" && r === 1 && (x * 7 + z * 3 + k) % 5 === 0) {
    const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
    if (has(ix, iz) && exposed(ix, iz, y).length === 0) v.set(ix, y, iz, "glowstone");
  }
}

for (const [k, gr] of ground) {
  const x = Math.floor(k / 100), z = k % 100, t = T(x, z);
  for (let y = 0; y < gr; y++) v.set(x, y, z, "stone_bricks");        // foundation to the lowest ground
  for (let y = gr; y < t; y++) {
    const ex = exposed(x, z, y);
    if (ex.length) facade(x, z, y, ex);
    else if (y % 4 === 0 || y === gr) v.set(x, y, z, "light_gray_concrete"); // floor slab per storey
  }
  v.set(x, t, z, "gray_concrete");                                    // the deck
  if (exposed(x, z, t).length) {                                      // parapet and cornice at the edge
    v.set(x, t + 1, z, "white_concrete");
    v.set(x, t + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// rooftop plant rooms on the taller tiers: 2x2 boxes with a grey roof, set on the deck
for (const [k] of ground) {
  const x = Math.floor(k / 100), z = k % 100, t = T(x, z);
  if (t < 16 || x % 9 !== 4 || z % 9 !== 4) continue;
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!block.every(([bx, bz]) => has(bx, bz) && exposed(bx, bz, t).length === 0)) continue;
  for (const [bx, bz] of block) for (let y = t + 1; y <= t + 2; y++) v.set(bx, y, bz, "light_gray_concrete");
}

const stats = v.save(OUT);
console.log(JSON.stringify({ file: OUT, ...stats, size: v.size }));
