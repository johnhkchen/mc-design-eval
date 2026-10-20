// Calls each h4 helper once on a small grid and checks that every block it changed lies inside the footprint it was given,
// that its return count matches the cells changed, and that an occupied cell survives (air only). Run: node vocab/test-h4.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { quoins, slitWindow, octoTower, lampPost, gableDiamond, lanternCap, fountain, curvedPier } from "./h4.mjs";

const g = new Grid([56, 16, 56]);
g.set(2, 1, 2, "stone"); // occupied: quoins must leave it alone

const snap = () => new Map([...g].map((c) => [c.pos.join(","), JSON.stringify([c.block, c.state ?? {}])]));
let failed = 0;

// Runs call(), then checks: changes inside box [x0,y0,z0,x1,y1,z1] (inclusive), count == changed cells, and extra(g).
function check(name, box, call, extra = () => true) {
  const before = snap();
  const n = call();
  const changed = [...snap()].filter(([k, v]) => before.get(k) !== v);
  const inside = changed.every(([k]) => {
    const [x, y, z] = k.split(",").map(Number);
    return x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
  });
  const ok = n > 0 && n === changed.length && inside && extra();
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: placed ${n}, changed ${changed.length}, inside footprint ${inside}`);
}

check("quoins", [2, 1, 2, 2, 4, 2], () => quoins(g, 2, 2, 1, 4),
  () => g.blockAt(2, 1, 2) === "minecraft:stone" && g.blockAt(2, 2, 2) === "minecraft:polished_granite");

check("slitWindow", [8, 1, 8, 8, 3, 8], () => slitWindow(g, 8, 1, 8, "north", 3),
  () => g.blockAt(8, 2, 8) === "minecraft:gray_stained_glass_pane" && g.get(8, 2, 8).state.east === "true");

check("octoTower", [12, 1, 2, 15, 10, 5], () => octoTower(g, 12, 2, 15, 5, 10, 1, { y0: 1 }),
  () => g.blockAt(12, 5, 3) === "minecraft:red_terracotta" && g.blockAt(13, 5, 3) === "minecraft:air");

check("lampPost", [20, 1, 3, 20, 3, 3], () => lampPost(g, 20, 1, 3),
  () => g.blockAt(20, 3, 3) === "minecraft:lantern" && g.blockAt(20, 1, 3) === "minecraft:red_nether_brick_wall");

check("gableDiamond", [22, 6, 30, 26, 10, 30], () => gableDiamond(g, 24, 8, 30, "north"),
  () => g.blockAt(24, 8, 30) === "minecraft:glass_pane" && g.blockAt(24, 10, 30) === "minecraft:yellow_terracotta");

check("lanternCap", [31, 4, 7, 33, 7, 9], () => lanternCap(g, 32, 4, 8),
  () => g.blockAt(32, 4, 8) === "minecraft:shroomlight" && g.blockAt(32, 5, 8) === "minecraft:air" && g.blockAt(32, 7, 8) === "minecraft:lightning_rod");

check("fountain (round)", [37, 1, 5, 43, 1, 11], () => fountain(g, 40, 8, 3, 1),
  () => g.blockAt(40, 1, 8) === "minecraft:water" && g.blockAt(43, 1, 8) === "minecraft:smooth_stone_slab");

check("fountain (box)", [48, 1, 12, 52, 1, 15], () => fountain(g, 0, 0, 0, 1, { box: [48, 12, 52, 15] }),
  () => g.blockAt(50, 1, 13) === "minecraft:water" && g.blockAt(48, 1, 13) === "minecraft:smooth_stone_slab");

check("curvedPier", [14, 0, 14, 38, 2, 38], () => curvedPier(g, 26, 26, 9, 12, -45, 20),
  () => g.blockAt(33, 0, 19) === "minecraft:white_terracotta" && g.blockAt(33, 2, 19) === "minecraft:light_gray_concrete"
    && g.blockAt(33, 0, 33) === "minecraft:air");

console.log(failed ? `${failed} helper(s) failed` : "all h4 helpers passed");
process.exitCode = failed ? 1 : 0;
