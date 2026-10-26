// Calls every h3 helper once on an empty grid and checks it placed blocks only inside the footprint it was given.
// Run: node vocab/test-h3.mjs
import { strict as assert } from "node:assert";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { lancetOpening, kingNiche, setoffButtress, flyer, octagonRing, glazeOpening, pavePatch } from "./h3.mjs";

const SIZE = [40, 40, 40];

// run(g) places one helper; fp = [x0, y0, z0, x1, y1, z1] is the footprint that call was given.
function check(name, fp, run) {
  const g = new Grid(SIZE);
  const r = run(g);
  const bad = [...g.cells.values()].filter(({ pos }) => pos.some((v, i) => v < fp[i] || v > fp[i + 3]));
  assert.equal(bad.length, 0, `${name}: ${bad.length} block(s) outside its footprint, e.g. ${JSON.stringify(bad[0]?.pos)}`);
  assert.ok(r.cells > 0, `${name}: placed nothing`);
  assert.equal(r.refused.length, 0, `${name}: refused ${JSON.stringify(r.refused.slice(0, 3))}`);
  console.log(`ok  ${name}: ${r.cells} blocks`);
  return g;
}

check("lancetOpening", [10, 5, 7, 11, 14, 13], (g) => lancetOpening(g, 10, 5, 10, "west", 5, 9));
check("kingNiche", [20, 5, 20, 21, 8, 20], (g) => kingNiche(g, 20, 5, 20, "west"));
check("setoffButtress", [30, 5, 5, 33, 20, 8], (g) => setoffButtress(g, [30, 5, 5, 33, 20, 8], "west", [10, 15]));
check("flyer", [5, 30, 15, 5, 36, 25], (g) => flyer(g, [5, 30, 25], [5, 35, 15], "z"));
check("octagonRing", [17, 5, 17, 23, 5, 23], (g) => octagonRing(g, 20, 20, 5, 7, 2, "polished_deepslate"));
check("glazeOpening", [10, 10, 30, 10, 20, 33], (g) => glazeOpening(g, [10, 10, 30, 10, 20, 33], "west"));
check("pavePatch", [0, 0, 0, 6, 0, 6], (g) => pavePatch(g, [0, 0, 0, 6, 0, 6]));

// Writes only into air: a second lancet on the same cells places nothing and reports every cell refused.
{
  const g = new Grid(SIZE);
  lancetOpening(g, 10, 5, 10, "west", 5, 9);
  const again = lancetOpening(g, 10, 5, 10, "west", 5, 9);
  assert.equal(again.cells, 0, "lancetOpening overwrote existing blocks");
  assert.ok(again.refused.length > 0, "lancetOpening did not report refused cells");
  console.log("ok  air-only: second lancetOpening refused everything");
}

// Off the grid: refused and reported, never thrown.
{
  const g = new Grid(SIZE);
  const r = setoffButtress(g, [38, 5, 5, 41, 20, 8], "west", [10]);
  assert.ok(r.refused.length > 0 && r.cells > 0, "setoffButtress should place inside and refuse outside the grid");
  console.log("ok  off-grid: refused, not thrown");
}

console.log("all h3 checks passed");
