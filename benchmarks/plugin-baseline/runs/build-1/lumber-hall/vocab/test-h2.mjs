// Calls every h2 helper once on an empty grid and checks that each one changed only cells inside the footprint it was
// given, placed something and refused nothing. Then the specifics: block states, air-only writes into a pre-built
// wall, and the cart passage lane (x 37) that the woodPile must leave open.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const SIZE = [44, 40, 40];
const PASSAGE = [35, 5, 5, 39, 9, 32];                        // plan ROOMS: cart passage box
const inside = (box, [x, y, z]) => x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];

const cases = [
  ["beam x", (g) => h2.beam(g, 3, 39, 23, 3, "x"), [3, 23, 3, 39, 23, 3]],
  ["beam z", (g) => h2.beam(g, 0, 4, 10, 9, "z"), [9, 10, 0, 9, 10, 4]],
  ["windowUnit north", (g) => h2.windowUnit(g, 7, 14, 4, "north"), [6, 13, 4, 8, 15, 4]],
  ["windowUnit east", (g) => h2.windowUnit(g, 40, 14, 21, "east"), [40, 13, 20, 40, 15, 22]],
  ["hoistBeam north", (g) => h2.hoistBeam(g, 11, 0, 3, "north"), [11, 26, 0, 12, 30, 3]],
  ["hoistBeam south", (g) => h2.hoistBeam(g, 30, 34, 37, "south"), [30, 26, 34, 31, 30, 37]],
  ["cartArch", (g) => h2.cartArch(g, 37, 5, "north"), [35, 5, 5, 39, 11, 5]],
  ["awning north", (g) => h2.awning(g, 10, 16, "north", "birch"), [10, 9, 3, 16, 10, 4]],
  ["shopFront south", (g) => h2.shopFront(g, "JUNGLE", 10, "south"), [10, 9, 33, 16, 10, 34]],
  ["woodPile x", (g) => h2.woodPile(g, 20, 5, 30, 4, "acacia"), [20, 5, 30, 23, 7, 31]],
  ["woodPile passage", (g) => h2.woodPile(g, 35, 5, 5, 10, "birch", { axis: "z" }), [35, 5, 5, 36, 7, 14]],
];

let failed = 0;
const expect = (cond, msg) => { if (!cond) { failed++; console.log(`  FAIL: ${msg}`); } };

for (const [name, call, box] of cases) {
  const g = new Grid(SIZE);
  const r = call(g);
  const cells = [...g.cells.values()].map((c) => c.pos);
  const outside = cells.filter((p) => !inside(box, p));
  const ok = cells.length > 0 && outside.length === 0 && r.placed > 0 && r.refused.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${r.placed} placed, ${r.refused.length} refused${outside.length ? `, outside ${outside.join(" ")}` : ""}`);
}

// specifics: states and block ids on the cells that matter
{
  const g = new Grid(SIZE);
  h2.beam(g, 3, 39, 23, 3, "x");
  expect(g.blockAt(3, 23, 3) === "minecraft:stripped_dark_oak_wood", "beam end is wood");
  expect(g.get(20, 23, 3)?.block === "minecraft:stripped_dark_oak_log" && g.get(20, 23, 3).state.axis === "x", "beam middle is log axis x");
}
{
  const g = new Grid(SIZE);
  h2.windowUnit(g, 7, 14, 4, "north");
  expect(g.blockAt(7, 14, 4) === "minecraft:glass_pane" && g.blockAt(7, 15, 4) === "minecraft:glass_pane", "window is a 1x2 pane");
  expect(g.get(7, 13, 4)?.block === "minecraft:dark_oak_slab" && g.get(7, 13, 4).state.type === "bottom", "sill is a bottom slab");
  expect(g.get(6, 14, 4)?.block === "minecraft:dark_oak_trapdoor" && g.get(6, 14, 4).state.open === "true", "shutter is an open trapdoor");
}
{
  const g = new Grid(SIZE);
  h2.hoistBeam(g, 30, 34, 37, "south");
  expect(g.get(30, 30, 37)?.block === "minecraft:stripped_dark_oak_wood", "south hoist beam end cap at z 37");
  expect(g.blockAt(30, 28, 36) === "minecraft:iron_chain", "south chain hangs at z 36");
}
{
  const g = new Grid(SIZE);
  h2.awning(g, 10, 16, "north", "birch");
  expect(g.get(12, 9, 4)?.block === "minecraft:birch_stairs" && g.get(12, 9, 4).state.facing === "north", "awning stair at z 4 y 9 faces out");
  expect(g.get(12, 9, 3)?.block === "minecraft:birch_trapdoor" && g.get(12, 9, 3).state.open === "true", "valance open trapdoor at z 3 y 9");
}
{
  // a wall already built: the arch cuts its opening, and the lintel and frame are left alone (air-only)
  const g = new Grid(SIZE);
  for (let x = 34; x <= 40; x++) for (let y = 5; y <= 11; y++) g.set(x, y, 5, "stone");
  const r = h2.cartArch(g, 37, 5, "north");
  expect(g.isAir(37, 5, 5) && g.isAir(37, 9, 5), "arch opening is air");
  expect(g.blockAt(37, 11, 5) === "minecraft:stone" && g.blockAt(34, 6, 5) === "minecraft:stone", "wall outside the opening stays");
  expect(g.get(35, 9, 5)?.block === "minecraft:dark_oak_stairs" && g.get(35, 9, 5).state.half === "top", "corner is upside-down stairs");
  expect(r.carved === 25 && r.refused.includes("37,11,5"), "carved 25, lintel refused where the wall is");
}
{
  const g = new Grid(SIZE);
  g.set(11, 30, 0, "stone");
  const r = h2.hoistBeam(g, 11, 0, 3, "north");
  expect(g.blockAt(11, 30, 0) === "minecraft:stone" && r.refused.includes("11,30,0"), "hoist beam never overwrites");
}
{
  // cart passage: the pile sits inside the room and leaves the x 37 lane open at y 5..6
  const g = new Grid(SIZE);
  h2.woodPile(g, 35, 5, 5, 10, "birch", { axis: "z" });
  expect(g.get(35, 6, 5)?.state?.axis === "z" && g.blockAt(35, 5, 5) === "minecraft:birch_planks", "pile: planks base, logs along z");
  for (let z = 5; z <= 14; z++) for (const y of [5, 6]) expect(g.isAir(37, y, z), `lane x37 y${y} z${z} clear`);
  const inRoom = [...g.cells.values()].every((c) => inside(PASSAGE, c.pos));
  expect(inRoom, "pile sits inside the cart passage room");
}

console.log(failed ? `${failed} check(s) failed` : "all h2 checks passed");
process.exitCode = failed ? 1 : 0;
