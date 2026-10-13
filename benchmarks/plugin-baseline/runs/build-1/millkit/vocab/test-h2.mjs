// Calls every h2 helper once on a small grid; each must place blocks only inside the footprint it was given.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const inside = (box, [x, y, z]) => box[0] <= x && x <= box[3] && box[1] <= y && y <= box[4] && box[2] <= z && z <= box[5];
const cases = [
  ["lamp_post", [4, 0, 4, 4, 4, 4], (g) => h2.lamp_post(g, 4, 4)],
  ["pier_skirt", [2, 1, 2, 10, 1, 8], (g) => h2.pier_skirt(g, [2, 2, 10, 8], "bricks", "spruce_fence")],
  ["batten_wall", [2, 3, 9, 10, 6, 9], (g) => h2.batten_wall(g, [2, 9], [10, 9], { battens: [2, 6, 10] })],
  ["shutter", [5, 4, 3, 5, 5, 3], (g) => h2.shutter(g, [5, 4, 3], "north", "dark_oak")],
  ["crop_bed", [2, 0, 2, 5, 1, 4], (g) => h2.crop_bed(g, 2, 5, 2, 4, "wheat", { soil: true })],
  ["trough", [2, 1, 6, 6, 2, 6], (g) => h2.trough(g, 2, 6, 6)],
  ["bench", [2, 1, 10, 5, 1, 10], (g) => h2.bench(g, 3, 10)],
  ["false_front", [2, 3, 8, 12, 12, 9], (g) => h2.false_front(g, 2, 12, 9)],
  ["woodpile", [4, 1, 12, 5, 2, 12], (g) => h2.woodpile(g, 4, 12)],
];

let failed = 0;
for (const [name, box, call] of cases) {
  const g = new Grid([16, 14, 16]);
  const res = call(g);
  const cells = [...g];
  const outside = cells.filter((c) => !inside(box, c.pos));
  const ok = cells.length > 0 && outside.length === 0 && res.placed === cells.length;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${res.placed} placed, ${res.skipped.length} skipped, ${outside.length} outside footprint`);
}
if (failed) { console.log(`${failed} helper(s) failed`); process.exitCode = 1; }
else console.log("all h2 helpers placed inside their footprints");
