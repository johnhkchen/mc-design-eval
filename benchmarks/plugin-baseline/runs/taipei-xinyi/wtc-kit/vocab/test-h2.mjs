// Calls each h2 helper once on a small grid and checks that what it placed lies inside the footprint it was given.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h2.mjs";

const g = new Grid([60, 60, 60], { dataVersion: 3955 });
const ground = (x0, y, z0, x1, z1) => g.fill([x0, y, z0], [x1, y, z1], "smooth_stone");
const failures = [];

// run one call: its footprint box [x0,y0,z0,x1,y1,z1]; every cell it changed must be inside that box
function check(name, box, call) {
  const before = new Map(g.cells);
  const res = call();
  const changed = [...g.cells.entries()].filter(([k, v]) => before.get(k) !== v).map(([, v]) => v.pos);
  const outside = changed.filter(([x, y, z]) => x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5]);
  const ok = res.ok && changed.length > 0 && outside.length === 0;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${changed.length} cells${res.ok ? "" : ` (blocked ${res.blocked.length}, unsupported ${res.unsupported.length})`}`);
  if (!ok) failures.push(name, outside.slice(0, 3));
  return res;
}

// curtain_bay: south wall on z 10, 6 cells long, one storey (y 6..10); backing one cell in (z 9)
const bay = check("curtain_bay", [2, 6, 9, 7, 10, 10], () => h.curtain_bay(g, "south", 2, 6, 10, 1, { length: 6 }));
check("window_backing", [2, 6, 9, 7, 10, 10], () => h.window_backing(g, bay.backing, 0.3, 0.1));
check("lit_rim", [10, 20, 10, 16, 20, 16], () => h.lit_rim(g, [10, 10, 16, 16], 20));
ground(20, 20, 20, 20, 20);
check("floodlight", [20, 21, 20, 20, 21, 20], () => h.floodlight(g, 20, 21, 20));
ground(25, 3, 25, 25, 25);
check("lamp_post", [25, 4, 25, 25, 6, 25], () => h.lamp_post(g, 25, 4, 25));
// pier_bay on the south wall, plane z 30: piers proud to z 31, bays with backing at z 29
check("pier_bay", [2, 3, 29, 8, 8, 31], () => h.pier_bay(g, 2, "south", { plane: 30, y0: 3, y1: 8 }));
ground(30, 26, 30, 30, 30);
check("flag_pole", [30, 27, 30, 32, 38, 30], () => h.flag_pole(g, 30, 30, "red"));
ground(2, 40, 2, 21, 14);
check("ahu_box", [2, 41, 2, 21, 44, 14], () => h.ahu_box(g, 2, 2));
ground(40, 5, 40, 42, 42);
check("ticc_pier", [40, 6, 40, 42, 56, 42], () => h.ticc_pier(g, 40, 40));
ground(35, 39, 35, 35, 35);
check("roof_light", [35, 40, 35, 35, 40, 35], () => h.roof_light(g, 35, 40, 35));

// a cell with no support must refuse the whole piece, writing nothing
const none = h.floodlight(g, 50, 30, 50);
if (none.ok || none.unsupported.length !== 1 || g.blockAt(50, 30, 50) !== "minecraft:air") {
  failures.push("floodlight without support was not refused");
  console.log("FAIL floodlight without support was not refused");
} else console.log("ok   floodlight without support refused");

if (failures.length) { console.log("\nFAILED:", failures); process.exitCode = 1; }
else console.log("\nall ten helpers passed");
