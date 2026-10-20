// Calls every h1 helper once on a small grid and checks each one placed blocks only inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hillCell, crack, deckRail, trailRun, lampPost, tree } from "./h1.mjs";

let failed = 0;
const pass = (name) => console.log(`ok   ${name}`);
const fail = (name, why) => { failed++; console.log(`FAIL ${name}: ${why}`); };

// Flat ground: grass at y 9 over stone and dirt, so the helpers have something to stand on
function ground(g) {
  for (let x = 0; x < 80; x++) for (let z = 0; z < 40; z++) for (let y = 0; y <= 9; y++) {
    g.set(x, y, z, y === 9 ? "grass_block" : y >= 6 ? "dirt" : "stone");
  }
  return g;
}

// Run fn on a fresh grid and check every block it changed lies inside one of the boxes (inclusive [x0,y0,z0,x1,y1,z1])
function check(name, setup, fn, boxes, expectCount) {
  const g = setup(new Grid([80, 30, 40]));
  const before = new Map([...g.cells].map(([k, c]) => [k, c.block]));
  const count = fn(g);
  const outside = [];
  let changed = 0;
  for (const [k, c] of g.cells) {
    if (before.get(k) === c.block) continue;
    changed++;
    const [x, y, z] = c.pos;
    if (!boxes.some(([x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1)) outside.push(c.pos.join(","));
  }
  if (outside.length) return fail(name, `${outside.length} block(s) outside the footprint, e.g. ${outside.slice(0, 3).join(" ")}`);
  if (count !== changed) return fail(name, `returned ${count} but ${changed} cells changed`);
  if (expectCount && !expectCount(g, count)) return fail(name, `unexpected result (${count} placed)`);
  pass(name);
  return g;
}

check("hillCell", (g) => ground(g) && g,
  (g) => {
    const placed = hillCell(g, 10, 10, 9, { rise: 0 });
    if (hillCell(g, 67, 10, 9) !== 0) throw new Error("hillCell wrote into a reserved trail column");
    return placed;
  },
  [[10, 0, 10, 10, 9, 10]],
  (g) => g.blockAt(10, 9, 10) === "minecraft:grass_block" && g.blockAt(10, 8, 10) === "minecraft:dirt");

check("crack", (g) => {
  ground(g).fill([20, 10, 20], [26, 20, 26], "smooth_sandstone");
  return g;
}, (g) => crack(g, { x0: 20, x1: 26, y0: 10, y1: 20, z0: 20, z1: 26 }, "north", 23, 12, 5),
  [[20, 10, 20, 26, 20, 26], [23, 10, 19, 23, 10, 19]],
  (g) => g.blockAt(23, 13, 20) === "minecraft:air" && g.blockAt(23, 13, 21) === "minecraft:tuff");

check("deckRail", (g) => ground(g) && g,
  (g) => deckRail(g, [[30, 10], [30, 11], [30, 12], [30, 13], [30, 14], [30, 15], [30, 16]], {
    y: 12, openings: [[30, 13]], corners: [[30, 10], [30, 16]],
  }),
  [[30, 12, 10, 30, 13, 16]],
  (g) => g.blockAt(30, 12, 13) === "minecraft:air" && g.blockAt(30, 12, 16) === "minecraft:dark_oak_fence" && g.blockAt(30, 13, 16) === "minecraft:lantern");

check("trailRun", (g) => ground(g) && g,
  (g) => trailRun(g, [[68, 14, 2], [68, 15, 3], [68, 15.5, 4], [68, 16, 5], [68, 16, 6]]),
  [[67, 10, 2, 68, 16, 6]],
  (g) => g.blockAt(68, 15, 3) === "minecraft:stone_brick_stairs" && g.blockAt(68, 10, 2) === "minecraft:stone" && g.blockAt(68, 13, 2) === "minecraft:dirt");

check("lampPost", (g) => ground(g) && g,
  (g) => lampPost(g, 30, 30),
  [[30, 10, 30, 30, 13, 30]],
  (g) => g.blockAt(30, 13, 30) === "minecraft:lantern" && g.get(30, 13, 30).state.hanging === "false");

check("tree", (g) => ground(g) && g,
  (g) => tree(g, 20, 20, "oak"),
  [[16, 10, 16, 24, 17, 24]],
  (g) => g.blockAt(20, 15, 20) === "minecraft:oak_log" && g.get(20, 16, 22)?.state?.persistent === "true");

if (failed) {
  console.log(`${failed} failed`);
  process.exit(1);
}
console.log("all h1 helpers passed");
