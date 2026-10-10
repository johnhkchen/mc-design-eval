import { Grid, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = new Grid([19, 15, 26]);
const ox = 2, oz = 4, W = 15, D = 21;
const S = (x, y, z, b, st = {}) => g.set(x, y, z, b, st);
const SB = (x, y, z, bs) => g.set(x, y, z, ...bs);
const F = (a, b, blk, st) => g.fill(a, b, blk, st);
const RED = "red_concrete", WH = "white_concrete";
// ground
F([0, 0, 0], [18, 0, 25], "grass_block");
F([ox, 0, oz], [ox + W - 1, 0, oz + D - 1], "spruce_planks");
// walls
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (x > 0 && x < W - 1 && z > 0 && z < D - 1) continue;
  S(ox + x, 1, oz + z, x % 3 == 0 || z % 3 == 0 ? "cobblestone" : "stone_bricks");
  for (let y = 2; y <= 6; y++) S(ox + x, y, oz + z, RED);
}
// corner posts + base band
for (const x of [0, W - 1]) for (const z of [0, D - 1]) F([ox + x, 2, oz + z], [ox + x, 6, oz + z], WH);
// gambrel roof
const s = { 7: 7, 6: 8, 5: 9, 4: 9, 3: 10, 2: 10, 1: 11, 0: 11 };
const cx = 7;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const dx = Math.abs(x - cx), y = s[dx], end = z == 0 || z == D - 1;
  const out = x < cx ? "west" : "east";
  const stair = dx > 0 && dx < 7 && s[dx + 1] < s[dx] || dx == 7;
  const mat = end ? "quartz" : "deepslate_tile";
  if (dx == 0 || !stair) S(ox + x, y, oz + z, end ? "smooth_quartz" : "deepslate_tiles");
  else SB(ox + x, y, oz + z, B.stairs(mat, out));
  if (!end || true) { // underlayer
    const u = dx == 0 ? y - 1 : y - 1;
    if (u >= 7 && !end) S(ox + x, u, oz + z, "deepslate_tiles");
  }
  if (end) for (let yy = 7; yy < y; yy++) S(ox + x, yy, oz + z, RED);
}
// white band under front/back gable on roofline: keep; eave brackets
for (const z of [0, D - 1]) for (const x of [0, W - 1]) S(ox + x, 7, oz + z, "smooth_quartz");
// roof hollow under, gable ends interior behind front wall left air
// front: double doors
const fz = oz;
const leaf = (x0) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
  S(ox + x0 + i, 1 + j, fz, i == j || i == 3 - j ? WH : RED); } };
leaf(3); leaf(8);
F([ox + 7, 1, fz], [ox + 7, 4, fz], "dark_oak_log", { axis: "y" });
F([ox + 2, 1, fz], [ox + 2, 5, fz], WH); F([ox + 12, 1, fz], [ox + 12, 5, fz], WH);
F([ox + 2, 5, fz], [ox + 12, 5, fz], WH);
F([ox + 3, 6, fz - 1], [ox + 11, 6, fz - 1], "dark_oak_planks"); // rail beam proud
F([ox + 2, 6, fz], [ox + 12, 6, fz], WH);
// lanterns by chains
for (const x of [2, 12]) { SB(ox + x, 5, fz - 1, B.chain()); SB(ox + x, 4, fz - 1, B.lantern(true)); }
// side-of-door windows? front: loft door
F([ox + 6, 7, fz], [ox + 8, 8, fz], "air");
F([ox + 6, 7, fz + 1], [ox + 8, 8, fz + 1], "hay_block", { axis: "y" });
for (const x of [5, 9]) { F([ox + x, 7, fz], [ox + x, 9, fz], WH); }
F([ox + 5, 9, fz], [ox + 9, 9, fz], WH);
S(ox + 6, 7, fz, WH); S(ox + 8, 7, fz, WH);
for (const x of [5, 9]) S(ox + x, 8, fz - 1, "white_concrete"); // proud shutter edges
// X on shutters
S(ox + 5, 8, fz, RED); S(ox + 9, 8, fz, RED);
F([ox + 7, 10, fz - 2], [ox + 7, 10, fz], "dark_oak_log", { axis: "z" });
S(ox + 7, 11, fz - 1, "dark_oak_planks");
SB(ox + 7, 9, fz - 2, B.chain()); SB(ox + 7, 8, fz - 2, B.chain());
S(ox + 7, 7, fz - 2, "hay_block", { axis: "y" });
// white rake at gable already via end quartz. Side windows and door
for (const z of [4, 9, 14]) for (const x of [0, W - 1]) {
  F([ox + x, 3, oz + z], [ox + x, 4, oz + z], "glass_pane");
  S(ox + x, 5, oz + z, WH); S(ox + x, 2, oz + z, WH);
}
for (const z of [4, 10]) { for (const dxs of [-1, 1]) { const x = (dxs < 0 ? 0 : W - 1); const o = dxs < 0 ? -1 : 1;
  } }
