// Calls every h3 helper once on a small grid and checks each call: it placed blocks, changed only cells inside the
// rectangle it was given, touched no ground below the column top, and left the expected blocks. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const W = 48, HGT = 24, D = 48;
// Ground: stone up to the top, grass on it. The top is y2 west of x24 and y3 east of it.
const top = (x) => (x < 24 ? 2 : 3);
const g = new Grid([W, HGT, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  for (let y = 0; y < top(x); y++) g.set(x, y, z, "stone");
  g.set(x, top(x), z, "grass_block");
}

const snap = () => { const m = new Map(); for (let x = 0; x < W; x++) for (let y = 0; y < HGT; y++) for (let z = 0; z < D; z++) m.set(`${x},${y},${z}`, g.blockAt(x, y, z)); return m; };
let failed = 0;
const fail = (msg) => { failed++; console.log("FAIL " + msg); };

/** Run one call, then check its footprint rectangle, the ground, and the expected blocks. */
function call(name, rect, fn, want = []) {
  const before = snap();
  const n = fn();
  if (!(n > 0)) fail(`${name} placed nothing`);
  for (let x = 0; x < W; x++) for (let y = 0; y < HGT; y++) for (let z = 0; z < D; z++) {
    const k = `${x},${y},${z}`;
    if (before.get(k) === g.blockAt(x, y, z)) continue;
    const inside = x >= rect[0] && x <= rect[2] && z >= rect[1] && z <= rect[3];
    if (!inside) fail(`${name} wrote outside its rectangle at ${k}`);
    if (y < top(x)) fail(`${name} touched the ground at ${k}`);
    if (before.get(k) !== "minecraft:air" && y !== top(x)) fail(`${name} overwrote a non-air block at ${k}`);
  }
  for (const [x, y, z, block] of want) {
    const got = g.blockAt(x, y, z);
    if (got !== `minecraft:${block}`) fail(`${name}: ${x},${y},${z} is ${got}, want ${block}`);
  }
  console.log(`ok   ${name}: ${n} blocks`);
}

call("copingRing", [2, 2, 21, 21], () => h3.copingRing(g, 2, 2, 21, 21),
  [[2, 3, 2, "polished_andesite"], [3, 3, 3, "smooth_stone_slab"], [5, 3, 5, "air"]]);
call("slabStep", [26, 5, 26, 5], () => h3.slabStep(g, 26, 5, 3), [[26, 3, 5, "smooth_sandstone_slab"]]);
call("hedgeBed", [28, 10, 33, 13], () => h3.hedgeBed(g, 28, 10, 33, 13),
  [[28, 3, 10, "moss_block"], [28, 4, 10, "shroomlight"], [29, 4, 10, "azalea_leaves"]]);
call("balustradeRun", [30, 30, 45, 30], () => h3.balustradeRun(g, { axis: "x", at: 30, from: 30, to: 45 }, 4, [[36, 38]]),
  [[30, 4, 30, "quartz_pillar"], [31, 4, 30, "diorite_wall"], [31, 5, 30, "smooth_quartz_slab"], [35, 4, 30, "quartz_pillar"], [37, 4, 30, "air"], [39, 4, 30, "quartz_pillar"]]);
call("fountainBasin", [26, 40, 31, 45], () => h3.fountainBasin(g, 26, 40, 31, 45, 5, true),
  [[26, 4, 40, "smooth_quartz"], [27, 5, 41, "water"], [28, 6, 42, "water"], [26, 6, 40, "decorated_pot"]]);
call("pedestal", [8, 25, 10, 27], () => h3.pedestal(g, 8, 25, 10, 27, 3, 7),
  [[9, 3, 26, "quartz_pillar"], [9, 7, 26, "polished_blackstone"]]);
call("cavalryGroup", [14, 25, 18, 29], () => h3.cavalryGroup(g, 14, 25, 18, 29, 3),
  [[14, 3, 25, "smooth_quartz"], [14, 5, 26, "polished_blackstone_stairs"], [15, 5, 26, "polished_blackstone"], [15, 6, 26, "polished_blackstone_wall"]]);
call("lampPost", [36, 40, 36, 40], () => h3.lampPost(g, 36, 40),
  [[36, 4, 40, "polished_blackstone_wall"], [36, 6, 40, "lantern"]]);

// The leaves are persistent, and the bed's shroomlight replaces its leaf.
if (g.get(29, 4, 10)?.state?.persistent !== "true") fail("azalea leaves are not persistent");

console.log(failed ? `${failed} failure(s)` : "all h3 helpers passed");
process.exitCode = failed ? 1 : 0;
