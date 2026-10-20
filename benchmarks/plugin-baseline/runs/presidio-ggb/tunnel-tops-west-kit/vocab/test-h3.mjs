// Smoke test for vocab/h3.mjs: every helper once on a small grid (ground at y 4), each change inside its footprint.
// Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { roadStrip, moundLawn, fortTower, boulder, bench, tier, drift, hiddenLight } from "./h3.mjs";

const g = new Grid([24, 20, 24]);
for (let x = 0; x < 24; x++) for (let z = 0; z < 24; z++) {
  for (let y = 1; y < 4; y++) g.set(x, y, z, "dirt");
  g.set(x, 4, z, "grass_block");
}

let failed = 0;
function run(name, box, fn, expectPlaced = true) {
  const before = new Map([...g].map((c) => [c.pos.join(","), c.block]));
  const r = fn();
  const bounds = [0, 1, 2].map((i) => [Math.min(box[0][i], box[1][i]), Math.max(box[0][i], box[1][i])]);
  const outside = [];
  for (const c of g) {
    const k = c.pos.join(",");
    if (before.get(k) === c.block) continue;
    if (c.pos.some((v, i) => v < bounds[i][0] || v > bounds[i][1])) outside.push(k);
  }
  const ok = outside.length === 0 && (r.placed > 0) === expectPlaced;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${r.placed}, refused ${r.refused.length}` +
    (outside.length ? `, outside footprint: ${outside.slice(0, 4).join(" ")}` : ""));
  return r;
}

run("roadStrip", [[0, 4, 0], [11, 4, 2]], () => roadStrip(g, 0, 0, 11, 2, 4, { axis: "x", over: true }));
run("moundLawn", [[14, 5, 0], [22, 5, 8]], () => moundLawn(g, 14, 0, 22, 8, 4));
run("moundLawn again is refused (air only)", [[14, 5, 0], [22, 5, 8]], () => moundLawn(g, 14, 0, 22, 8, 4), false);
run("fortTower", [[3, 5, 3], [10, 16, 10]], () => fortTower(g, 4, 4, 4));
console.log(`    hatch open: ${g.get(6, 12, 5)?.state?.open}, ladder facing: ${g.get(6, 5, 5)?.state?.facing}`);
run("boulder", [[14, 5, 12], [15, 6, 13]], () => boulder(g, 14, 12, 4, 1, { seed: 3 }));
run("bench", [[17, 5, 13], [19, 5, 15]], () => bench(g, 18, 5, 14, "south"));
run("tier", [[0, 4, 17], [7, 6, 20]], () => tier(g, 0, 7, 17, 20, 4, { over: true }));
run("drift grey-green", [[16, 5, 16], [23, 6, 23]], () => drift(g, "grey-green", 16, 16, 23, 23, 4, { seed: 2 }));
run("hiddenLight", [[1, 5, 13], [3, 5, 15]], () => hiddenLight(g, 2, 14, 4, { ring: true }));
console.log(failed ? `${failed} helper check(s) FAILED` : "all helper checks passed");
process.exitCode = failed ? 1 : 0;
