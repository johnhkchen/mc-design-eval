// Smoke test for vocab/h1.mjs: every helper on a small 1.21.1 grid. Each call must place blocks, refuse nothing,
// and change only cells inside the box it was given. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const g = new Grid([48, 48, 48], { dataVersion: 3955 });
let failures = 0;

const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

function run(name, box, call) {
  const before = new Map(g.cells);
  const res = call();
  const changed = [...g.cells].filter(([k, c]) => before.get(k) !== c).map(([, c]) => c.pos);
  const stray = changed.filter((p) => !inside(box, p));
  const ok = res.placed > 0 && res.refused.length === 0 && stray.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${res.placed}, kept ${res.kept}, refused ${res.refused.length}, stray ${stray.length}`);
  if (res.refused.length) console.log("     refused:", res.refused.slice(0, 5));
  if (stray.length) console.log("     stray:", stray.slice(0, 5));
}

// A white wall for the painting helpers to go over: north face of the Hyatt wedge, a KOMO-like office, a shop line.
g.fill([16, 0, 8], [30, 38, 15], "white_concrete");
g.fill([2, 0, 2], [20, 8, 2], "white_concrete");

run("ribbonBand (air)", [4, 7, 4, 20, 12, 4], () => h1.ribbonBand(g, { x0: 4, x1: 20, z: 4, slab: 7 }));
run("ribbonBand (over wall)", [16, 7, 8, 30, 12, 8], () => h1.ribbonBand(g, { x0: 16, x1: 30, z: 8, slab: 7, over: true }));
run("crownRing", [0, 41, 7, 26, 43, 33], () => h1.crownRing(g, { cx: 13, cz: 20, r: 13 }));
run("finRow", [18, 7, 3, 32, 36, 3], () => h1.finRow(g, { xs: [18, 32], z: 3 }));
const rects = [
  { x0: 22, x1: 30, y0: 0, y1: 38, z0: 8, z1: 11 },
  { x0: 16, x1: 30, y0: 0, y1: 38, z0: 12, z1: 15 },
];
run("sawtoothStep (over wall)", [16, 1, 8, 30, 38, 15], () => h1.sawtoothStep(g, rects, { over: true }));
run("plantScreen", [36, 38, 36, 43, 44, 43], () => h1.plantScreen(g, [36, 38, 36, 43, 44, 43]));
run("shopfront (over wall)", [2, 1, 2, 20, 6, 2], () => h1.shopfront(g, { x0: 2, x1: 20, z: 2, open: [[5, 6]], over: ["white_concrete"] }));
run("planter", [24, 1, 24, 28, 2, 28], () => h1.planter(g, [24, 1, 24, 28, 2, 28]));
run("benchRow", [20, 1, 30, 26, 1, 36], () => h1.benchRow(g, [20, 30], 6, [0, 90]));

// Same blocks again are kept (idempotent); a different block in the way, without over, is refused and never thrown.
const again = h1.crownRing(g, { cx: 13, cz: 20, r: 13 });
if (again.placed !== 0 || again.kept === 0 || again.refused.length) { failures++; console.log("FAIL crownRing re-run should keep"); }
else console.log(`ok   crownRing re-run kept ${again.kept} cells`);
const clash = h1.planter(g, [16, 1, 9, 18, 2, 12]);
if (clash.refused.length === 0) { failures++; console.log("FAIL planter into a wall should refuse"); }
else console.log(`ok   planter into a wall refused ${clash.refused.length} cells`);

console.log(failures ? `${failures} FAILED` : "all helpers passed");
process.exit(failures ? 1 : 0);
