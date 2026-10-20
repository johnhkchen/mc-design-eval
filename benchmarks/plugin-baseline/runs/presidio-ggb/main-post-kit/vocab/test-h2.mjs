// Smoke test for vocab/h2.mjs: each helper once on a fresh grid. It must return true and place blocks only inside its
// footprint box. Then the refusal rule: an occupied cell makes it return false and write nothing.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const DATA_VERSION = 3955; // 1.21.1, the server version
const fresh = () => new Grid([30, 14, 24], { dataVersion: DATA_VERSION });
let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.log("FAIL", msg); } };

// [name, call, footprint box [x0, y0, z0, x1, y1, z1]]
const cases = [
  ["brickBlock", (g) => h2.brickBlock(g, 2, 2, 12, 9, { y1: 9, holes: [[6, 1, 9], [6, 2, 9], [6, 3, 9]] }), [2, 1, 2, 12, 9, 9]],
  ["doubleDoor", (g) => h2.doubleDoor(g, 5, 9, "south"), [5, 1, 9, 6, 3, 9]],
  ["handrail", (g) => h2.handrail(g, 14, 2, 4), [14, 0, 2, 14, 1, 4]],
  ["stack", (g) => h2.stack(g, 20, 3), [20, 10, 3, 21, 13, 4]],
  ["arcadeBay", (g) => h2.arcadeBay(g, 2, 6, 14), [2, 1, 14, 6, 4, 14]],
  ["grilleWindow", (g) => h2.grilleWindow(g, 10, 2, 14, "north"), [10, 2, 13, 10, 3, 14]],
  ["shrub", (g) => h2.shrub(g, 24, 18), [24, 0, 18, 25, 1, 19]],
];

for (const [name, call, [x0, y0, z0, x1, y1, z1]] of cases) {
  const g = fresh();
  const r = call(g);
  check(r.refused.length === 0 && r.placed > 0, `${name} refused cells on an empty grid: ${JSON.stringify(r.refused)}`);
  const cells = [...g.cells.values()];
  check(cells.length > 0, `${name} placed nothing`);
  const outside = cells.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  check(outside.length === 0, `${name} wrote outside its footprint: ${outside.map((c) => c.pos.join(",")).join(" ")}`);
  console.log(`${name}: ${cells.length} blocks in ${[x0, y0, z0, x1, y1, z1].join(",")}`);
}

// the doors: both halves written, and the two leaves hinge on opposite sides. The walls come first: brickBlock leaves
// its holes air, then doubleDoor fills them (its footprint is all air, so it is accepted)
{
  const g = fresh();
  h2.brickBlock(g, 2, 2, 12, 9, { y1: 9, holes: [[5, 1, 9], [5, 2, 9], [5, 3, 9], [6, 1, 9], [6, 2, 9], [6, 3, 9]] });
  check(h2.doubleDoor(g, 5, 9, "south").refused.length === 0, "doubleDoor refused its holes in the wall");
  check(g.get(5, 1, 9)?.state?.half === "lower" && g.get(5, 2, 9)?.state?.half === "upper", "doubleDoor halves wrong");
  check(g.get(5, 1, 9)?.state?.hinge !== g.get(6, 1, 9)?.state?.hinge, "doubleDoor leaves hinge the same way");
}

// refusal: an occupied cell in the footprint means false and nothing written
{
  const g = fresh();
  g.set(21, 11, 4, "stone");
  const before = g.cells.size;
  const r = h2.stack(g, 20, 3);
  check(r.placed === 0 && r.refused.length === 1, "stack did not refuse the occupied cell");
  check(g.cells.size === before, "stack wrote cells when it refused");
}

if (fails) { console.log(`${fails} check(s) failed`); process.exitCode = 1; }
else console.log("test-h2: all helpers passed");
