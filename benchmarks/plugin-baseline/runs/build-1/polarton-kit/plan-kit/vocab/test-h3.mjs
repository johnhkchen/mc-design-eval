// Smoke test for h3.mjs: each helper once on a blank grid, at its plan.md spot; every placed cell must sit inside the
// footprint the test gives it, and nothing may be refused. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const g = new Grid([96, 30, 24]);
const cases = [
  ["slabRamp (plot 1 way in)", () => h3.slabRamp(g, 17, 6, 2, 1), [17, 1, 6, 18, 1, 8]],
  ["hayDoor (gin)", () => h3.hayDoor(g, 5, 7, 9, "north"), [4, 7, 9, 7, 8, 9]],
  ["doorPair (cloakroom)", () => h3.doorPair(g, 17, 2, 9, "north", "mangrove_door"), [17, 2, 9, 18, 4, 9]],
  ["porchDeep (farmhouse)", () => h3.porchDeep(g, 26, 1, 9, "north", { width: 8, depth: 3 }), [26, 1, 7, 33, 6, 9]],
  ["spireCap (church)", () => h3.spireCap(g, 51, 19, 9, { size: 4, rows: 6 }), [51, 19, 9, 54, 23, 12]],
  ["picketYard (graveyard)", () => h3.picketYard(g, [56, 1, 6, 58, 2, 9]), [56, 1, 6, 58, 2, 9]],
  ["baleStack (yard, plot 0)", () => h3.baleStack(g, 1, 1, 6), [1, 1, 6, 3, 1, 8]],
  ["chimney (plot 2 hearth)", () => h3.chimney(g, { wall: [32, 2, 15], into: "west", top: 13 }), [32, 0, 14, 34, 13, 16]],
  ["yardBench (plot 1)", () => h3.yardBench(g, 13, 1, 7, "south"), [13, 1, 7, 14, 1, 7]],
];

let failed = 0;
for (const [name, run, [x0, y0, z0, x1, y1, z1]] of cases) {
  const { placed, refused = [] } = run();
  const outside = placed.filter(([x, y, z]) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ok = placed.length > 0 && outside.length === 0 && refused.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${placed.length} placed, ${refused.length} refused, ${outside.length} outside`);
}
console.log(failed ? `${failed} helper(s) failed` : "all helpers passed");
process.exit(failed ? 1 : 0);
