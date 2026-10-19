// 120 West 45th Street, 1988 midblock office tower, built from the footprint's lidar roof record.
// Massing: lidar roof per cell, snapped to the record's tiers (open ground, a 26 wing, a 54 podium at the north edge,
// a 96 shoulder, a 128 roof terrace, and the 134 tower body). Storeys are aligned from the top down, so the base
// course is the odd remainder at the bottom and the downhill side (ground 0) gets the extra storeys underneath.
// Facade: granite base, light piers on a 3-block storey grid, dark bronze-tinted glass between, a few lit panes,
// a storefront on the ground storey, a glass-and-steel entrance on the south (45th Street) face, a coping and parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 42, D = 24, H = 147;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1069581.cells.json`, "utf8"));

const FOUND = "polished_andesite", BASE = "polished_granite", PIER = "polished_andesite", SLAB = "light_gray_concrete";
const GLASS = "gray_stained_glass", LIT = "glowstone", ROOF = "gray_concrete", COPING = "polished_andesite";
const PARAPET = "polished_andesite", PAVE = "smooth_stone", BOX = "stone_bricks";

const TIERS = [1, 26, 54, 96, 128, 134];
const snap = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));

const col = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) col[z][x] = { g, t: snap(r) };
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : col[z][x]);
const nTop = (x, z) => (at(x, z) ? at(x, z).t : -1);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Lidar holes: an open cell ringed by tower roof is a noisy return, not a courtyard. It takes the tower's top.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = col[z][x]; if (!c || c.t > 2) continue;
  const tall = NB.map(([dx, dz]) => at(x + dx, z + dz)).filter((n) => n && n.t >= 96);
  if (tall.length >= 3) c.t = Math.max(...tall.map((n) => n.t));
}

const ENTRANCE_X = [19, 20], ENTRANCE_Z = 19;
// Lit offices come in whole two-window bays, about one bay in six per storey, so they read as rooms, not noise.
const lit = (u, j) => (Math.floor(u / 6) * 31 + j * 17) % 6 === 0 && u % 3 !== 0;

// What a wall block on an exposed face is: null for interior air, else a block (door, pier, storefront, glass or lit pane).
function facade(x, y, z, j, n, b) {
  const exp = { "+z": nTop(x, z + 1) <= y, "-z": nTop(x, z - 1) <= y, "+x": nTop(x + 1, z) <= y, "-x": nTop(x - 1, z) <= y };
  if (!Object.values(exp).some(Boolean)) return null;
  const onZFace = exp["+z"] || exp["-z"];
  const u = onZFace ? x : z;                       // position along the facade the block faces
  if (j === n && z === ENTRANCE_Z && exp["+z"] && ENTRANCE_X.includes(x)) {
    return { block: "iron_door", state: { facing: "south", half: y === b + 1 ? "lower" : "upper", hinge: x === ENTRANCE_X[0] ? "left" : "right", open: "false", powered: "false" } };
  }
  if (j === n) return u % 6 === 0 ? { block: BASE } : { block: GLASS };   // storefront: glass, granite piers every 6
  if (u % 3 === 0) return { block: PIER };
  return lit(u, j) ? { block: LIT } : { block: GLASS };
}

const v = new Voxels([W, H, D]);
const posts = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = col[z][x]; if (!c) continue;
  const { g: G, t } = c;
  if (t <= 2) {                                    // open ground: foundation to the ground, then paving
    for (let y = 0; y < G; y++) v.set(x, y, z, FOUND);
    v.set(x, G, z, PAVE);
    continue;
  }
  const n = Math.floor((t - 1 - G) / 3);           // storeys above the base course, aligned from the top
  const bn = t - 1 - 3 * n;                        // the bottom storey's floor
  for (let y = 0; y < G; y++) v.set(x, y, z, FOUND);
  for (let y = G; y < bn; y++) v.set(x, y, z, BASE);
  const perim = NB.some(([dx, dz]) => { const m = at(x + dx, z + dz); return !m || m.t < t; });
  for (let j = 0; j <= n; j++) {
    const b = t - 1 - 3 * j;
    if (j === 0) { v.set(x, b, z, perim ? COPING : ROOF); continue; }   // roof membrane / coping at t-1
    v.set(x, b, z, SLAB);                          // storey floor, solid across the footprint
    for (let y = b + 1; y <= b + 2; y++) {
      const blk = facade(x, y, z, j, n, b);
      if (blk) v.set(x, y, z, blk.block, blk.state);
    }
  }
  if (perim) v.set(x, t, z, PARAPET);              // parapet on the roof edge, standing on the coping
}

// Entrance canopy: posts on the paving in front of the doors (z 20), a slab on top at the first floor's ceiling.
// The tower's ground storey floor is at y 1 (ground 1 under the plaza), so the posts run y 2-3 and the canopy sits at y 4.
const FLOOR1 = 1;
for (let x = 17; x <= 22; x++) {
  for (let y = FLOOR1 + 1; y <= FLOOR1 + 2; y++) v.set(x, y, 20, "polished_granite");
  v.set(x, FLOOR1 + 3, 20, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Crown: lanterns on the four tower corners, standing on the parapet.
for (const [x, z] of [[0, 3], [41, 3], [0, 19], [41, 19]]) v.set(x, nTop(x, z) + 1, z, "lantern", { hanging: "false", waterlogged: "false" });

// 128 roof terrace: a stair-core box on the terrace, standing on its coping.
for (let z = 13; z <= 14; z++) for (let x = 29; x <= 31; x++) for (let y = 128; y <= 130; y++) v.set(x, y, z, BOX);

// 54 north terrace: planters standing on its roof.
for (const x of [4, 10, 16, 22, 28]) v.set(x, 54, 0, "moss_block");

const stats = v.save(`${DIR}/NYC1069581.nbt`);
console.log(JSON.stringify({ cells: cells.length, ...stats }));
