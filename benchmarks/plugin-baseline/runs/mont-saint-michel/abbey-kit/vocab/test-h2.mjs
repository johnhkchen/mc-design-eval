// Calls every h2 helper once on a fresh grid and checks it placed blocks, refused nothing, and stayed in its footprint.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const SIZE = [24, 24, 24];
const DATA_VERSION = 3955; // Minecraft 1.21.1 (the server)
let failed = 0;

function run(name, footprint, call) {
  const g = new Grid(SIZE, { dataVersion: DATA_VERSION });
  const r = call(g);
  const [x0, y0, z0, x1, y1, z1] = footprint;
  let outside = 0, solid = 0;
  for (let x = 0; x < SIZE[0]; x++) for (let y = 0; y < SIZE[1]; y++) for (let z = 0; z < SIZE[2]; z++) {
    if (g.isAir(x, y, z)) continue;
    solid++;
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) outside++;
  }
  const ok = r.placed > 0 && r.refused.length === 0 && outside === 0 && solid === r.placed;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${r.placed}, refused ${r.refused.length}, outside footprint ${outside}`);
}

run("granite_wall", [2, 2, 2, 12, 8, 4], (g) => h2.granite_wall(g, [2, 2, 2, 12, 8, 4], "north"));
run("tracery_window", [4, 3, 5, 6, 7, 5], (g) => h2.tracery_window(g, 4, 3, 5, "south"));
run("slate_stair_roof", [2, 2, 2, 12, 6, 10], (g) => h2.slate_stair_roof(g, [2, 2, 2, 12, 6, 10], "x", [1, 1]));
run("pinnacle", [8, 2, 8, 8, 6, 8], (g) => h2.pinnacle(g, 8, 2, 8, 5));
run("colonnade_bay", [2, 2, 14, 6, 7, 14], (g) => h2.colonnade_bay(g, 2, 2, 14, "x", 4, 4));
run("chimney_stack", [14, 2, 14, 15, 8, 15], (g) => h2.chimney_stack(g, 14, 2, 14, 6));
run("degre_flight", [4, 6, 2, 9, 19, 6], (g) => h2.degre_flight(g, [4, 6, 3], [9, 11], 3));

if (failed) {
  console.log(`${failed} helper(s) failed`);
  process.exit(1);
}
console.log("all h2 helpers passed");