// side door east z=17
SB(ox + 14, 1, oz + 17, B.door("dark_oak", "east", "lower"));
SB(ox + 14, 2, oz + 17, B.door("dark_oak", "east", "upper"));
S(ox + 14, 3, oz + 17, WH);
S(ox + 15, 0, oz + 17, "cobblestone");
// cupola on ridge
for (let z = 9; z <= 11; z++) for (let x = 6; x <= 8; x++) S(ox + x, 11, oz + z, "deepslate_tiles");
for (let z = 9; z <= 11; z++) for (let x = 6; x <= 8; x++) {
  const edge = x == 6 || x == 8 || z == 9 || z == 11;
  if (edge) S(ox + x, 12, oz + z, (x != 7 && z != 10) ? WH : RED);
}
for (const [x, z] of [[7, 9], [7, 11]]) SB(ox + x, 12, oz + z, B.trapdoor("dark_oak", z == 9 ? "north" : "south", "bottom", false));
for (const [x, z] of [[6, 10], [8, 10]]) SB(ox + x, 12, oz + z, B.trapdoor("dark_oak", x == 6 ? "west" : "east", "bottom", false));
S(ox + 7, 12, oz + 10, "air");
// cupola cap (pyramid)
for (let z = 8; z <= 12; z++) for (let x = 5; x <= 9; x++) {
  const dx = Math.abs(x - 7), dz = Math.abs(z - 10);
  if (dx == 2 || dz == 2) {
    if (dx == 2 && dz == 2) continue;
    if (dx == 2) SB(ox + x, 13, oz + z, B.stairs("deepslate_tile", x < 7 ? "west" : "east"));
    else SB(ox + x, 13, oz + z, B.stairs("deepslate_tile", z < 10 ? "north" : "south"));
  } else S(ox + x, 13, oz + z, "deepslate_tiles");
}
F([ox + 7, 14, oz + 10], [ox + 7, 14, oz + 10], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
// foundation stone steps / hay + fence
const fy = 1;
for (let x = 0; x < 19; x++) if (x < 6 || x > 12) SB(x, fy, 1, B.fence("dark_oak"));
for (const x of [0, 18]) for (let z = 2; z <= 14; z++) SB(x, fy, z, B.fence("dark_oak"));
for (const [x, y, z] of [[1, 1, 2], [2, 1, 2], [1, 1, 3], [1, 2, 2], [16, 1, 2], [17, 1, 3], [17, 1, 2], [1, 1, 18], [1, 1, 19], [2, 1, 19], [17, 1, 22]]) S(x, y, z, "hay_block", { axis: "y" });
S(5, 1, 2, "barrel", { facing: "up", open: "false" });
F([6, 0, 0], [12, 0, 3], "dirt_path");
F([6, 0, 0], [12, 0, 3], "dirt_path");
g.save("/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/baseline-1/red-barn-plugin/build.nbt");
console.log(g.refused);
