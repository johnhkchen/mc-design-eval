// Calls every h3 helper once on an empty grid and checks it placed blocks, all inside the footprint it was given.
// Run: node vocab/test-h3.mjs
import { strict as assert } from "node:assert";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { lancet, polygonWall, leanTo, leadDeck, pinnacle, gargoyle, kingNiche, crocket, glowBehind } from "./h3.mjs";

// fp = [x0, y0, z0, x1, y1, z1], the footprint that call was given
function check(name, fp, run) {
  const g = new Grid([48, 48, 48]);
  const r = run(g);
  const bad = [...g.cells.values()].filter(({ pos }) => pos.some((v, i) => v < fp[i] || v > fp[i + 3]));
  assert.equal(bad.length, 0, `${name}: ${bad.length} outside its footprint, e.g. ${JSON.stringify(bad[0]?.pos)}`);
  assert.ok(r.cells > 0, `${name}: placed nothing`);
  assert.equal(r.refused.length, 0, `${name}: refused ${JSON.stringify(r.refused.slice(0, 3))}`);
  console.log(`ok  ${name}: ${r.cells} blocks`);
  return g;
}

const g1 = check("lancet", [9, 5, 10, 14, 17, 11], (g) => lancet(g, { x: 10, z: 10, y0: 6, w: 4, h: 12, face: "north" }));
assert.ok(g1.isAir(11, 16, 10) && g1.isAir(10, 10, 10) && /stairs/.test(g1.blockAt(10, 16, 10)) && /stairs/.test(g1.blockAt(11, 17, 10)), "lancet: opening/head wrong");
check("polygonWall", [10, 3, 10, 30, 6, 30], (g) => polygonWall(g, { verts: [[20, 10], [30, 20], [20, 30]], y0: 3, y1: 6, centre: [18, 20] }));
check("leanTo", [5, 20, 30, 12, 30, 39], (g) => leanTo(g, { x0: 5, x1: 12, zLow: 39, zHigh: 30, yLow: 21, yHigh: 30, keep: [[8, 25, 30, 8, 30, 39]] }));
check("leadDeck", [2, 40, 2, 10, 40, 10], (g) => leadDeck(g, [2, 2, 10, 10], 40));
check("pinnacle", [20, 39, 20, 21, 47, 21], (g) => pinnacle(g, { x: 20, z: 20 }));
check("pinnacle size 1", [20, 21, 20, 20, 26, 20], (g) => pinnacle(g, { x: 20, z: 20, y0: 21, size: 1 }));
check("gargoyle", [30, 47, 21, 30, 47, 22], (g) => gargoyle(g, { x: 30, z: 20, face: "south" }));
check("kingNiche", [2, 23, 12, 3, 27, 12], (g) => kingNiche(g, { z: 12 }));
check("crocket", [14, 30, 14, 24, 30, 24], (g) => crocket(g, { cx: 19, cz: 19, y: 30, w: 9, cut: 2 }));
check("glowBehind", [10, 10, 37, 13, 11, 37], (g) => glowBehind(g, { cells: [10, 6, 35, 13, 17, 35], inward: "south" }));

// air-only: a second pinnacle on the same cells places nothing and reports every write refused
{
  const g = new Grid([48, 48, 48]);
  pinnacle(g, { x: 5, z: 5 });
  const again = pinnacle(g, { x: 5, z: 5 });
  assert.ok(again.cells === 0 && again.refused.length > 0, "pinnacle overwrote existing blocks");
  console.log("ok  air-only: second pinnacle refused");
}
