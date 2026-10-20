// Calls each h1 helper once on a small grid and checks that what it placed lies inside the footprint it was given,
// and that a blocked cell refuses the whole piece. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

const g = new Grid([60, 40, 60], { dataVersion: 3955 });
const failures = [];

// run one call: `box` is its footprint [x0,y0,z0,x1,y1,z1]; every cell it changed must lie inside it
function check(name, box, call) {
  const before = new Map(g.cells);
  const res = call();
  const changed = [...g.cells.entries()].filter(([k, v]) => before.get(k) !== v).map(([, v]) => v.pos);
  const outside = changed.filter(([x, y, z]) => x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5]);
  const ok = res.ok && res.placed > 0 && changed.length === res.placed && outside.length === 0;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${res.placed} cells${res.ok ? "" : ` (blocked ${res.blocked.length})`}`);
  if (!ok) failures.push([name, outside.slice(0, 3), res.blocked.slice(0, 3)]);
  return res;
}

check("plinth_fill", [20, 0, 2, 30, 4, 12], () => h.plinth_fill(g, [20, 0, 2, 30, 4, 12], 2, "polished_granite"));
check("chamfer_corner", [40, 15, 2, 46, 25, 8], () => h.chamfer_corner(g, 40, 2, "nw", 6, 15, 25));
check("lit_lobby_front", [40, 4, 30, 51, 13, 31], () => h.lit_lobby_front(g, "north", 40, 51, 4, 13, 30, { doors: [[44, 45]] }));
check("aircraft_light", [55, 20, 5, 55, 21, 5], () => h.aircraft_light(g, 55, 20, 5));
check("planter_tree", [8, 4, 23, 12, 10, 27], () => h.planter_tree(g, 10, 4, 25));
check("slab_ramp", [2, 4, 40, 6, 5, 42], () => h.slab_ramp(g, [2, 4, 40], "east", 3, { rise: 1.5 }));
check("arcade_pier", [20, 3, 40, 21, 21, 41], () => h.arcade_pier(g, 20, 40));
check("skylight_strip", [30, 9, 40, 36, 10, 42], () => h.skylight_strip(g, 30, 36, 40, { deckY: 10 }));
check("hotel_band", [49, 4, 20, 50, 8, 30], () => h.hotel_band(g, "east", 4, 20, 30, 50));
check("grand_stair", [0, 1, 44, 19, 6, 58], () => h.grand_stair(g, "west", [0, 1, 44, 19, 6, 58], { ramp: 3 }));

// a block in the way refuses the whole plinth: nothing written, the blocker kept
g.set(5, 3, 5, "stone");
const refused = h.plinth_fill(g, [2, 0, 2, 12, 4, 12], 2, "polished_granite");
if (refused.ok || refused.placed || refused.blocked.length !== 1 || g.blockAt(5, 3, 5) !== "minecraft:stone" || g.blockAt(4, 3, 4) !== "minecraft:air") {
  failures.push(["blocked plinth not refused", refused]);
  console.log("FAIL blocked plinth refused whole");
} else console.log("ok   blocked plinth refused whole");

// a ramp that cannot fit its run throws rather than spilling out of the footprint
try { h.grand_stair(g, "west", [0, 1, 0, 11, 6, 30]); failures.push(["short grand_stair did not throw"]); console.log("FAIL short grand_stair did not throw"); }
catch { console.log("ok   short grand_stair throws"); }

if (failures.length) { console.log("\nFAILED:", failures); process.exitCode = 1; }
else console.log("\nall ten helpers passed");
