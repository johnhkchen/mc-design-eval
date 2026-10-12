// Calls every vocab.mjs helper once on an empty site-size grid and checks the blocks it placed. Run: node test-vocab.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as V from "./vocab.mjs";

const g = new Grid(V.SIZE, { dataVersion: V.DATA_VERSION });
const at = (x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");
const expect = (label, x, y, z, want) => {
  const got = at(x, y, z);
  const ok = want instanceof RegExp ? want.test(got) : got === want;
  assert.ok(ok, `${label}: (${x},${y},${z}) is ${got}, want ${want}`);
};
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("wallCell: veneer on a north plane, siding elsewhere, belt, cornice, reserved skipped", () => {
  V.wallCell(g, 13, 3, 8, { north: true });
  expect("veneer", 13, 3, 8, /^(stone_bricks|andesite|cobblestone)$/);
  V.wallCell(g, 33, 3, 20);
  expect("siding y3", 33, 3, 20, "sandstone");
  V.wallCell(g, 33, 4, 20);
  expect("siding y4", 33, 4, 20, "smooth_sandstone");
  V.wallCell(g, 33, 5, 20);
  expect("belt", 33, 5, 20, "smooth_quartz");
  V.wallCell(g, 33, 9, 20);
  expect("cornice", 33, 9, 20, "smooth_quartz");
  V.wallCell(g, 20, 6, 20, { partition: true });
  expect("partition", 20, 6, 20, "smooth_sandstone");
  V.wallCell(g, 37, 2, 12, { north: true });
  expect("firebox stays air", 37, 2, 12, "air");
});

test("quoin: corner plus alternating neighbours", () => {
  V.quoin(g, 0, 6, ["east", "south"]);
  expect("corner", 0, 4, 6, "smooth_quartz");
  expect("front neighbour, even y", 1, 4, 6, "smooth_quartz");
  expect("side neighbour, odd y", 0, 3, 7, "smooth_quartz");
});

test("window (sill mode) reserves the opening and builds the sill; fill mode glazes it", () => {
  V.window(g, 14, 3, 8, "north", 3, 2);
  expect("sill", 15, 2, 8, "smooth_quartz");
  assert.ok(V.isReserved(15, 3, 8) && V.isReserved(16, 4, 8), "opening reserved");
  V.wallCell(g, 15, 3, 8, { north: true });
  expect("walls skip reserved opening", 15, 3, 8, "air");
  V.window(g, 14, 3, 8, "north", 3, 2, { fill: true });
  expect("glass", 15, 3, 8, "glass_pane");
});

test("archWin: glass with top-row corner stairs", () => {
  V.archWin(g, 14, 7, 9, "north", 3, 2);
  expect("arch glass", 15, 7, 9, "glass_pane");
  expect("arch corner", 14, 8, 9, /_stairs$/);
  V.archWin(g, 0, 3, 20, "west", 1, 2);
});

test("shutterPair: dark oak trapdoors beside the window, outside the wall", () => {
  V.shutterPair(g, 14, 16, 3, 4, 8, "north");
  expect("left shutter", 13, 3, 7, "dark_oak_trapdoor");
  expect("right shutter", 17, 4, 7, "dark_oak_trapdoor");
  expect("wall stays put", 13, 3, 8, "stone_bricks");
});

test("column: base, pillars, capital", () => {
  V.column(g, 30, 20);
  expect("base", 30, 2, 20, "quartz_block");
  expect("pillar", 30, 5, 20, "quartz_pillar");
  expect("capital", 30, 8, 20, "chiseled_quartz_block");
});

test("turret: ring walls without the chamfers", () => {
  V.turret(g);
  expect("ring wall", 29, 2, 6, /^(stone_bricks|andesite|cobblestone|smooth_sandstone|sandstone)$/);
  expect("chamfer omitted", 29, 2, 4, "air");
  expect("inside air", 31, 2, 6, "air");
});

test("chimneyStack: solid stack, firebox air, collar, pots and campfire", () => {
  V.chimneyStack(g);
  expect("stack", 38, 10, 11, /^(stone_bricks|andesite)$/);
  expect("firebox", 38, 2, 12, "air");
  expect("collar", 36, 13, 9, "stone_brick_slab");
  expect("pot", 37, 14, 10, "stone_brick_wall");
  expect("campfire", 38, 14, 11, "campfire");
});

test("portico: columns, ceiling, porch floor, steps", () => {
  V.portico(g);
  expect("column", 19, 2, 5, "quartz_block");
  expect("ceiling", 22, 9, 6, "smooth_quartz");
  expect("porch border", 19, 1, 6, "smooth_quartz");
  expect("porch floor", 22, 1, 6, "smooth_stone");
  expect("steps", 20, 1, 4, "stone_brick_stairs");
});

test("entryDoor: two dark oak door halves and transom", () => {
  V.entryDoor(g);
  expect("door lower", 22, 2, 8, "dark_oak_door");
  expect("door upper", 23, 3, 8, "dark_oak_door");
  expect("transom", 22, 4, 8, "glass_pane");
});

test("fanlight: glass, shoulders, arched window above", () => {
  V.fanlight(g);
  expect("fanlight", 21, 5, 8, "glass_pane");
  expect("shoulder", 21, 6, 8, "smooth_quartz_stairs");
  expect("arch", 22, 7, 8, "glass_pane");
});

test("carriageDoor: leaf, glass strip, straps", () => {
  V.carriageDoor(g, 1);
  expect("leaf", 2, 2, 7, "birch_planks");
  expect("strip", 2, 4, 7, "glass_pane");
  expect("strap", 1, 2, 6, "dark_oak_trapdoor");
});

test("wallLamp, plaque, planter", () => {
  V.wallLamp(g, 21, 4, 7, "north");
  expect("lamp fence", 21, 4, 7, "dark_oak_fence");
  expect("lantern", 21, 3, 7, "lantern");
  V.plaque(g, 25, 4, 7);
  expect("plaque", 25, 4, 7, "oak_wall_sign");
  V.planter(g, 19, 4);
  expect("planter pedestal", 19, 1, 4, "stone_brick_wall");
  expect("planter pot", 19, 2, 4, "potted_azalea_bush");
});

test("stairFlight and chandelier: banister keeps (23,5,12), lanterns elsewhere", () => {
  V.stairFlight(g);
  expect("stair", 21, 4, 12, "dark_oak_stairs");
  expect("bullnose", 22, 2, 9, "smooth_quartz_slab");
  expect("banister", 23, 5, 12, "iron_bars");
  V.chandelier(g);
  expect("chain", 23, 8, 11, "iron_chain");
  expect("plus", 23, 6, 11, "iron_bars");
  expect("lantern", 22, 5, 11, "lantern");
  expect("banister kept", 23, 5, 12, "iron_bars");
});

test("street, frontWalk, driveway, lawn", () => {
  V.street(g, 0, 43);
  expect("street", 0, 0, 0, /^(gray_concrete|black_concrete)$/);
  expect("sidewalk", 5, 0, 1, "polished_andesite");
  expect("kerb", 20, 1, 1, "stone_brick_slab");
  V.frontWalk(g);
  expect("walk", 22, 0, 2, "polished_andesite");
  expect("walk border", 21, 0, 2, "stone_bricks");
  V.driveway(g, 0, 1, 12, 5);
  expect("joint row", 0, 0, 1, "smooth_stone");
  V.lawn(g, 34, 2, 43, 9, { avoid: (x) => x === 36 });
  expect("lawn grass", 40, 0, 4, "grass_block");
});

test("shrub and bed", () => {
  V.shrub(g, 3, 3, "flower");
  expect("shrub base", 3, 0, 3, "coarse_dirt");
  expect("flowering", 3, 2, 3, "flowering_azalea_leaves");
  V.bed(g, 13, 6, 18, 7, "north");
  expect("bed mulch", 13, 0, 7, "coarse_dirt");
  expect("bed flower row", 13, 1, 6, /^(allium|pink_tulip|azure_bluet)$/);
  expect("bed shrub row", 13, 1, 7, "azalea_leaves");
});

test("youngTree and lampPost", () => {
  V.youngTree(g, 38, 5);
  expect("trunk", 38, 5, 5, "birch_log");
  expect("crown", 36, 4, 4, "birch_leaves");
  expect("stake", 36, 1, 5, "oak_fence");
  V.lampPost(g, 20, 2);
  expect("post", 20, 3, 2, "stone_brick_wall");
  expect("post lantern", 20, 4, 2, "lantern");
});

test("deck, patioSet, frenchDoor", () => {
  V.deck(g, 14, 24, 32, 30, { rail: ["east", "west", "south"], skip: (x, z) => z === 30 && x >= 22 && x <= 24 });
  expect("boards", 20, 1, 26, "spruce_planks");
  expect("boards odd", 20, 1, 25, "oak_planks");
  expect("rail", 14, 2, 26, "dark_oak_fence");
  expect("step gap", 23, 2, 30, "air");
  V.patioSet(g, 18, 27);
  expect("table", 18, 2, 27, "dark_oak_fence");
  expect("chair", 17, 2, 27, "spruce_stairs");
  V.frenchDoor(g, 25, 23);
  expect("french door", 25, 2, 23, "birch_door");
  expect("transom", 26, 4, 23, "glass_pane");
});

test("roofPiece: dry run writes nothing; real R3, R1, R2, R5 stay at or below y14", () => {
  const before = g.cells.size;
  const dry = V.roofPiece(g, "R3", { dryRun: true });
  assert.equal(dry.dryRun, true);
  assert.equal(g.cells.size, before, "dry run must not write");
  for (const id of ["R3", "R1", "R2", "R5"]) V.roofPiece(g, id);
  expect("attic window glass", 22, 11, 4, "glass_pane");
  expect("finial", 31, 14, 6, "lightning_rod");
  for (const [pos, cell] of g.cells) {
    if (pos.split(",")[1] > 14) assert.fail(`block above y14 at ${pos}: ${cell.block}`);
  }
});

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log(`ok   ${name}`); }
  catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); }
}
console.log(failed ? `${failed} of ${tests.length} failed` : `all ${tests.length} vocab tests passed`);
process.exitCode = failed ? 1 : 0;
