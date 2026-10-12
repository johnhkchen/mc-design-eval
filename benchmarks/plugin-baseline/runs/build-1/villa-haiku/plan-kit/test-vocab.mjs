// Calls every vocab helper once on the site grid and checks what it placed. Run: node --test test-vocab.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as V from "./vocab.mjs";

const PALETTE = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const palette = new Set([...Object.values(PALETTE.roles).flat(), ...PALETTE.objects].map((id) => `minecraft:${id}`));
const at = (g, x, y, z) => g.blockAt(x, y, z);
const cell = (g, x, y, z) => g.get(x, y, z);
const ns = (id) => `minecraft:${id}`;

test("palette constants are palette.json ids", () => {
  const ids = Object.entries(V).filter(([k, v]) => /^[A-Z_]+$/.test(k) && typeof v === "string").map(([, v]) => v);
  assert.ok(ids.length >= 30, `only ${ids.length} palette constants`);
  for (const id of ids) assert.ok(palette.has(ns(id)), `${id} is not in palette.json`);
});

test("plaster: smooth_quartz to y5, red dado y2..3", () => {
  const g = V.siteGrid();
  V.plaster(g, [9, 9, 9, 20]);
  assert.equal(at(g, 9, 2, 10), ns("red_terracotta"));
  assert.equal(at(g, 9, 3, 10), ns("red_terracotta"));
  assert.equal(at(g, 9, 4, 10), ns("smooth_quartz"));
  assert.equal(at(g, 9, 5, 20), ns("smooth_quartz"));
  assert.equal(at(g, 9, 6, 10), "minecraft:air");
  V.plaster(g, [0, 0, 0, 0], 9);
  assert.equal(at(g, 0, 9, 0), ns("smooth_quartz"));
});

test("mosaicFloor: white field, black border one in from each wall", () => {
  const g = V.siteGrid();
  V.mosaicFloor(g, [10, 9, 25, 20]);
  assert.equal(at(g, 10, 1, 9), ns("black_terracotta"));
  assert.equal(at(g, 25, 1, 20), ns("black_terracotta"));
  assert.equal(at(g, 11, 1, 10), ns("white_terracotta"));
  assert.equal(at(g, 17, 1, 14), ns("white_terracotta"));
});

test("doorway: lower and upper door halves, quartz jambs, lintel", () => {
  const g = V.siteGrid();
  V.doorway(g, 9, 10, "z");
  assert.equal(at(g, 9, 2, 10), ns("dark_oak_door"));
  assert.equal(cell(g, 9, 2, 10).state.half, "lower");
  assert.equal(cell(g, 9, 3, 10).state.half, "upper");
  assert.equal(at(g, 9, 2, 9), ns("quartz_block"));
  assert.equal(at(g, 9, 3, 11), ns("quartz_block"));
  assert.equal(at(g, 9, 4, 10), ns("smooth_quartz"));
  V.doorway(g, 15, 26, "x");
  assert.equal(at(g, 14, 2, 26), ns("quartz_block"));
  assert.equal(at(g, 16, 2, 26), ns("quartz_block"));
});

test("doorwayFacing: two leaves at x17 and x18, jambs x16 and x19, lintel", () => {
  const g = V.siteGrid();
  V.doorwayFacing(g, 17, 1);
  assert.equal(at(g, 17, 2, 1), ns("dark_oak_door"));
  assert.equal(at(g, 18, 3, 1), ns("dark_oak_door"));
  assert.equal(cell(g, 17, 2, 1).state.facing, "south");
  assert.equal(at(g, 16, 2, 1), ns("quartz_block"));
  assert.equal(at(g, 19, 3, 1), ns("quartz_block"));
  assert.equal(at(g, 18, 5, 1), ns("smooth_quartz"));
});

test("opening: carves air over the box", () => {
  const g = V.siteGrid();
  V.plaster(g, [16, 8, 19, 8]);
  V.opening(g, [16, 2, 8, 19, 5, 8]);
  assert.equal(at(g, 17, 3, 8), "minecraft:air");
  assert.equal(at(g, 19, 5, 8), "minecraft:air");
});

