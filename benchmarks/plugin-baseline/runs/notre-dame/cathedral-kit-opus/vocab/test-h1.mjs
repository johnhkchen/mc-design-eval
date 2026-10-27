// Calls every h1 helper once on an empty grid and checks it placed blocks, all inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import { strict as assert } from "node:assert";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { plinthCourse, radialPier, stoneGable, apseRoof, stringCourse, flyerRadial, portal, belfryLancet, apostle, pierLantern } from "./h1.mjs";

// fp = [x0, y0, z0, x1, y1, z1], the footprint that call was given
function check(name, fp, run, { size = [190, 70, 80], pre } = {}) {
  const g = new Grid(size);
  pre?.(g);
  const before = new Set(g.cells.keys());
  const r = run(g);
  const bad = [...g.cells.entries()].filter(([k]) => !before.has(k)).map(([, c]) => c).filter(({ pos }) => pos.some((v, i) => v < fp[i] || v > fp[i + 3]));
  assert.equal(bad.length, 0, `${name}: ${bad.length} outside its footprint, e.g. ${JSON.stringify(bad[0]?.pos)}`);
  assert.ok(r.cells > 0, `${name}: placed nothing`);
  assert.equal(r.refused.length, 0, `${name}: refused ${JSON.stringify(r.refused.slice(0, 3))}`);
  console.log(`ok  ${name}: ${r.cells} blocks`);
  return g;
}

const g1 = check("plinthCourse", [150, 1, 60, 155, 2, 62], (g) => plinthCourse(g, 150, 60, 155, 62, { ground: 1 }));
assert.equal(g1.blockAt(150, 2, 60), "minecraft:smooth_stone");
check("radialPier +54", [160, 3, 55, 175, 38, 70], (g) => radialPier(g, { angle: 54 }));
const g2 = check("radialPier -90", [152, 3, 5, 153, 38, 11], (g) => radialPier(g, { angle: -90 }));
assert.ok(!g2.isAir(152, 20, 5) && g2.isAir(152, 21, 5) || /stairs/.test(g2.blockAt(152, 21, 5)), "pier set-off wrong");
const g3 = check("stoneGable", [85, 48, 66, 103, 58, 67], (g) => stoneGable(g, { axis: "x", at: 67, from: 85, to: 103, eaveY: 48, peakY: 57, face: "south", thick: 2 }));
assert.equal(g3.blockAt(94, 57, 67), "minecraft:end_stone_brick_wall");
const g4 = check("apseRoof", [152, 48, 27, 163, 62, 49], (g) => apseRoof(g));
assert.equal(g4.blockAt(152, 62, 38), "minecraft:end_rod");
check("stringCourse", [40, 19, 67, 45, 19, 67], (g) => stringCourse(g, { cells: [[40, 66], [41, 66], [42, 66], [45, 66, "south"]], y: 19, face: "south" }));
check("flyerRadial", [152, 30, 38, 179, 45, 49], (g) => flyerRadial(g, { angle: 18 }));
const g5 = check("portal", [90, 3, 66, 98, 19, 68], (g) => portal(g, { at: [94, 3, 66], face: "south", w: 3, h: 9, archTop: 17, rings: 3 }));
assert.ok(/door/.test(g5.blockAt(93, 3, 66)) && g5.get(93, 4, 66).state.half === "upper" && g5.isAir(94, 5, 68), "portal doors/recess wrong");
check("portal trumeau", [6, 3, 33, 6, 20, 43], (g) => portal(g, { at: [6, 3, 38], face: "west", w: 7, h: 12, archTop: 20, rings: 1, trumeau: 38 }));
check("belfryLancet", [3, 61, 49, 4, 86, 53], (g) => belfryLancet(g, { box: [3, 62, 50, 4, 86, 52], face: "west" }), { size: [20, 100, 60] });
check("apostle", [100, 54, 43, 100, 56, 43], (g) => apostle(g, { x: 100, y: 55, z: 43, facing: "south" }));
check("pierLantern", [70, 21, 69, 70, 21, 69], (g) => pierLantern(g, { x: 70, y: 21, z: 69 }), { pre: (g) => g.set(70, 20, 69, "smooth_sandstone") });

// air-only: a second gable on the same cells places nothing and reports every write refused
{
  const g = new Grid([190, 70, 80]);
  stoneGable(g, { axis: "z", at: 22, from: 27, to: 49, eaveY: 48, peakY: 63, face: "east" });
  const again = stoneGable(g, { axis: "z", at: 22, from: 27, to: 49, eaveY: 48, peakY: 63, face: "east" });
  assert.ok(again.cells === 0 && again.refused.length > 0, "stoneGable overwrote existing blocks");
  console.log("ok  air-only: second gable refused");
}
