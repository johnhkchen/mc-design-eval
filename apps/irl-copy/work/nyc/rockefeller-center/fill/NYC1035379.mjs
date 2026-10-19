// 6 East 45th Street (1932, Commercial & Office): a limestone setback office tower on a granite base, the north face on
// 45th Street with a recessed entrance, a 22-storey massing stepped down from a copper crown, a lidar-read shell.
// Floors sit at y = 2 + 3k (storey lines), tiers are multiples of 3 so every roof lands on a floor line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 14, D = 26, H = 74;

const cells = JSON.parse(readFileSync(`${DIR}/NYC1035379.cells.json`, "utf8"));
const roof = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, , r] of cells) roof[z][x] = r;

// Lidar dropouts (values under 4) are filled from valid neighbours: a 3x3 median, widening once if needed.
const valid = (v) => v >= 4;
function smoothed(x, z) {
  for (const rad of [1, 2]) {
    const vals = [];
    for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue;
      if (valid(roof[nz][nx])) vals.push(roof[nz][nx]);
    }
    if (vals.length) { vals.sort((a, b) => a - b); return vals[vals.length >> 1]; }
  }
  return 0;
}

// Flat tiers (roof heights): 6 = one-storey rear wing, 45 = north base, 57 = wings, 66 = shoulder, 69 = crown.
function tierOf(h) {
  if (h <= 12) return 6;
  if (h <= 50) return 45;
  if (h <= 60) return 57;
  if (h <= 67) return 66;
  return 69;
}
const TIER = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => tierOf(smoothed(x, z))));
// Roof equipment: a 4 x 4 penthouse on the crown, stepping up three blocks.
const TOP = TIER.map((row, z) => row.map((t, x) => (t === 69 && x >= 5 && x <= 8 && z >= 10 && z <= 13 ? 72 : t)));

const topAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : TOP[z][x]);
// The recessed entrance: a notch in the north face, two blocks of door opening under the canopy at y = 5.
const isNotch = (x, z, y) => z === 0 && x >= 5 && x <= 8 && (y === 3 || y === 4);
// A neighbour column that does not reach y, or a notch, or the edge of the lot, leaves this face exposed.
const open = (x, z, y) => x < 0 || z < 0 || x >= W || z >= D || isNotch(x, z, y) || topAt(x, z) <= y;
const expZ = (x, z, y) => open(x, z - 1, y) || open(x, z + 1, y);
const expX = (x, z, y) => open(x - 1, z, y) || open(x + 1, z, y);

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const top = TOP[z][x];
  for (let y = 0; y < top; y++) {
    if (isNotch(x, z, y)) continue;
    const ezz = expZ(x, z, y), exx = expX(x, z, y), ex = ezz || exx;
    // Roof cap: copper on the crown and its shoulder, stone elsewhere; a cornice band on the exposed edge.
    if (y === top - 1) {
      if (ex) put(x, y, z, "polished_andesite");
      else put(x, y, z, top >= 66 ? "oxidized_copper" : "stone_bricks");
      continue;
    }
    // Base course: granite on the exposed sides (the downhill sides show more of it), stone inside.
    if (y < 2) { put(x, y, z, ex ? "polished_granite" : "smooth_stone"); continue; }
    const row = (y - 2) % 3;
    // Floor line: a spandrel band on the face, a slab inside.
    if (row === 0) { put(x, y, z, ex ? "polished_andesite" : "smooth_stone"); continue; }
    // Storey rows: piers on the bay rhythm, glass between; interior stays air behind the glass.
    if (!ex) continue;
    const pier = ezz ? x % 3 === 0 : z % 3 === 0;
    if (pier) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "light_blue_stained_glass_pane");
  }
}

// The entrance door, set back in the notch, two blocks tall.
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(6, 3, 1, "dark_oak_door", doorState("lower"));
put(6, 4, 1, "dark_oak_door", doorState("upper"));

// Warm light: a lantern on the floor just inside some windows, never on a wall or in the air.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  for (let y = 3; y < TOP[z][x]; y += 3) {
    const row1 = y;                                          // the lower row of a storey, sitting on the floor line below
    if (!expZ(x, z, row1) && !expX(x, z, row1)) continue;
    if (row1 === 3 && z === 0) continue;                     // shopfront stays open to the street
    if (!((x * 3 + z * 5 + y) % 7 === 0)) continue;
    let dx = 0, dz = 0;
    if (expZ(x, z, row1)) dz = open(x, z - 1, row1) ? 1 : -1;
    else dx = open(x - 1, z, row1) ? 1 : -1;
    const ix = x + dx, iz = z + dz;
    if (ix < 0 || iz < 0 || ix >= W || iz >= D) continue;
    if (TOP[iz][ix] <= row1 || expZ(ix, iz, row1) || expX(ix, iz, row1)) continue;
    if (vox.get(ix, row1, iz)) continue;
    put(ix, row1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Glass panes connect to their neighbours the way the game would draw them: to glass, stone and piers, not to air or lights.
const solidish = (b) => b && !/lantern|door|air/.test(b.block);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < TOP[z][x]; y++) {
  const here = vox.get(x, y, z);
  if (!here || !here.block.endsWith("light_blue_stained_glass_pane")) continue;
  const side = (dx, dz) => (solidish(vox.get(x + dx, y, z + dz)) ? "true" : "false");
  put(x, y, z, "light_blue_stained_glass_pane", {
    north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false",
  });
}

// Parapet: a calcite lip on the outer edge of the taller tiers, standing on the roof cap.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const top = TOP[z][x];
  if (top < 45) continue;
  if (x === 0 || z === 0 || x === W - 1 || z === D - 1) put(x, top, z, "calcite");
}

const info = vox.save(`${DIR}/NYC1035379.nbt`);
console.log(JSON.stringify(info));
for (let z = 0; z < D; z++) console.log(String(z).padStart(2), TIER[z].map((t) => String(t).padStart(3)).join(""));
