// Calls every H3 helper once on a grid and checks each placed block lies in the footprint it was given.
// Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const g = new Grid([96, 12, 19]);
let failed = 0;

// Runs one helper, then checks every block it added lies inside box [x0, y0, z0, x1, y1, z1].
function check(name, box, call) {
  const before = new Set([...g].map((c) => c.pos.join(",")));
  const placed = call();
  const added = [...g].filter((c) => !before.has(c.pos.join(",")));
  const outside = added.filter(({ pos: [x, y, z] }) => x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5]);
  const ok = added.length > 0 && outside.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${added.length} blocks (helper returned ${placed})` +
    (outside.length ? `; outside footprint at ${outside.slice(0, 3).map((c) => c.pos.join(",")).join(" ")}` : ""));
}

check("fence_line", [2, 1, 5, 2, 1, 18], () => h3.fence_line(g, 2, 5, 18, "spruce_fence"));
check("porch", [3, 1, 6, 8, 5, 8], () => h3.porch(g, 3, 8, "oak_planks", { block: "stripped_birch_log", xs: [3, 8] }, "birch_fence", [5, 6]));
check("window (1x2)", [4, 3, 9, 4, 6, 9], () => h3.window(g, 4, 4, 9, "north", 1, 2, "birch"));
check("window (2x2, east wall)", [34, 3, 11, 34, 6, 12], () => h3.window(g, 34, 4, 11, "east", 2, 2, "birch"));
check("chimney", [8, 1, 11, 11, 12, 14], () => h3.chimney(g, 9, 12, 10, 9, 11));
check("channel", [49, 0, 11, 52, 0, 11], () => h3.channel(g, 49, 52, 11));
check("coop", [63, 1, 12, 68, 4, 16], () => h3.coop(g, 63, 12));
check("tree", [79, 1, 13, 83, 9, 17], () => h3.tree(g, 81, 15, 6));
check("store_sign", [84, 3, 4, 95, 11, 9], () => h3.store_sign(g, { center: [89, 10, 8], face: "north", sign: [89, 6, 7] }));

// A block already in the grid is never overwritten (air-only writes)
g.set(10, 1, 3, "stone");
h3.fence_line(g, 10, 1, 4, "spruce_fence");
if (g.blockAt(10, 1, 3) !== "minecraft:stone") { failed++; console.log("FAIL air-only: stone was overwritten"); }
else console.log("ok   air-only: an existing block is left alone");

if (failed) { console.log(`${failed} failed`); process.exitCode = 1; }
else console.log("all H3 helpers passed");
