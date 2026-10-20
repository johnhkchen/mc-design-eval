// Smoke test for vocab/h1.mjs: each helper once on a 20 x 12 x 20 grid with the smooth_stone ground at y0.
// Each call must change only cells inside its footprint and place something; a filled cell must be kept (air only).
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { wallBox, leanTo, shutter, arcade, cupola, lawn, lampPost } from "./h1.mjs";

const g = new Grid([20, 12, 20], { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, 0, 0], [19, 0, 19], "smooth_stone");

const key = (c) => c.block + JSON.stringify(c.state ?? {});
const snapshot = () => new Map([...g].map((c) => [c.pos.join(","), key(c)]));
let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL ${msg}`); };

// run fn, then check: placed > 0, every changed cell inside box [x0, y0, z0, x1, y1, z1]
function check(name, box, fn) {
  const before = snapshot();
  const res = fn();
  const [x0, y0, z0, x1, y1, z1] = box;
  for (const c of g) {
    const [x, y, z] = c.pos;
    if (before.get(c.pos.join(",")) === key(c)) continue;
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) fail(`${name} wrote outside its footprint at ${c.pos}`);
  }
  if (res.placed === 0) fail(`${name} placed nothing`);
  console.log(`${res.placed === 0 ? "FAIL" : "ok  "} ${name}: ${res.placed} placed, ${res.refused.length} refused`);
  return res;
}

// a stone block in a wall corner: the air-only rule must keep it and report the refusal
g.set(2, 2, 2, "stone");
const w = check("wallBox", [2, 1, 2, 8, 4, 7], () => wallBox(g, [2, 2, 8, 7], 1, 4, "white_concrete", "stone_bricks"));
if (g.blockAt(2, 2, 2) !== "minecraft:stone" || w.refused.length !== 1) fail("wallBox overwrote a filled cell");
if (g.blockAt(5, 1, 2) !== "minecraft:stone_bricks" || g.blockAt(5, 2, 2) !== "minecraft:white_concrete") fail("wallBox plinth/wall blocks");
if (g.blockAt(5, 2, 5) !== "minecraft:air") fail("wallBox filled the interior");

check("leanTo", [10, 4, 2, 12, 4, 4], () => leanTo(g, [10, 2, 12, 4], 4, "west", "polished_andesite", "stone_brick"));
if (g.get(10, 4, 3).state.facing !== "east" || g.get(10, 4, 3).block !== "minecraft:stone_brick_stairs") fail("leanTo edge row/facing");

check("shutter", [14, 2, 3, 14, 3, 3], () => shutter(g, [14, 2, 3], "north", "warped", { height: 2 }));
if (g.blockAt(14, 2, 3) !== "minecraft:warped_trapdoor") fail("shutter block");

check("arcade", [1, 1, 12, 8, 3, 12], () => arcade(g, 1, 8, 12, 1));
if (g.blockAt(1, 1, 12) !== "minecraft:smooth_sandstone" || g.blockAt(1, 2, 12) !== "minecraft:smooth_sandstone") fail("arcade pier");
if (g.get(2, 3, 12).block !== "minecraft:smooth_sandstone_stairs" || g.get(2, 3, 12).state.facing !== "east") fail("arcade arch west cell");
if (g.get(3, 3, 12).state.facing !== "west") fail("arcade arch east cell");

check("cupola", [16, 7, 2, 17, 10, 3], () => cupola(g, [16, 2], 7));
if (g.blockAt(16, 10, 2) !== "minecraft:lightning_rod") fail("cupola rod");

check("lawn", [0, 0, 14, 5, 0, 18], () => lawn(g, [0, 14, 5, 18], 0));
if (g.blockAt(3, 0, 16) !== "minecraft:grass_block") fail("lawn");

check("lampPost", [9, 1, 14, 9, 4, 14], () => lampPost(g, 9, 14));
if (g.blockAt(9, 4, 14) !== "minecraft:lantern") fail("lampPost lantern");

console.log(failures ? `${failures} failure(s)` : "all helpers passed");
process.exit(failures ? 1 : 0);
