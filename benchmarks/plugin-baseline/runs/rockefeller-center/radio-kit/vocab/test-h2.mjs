// Calls every H2 helper once on a fresh grid and checks it wrote blocks only inside the footprint it was given, and
// overwrote nothing that was already there (air-only). Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import * as h2 from "./h2.mjs";

let failed = 0;
// footprint = [x0, y0, z0, x1, y1, z1]; want = the exact count the helper should return, when known.
function check(name, size, footprint, call, { setup = () => {}, want } = {}) {
  const g = new Grid(size, { dataVersion: DATA_VERSIONS["1.21.1"] });
  setup(g);
  const before = new Map(g.cells);
  const n = call(g);
  const [x0, y0, z0, x1, y1, z1] = footprint;
  const changed = [...g.cells].filter(([k, c]) => before.get(k) !== c).map(([, c]) => c);
  const outside = changed.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const overwritten = [...before].filter(([k, c]) => g.cells.get(k) !== c).length;
  const ok = n > 0 && changed.length > 0 && outside.length === 0 && overwritten === 0 && (want === undefined || n === want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${n} placed${want !== undefined ? ` (want ${want})` : ""}, ${outside.length} outside, ${overwritten} overwritten`);
  return g;
}

check("setback_deck", [20, 8, 20], [2, 2, 4, 9, 3, 8],
  (g) => h2.setback_deck(g, [2, 4, 9, 8], { y: 2, lightEvery: 3 }),
  { setup: (g) => g.set(2, 2, 4, "minecraft:stone") });   // the stone cell must survive: air-only

check("lit_window_cluster", [20, 8, 20], [5, 5, 9, 12, 5, 10],
  (g) => h2.lit_window_cluster(g, "south", 10, 5, 3),
  { setup: (g) => { for (let x = 5; x <= 12; x++) g.set(x, 5, 10, "minecraft:gray_stained_glass"); }, want: 3 });

check("marquee_corner", [20, 12, 20], [5, 5, 11, 6, 11, 12],
  (g) => h2.marquee_corner(g, [5, 12], { y: 6 }), { want: 20 });

const blade = check("blade_sign", [6, 40, 60], [0, 11, 51, 4, 35, 53],
  (g) => h2.blade_sign(g, [0, 11, 51, 4, 34, 52]));
// plan.md: R31 A29 D27 I25 O23, the blank row 21, then C19 I17 T15 Y13, all at x2 z53.
const rows = [...blade.cells.values()].filter((c) => c.block === "minecraft:white_wall_banner" && c.pos[2] === 53).map((c) => c.pos[1]).sort((a, b) => b - a);
const wantRows = [31, 29, 27, 25, 23, 19, 17, 15, 13];
const bannerOk = rows.join() === wantRows.join();
if (!bannerOk) failed++;
console.log(`${bannerOk ? "ok  " : "FAIL"} blade_sign letters at rows ${rows.join(",")}${bannerOk ? "" : `, want ${wantRows.join(",")}`}`);

check("glazed_front", [14, 8, 60], [3, 1, 49, 9, 5, 50],
  (g) => h2.glazed_front(g, [3, 1, 50, 9, 5, 50], { facing: "south", mullionEvery: 3 }), { want: 42 });

check("garden_bed", [20, 24, 20], [4, 18, 4, 12, 19, 10],
  (g) => h2.garden_bed(g, [4, 4, 12, 10], { y: 18 }), { want: 103 });

check("sidewalk", [10, 4, 10], [0, 0, 0, 5, 0, 5],
  (g) => h2.sidewalk(g, [0, 0, 5, 5], { y: 0 }), { want: 36 });

console.log(failed ? `${failed} check(s) failed` : "all H2 helper checks passed");
process.exitCode = failed ? 1 : 0;
