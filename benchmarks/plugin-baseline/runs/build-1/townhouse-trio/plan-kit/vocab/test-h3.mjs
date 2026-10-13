// Smoke test for vocab/h3.mjs: each helper once on an empty grid; every placed cell must sit inside the footprint
// given. Then one air-only check (a second door on the same cells is refused whole). Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const g = new Grid([32, 32, 36]);
const inBox = ([x, y, z], box) => box.some(([x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);

const cases = [
  ["stringCourse", () => h3.stringCourse(g, 3, 27, 7, 12, { sides: { xs: [3, 27], zTo: 24 } }),
    [[3, 7, 12, 27, 7, 12], [3, 7, 13, 3, 7, 24], [27, 7, 13, 27, 7, 24]]],
  ["cantedBay", () => h3.cantedBay(g, 7), [[7, 1, 10, 10, 12, 11]]],
  ["doorFit", () => h3.doorFit(g, 5, 12, "warped_door", "north"), [[5, 3, 12, 5, 5, 12]]],
  ["chimneyStack", () => h3.chimneyStack(g, 10, 18), [[10, 5, 18, 12, 27, 19], [9, 28, 17, 13, 28, 20]]],
  ["atticLadder", () => h3.atticLadder(g, 4, 23, "east"), [[4, 18, 23, 4, 20, 23]]],
  ["gardenWall", () => h3.gardenWall(g, 3, 34, 27, 34, { gates: [[7, 34], [15, 34], [23, 34]] }), [[3, 1, 34, 27, 3, 34]]],
  ["lampPost", () => h3.lampPost(g, 9, 8), [[9, 1, 8, 9, 4, 8]]],
];

let failed = 0;
for (const [name, run, boxes] of cases) {
  const { placed, refused } = run();
  const outside = placed.filter((c) => !inBox(c, boxes));
  const ok = placed.length > 0 && outside.length === 0 && refused.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${placed.length} placed, ${refused.length} refused${outside.length ? `, outside ${JSON.stringify(outside)}` : ""}`);
  if (!ok && refused.length) console.log("     refused:", JSON.stringify(refused.slice(0, 5)));
}

// Doors write both halves, and a second placement on the same cells writes nothing.
const lower = g.blockAt(5, 3, 12), upper = g.blockAt(5, 4, 12);
const again = h3.doorFit(g, 5, 12, "warped_door", "north");
const airOnly = again.placed.length === 0 && again.refused.length === 3;
const doorOk = lower === "minecraft:warped_door" && upper === "minecraft:warped_door" && g.get(5, 4, 12).state.half === "upper";
if (!airOnly || !doorOk) failed++;
console.log(`${airOnly && doorOk ? "ok  " : "FAIL"} doorFit halves and air-only (second call placed ${again.placed.length}, refused ${again.refused.length})`);

if (failed) {
  console.log(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("all h3 checks passed");
