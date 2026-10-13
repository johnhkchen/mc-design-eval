// Calls every h1 helper once on one small grid; every block must land inside the box that helper returned,
// and no helper may write into a cell another one owns. Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const g = new Grid([40, 20, 40]);
const inside = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

const calls = [
  ["wallCourse", h1.wallCourse(g, 3, 9, 1, 2, 12, "bricks")],
  ["quoinColumn", h1.quoinColumn(g, 3, "west", 12)],
  ["portico", h1.portico(g, 13, 9)],
  ["doorHood", h1.doorHood(g, 4, 11)],
  ["hearth", h1.hearth(g, 10, 18, "west")],
  ["windowBox", h1.windowBox(g, 9, 12, 11)],
  ["gardenBed", h1.gardenBed(g, 7, 27, 33)],
];

let total = 0;
for (const [name, r] of calls) {
  assert.ok(r.cells.length > 0, `${name} placed nothing`);
  assert.equal(r.skipped, 0, `${name} skipped ${r.skipped} cells on empty air`);
  for (const c of r.cells) assert.ok(inside(c, r.box), `${name} wrote ${c} outside ${r.box}`);
  total += r.cells.length;
}
assert.equal([...g].length, total, "grid holds blocks no helper reported");

// occupied cells and the ground row are refused, never overwritten
const again = h1.wallCourse(g, 3, 9, 1, 2, 12, "stone");
assert.equal(again.cells.length, 0);
assert.equal(again.skipped, 14);
assert.equal(h1.wallCourse(g, 3, 3, 0, 0, 12, "bricks").cells.length, 0, "wrote the ground row");

// states: the rail joins its neighbours, the campfire is lit and faces the room
assert.equal(g.get(14, 8, 9).state.west, "true");
assert.equal(g.get(14, 8, 9).state.north, "false");
assert.equal(g.get(10, 3, 18).state.lit, "true");
assert.equal(g.get(10, 3, 18).state.facing, "west");

console.log(`test-h1 ok: ${calls.length} helpers, ${total} blocks, all inside their footprints`);
