// Smoke test for vocab/h3.mjs: each helper once on a fresh 1.21.1 grid; every placed cell must sit inside the footprint
// the helper was given, and nothing may be refused on empty ground. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { legBox, pairTie, coreBand, ringWall, glassRing, hexCells, roofStep, hiddenLamp } from "./h3.mjs";

const g = new Grid([64, 260, 64], { dataVersion: 3955 });   // DataVersion 3955 = 1.21.1
let failures = 0;

function check(name, res, [x0, y0, z0, x1, y1, z1]) {
  const outside = res.placed.filter(([x, y, z]) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ok = res.placed.length > 0 && outside.length === 0 && res.refused.length === 0;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${res.placed.length}, kept ${res.kept}, refused ${res.refused.length}`
    + (outside.length ? `, outside ${JSON.stringify(outside.slice(0, 3))}` : ""));
  if (!ok) failures++;
}

check("legBox Sa y1", legBox(g, "Sa", 1), [34, 1, 54, 35, 1, 55]);
check("pairTie y13", pairTie(g, 13), [8, 13, 8, 56, 13, 56]);
check("coreBand y13", coreBand(g, 13), [29, 13, 29, 35, 13, 35]);
check("ringWall r14 y2..7 glass", ringWall(g, 14, 2, 7, "glass"), [17, 2, 17, 47, 7, 47]);
check("glassRing r27 y219..220 glass_pane", glassRing(g, 27, 219, 220, "glass_pane"), [4, 219, 4, 60, 220, 60]);
check("hexCells a13 y47 outline", hexCells(g, 13, 47, "gray_stained_glass", { outline: true }), [16, 47, 16, 48, 47, 48]);
check("roofStep y223 r22", roofStep(g, 223, 22), [9, 223, 9, 55, 223, 55]);

// hiddenLamp replaces a floor cell, and refuses air.
g.set(40, 42, 40, "smooth_quartz");
check("hiddenLamp on floor", hiddenLamp(g, 40, 42, 40), [40, 42, 40, 40, 42, 40]);
const airLamp = hiddenLamp(g, 41, 42, 40);
if (airLamp.placed.length !== 0 || airLamp.refused.length !== 1) { console.log("FAIL hiddenLamp on air should refuse"); failures++; }
else console.log("ok   hiddenLamp on air refused");

console.log(failures ? `${failures} failing` : "all helper checks passed");
process.exit(failures ? 1 : 0);
