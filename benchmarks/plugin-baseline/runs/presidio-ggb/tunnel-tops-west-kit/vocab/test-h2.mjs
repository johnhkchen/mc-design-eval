// Smoke test for vocab/h2.mjs: each helper once on a small grid; every cell it changes must lie in the footprint given.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const g = new Grid([24, 14, 24], { dataVersion: 3955 });   // 1.21.1
for (let x = 0; x < 23; x++) for (let z = 0; z < 24; z++) h2.groundColumn(g, x, z, "grass_block", 3);   // surface y 3

let fails = 0;
const inside = (p, [x0, y0, z0, x1, y1, z1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;

// run one helper call; every cell whose block changed must sit inside `foot`
function check(name, foot, call, { expectRefused = false } = {}) {
  const before = new Map([...g.cells].map(([k, c]) => [k, c.block]));
  const r = call();
  const stray = [];
  for (const [k, c] of g.cells) if (before.get(k) !== c.block && !inside(c.pos, foot)) stray.push(c.pos);
  const ok = stray.length === 0 && (expectRefused ? r.refused.length > 0 : r.placed > 0 && r.refused.length === 0);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: placed ${r.placed}, refused ${r.refused.length}${stray.length ? `, stray ${JSON.stringify(stray)}` : ""}`);
  return r;
}

check("groundColumn water", [23, 1, 0, 23, 2, 0], () => h2.groundColumn(g, 23, 0, "water", 2));
check("curvePath", [2, 3, 4, 11, 3, 13], () => h2.curvePath(g, [[2, 4], [10, 4], [10, 12]], { width: 2, y: 3 }));
check("retainWall", [2, 5, 16, 5, 10, 17], () => h2.retainWall(g, 2, 5, 16, 17, 9, { y0: 5 }));
check("balanceLog", [8, 4, 16, 12, 4, 16], () => h2.balanceLog(g, 8, 16, 5, "x", { y: 4 }));
check("picnicTable", [15, 4, 5, 17, 5, 7], () => h2.picnicTable(g, 16, 4, 6, { axis: "x" }));
check("seatWall", [2, 4, 20, 9, 5, 20], () => h2.seatWall(g, 2, 9, 4, 20, { aisles: [[5, 6]] }));
check("shrubMound", [12, 4, 17, 16, 5, 21], () => h2.shrubMound(g, 14, 19, 5, 5, 2, 4, { seed: 1 }));
check("lampPost", [20, 4, 2, 20, 7, 2], () => h2.lampPost(g, 20, 4, 2));

// a helper must not write over ground it was not told it may replace
const grass = g.blockAt(10, 3, 14);
check("picnicTable over ground refused", [9, 3, 13, 11, 4, 15], () => h2.picnicTable(g, 10, 3, 14), { expectRefused: true });
if (g.blockAt(10, 3, 14) !== grass) { fails++; console.log("FAIL picnicTable replaced ground"); }

// shrub leaves are persistent
const leaf = [...g.cells.values()].find((c) => /leaves$/.test(c.block));
if (!leaf || leaf.state?.persistent !== "true") { fails++; console.log("FAIL shrub leaves not persistent"); }

console.log(fails ? `${fails} FAILED` : "all helpers PASS");
process.exit(fails ? 1 : 0);
