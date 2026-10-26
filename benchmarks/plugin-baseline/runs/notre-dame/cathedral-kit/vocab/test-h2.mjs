// Calls every h2 helper once on a grid with a checkerboard of existing stone, then checks that each one placed blocks,
// that every block it placed lies inside the footprint it was given, and that no existing stone was overwritten.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const inBox = (p, [x0, y0, z0, x1, y1, z1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;

const cases = [
  ["ashlarWall", [0, 3, 10, 6, 9, 14], (g) => h2.ashlarWall(g, [0, 3, 10, 6, 9, 14], "west")],
  ["portal", [2, 3, 28, 6, 26, 46], (g) => h2.portal(g, 2, 37, 11, 20, "west", { y0: 3 })],
  ["colonnade", [2, 30, 7, 2, 34, 40], (g) => h2.colonnade(g, [2, 7, 2, 40], 30, 34)],
  ["gargoyle", [1, 40, 20, 2, 40, 20], (g) => h2.gargoyle(g, 2, 40, 20, "west")],
  ["ringWall", [150, 3, 27, 160, 45, 47], (g) => h2.ringWall(g, 150, 37, 10, 10, 3, 45, [-90, 90], { bays: 7, window: { y0: 35, y1: 43, width: 3 } })],
  ["statue", [95, 60, 37, 95, 61, 37], (g) => h2.statue(g, 95, 60, 37, "south")],
  ["lampPost", [105, 3, 75, 105, 6, 75], (g) => h2.lampPost(g, 105, 3, 75)],
];

let failed = 0;
for (const [name, box, call] of cases) {
  const g = new Grid([200, 140, 120]);
  for (let x = box[0]; x <= box[3]; x++) for (let y = box[1]; y <= box[4]; y++) for (let z = box[2]; z <= box[5]; z++) {
    if ((x + y + z) % 3 === 0) g.set(x, y, z, "minecraft:stone");
  }
  const before = new Map([...g].map((c) => [c.pos.join(), c.block]));
  const placed = call(g);
  const added = [...g].filter((c) => !before.has(c.pos.join()));
  const outside = added.filter((c) => !inBox(c.pos, box));
  const overwritten = [...before].filter(([k, b]) => g.get(...k.split(",").map(Number))?.block !== b);
  const ok = placed > 0 && added.length === placed && outside.length === 0 && overwritten.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: placed ${placed}, outside ${outside.length}, overwritten ${overwritten.length}`);
}

// portal doors come in whole pairs (lower and upper halves)
const gp = new Grid([200, 140, 120]);
h2.portal(gp, 2, 37, 11, 20, "west", { y0: 3 });
const doors = [...gp].filter((c) => c.block === "minecraft:dark_oak_door");
const halves = { lower: doors.filter((c) => c.state.half === "lower").length, upper: doors.filter((c) => c.state.half === "upper").length };
const pairs = halves.lower > 0 && halves.lower === halves.upper;
if (!pairs) failed++;
console.log(`${pairs ? "PASS" : "FAIL"} portal doors: ${halves.lower} lower, ${halves.upper} upper`);

process.exitCode = failed ? 1 : 0;
console.log(failed ? `${failed} failed` : "all h2 helpers pass");
