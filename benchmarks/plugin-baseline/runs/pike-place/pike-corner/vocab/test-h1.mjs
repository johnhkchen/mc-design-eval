// Calls every H1 helper once on a small grid and checks that each placed block lies inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

// [name, grid size, footprint box [x0,y0,z0,x1,y1,z1], call]
const cases = [
  ["plinthTo", [12, 9, 12], [2, 0, 2, 6, 5, 6],
    (g) => h1.plinthTo(g, { x0: 2, x1: 6, z0: 2, z1: 6, groundAt: (x, z) => 2 + ((x + z) % 3), wallY: 5 })],
  ["pier", [12, 10, 12], [4, 2, 4, 4, 7, 5],
    (g) => h1.pier(g, { at: [4, 4], face: "west", y0: 2, y1: 7 })],
  ["litWindow", [12, 9, 12], [5, 3, 4, 6, 7, 7],
    (g) => h1.litWindow(g, { at: [6, 3, 4], face: "east", w: 4, h: 4 })],
  ["parapetCap", [12, 6, 12], [1, 2, 1, 8, 3, 8],
    (g) => h1.parapetCap(g, { box: [1, 1, 8, 8], y0: 2, y1: 3, coping: "smooth_stone_slab" })],
  ["signboard (wall)", [12, 8, 12], [6, 3, 6, 6, 3, 6],
    (g) => h1.signboard(g, "ECONOMY MARKET", { at: [6, 3, 6], face: "west", mode: "wall" })],
  ["signboard (hanging)", [12, 8, 12], [6, 3, 6, 6, 5, 6],
    (g) => h1.signboard(g, "GARDEN CENTER", { at: [6, 3, 6], face: "west", mode: "hanging" })],
  ["stallFit", [12, 8, 12], [2, 2, 2, 5, 6, 8],
    (g) => h1.stallFit(g, { box: [2, 2, 2, 5, 6, 8], front: "west", trade: "produce" })],
  ["chimneyStack", [12, 40, 12], [3, 33, 3, 6, 38, 6],
    (g) => h1.chimneyStack(g, { at: [4, 4] })],
  ["rooftopPlanter", [12, 6, 12], [2, 2, 4, 9, 3, 4],
    (g) => h1.rooftopPlanter(g, { box: [2, 2, 4, 9, 3, 4] })],
  ["sanitaryPier", [12, 12, 12], [4, 0, 4, 4, 10, 5],
    (g) => h1.sanitaryPier(g, { at: [4, 4], face: "west" })],
];

let fails = 0;
for (const [name, size, [x0, y0, z0, x1, y1, z1], call] of cases) {
  const g = new Grid(size);
  const placed = call(g);
  const cells = [...g.cells.values()];
  const outside = cells.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ok = placed > 0 && placed === cells.length && outside.length === 0;
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${cells.length} blocks${outside.length ? `, ${outside.length} outside the footprint` : ""}`);
}
console.log(fails ? `${fails} failed` : "all passed");
process.exit(fails ? 1 : 0);
