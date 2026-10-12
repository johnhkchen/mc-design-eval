// test-vocab.mjs: calls every vocab.mjs helper once on a fresh grid and checks the blocks and states it placed.
// Run: node test-vocab.mjs   (exit 1 on any failure)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as V from "./vocab.mjs";

const palette = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const allowed = new Set([...Object.values(palette.roles).flat(), ...palette.objects].map((id) => `minecraft:${id}`));

const fresh = () => new Grid(V.SIZE, { dataVersion: 5023 });
const at = (g, x, y, z) => g.get(x, y, z) ?? { block: "minecraft:air", state: {} };
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    const g = fresh();
    fn(g);
    // every placed block must come from palette.json
    for (const c of g.cells.values()) assert.ok(allowed.has(c.block), `${name}: off-palette ${c.block} at ${c.pos}`);
    passed++;
    console.log(`ok   ${name} (${g.cells.size} cells)`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}: ${e.message.split("\n")[0]}`);
  }
}
const expect = (g, [x, y, z], block, state) => {
  const c = at(g, x, y, z);
  assert.equal(c.block, `minecraft:${block}`, `block at ${x},${y},${z}`);
  if (state) for (const [k, v] of Object.entries(state)) assert.equal(c.state?.[k], v, `${k} at ${x},${y},${z}`);
};

test("palette constants are palette ids", () => {
  for (const [k, v] of Object.entries(V)) if (typeof v === "string") assert.ok(allowed.has(`minecraft:${v}`), `${k}=${v}`);
});

test("wallSiding", (g) => { V.wallSiding(g, [0, 1, 0, 3, 2, 3]); expect(g, [0, 1, 0], "birch_planks"); expect(g, [3, 2, 3], "birch_planks"); });
test("wallStone", (g) => { V.wallStone(g, [5, 1, 5, 12, 3, 5]); expect(g, [5, 1, 5], "stone_bricks"); assert.ok([...g.cells.values()].some((c) => c.block === "minecraft:chiseled_stone_bricks")); });
test("stoneCap", (g) => { V.stoneCap(g, 5, 12, 5); expect(g, [7, 4, 5], "stone_brick_slab", { type: "top" }); });
test("quoin", (g) => { V.quoin(g, 0, 5); expect(g, [0, 2, 5], "smooth_quartz"); expect(g, [0, 3, 5], "birch_planks"); });
test("archWindow", (g) => {
  V.archWindow(g, "south", 22, 3, 7);
  expect(g, [22, 3, 7], "glass_pane");
  expect(g, [21, 5, 7], "smooth_quartz_stairs", { facing: "west", half: "top" });
  expect(g, [23, 5, 7], "smooth_quartz_stairs", { facing: "east", half: "top" });
  expect(g, [22, 5, 7], "glass_pane");
});
test("shutters", (g) => { V.shutters(g, "south", 22, 3, 7); expect(g, [20, 3, 8], "iron_trapdoor", { facing: "south", open: "true" }); });
test("carriageDoor", (g) => {
  V.carriageDoor(g, 2, 5);
  expect(g, [3, 2, 5], "spruce_planks");
  expect(g, [2, 1, 4], "spruce_trapdoor", { facing: "north", open: "false" });
  expect(g, [5, 4, 5], "glass_pane");
});
test("carriageLamp", (g) => { V.carriageLamp(g, 1, 4); expect(g, [1, 4, 4], "lantern", { hanging: "false" }); expect(g, [1, 2, 4], "spruce_fence"); });
test("column", (g) => { V.column(g, 26, 4); expect(g, [26, 5, 4], "quartz_pillar", { axis: "y" }); expect(g, [26, 1, 4], "smooth_quartz"); });
test("beam", (g) => { V.beam(g); expect(g, [30, 9, 4], "smooth_quartz"); });
test("doorDouble", (g) => {
  V.doorDouble(g);
  expect(g, [30, 2, 7], "dark_oak_door", { half: "lower", hinge: "left", facing: "north" });
  expect(g, [31, 3, 7], "dark_oak_door", { half: "upper", hinge: "right" });
});
test("fanlight", (g) => { V.fanlight(g); expect(g, [30, 4, 7], "white_stained_glass_pane"); expect(g, [29, 5, 7], "smooth_quartz_stairs", { facing: "west" }); });
test("pediment", (g) => { V.pediment(g); expect(g, [30, 13, 4], "white_concrete"); expect(g, [27, 10, 4], "white_concrete"); });
test("pedimentWindow", (g) => { V.pedimentWindow(g); expect(g, [31, 11, 4], "glass_pane"); });
test("roofGable", (g) => {
  V.roofGable(g);
  expect(g, [26, 10, 6], "deepslate_tile_stairs", { facing: "east" });
  expect(g, [35, 10, 6], "deepslate_tile_stairs", { facing: "west" });
  expect(g, [30, 14, 6], "deepslate_tiles");
});
test("roofHip", (g) => {
  V.roofHip(g, 0, 5, 18, 22);
  expect(g, [9, 11, 5], "deepslate_tile_stairs", { facing: "south" });
  expect(g, [0, 11, 10], "deepslate_tile_stairs", { facing: "east" });
  expect(g, [9, 13, 10], "deepslate_tiles");
  assert.equal(at(g, 18, 11, 10).block, "minecraft:deepslate_tile_stairs");
  assert.equal(at(g, 0, 13, 5).block, "minecraft:air", "deck stays inset 2");
});
test("roofCone", (g) => { V.roofCone(g); expect(g, [39, 14, 5], "lightning_rod", { facing: "up" }); expect(g, [37, 10, 4], "deepslate_tile_stairs", { facing: "east" }); });
test("dormer", (g) => {
  V.dormer(g, 21, 7);
  expect(g, [22, 11, 7], "glass_pane");
  expect(g, [21, 11, 9], "birch_planks");
  expect(g, [21, 13, 7], "deepslate_tile_stairs", { facing: "east" });
});
test("bay", (g) => {
  V.bay(g);
  expect(g, [38, 4, 4], "glass");
  expect(g, [37, 4, 4], "smooth_quartz");
  expect(g, [38, 2, 7], "air");
  expect(g, [38, 6, 5], "oak_planks");
});
test("chimney", (g) => { V.chimney(g); expect(g, [41, 5, 25], "stone_bricks"); expect(g, [40, 14, 25], "stone_brick_wall"); expect(g, [41, 14, 24], "stone_brick_slab"); });
test("shrub", (g) => { V.shrub(g, 20, 6); expect(g, [20, 1, 6], "oak_leaves"); expect(g, [20, 2, 6], "flowering_azalea_leaves"); });
test("youngTree", (g) => { V.youngTree(g); expect(g, [8, 1, 2], "oak_log", { axis: "y" }); expect(g, [9, 1, 2], "oak_fence"); expect(g, [8, 7, 2], "oak_leaves"); });
test("deck", (g) => {
  V.deck(g);
  expect(g, [35, 1, 30], "spruce_planks");
  expect(g, [42, 2, 31], "spruce_fence");
  expect(g, [29, 1, 30], "spruce_stairs", { facing: "east" });
});
test("lamp", (g) => { V.lamp(g, 29, 0); expect(g, [29, 4, 0], "lantern"); });
test("driveway", (g) => {
  V.driveway(g);
  expect(g, [5, 0, 1], "gray_concrete");
  expect(g, [5, 0, 2], "polished_andesite_slab", { type: "bottom" });
  expect(g, [17, 0, 0], "gray_concrete");
});
test("mainStair", (g) => {
  V.mainStair(g);
  expect(g, [27, 2, 8], "spruce_stairs", { facing: "south", half: "bottom" });
  expect(g, [28, 6, 12], "spruce_stairs", { facing: "south" });
  expect(g, [27, 6, 13], "oak_planks");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