test("shutter: open dark_oak_trapdoors over the given y range", () => {
  const g = V.siteGrid();
  V.shutter(g, 1, 2, 4, 0, "east");
  assert.equal(at(g, 1, 2, 0), ns("dark_oak_trapdoor"));
  assert.equal(at(g, 1, 4, 0), ns("dark_oak_trapdoor"));
  assert.equal(cell(g, 1, 3, 0).state.open, "true");
  assert.equal(cell(g, 1, 3, 0).state.facing, "east");
});

test("window: iron bars at y3 and y4", () => {
  const g = V.siteGrid();
  V.window(g, 0, 11);
  assert.equal(at(g, 0, 3, 11), ns("iron_bars"));
  assert.equal(at(g, 0, 4, 11), ns("iron_bars"));
  assert.equal(at(g, 0, 5, 11), "minecraft:air");
});

test("shopOpening: carved mouth, counter at z=1, shutters beside", () => {
  const g = V.siteGrid();
  V.shopOpening(g, 2, 5);
  assert.equal(at(g, 3, 3, 0), "minecraft:air");
  assert.equal(at(g, 3, 2, 1), ns("smooth_quartz"));
  assert.equal(at(g, 1, 2, 0), ns("dark_oak_trapdoor"));
  assert.equal(at(g, 6, 4, 0), ns("dark_oak_trapdoor"));
});

test("column: quartz pillar y2..4 with a slab capital at y5", () => {
  const g = V.siteGrid();
  V.column(g, 11, 29);
  assert.equal(at(g, 11, 2, 29), ns("quartz_pillar"));
  assert.equal(at(g, 11, 4, 29), ns("quartz_pillar"));
  assert.equal(at(g, 11, 5, 29), ns("quartz_slab"));
  assert.equal(cell(g, 11, 5, 29).state.type, "bottom");
});

test("lamp: pillar at base, lantern above (street lamp base 1)", () => {
  const g = V.siteGrid();
  V.lamp(g, 10, 9);
  assert.equal(at(g, 10, 2, 9), ns("quartz_pillar"));
  assert.equal(at(g, 10, 3, 9), ns("lantern"));
  assert.equal(cell(g, 10, 3, 9).state.hanging, "false");
  V.lamp(g, 13, -2, 1);
  assert.equal(at(g, 13, 1, -2), ns("quartz_pillar"));
  assert.equal(at(g, 13, 2, -2), ns("lantern"));
});

test("pot: potted plant at y2", () => {
  const g = V.siteGrid();
  V.pot(g, 9, 28, "fern");
  V.pot(g, 26, 28, "azalea");
  assert.equal(at(g, 9, 2, 28), ns("potted_fern"));
  assert.equal(at(g, 26, 2, 28), ns("potted_azalea_bush"));
  assert.throws(() => V.pot(g, 1, 1, "cactus"));
});

test("hedge: azalea_leaves at y2, persistent", () => {
  const g = V.siteGrid();
  V.hedge(g, [12, 30, 16, 30]);
  assert.equal(at(g, 12, 2, 30), ns("azalea_leaves"));
  assert.equal(at(g, 16, 2, 30), ns("azalea_leaves"));
  assert.equal(cell(g, 14, 2, 30).state.persistent, "true");
});

test("bed: grass y1, rose_bush corners (2 high), flowers on the rest", () => {
  const g = V.siteGrid();
  V.bed(g, [13, 31, 14, 36]);
  assert.equal(at(g, 13, 1, 31), ns("grass_block"));
  assert.equal(at(g, 13, 2, 31), ns("rose_bush"));
  assert.equal(cell(g, 13, 2, 31).state.half, "lower");
  assert.equal(at(g, 14, 3, 36), ns("rose_bush"));
  assert.equal(cell(g, 14, 3, 36).state.half, "upper");
  const flat = at(g, 13, 2, 32);
  assert.ok(flat === ns("cornflower") || flat === ns("poppy"));
});

test("couch: dark oak stairs facing the table, red carpet in front", () => {
  const g = V.siteGrid();
  V.couch(g, [13, 43, 13, 45], "east");
  assert.equal(at(g, 13, 2, 43), ns("dark_oak_stairs"));
  assert.equal(cell(g, 13, 2, 44).state.facing, "east");
  assert.equal(at(g, 14, 2, 44), ns("red_carpet"));
});

