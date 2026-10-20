// Smoke test for vocab/h1.mjs: each helper once on an empty grid. Every cell it changes must sit inside the
// footprint the test expects; a repeat call on built cells must refuse; `over` must replace them.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { arcadeBay, shopDoor, cornice, slit, clockFace, naveRoofProfile, lunette } from "./h1.mjs";

const g = new Grid([120, 110, 100], { dataVersion: 3955 });   // 1.21.1
const state = (c) => c.block + JSON.stringify(c.state ?? {});

function run(name, box, fn) {
  const before = new Map([...g].map((c) => [c.pos.join(), state(c)]));
  const res = fn();
  const changed = [...g].filter((c) => before.get(c.pos.join()) !== state(c));
  const outside = changed.filter(({ pos: [x, y, z] }) => x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5]);
  assert.deepEqual(outside.map((c) => c.pos.join()), [], `${name} wrote outside its footprint`);
  assert.deepEqual(res.refused, [], `${name} refused cells`);
  assert.ok(res.placed > 0, `${name} placed nothing`);
  console.log(`ok ${name}: ${res.placed} cells`);
}

run("arcadeBay", [10, 1, 2, 17, 25, 4], () => arcadeBay(g, 10));
run("shopDoor", [29, 1, 9, 31, 2, 9], () => shopDoor(g, 30, 9));
assert.equal(g.get(30, 1, 9).state.half, "lower");
assert.equal(g.get(30, 2, 9).state.half, "upper");
run("cornice north", [40, 26, 2, 50, 27, 2], () => cornice(g, { x0: 40, x1: 50, y: 26, z: 2, face: "north" }));
run("cornice east", [60, 26, 40, 60, 27, 50], () => cornice(g, { x0: 40, x1: 50, y: 26, z: 60, face: "east" }));
run("slit north", [60, 10, 20, 60, 12, 21], () => slit(g, 60, 10, 12, "north", { at: 20 }));
run("slit east", [49, 10, 70, 50, 12, 70], () => slit(g, 70, 10, 12, "east", { at: 50 }));
run("clockFace", [25, 55, 20, 35, 65, 21], () => clockFace(g, { center: [30, 60, 20], face: "north" }));
run("naveRoofProfile", [50, 27, 15, 52, 36, 63], () => naveRoofProfile(g, 50, 52));
run("lunette z", [17, 4, 78, 29, 26, 78], () => lunette(g, { cx: 23, y0: 4, w: 13, h: 23, head: 4, z: 78 }));
run("lunette x", [100, 6, 36, 100, 25, 44], () => lunette(g, { cx: 40, y0: 6, w: 9, h: 20, head: 3, x: 100 }));

// a second call on built cells refuses and writes nothing
const again = arcadeBay(g, 10);
assert.equal(again.placed, 0);
assert.ok(again.refused.length > 0, "repeat arcadeBay should refuse");
// and over: true replaces them
assert.ok(arcadeBay(g, 10, { over: true }).placed > 0);
console.log("ok refusal and over");
