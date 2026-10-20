// Calls every h2 helper once on a small grid; each placed block must sit inside the footprint the call was given.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h2.mjs";

const g = new Grid([48, 30, 56]);
let fails = 0;

// Snapshot the cell objects, run the call, then check every new or changed cell against the footprint box [lo, hi].
function run(name, [lo, hi], call) {
  const before = new Set(g.cells.values());
  const refused = call();
  const fresh = [...g.cells.values()].filter((c) => !before.has(c));
  const outside = fresh.filter(({ pos: [x, y, z] }) => x < lo[0] || x > hi[0] || y < lo[1] || y > hi[1] || z < lo[2] || z > hi[2] || y < 1);
  const ok = fresh.length > 0 && outside.length === 0 && refused.length === 0;
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${fresh.length} blocks, ${outside.length} outside footprint, ${refused.length} refused`);
}

run("lancet", [[10, 12, 10], [10, 16, 11]], () => H.lancet(g, [10, 10], "north", 12, 16, true));
run("arcade_bay", [[20, 1, 4], [23, 9, 7]], () => H.arcade_bay(g, "west", [20, 4], 3));
run("arch_frame", [[4, 10, 6], [18, 24, 6]], () => H.arch_frame(g, { x0: 4, x1: 18, z: 6, spring: 10, crown: 22 }));
g.set(12, 20, 12, "smooth_quartz");
run("globe_lamp", [[12, 15, 12], [12, 19, 12]], () => H.globe_lamp(g, 12, 20, 12));
run("fountain_bowl", [[14, 1, 23], [18, 4, 27]], () => H.fountain_bowl(g, 16, 25));
run("promenade_stair", [[26, 1, 4], [27, 9, 12]], () => H.promenade_stair(g, 26, 4, 12));
run("name_band", [[39, 12, 30], [39, 12, 53]], () => H.name_band(g, { x: 39, y: 12, z0: 30, z1: 53 }));
run("lamp_post", [[30, 1, 40], [30, 3, 40]], () => H.lamp_post(g, 30, 40));

// Only into air: a solid block in the way is kept and reported as refused.
g.set(31, 2, 40, "stone");
const refused = H.lamp_post(g, 31, 40);
const kept = g.blockAt(31, 2, 40) === "minecraft:stone" && refused.length === 1;
if (!kept) fails++;
console.log(`${kept ? "ok  " : "FAIL"} lamp_post over stone: stone kept, ${refused.length} refused`);

console.log(fails ? `${fails} FAILED` : "all h2 helpers passed");
process.exitCode = fails ? 1 : 0;
