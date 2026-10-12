// Smoke test for vocab/h2.mjs: every helper once on a small grid. Each must place something, and change only cells inside
// the box it was given. Then two checks on the rules: the hatch is carved, and a block in the way is refused.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const cases = [
  ["logCourse", [2, 8, 2, 5, "x"], [2, 2, 5, 8, 2, 5]],
  ["logCourse", [2, 8, 2, 10, "z"], [10, 2, 2, 10, 2, 8]],
  ["shutterPair", [6, 3, 8, "north", 2], [5, 3, 7, 8, 4, 7]],
  ["loftLadder", [5, 16, 2, 4, "north"], [5, 2, 16, 5, 5, 16]],
  ["halfWall", [30, 8, 12], [30, 1, 8, 30, 2, 12]],
  ["logDeck", [24, 34, 4, 7], [24, 1, 4, 34, 3, 7]],
  ["hearthMouth", [18, 2, 12, "west"], [17, 2, 12, 18, 4, 13]],
  ["cordwood", [9, 18, 12, 20, 1, 3], [9, 1, 18, 12, 3, 20]],
  ["ruts", [0, 20, 1], [0, 0, 1, 20, 0, 1]],
];

const inside = (p, [x0, y0, z0, x1, y1, z1]) =>
  p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;
const fresh = () => {
  const g = new Grid([40, 8, 22]);
  g.fill([0, 0, 0], [39, 0, 21], "grass_block");
  return g;
};
let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log(`FAIL ${msg}`); } };

for (const [name, args, box] of cases) {
  const g = fresh(), before = new Map([...g].map((c) => [c.pos.join(","), c.block]));
  const r = h2[name](g, ...args);
  check(r.placed > 0, `${name} placed nothing`);
  for (const c of g) {
    if (before.get(c.pos.join(",")) !== c.block) check(inside(c.pos, box), `${name} changed ${c.pos} outside ${box}`);
  }
  console.log(`${name}: ${r.placed} placed, ${r.blocked.length} refused`);
}

// the ladder runs up to the hatch and carves it; a block in the way is refused, not overwritten
const g = fresh();
g.set(5, 3, 16, "stone");
const r = h2.loftLadder(g, 5, 16, 2, 4, "north");
check(g.blockAt(5, 4, 16) === "minecraft:ladder", "ladder missing at y=4");
check(g.blockAt(5, 5, 16) === "minecraft:air", "hatch not carved at y=5");
check(g.blockAt(5, 3, 16) === "minecraft:stone" && r.blocked.length === 1, "ladder overwrote a block in its way");

console.log(failures ? `${failures} failure(s)` : "test-h2: all helpers pass");
process.exit(failures ? 1 : 0);
