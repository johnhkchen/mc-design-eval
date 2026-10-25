// Calls each h3 helper once on an open grid and checks that what it placed lies in the footprint it was given.
// Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h3.mjs";

const g = new Grid([40, 160, 40], { dataVersion: 3955 });   // Minecraft 1.21.1
const fails = [];
const key = (c) => c.join(",");
const inBox = ([x, y, z], [x0, x1, y0, y1, z0, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

function run(name, box, call, expectRefused = []) {
  const before = new Set([...g].map((c) => key(c.pos)));
  const res = call();
  const fresh = [...g].filter((c) => !before.has(key(c.pos)));
  const outside = fresh.filter((c) => !inBox(c.pos, box));
  const refusedOk = expectRefused.every((c) => res.refused.some((r) => key(r) === key(c)));
  const ok = res.placed > 0 && fresh.length === res.placed && outside.length === 0 && refusedOk;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${res.placed} placed, ${res.refused.length} refused`);
  if (!ok) fails.push(name, outside.map((c) => key(c.pos)));
}

// prepared support for the lamps (outside each lamp's footprint, placed before the snapshot)
g.set(5, 20, 5, "stone_bricks", {});
g.set(7, 18, 7, "stone_bricks", {});
g.set(7, 11, 10, "stone_bricks", {});   // round_window's glass cell is solid: must be refused, not overwritten
run("round_window", [5, 7, 9, 13, 10, 10], () => H.round_window(g, 6, 10, 10, "west"), [[7, 11, 10]]);
run("mullion_window", [11, 13, 9, 13, 10, 11], () => H.mullion_window(g, 12, 10, 10, "west"));
run("buttress", [20, 21, 20, 40, 29, 30], () => H.buttress(g, 20, 30, 20, 40, { face: "north" }));
run("octagon_ring", [21, 29, 100, 100, 21, 29], () => H.octagon_ring(g, 25, 25, 4, 100));
run("archangel", [24, 26, 143, 151, 24, 26], () => H.archangel(g, 25, 25, 143));
run("round_turret", [28, 32, 10, 17, 28, 32], () => H.round_turret(g, 30, 30, 1.5, 10, 16, { front: "south" }));
run("lamp standing", [7, 7, 19, 19, 7, 7], () => H.lamp(g, 7, 19, 7));
run("lamp hanging", [5, 5, 19, 19, 5, 5], () => H.lamp(g, 5, 19, 5, { hang: true }));

// air-only: the solid stone in the way is still there after round_window
if (g.blockAt(7, 11, 10) !== "minecraft:stone_bricks") fails.push("solid cell overwritten");
console.log(fails.length ? `FAILED: ${JSON.stringify(fails)}` : "all helpers placed inside their footprints");
process.exit(fails.length ? 1 : 0);