test("statue: plinth, copper figure, cap slab", () => {
  const g = V.siteGrid();
  V.statue(g, 13, 33);
  assert.equal(at(g, 13, 2, 33), ns("polished_andesite"));
  assert.equal(at(g, 13, 3, 33), ns("oxidized_copper"));
  assert.equal(at(g, 13, 4, 33), ns("oxidized_copper"));
  assert.equal(at(g, 13, 5, 33), ns("oxidized_cut_copper_slab"));
});

test("impluvium: rim slab at y1, water 4x4 inside", () => {
  const g = V.siteGrid();
  V.impluvium(g, V.IMPLUVIUM);
  assert.equal(at(g, 15, 1, 12), ns("smooth_quartz_slab"));
  assert.equal(at(g, 16, 1, 13), ns("water"));
  assert.equal(at(g, 19, 1, 16), ns("water"));
  assert.equal(at(g, 17, 1, 17), ns("smooth_quartz_slab"));
});

test("fountain: basin, centre column, jet at (17,4,33)", () => {
  const g = V.siteGrid();
  V.fountain(g, V.FOUNTAIN);
  assert.equal(at(g, 15, 1, 31), ns("smooth_quartz_slab"));
  assert.equal(at(g, 16, 1, 32), ns("water"));
  assert.equal(at(g, 17, 2, 33), ns("quartz_block"));
  assert.equal(at(g, 18, 3, 34), ns("quartz_block"));
  assert.equal(at(g, 17, 4, 33), ns("water"));
});

test("roofBand: shed band over a union, bricks in y6..9, nothing off-palette", () => {
  const g = V.siteGrid();
  const report = V.roofBand(g, [[0, 0, 35, 8], [9, 8, 26, 11]], "south");
  assert.ok(report && typeof report === "object");
  let roofCells = 0;
  for (const c of g.cells.values()) if (c.pos[1] >= 6) roofCells++;
  assert.ok(roofCells > 100, `roof placed ${roofCells} cells`);
});

test("pediment: quartz stairs at y6 x16..19 and y7 x17..18, facing the street", () => {
  const g = V.siteGrid();
  V.pediment(g, 16, 19, 0);
  assert.equal(at(g, 16, 6, 0), ns("quartz_stairs"));
  assert.equal(at(g, 19, 6, 0), ns("quartz_stairs"));
  assert.equal(at(g, 17, 7, 0), ns("quartz_stairs"));
  assert.equal(at(g, 16, 7, 0), "minecraft:air");
  assert.equal(cell(g, 17, 6, 0).state.facing, "north");
});

test("streetPaving: stone bricks at y0 on the street, slab edge at z=-1", () => {
  const g = V.siteGrid();
  V.streetPaving(g, V.STREET_PAVING);
  assert.equal(at(g, 12, 0, -4), ns("stone_bricks"));
  assert.equal(at(g, 23, 0, -2), ns("stone_bricks"));
  assert.equal(at(g, 17, 0, -1), ns("smooth_stone_slab"));
});

test("every helper output is palette-only (air aside)", () => {
  const g = V.siteGrid();
  V.plaster(g, [9, 9, 9, 20]); V.mosaicFloor(g, [10, 9, 25, 20]); V.doorwayFacing(g, 17, 1);
  V.shopOpening(g, 2, 5); V.column(g, 11, 29); V.lamp(g, 10, 9); V.pot(g, 9, 28);
  V.hedge(g, [12, 30, 16, 30]); V.bed(g, [13, 31, 14, 36]); V.couch(g, [13, 43, 13, 45], "east");
  V.statue(g, 13, 33); V.impluvium(g, V.IMPLUVIUM); V.fountain(g, V.FOUNTAIN);
  V.pediment(g, 16, 19, 0); V.streetPaving(g, V.STREET_PAVING); V.roofBand(g, [[0, 0, 35, 8]], "south");
  const off = new Set();
  for (const c of g.cells.values()) if (c.block !== "minecraft:air" && !palette.has(c.block)) off.add(c.block);
  assert.deepEqual([...off], []);
});
