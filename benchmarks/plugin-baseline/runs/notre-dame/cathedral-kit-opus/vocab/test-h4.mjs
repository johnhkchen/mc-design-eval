// Calls every h4 helper once on an empty grid and checks it placed blocks, all inside the footprint it was given.
// Run: node vocab/test-h4.mjs
import { strict as assert } from "node:assert";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { setoffPier, radialChapel, leanToPolar, balustrade, flyer, roseWindow, colonnade, spireTip, floodlight } from "./h4.mjs";

// fp = [x0, y0, z0, x1, y1, z1], the footprint that call was given
function check(name, fp, run, prep) {
  const g = new Grid([80, 80, 80]);
  prep?.(g);
  const before = new Set(g.cells.keys());
  const r = run(g);
  const bad = [...g.cells.entries()].filter(([k]) => !before.has(k)).map(([, c]) => c).filter(({ pos }) => pos.some((v, i) => v < fp[i] || v > fp[i + 3]));
  assert.equal(bad.length, 0, `${name}: ${bad.length} outside its footprint, e.g. ${JSON.stringify(bad[0]?.pos)}`);
  assert.ok(r.cells > 0, `${name}: placed nothing`);
  assert.equal(r.refused.length, 0, `${name}: refused ${JSON.stringify(r.refused.slice(0, 3))}`);
  console.log(`ok  ${name}: ${r.cells} blocks`);
  return g;
}

const g1 = check("setoffPier", [10, 3, 65, 11, 38, 69], (g) => setoffPier(g, { x: 10, z0: 65, z1: 69, y0: 3, setoffs: [[69, 20], [68, 30], [67, 38]], face: "south" }));
assert.ok(/stairs/.test(g1.blockAt(10, 21, 69)) && g1.isAir(10, 21, 70) && g1.get(10, 21, 69).state.facing === "north", "setoffPier: weathering");
check("setoffPier north", [10, 3, 7, 11, 38, 11], (g) => setoffPier(g, { x: 10, z0: 7, z1: 11, setoffs: [[7, 20], [8, 30], [9, 38]], face: "north" }));
check("radialChapel 0", [36, 3, 35, 40, 26, 41], (g) => radialChapel(g, { angle: 0, centre: [10, 38] }));
check("radialChapel 36", [25, 3, 40, 43, 26, 62], (g) => radialChapel(g, { angle: 36, centre: [10, 38] }));
check("leanToPolar", [10, 31, 19, 30, 37, 57], (g) => leanToPolar(g, { r0: 12, r1: 19, yLow: 32, yHigh: 37, centre: [10, 38] }));
check("balustrade", [5, 20, 5, 12, 20, 5], (g) => balustrade(g, { cells: [5, 6, 7, 8, 9, 10, 11, 12].map((x) => [x, 5]), y: 20 }));
const g6 = check("flyer S", [20, 32, 51, 20, 45, 64], (g) => flyer(g, { p: 20, side: "S" }));
assert.ok(g6.isAir(20, 32, 58) && /stairs/.test(g6.blockAt(20, 36, 64)), "flyer: sky under / coping");
check("flyer N", [20, 32, 12, 20, 45, 25], (g) => flyer(g, { p: 20, side: "N" }));
check("roseWindow x", [2, 32, 31, 2, 46, 45], (g) => roseWindow(g, { center: [2, 39, 38], plane: "x" }));
check("roseWindow z r1", [39, 51, 66, 41, 53, 66], (g) => roseWindow(g, { center: [40, 52, 66], plane: "z", r: 1 }));
check("colonnade", [2, 47, 10, 2, 57, 30], (g) => colonnade(g, { z0: 10, z1: 30 }));
const g9 = check("spireTip", [39, 60, 37, 41, 72, 39], (g) => spireTip(g, { x: 40, z: 38, y0: 60 }));
assert.equal(g9.blockAt(40, 72, 38), "minecraft:lightning_rod");
check("floodlight", [5, 2, 5, 5, 2, 5], (g) => floodlight(g, { x: 5, z: 5 }), (g) => g.fill([0, 0, 0], [9, 2, 9], "smooth_stone"));
console.log("all h4 helpers ok");
