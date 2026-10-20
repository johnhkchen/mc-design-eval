// Calls each h3 helper once on a small grid and checks that it wrote only inside the footprint it returned.
// Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { roadStrip, seatingWall, tunnelBore, deck, drift, youngTree, umbrella, hiddenLight } from "./h3.mjs";

const g = new Grid([80, 12, 40], { dataVersion: 3955 });
// Ground: stone y0..1, grass surface at y2, and a stone lid at y6 over the bore (x65..73, z19..26) for its lanterns.
g.fill([0, 0, 0], [79, 1, 39], "stone");
g.fill([0, 2, 0], [79, 2, 39], "grass_block");
g.fill([65, 6, 19], [73, 6, 26], "stone");

let failed = false;

function check(name, call) {
  const before = new Map(g.cells);
  const r = call();
  const [x0, y0, z0, x1, y1, z1] = r.footprint;
  const outside = [];
  for (const [k, c] of g.cells) {
    if (before.get(k) === c) continue;
    const [x, y, z] = c.pos;
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) outside.push(k);
  }
  const ok = outside.length === 0 && r.placed > 0;
  if (!ok) failed = true;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${r.placed}, refused ${r.refused.length}, footprint [${r.footprint}]${outside.length ? `, outside: ${outside.slice(0, 5)}` : ""}`);
  return r;
}

// Air-only default: a road laid on grass is refused, not written.
const airOnly = roadStrip(g, [2, 2, 30, 10, 2, 31], "z");
if (airOnly.placed !== 0 || airOnly.refused.length === 0) { failed = true; console.log("FAIL roadStrip default should refuse grass"); }
else console.log(`ok   roadStrip default refuses grass (${airOnly.refused.length} refused)`);

check("roadStrip", () => roadStrip(g, [2, 2, 20, 30, 2, 24], "x", { over: true, yellow: [22, 23] }));
check("seatingWall", () => seatingWall(g, 2, 20, 16, 2, 4));
check("tunnelBore", () => tunnelBore(g, 19, 26, { lanternZ: [20, 22, 24] }));
check("deck", () => deck(g, [4, 3, 19, 14, 3, 22]));
check("drift", () => drift(g, "grey-green", [[22, 30], [36, 30], [36, 36], [22, 36]], 2));
check("youngTree", () => youngTree(g, 44, 2, 32));
check("umbrella", () => umbrella(g, 50, 2, 32, "orange"));
check("hiddenLight", () => hiddenLight(g, 54, 2, 34, { over: true }));

if (failed) {
  console.log("FAILED");
  process.exitCode = 1;
} else {
  console.log("PASSED");
}
