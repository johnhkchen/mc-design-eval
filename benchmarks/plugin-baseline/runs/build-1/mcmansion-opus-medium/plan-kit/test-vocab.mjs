// Calls every vocab.mjs helper once on a fresh grid and checks the blocks and states it placed.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import * as V from "./vocab.mjs";

const fresh = () => new Grid([44, 18, 32], { dataVersion: DATA_VERSIONS["26.3"] });
const id = (g, x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");
const st = (g, x, y, z) => g.get(x, y, z)?.state ?? {};
const is = (g, x, y, z, block) => assert.equal(id(g, x, y, z), block, `${x},${y},${z} wanted ${block}, got ${id(g, x, y, z)}`);
const isAir = (g, x, y, z) => assert.equal(id(g, x, y, z), "air", `${x},${y},${z} should be air, got ${id(g, x, y, z)}`);

const cases = [
  ["veneer (pure)", null, () => {
    const allowed = new Set([V.STONE_BRICKS, V.ANDESITE, V.TUFF_BRICKS, V.COBBLESTONE]);
    const seen = new Set();
    for (let x = 0; x < 20; x++) for (let z = 0; z < 20; z++) { const b = V.veneer(x, 1, z); assert.ok(allowed.has(b), b); seen.add(b); }
    assert.equal(seen.size, 4, "all four veneer blocks used");
  }],
  ["siding (pure)", null, () => assert.equal(V.siding(3, 6, 11), V.BIRCH_PLANKS)],
  ["wallCell front", (g) => { V.wallCell(g, 5, 5, 11, "front"); V.wallCell(g, 5, 9, 11, "front"); V.wallCell(g, 5, 7, 11, "front"); }, (g) => {
    is(g, 5, 5, 11, V.SMOOTH_QUARTZ); is(g, 5, 9, 11, V.SMOOTH_QUARTZ); is(g, 5, 7, 11, V.BIRCH_PLANKS);
  }],
  ["wallCell other", (g) => { V.wallCell(g, 2, 1, 15, "other"); V.wallCell(g, 2, 4, 15, "other"); }, (g) => {
    is(g, 2, 1, 15, V.STONE_BRICKS); is(g, 2, 4, 15, V.BIRCH_PLANKS);
  }],
  ["wallLine", (g) => V.wallLine(g, 13, 11, 20, 11, "front", { open: [[13, 2, 11, 20, 8, 11]] }), (g) => {
    is(g, 13, 9, 11, V.SMOOTH_QUARTZ); isAir(g, 13, 2, 11); isAir(g, 20, 8, 11); is(g, 13, 1, 11, V.veneer(13, 1, 11));
  }],
  ["quoin", (g) => V.quoin(g, 2, 11, "east", "south", 2, 8), (g) => {
    is(g, 2, 2, 11, V.QUARTZ_BRICKS); is(g, 3, 2, 11, V.QUARTZ_BRICKS); is(g, 2, 3, 11, V.QUARTZ_BRICKS); is(g, 2, 3, 12, V.QUARTZ_BRICKS);
    isAir(g, 3, 3, 11);
  }],
  ["partition", (g) => V.partition(g, 12, 12, 12, 17, 2, 4, { open: [[12, 2, 15, 12, 3, 15]] }), (g) => {
    is(g, 12, 2, 13, V.BIRCH_PLANKS); isAir(g, 12, 2, 15);
  }],
  ["archWindow north", (g) => V.archWindow(g, 8, 2, 11, "north"), (g) => {
    is(g, 8, 2, 11, V.GLASS_PANE); is(g, 9, 3, 11, V.GLASS_PANE);
    is(g, 8, 4, 11, V.QUARTZ_STAIRS); assert.equal(st(g, 8, 4, 11).facing, "west"); assert.equal(st(g, 9, 4, 11).facing, "east");
    is(g, 8, 1, 10, V.SMOOTH_QUARTZ_SLAB); assert.equal(st(g, 8, 1, 10).type, "top");
    is(g, 7, 2, 10, V.DARK_OAK_TRAPDOOR); assert.equal(st(g, 7, 2, 10).facing, "north"); is(g, 10, 4, 10, V.DARK_OAK_TRAPDOOR);
  }],
  ["archWindow west", (g) => V.archWindow(g, 13, 2, 2, "west"), (g) => {
    is(g, 2, 2, 13, V.GLASS_PANE); is(g, 2, 4, 14, V.QUARTZ_STAIRS); is(g, 1, 1, 13, V.SMOOTH_QUARTZ_SLAB);
  }],
  ["windowRect", (g) => V.windowRect(g, [[2, 13], [2, 14]], [2, 3], "west"), (g) => {
    is(g, 2, 2, 13, V.GLASS_PANE); is(g, 2, 3, 14, V.GLASS_PANE); is(g, 1, 1, 13, V.SMOOTH_QUARTZ_SLAB);
    is(g, 1, 2, 12, V.DARK_OAK_TRAPDOOR); is(g, 1, 3, 15, V.DARK_OAK_TRAPDOOR);
  }],
  ["shutter", (g) => V.shutter(g, 7, 2, 10, "north"), (g) => {
    is(g, 7, 2, 10, V.DARK_OAK_TRAPDOOR); assert.equal(st(g, 7, 2, 10).open, "true"); assert.equal(st(g, 7, 2, 10).facing, "north");
  }],
  ["column", (g) => V.column(g, 11, 5), (g) => {
    is(g, 11, 2, 5, V.QUARTZ_BLOCK); is(g, 11, 5, 5, V.QUARTZ_PILLAR); assert.equal(st(g, 11, 5, 5).axis, "y"); is(g, 11, 8, 5, V.CHISELED_QUARTZ_BLOCK);
  }],
  ["entablature", (g) => V.entablature(g), (g) => {
    is(g, 11, 9, 5, V.SMOOTH_QUARTZ); is(g, 22, 9, 8, V.SMOOTH_QUARTZ); is(g, 14, 9, 7, V.SMOOTH_QUARTZ_SLAB); assert.equal(st(g, 14, 9, 7).type, "top");
  }],
  ["entryDoor", (g) => V.entryDoor(g), (g) => {
    is(g, 16, 2, 9, V.DARK_OAK_DOOR); assert.equal(st(g, 16, 3, 9).half, "upper"); assert.equal(st(g, 17, 2, 9).hinge, "right");
    is(g, 15, 2, 9, V.GLASS_PANE); is(g, 15, 4, 9, V.QUARTZ_STAIRS); assert.equal(st(g, 15, 4, 9).facing, "west");
    is(g, 14, 3, 9, V.QUARTZ_PILLAR);
  }],
  ["carriageDoor", (g) => V.carriageDoor(g, 30), (g) => {
    is(g, 30, 1, 13, V.SPRUCE_TRAPDOOR); assert.equal(st(g, 32, 2, 13).open, "true"); is(g, 32, 3, 13, V.GLASS_PANE); is(g, 30, 4, 13, V.SMOOTH_QUARTZ); isAir(g, 33, 1, 13);
  }],
  ["coachLight", (g) => V.coachLight(g, 29, 12), (g) => {
    is(g, 29, 4, 12, V.SMOOTH_QUARTZ_SLAB); is(g, 29, 3, 12, V.LANTERN); assert.equal(st(g, 29, 3, 12).hanging, "true");
  }],
  ["sweepStair", (g) => V.sweepStair(g), (g) => {
    is(g, 18, 2, 12, V.DARK_OAK_STAIRS); assert.equal(st(g, 18, 2, 12).facing, "south"); is(g, 20, 5, 15, V.DARK_OAK_STAIRS);
    is(g, 18, 2, 13, V.DARK_OAK_PLANKS); is(g, 19, 2, 14, V.DARK_OAK_PLANKS); is(g, 17, 2, 11, V.DARK_OAK_SLAB);
    is(g, 18, 6, 15, V.BIRCH_FENCE); is(g, 13, 6, 15, V.BIRCH_FENCE);
  }],
  ["door interior", (g) => V.door(g, 12, 2, 15, "west", "left"), (g) => {
    is(g, 12, 2, 15, V.BIRCH_DOOR); is(g, 12, 3, 15, V.BIRCH_DOOR); assert.equal(st(g, 12, 3, 15).half, "upper");
  }],
  ["door exterior", (g) => V.door(g, 29, 2, 22, "west", "right", "dark_oak"), (g) => {
    is(g, 29, 2, 22, V.DARK_OAK_DOOR); is(g, 29, 3, 22, V.DARK_OAK_DOOR);
  }],
  ["hangLamp", (g) => V.hangLamp(g, 16, 8, 12), (g) => {
    is(g, 16, 8, 12, V.IRON_CHAIN); is(g, 16, 7, 12, V.LANTERN); assert.equal(st(g, 16, 7, 12).hanging, "true");
  }],
  ["shrub", (g) => V.shrub(g, 6, 4), (g) => is(g, 6, 1, 4, V.AZALEA_LEAVES)],
  ["bed", (g) => V.bed(g, 8, 10, 11, 10), (g) => {
    is(g, 8, 0, 10, V.PODZOL); is(g, 8, 1, 10, V.FLOWERING_AZALEA_LEAVES); is(g, 11, 1, 10, V.FLOWERING_AZALEA_LEAVES);
    is(g, 10, 1, 10, V.AZALEA_LEAVES); is(g, 9, 1, 10, V.WHITE_TULIP);
  }],
  ["bed two rows", (g) => V.bed(g, 23, 9, 28, 10), (g) => is(g, 24, 1, 9, V.RED_TULIP)],
  ["youngTree", (g) => V.youngTree(g, 6, 4), (g) => {
    is(g, 6, 1, 4, V.BIRCH_LOG); assert.equal(st(g, 6, 2, 4).axis, "y"); is(g, 5, 4, 4, V.BIRCH_LEAVES); is(g, 6, 6, 4, V.BIRCH_LEAVES);
    is(g, 5, 0, 3, V.PODZOL); isAir(g, 7, 6, 5);
  }],
  ["lampPost", (g) => V.lampPost(g, 14, 2), (g) => {
    is(g, 14, 1, 2, V.DARK_OAK_FENCE); is(g, 14, 2, 2, V.DARK_OAK_FENCE); is(g, 14, 3, 2, V.LANTERN); assert.equal(st(g, 14, 3, 2).hanging, "false");
  }],
  ["mailbox", (g) => V.mailbox(g, 27, 2), (g) => {
    is(g, 27, 1, 2, V.STONE_BRICK_WALL); is(g, 27, 2, 2, V.BARREL); assert.equal(st(g, 27, 2, 2).facing, "north");
  }],
  ["deckRail", (g) => V.deckRail(g, 6, 26, 24, 30, { gaps: [[6, 28], [6, 29]] }), (g) => {
    is(g, 24, 2, 28, V.SPRUCE_FENCE); is(g, 10, 2, 30, V.SPRUCE_FENCE); is(g, 6, 2, 27, V.SPRUCE_FENCE);
    isAir(g, 6, 2, 28); isAir(g, 6, 2, 29); isAir(g, 10, 2, 26); isAir(g, 10, 2, 28);
  }],
];

let failed = 0;
for (const [name, build, check] of cases) {
  const g = fresh();
  try {
    if (build) build(g);
    if (check) check(g);
    console.log(`ok   ${name}${build ? `  (${g.cells.size} cells)` : ""}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}: ${e.message}`);
  }
}
if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log(`all ${cases.length} vocab checks passed`);
