// Way 293020974: a 1930s brick-and-plaster shop-and-office block, two storeys on the downhill side and one
// on the uphill side (the slope steps the roof tiers down from 10 to 8). Shopfronts on the ground floor, Crittall-style
// punched windows above, cream string courses and a cornice, a brick parapet, a flat roof with plant boxes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_293020974.cells.json", "utf8"));   // [x, z, ground, roof]
const W = 39, D = 37, H = 22;
const LINES = [4, 8];   // storey string courses, absolute height above y 0

const ground = Array.from({ length: D }, () => Array(W).fill(null));
const roofRaw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, gr, rt] of cells) { ground[z][x] = gr; roofRaw[z][x] = rt; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[z][x] !== null;

// lidar roof: 3x3 median over the footprint (lidar noise), snapped to whole roof tiers 8-10
const roof = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) vals.push(roofRaw[z + dz][x + dx]);
  vals.sort((a, b) => a - b);
  roof[z][x] = Math.min(10, Math.max(8, vals[Math.floor(vals.length / 2)]));
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outward = (x, z) => Object.keys(DIRS).filter(k => !inFp(x + DIRS[k][0], z + DIRS[k][1]));
const footprint = cells.map(c => [c[0], c[1]]);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < H) g.set(x, y, z, block, state); };
const empty = (x, y, z) => y >= 0 && y < H && g.val(x, y, z) === 0;
const slab = { type: "bottom", waterlogged: "false" };

// the facade of a wall cell: what block sits at height y (null when nothing is set there)
function facade(x, z, y, gr, rt, out) {
  const alongX = out.includes("N") || out.includes("S");        // the wall runs east-west
  const corner = out.some(d => "NS".includes(d)) && out.some(d => "EW".includes(d));
  const pier = (alongX ? x : z) % 3 === 0;
  if (y === rt) return ["stone_bricks"];                          // parapet, one block above the roof
  if (y === rt - 1) return ["smooth_stone"];                      // coping
  if (y === rt - 2) return ["smooth_stone_slab", slab];           // cornice
  if (corner) return ["stone_bricks"];                            // quoins
  if (y === gr) return ["polished_andesite"];                     // base course
  if (LINES.includes(y)) return ["white_concrete"];               // cream string course
  if (y < 4) {
    if (y === 3) return ["dark_oak_planks"];                      // shopfront transom
    return pier ? ["bricks"] : ["glass"];                         // shopfront glazing
  }
  if (pier) return ["bricks"];
  if (y === 5) return ["stone_brick_slab", slab];                 // window sill
  return ["glass_pane", {                                         // window glass joined along its wall
    north: String(!alongX), south: String(!alongX), east: String(alongX), west: String(alongX), waterlogged: "false",
  }];
}

// 1. foundation, walls and the bearing partitions under each roof step
for (const [x, z] of footprint) {
  const gr = ground[z][x], rt = roof[z][x], out = outward(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  if (out.length === 0) {
    const lower = Math.min(...Object.values(DIRS).map(([dx, dz]) => roof[z + dz][x + dx]));
    if (lower < rt) for (let y = gr; y <= rt - 2; y++) put(x, y, z, "bricks");   // a step needs a solid riser under it
    continue;
  }
  for (let y = gr; y <= rt; y++) { const [b, s] = facade(x, z, y, gr, rt, out); put(x, y, z, b, s); }
}

// 2. one floor slab per storey inside (ground, then each string-course level), the air above them is the room
for (const [x, z] of footprint) {
  if (outward(x, z).length) continue;
  const gr = ground[z][x], rt = roof[z][x];
  for (const L of [gr, ...LINES]) if (L >= gr && L < rt - 1 && empty(x, L, z)) put(x, L, z, "oak_planks");
}

// 3. roof deck on every cell (the parapet and coping are already on the walls)
for (const [x, z] of footprint) {
  if (outward(x, z).length) continue;
  const rt = roof[z][x];
  if (empty(x, rt - 1, z)) put(x, rt - 1, z, "smooth_stone");
  if (rt === 10 && x % 9 === 4 && z % 9 === 4) put(x, rt, z, "light_gray_concrete");   // plant box on the roof
}

// 4. the street door: lowest front-facing wall cell near the middle of the block
const bx = (W - 1) / 2, bz = (D - 1) / 2;
const doorCands = footprint.filter(([x, z]) => outward(x, z).length === 1 && ground[z][x] <= 2)
  .sort((a, b) => ground[a[1]][a[0]] - ground[b[1]][b[0]]
    || (Math.hypot(a[0] - bx, a[1] - bz) - Math.hypot(b[0] - bx, b[1] - bz)));
if (doorCands.length) {
  const [x, z] = doorCands[0], gr = ground[z][x];
  const facing = { N: "north", S: "south", W: "west", E: "east" }[outward(x, z)[0]];
  const door = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  put(x, gr, z, "oak_door", door("lower"));
  put(x, gr + 1, z, "oak_door", door("upper"));
}

// 5. warm light: glowstone just inside some lit windows (the room behind the glass stays air otherwise)
for (const [x, z] of footprint) {
  const out = outward(x, z), gr = ground[z][x], rt = roof[z][x];
  if (!out.length || out.length > 1 || 6 >= rt - 2 || 6 <= gr) continue;   // only plain wall cells with a pane at y 6
  const pier = (out[0] === "N" || out[0] === "S" ? x : z) % 3 === 0;
  if (pier || (x * 7 + z * 5) % 4 !== 0) continue;
  const [ix, iz] = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[out[0]];
  if (inFp(ix, iz) && empty(ix, 6, iz)) put(ix, 6, iz, "glowstone");
}

g.save(DIR + "way_293020974.nbt");
