// Calls each h3 helper once on a small grid: every cell it returns must lie in the box it was given, and a second
// identical call must write nothing (air only). Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h3.mjs";

const g = new Grid([26, 26, 26]);
const inside = (cells, [x0, y0, z0, x1, y1, z1]) => cells.every(([x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);

const cases = [
  ["daubPanel", () => H.daubPanel(g, "x", 7, 15, 6, 9, 8, { brace: "left", skip: [[9, 7, 8]] }), [7, 6, 8, 15, 9, 8]],
  ["daubPanel z", () => H.daubPanel(g, "z", 2, 5, 3, 4, 20, { brace: "right" }), [20, 3, 2, 20, 4, 5]],
  ["jettyBracket", () => H.jettyBracket(g, 6, 5, 8), [6, 5, 8, 6, 5, 8]],
  ["counterSlab", () => H.counterSlab(g, 7, 9, 8), [7, 2, 8, 9, 2, 8]],
  ["flowerBox", () => H.flowerBox(g, 9, 10, 7), [9, 7, 7, 10, 8, 7]],
  ["roofMain", () => H.roofMain(g, { footprint: [6, 8, 16, 22], y: 10, preset: "shop", keep: [] }), [4, 8, 7, 18, 21, 23]],
  ["woodpile", () => H.woodpile(g, 7, 10, 24, 25), [7, 1, 24, 10, 3, 25]],
  ["smallSpruce", () => H.smallSpruce(g, 3, 16, 12), [2, 1, 15, 4, 11, 17]],
  ["breadRack", () => H.breadRack(g, 8, 2, 18, "x", 5), [8, 2, 18, 12, 5, 18]],
  ["peelWall", () => H.peelWall(g, 7, 2, 19, "west"), [7, 2, 19, 7, 3, 21]],
  ["shelfWall", () => H.shelfWall(g, 8, 7, 9, "x", 4, 2), [8, 7, 9, 11, 8, 10]],
];

let failed = 0;
for (const [name, call, box] of cases) {
  const cells = call();
  const again = call();
  const ok = cells.length > 0 && inside(cells, box) && again.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${cells.length} cells${again.length ? `, second call wrote ${again.length}` : ""}${inside(cells, box) ? "" : ", outside box"}`);
}
if (failed) {
  console.error(`${failed} of ${cases.length} failed`);
  process.exit(1);
}
console.log(`all ${cases.length} helpers passed`);
