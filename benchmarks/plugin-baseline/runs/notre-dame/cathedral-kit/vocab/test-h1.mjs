// Calls every h1 helper once on an empty grid and checks it placed blocks only inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import { strict as assert } from "node:assert";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { plinthCourse, roseWindow, balustrade, pinnacle, leadRoof, spireStage, floodlight } from "./h1.mjs";

const SIZE = [48, 64, 48];

// run(g) places one helper; fp = [x0, y0, z0, x1, y1, z1] is the footprint that call was given.
function check(name, fp, run) {
  const g = new Grid(SIZE);
  const r = run(g);
  const bad = [...g.cells.values()].filter(({ pos }) => pos.some((v, i) => v < fp[i] || v > fp[i + 3]));
  assert.equal(bad.length, 0, `${name}: ${bad.length} block(s) outside its footprint, e.g. ${JSON.stringify(bad[0]?.pos)}`);
  assert.ok(r.cells > 0, `${name}: placed nothing`);
  assert.equal(r.refused.length, 0, `${name}: refused ${JSON.stringify(r.refused.slice(0, 3))}`);
  console.log(`ok  ${name}: ${r.cells} blocks`);
  return g;
}

check("plinthCourse", [4, 0, 4, 8, 2, 8], (g) => plinthCourse(g, [4, 0, 4, 8, 2, 8]));
check("roseWindow", [20, 13, 13, 20, 27, 27], (g) => roseWindow(g, [20, 20, 20], "west", 5, true));
check("balustrade", [4, 40, 30, 20, 40, 30], (g) => balustrade(g, [4, 30, 20, 30], 40));
check("pinnacle", [29, 39, 29, 31, 44, 31], (g) => pinnacle(g, 30, 30, 39, 6));
check("leadRoof gable", [10, 17, 10, 30, 23, 20],(g) => leadRoof(g, [10, 10, 30, 20], 17, { ridge: "x" }));
check("leadRoof lean", [10, 17, 10, 30, 22, 20], (g) => leadRoof(g, [10, 10, 30, 20], 17, { lean: "south" }));
check("spireStage", [24, 52, 24, 36, 60, 36], (g) => spireStage(g, 30, 30, 52, 60, 11, { cut: 3, solid: true, crockets: [56] }));
check("floodlight", [30, 3, 30, 30, 3, 30], (g) => floodlight(g, 30, 3, 30, "z"));

// Writes only into air: a plinth over existing stone places nothing and reports every cell refused.
{
  const g = new Grid(SIZE);
  plinthCourse(g, [4, 0, 4, 8, 2, 8]);
  const again = plinthCourse(g, [4, 0, 4, 8, 2, 8]);
  assert.equal(again.cells, 0, "plinthCourse overwrote existing blocks");
  assert.equal(again.refused.length, 75,"plinthCourse did not report refused cells");
  console.log("ok  air-only: second plinthCourse refused everything");
}

console.log("all h1 helpers passed");
