// Calls each h3 helper once on a fresh grid: every cell it returns must lie in the box it was given, and a second
// identical call must write nothing (air only). Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h3.mjs";

const fresh = () => new Grid([26, 26, 26]);
const inside = (cells, [x0, y0, z0, x1, y1, z1]) => cells.every(([x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);

const cases = [
  ["bayWindow", (g) => H.bayWindow(g, 9, 13, 1, 7), [9, 1, 7, 13, 5, 7]],
  ["framePanel", (g) => H.framePanel(g, 6, 7, 7, 9, 7, { hole: [6, 8, 6, 9] }), [6, 7, 7, 7, 9, 7]],
  ["windowBox", (g) => H.windowBox(g, 9, 10, 7, 6), [9, 7, 6, 10, 8, 6]],
  ["candleCluster", (g) => H.candleCluster(g, 9, 2, 8, "candle", 3), [9, 2, 8, 9, 2, 8]],
  ["leanToBay", (g) => H.leanToBay(g, 18, 18), [15, 1, 18, 19, 5, 18]],
  ["picketFence", (g) => H.picketFence(g, 18, 18, 24, 18, 1, [[21, 18]]), [18, 1, 18, 24, 1, 18]],
  ["counter", (g) => H.counter(g, 8, 9, 2, 14), [8, 2, 14, 9, 3, 14]],
  ["bed", (g) => H.bed(g, 12, 7, 14, "east", "white"), [12, 7, 14, 13, 7, 14]],
];

let failed = 0;
for (const [name, call, box] of cases) {
  const g = fresh();
  const cells = call(g);
  const again = call(g);
  const ok = cells.length > 0 && inside(cells, box) && again.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${cells.length} cells${again.length ? `, second call wrote ${again.length}` : ""}${inside(cells, box) ? "" : ", outside box"}`);
}

// specifics: the window hole stays air, the gate and the bed head land where the plan puts them
const g = fresh();
H.framePanel(g, 6, 7, 7, 9, 7, { hole: [6, 8, 6, 9] });
const holeOk = g.isAir(6, 8, 7) && g.isAir(6, 9, 7) && !g.isAir(7, 8, 7);
const gateOk = (H.picketFence(fresh(), 18, 18, 24, 18, 1, [[21, 18]]).length) === 7;
const g2 = fresh();
H.picketFence(g2, 18, 18, 24, 18, 1, [[21, 18]]);
const gateBlock = g2.blockAt(21, 1, 18) === "minecraft:spruce_fence_gate";
const bedOk = (() => { const g3 = fresh(); H.bed(g3, 12, 7, 14, "east", "white"); return g3.blockAt(13, 7, 14) === "minecraft:white_bed"; })();
for (const [name, ok] of [["frame hole left air", holeOk], ["picket run is 7 cells", gateOk], ["gate at (21,1,18)", gateBlock], ["bed head east of foot", bedOk]]) {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
}

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log(`all ${cases.length} helpers passed`);
