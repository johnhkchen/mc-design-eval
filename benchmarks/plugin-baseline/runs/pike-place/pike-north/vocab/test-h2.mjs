// Calls each h2 helper once on an empty grid, in its own region, and checks that every cell it wrote is inside the
// footprint it was given and that the report counts match. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h2.mjs";

const g = new Grid([26, 26, 26]);
const key = (pos) => pos.join(",");
let failed = 0;
const fail = (msg) => { failed++; console.log(`FAIL ${msg}`); };

// Runs fn, then checks the new cells: inside [lo, hi], and as many as the report says (placed + letters).
function step(name, [lo, hi], fn, expect) {
  const before = new Set([...g.cells.values()].map((c) => key(c.pos)));
  const r = fn();
  const fresh = [...g.cells.values()].filter((c) => !before.has(key(c.pos)));
  const outside = fresh.filter(({ pos }) => pos.some((v, i) => v < lo[i] || v > hi[i]));
  const count = r.placed + (r.letters ?? 0);
  if (outside.length) fail(`${name}: wrote outside its footprint at ${outside.map((c) => key(c.pos)).join(" ")}`);
  if (fresh.length !== count) fail(`${name}: report says ${count}, grid got ${fresh.length}`);
  if (expect != null && count !== expect) fail(`${name}: expected ${expect} cells, got ${count}`);
  console.log(`${outside.length || fresh.length !== count ? "FAIL" : "ok  "} ${name}: ${count} cells`);
  return r;
}

step("awning_run", [[0, 8, 0], [1, 9, 9]], () => H.awning_run(g, { x0: 0, x1: 1, y: 9, z0: 0, z1: 9 }), 23);
step("awning_lantern", [[0, 7, 5], [0, 8, 5]], () => H.awning_lantern(g, { x: 0, y: 8, z: 5, chain: true }), 2);
step("window_box", [[3, 11, 0], [3, 12, 1]], () => H.window_box(g, { x: 3, z: 0, y: 11, width: 2 }), 4);
step("shop_board", [[5, 10, 0], [6, 11, 8]], () => H.shop_board(g, { x: 6, y0: 10, y1: 11, z0: 0, z1: 8, text: "AB", face: "west" }));
step("arch_window", [[10, 19, 0], [11, 24, 2]], () => H.arch_window(g, { x: 10, z: 0, y0: 20, y1: 23, face: "east" }), 6);
step("brick_stack", [[14, 11, 0], [15, 18, 1]], () => H.brick_stack(g, { x: 14, z: 0, y0: 12, height: 6, deck: 10 }), 4 * 8);
step("door_step", [[18, 2, 0], [18, 2, 1]], () => H.door_step(g, { x: 18, z: 0, y: 2, width: 2 }), 2);
step("pavilion_door", [[21, 9, 0], [21, 14, 3]], () => H.pavilion_door(g, { x: 21, z: 0, y: 9, face: "east" }), 16);

// Doors write both halves; the lantern hangs from a block; the helpers refuse to overwrite.
const door = g.get(21, 9, 1), doorTop = g.get(21, 10, 1);
if (!door || door.block !== "minecraft:dark_oak_door" || !doorTop || doorTop.state?.half !== "upper") fail("pavilion_door: door halves");
if (!g.get(0, 8, 5) || g.get(0, 8, 5).block !== "minecraft:chain") fail("awning_lantern: chain cell");
const again = H.window_box(g, { x: 3, z: 0, y: 11, width: 2 });
if (again.placed !== 0 || again.skipped.length !== 4) fail(`window_box: refuses occupied cells (placed ${again.placed})`);
const floating = H.awning_lantern(g, { x: 0, y: 8, z: 20 });
if (floating.placed !== 0 || g.get(0, 8, 20)) fail("awning_lantern: hung a lantern with nothing above");

console.log(failed ? `${failed} check(s) failed` : "all h2 checks passed");
process.exitCode = failed ? 1 : 0;
