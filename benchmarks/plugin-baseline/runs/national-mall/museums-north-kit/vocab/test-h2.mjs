// Calls every vocab/h2 helper once on a fresh small grid. Each must place blocks only inside the footprint it was
// given, leave the stone floor at y 0 alone, and report exactly what it placed.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const SIZE = [44, 26, 44];
const DATA_VERSION = 3955;   // 1.21.1, the server's version

// [name, call, footprint [x0, y0, z0, x1, y1, z1]]
const cases = [
  ["pilaster", (g) => h2.pilaster(g, 10, 2, 8, 10, "south"), [10, 2, 11, 10, 8, 11]],
  ["octagonDrum", (g) => h2.octagonDrum(g, [20, 3, 20], 9), [10, 3, 10, 30, 10, 30]],
  ["pediment", (g) => h2.pediment(g, [20, 12, 9], "south"), [10, 12, 9, 30, 17, 10]],
  ["grandSteps", (g) => h2.grandSteps(g, 14, 26, 3, 8), [14, 7, 3, 26, 8, 5]],
  ["corniceBand", (g) => h2.corniceBand(g, { x0: 4, x1: 8, z0: 30, z1: 34 }, 12), [3, 12, 29, 9, 13, 35]],
  ["coronaTier", (g) => h2.coronaTier(g, [20, 20], 3, 14), [9, 14, 9, 31, 16, 31]],
  ["reflectingPool", (g) => h2.reflectingPool(g, 10, 16, 10, 14, 3), [9, 2, 9, 17, 3, 15]],
  ["oakTree", (g) => h2.oakTree(g, 20, 1, 20, { height: 5 }), [18, 1, 18, 22, 6, 22]],
];

let failed = 0;
for (const [name, call, [x0, y0, z0, x1, y1, z1]] of cases) {
  const g = new Grid(SIZE, { dataVersion: DATA_VERSION });
  for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) g.set(x, 0, z, "stone");
  const t = call(g);
  const cells = [...g.cells.values()];
  const made = cells.filter((c) => c.pos[1] > 0);
  const outside = made.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const floorHit = cells.some((c) => c.pos[1] === 0 && c.block !== "minecraft:stone");
  const ok = made.length > 0 && outside.length === 0 && !floorHit && made.length === t.placed;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${made.length} blocks, held ${t.held}${outside.length ? `, ${outside.length} outside the footprint` : ""}${floorHit ? ", touched the floor" : ""}`);
  if (!ok) failed++;
}
console.log(failed ? `${failed} helper(s) failed` : "all helpers passed");
process.exitCode = failed ? 1 : 0;
