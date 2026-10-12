// Calls every vocab.mjs helper once on a small grid and checks that each placed blocks, that every block placed is in
// palette.json, and that the plan's openings and states came out right. Run: node test-vocab.mjs (exit 1 on failure).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as V from "./vocab.mjs";

const palette = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const allowed = new Set([...Object.values(palette.roles).flat(), ...palette.objects]);
const bare = (id) => id.replace("minecraft:", "");

let failures = 0;
const check = (name, fn) => {
  try { fn(); console.log(`ok   ${name}`); }
  catch (e) { failures++; console.log(`FAIL ${name}: ${e.message.split("\n")[0]}`); }
};

// ---- every helper, once, on a fresh grid each -------------------------------------------------------------------
const calls = {
  siding: (g) => V.siding(g, 3, 4, 7),
  rusticated: (g) => V.rusticated(g, [1, 0, 4], [8, 3, 6]),
  fishscale: (g) => V.fishscale(g, 1, 8, 13, 4),
  spandrel: (g) => V.spandrel(g, 3, 6, 9, 4),
  window: (g) => { V.window(g, 4, 5, 5, 7, 4); V.window(g, 2, 2, 5, 7, 5); V.window(g, 4, 5, 5, 7, 30, "south"); V.window(g, 11, 12, 10, 12, 7, "north", { hood: "slab" }); },
  sill: (g) => V.sill(g, 4, 5, 4, 4),
  hoodPair: (g) => V.hoodPair(g, 4, 5, 8, 3),
  hoodSingle: (g) => V.hoodSingle(g, 2, 8, 4),
  cornerBoard: (g) => V.cornerBoard(g, 3, 4, 4, 16),
  bracket: (g) => V.bracket(g, 1, 6),
  dentils: (g) => V.dentils(g, 1, 14, 6, 16, [1, 14]),
  cornice: (g) => V.cornice(g, [{ x: 0, z: 6 }, { x: 3, z: 3, facing: "east" }, { x: 0, z: 6, corner: true }]),
  parapet: (g) => V.parapet(g),
  pediment: (g) => V.pediment(g),
  finial: (g) => V.finial(g, 0),
  column: (g) => V.column(g, 10),
  porchWainscot: (g) => V.porchWainscot(g),
  entryDoor: (g) => V.entryDoor(g),
  garageDoor: (g) => V.garageDoor(g),
  stoop: (g) => V.stoop(g),
  bayWall: (g) => V.bayWall(g, 4, 16),
  ironFence: (g) => V.ironFence(g, 0, 2),
  flowerBed: (g) => V.flowerBed(g, 0, 2, 2, 3),
  deck: (g) => V.deck(g),
  tree: (g) => V.tree(g),
  chimney: (g) => V.chimney(g),
  skylight: (g) => V.skylight(g),
  gardenBed: (g) => V.gardenBed(g, 1, 4, 45, 47),
};

const helpers = Object.keys(V).filter((k) => typeof V[k] === "function");
check("every exported helper is tested", () => {
  assert.deepEqual(helpers.filter((k) => !(k in calls)), [], "untested helpers");
});

for (const [name, call] of Object.entries(calls)) {
  check(`${name} places blocks, all in palette`, () => {
    const g = new Grid([16, 24, 50]);
    call(g);
    assert.ok(g.cells.size > 0, "placed nothing");
    const off = [...g.cells.values()].map((c) => bare(c.block)).filter((b) => !allowed.has(b));
    assert.deepEqual([...new Set(off)], [], "blocks outside palette.json");
  });
}

// ---- named constants are palette ids -----------------------------------------------------------------------------
check("palette constants are palette ids", () => {
  const consts = [V.BODY, V.TRIM, V.PILLAR, V.PLUM, V.PLUM_PANEL, V.GOLD, V.GOLD_ALT, V.STONE, V.ANDESITE, V.CHISELED,
    V.BRICK, V.IRON, V.PANE, V.GLASS, V.CONCRETE, V.GRAVEL, V.DIRT, V.COARSE_DIRT, V.FARMLAND, V.GRASS, V.TIMBER_PLANKS,
    V.TIMBER, V.LOG, V.LEAVES, V.AZALEA, V.LANTERN, V.END_ROD, ...V.FLOWERS];
  // bases the helpers extend (smooth_quartz -> _stairs/_slab, crimson -> _planks/_stairs/...) are checked by their use
  const bases = new Set(["smooth_quartz", "crimson", "stone_brick", "brick", "spruce", "oak"]);
  const bad = consts.filter((c) => !allowed.has(c) && !bases.has(c));
  assert.deepEqual(bad, []);
});

// ---- the plan's openings and states --------------------------------------------------------------------------------
check("bay: siding on the wall, air in the window openings", () => {
  const g = new Grid([16, 24, 50]);
  V.bayWall(g, 4, 16);
  assert.equal(g.blockAt(3, 6, 4), "minecraft:cyan_terracotta");   // corner cell, siding before the board goes on
  assert.equal(g.blockAt(4, 6, 4), "minecraft:air");               // S1 face window
  assert.equal(g.blockAt(2, 6, 5), "minecraft:air");               // S1 diagonal window
  assert.equal(g.blockAt(2, 9, 5), "minecraft:cyan_terracotta");   // between S1 and S2: siding
});

check("stoop: stairs face south, stone fill beneath, iron rail above the cheek", () => {
  const g = new Grid([16, 24, 50]);
  V.stoop(g);
  assert.equal(g.get(11, 1, 2).block, "minecraft:stone_brick_stairs");
  assert.equal(g.get(11, 1, 2).state.facing, "south");
  assert.equal(g.get(11, 4, 5).state.half, "bottom");
  assert.equal(g.blockAt(12, 0, 2), "minecraft:stone_bricks");
  assert.equal(g.blockAt(10, 5, 5), "minecraft:iron_bars", "rail one above the z5 cheek top (y4)");
  assert.equal(g.blockAt(10, 1, 2), "minecraft:stone_bricks", "cheek at z2 is height 1");
  assert.equal(g.blockAt(10, 2, 2), "minecraft:iron_bars", "rail one above the z2 cheek top");
});

check("entry door: two-high doors, second hinged right, glass transom", () => {
  const g = new Grid([16, 24, 50]);
  V.entryDoor(g);
  assert.equal(g.get(11, 5, 10).state.half, "lower");
  assert.equal(g.get(11, 6, 10).state.half, "upper");
  assert.equal(g.get(12, 5, 10).state.hinge, "right");
  assert.equal(g.blockAt(11, 8, 10), "minecraft:glass_pane");
});

check("tree: trunk y3..7, canopy only within y7..10", () => {
  const g = new Grid([16, 24, 50]);
  V.tree(g);
  for (let y = 3; y <= 7; y++) assert.equal(g.blockAt(12, y, 41), "minecraft:oak_log");
  const leaves = [...g.cells.values()].filter((c) => c.block === "minecraft:oak_leaves");
  assert.ok(leaves.length > 0);
  assert.ok(leaves.every((c) => c.pos[1] >= 7 && c.pos[1] <= 10), "leaves outside y7..10");
  assert.ok(leaves.every((c) => c.state.persistent === "true"));
});

check("deck: posts at y3, planks at y4, rail gap at x6..8", () => {
  const g = new Grid([16, 24, 50]);
  V.deck(g);
  assert.equal(g.blockAt(1, 3, 31), "minecraft:spruce_fence");
  assert.equal(g.blockAt(7, 4, 33), "minecraft:spruce_planks");
  assert.equal(g.blockAt(7, 5, 35), "minecraft:air", "rail gap at x7 on z35");
  assert.equal(g.blockAt(5, 5, 35), "minecraft:spruce_fence");
});

check("garage door: plum planks in the opening, trapdoor panels proud at z3", () => {
  const g = new Grid([16, 24, 50]);
  V.garageDoor(g);
  for (let y = 1; y <= 3; y++) for (let x = 3; x <= 6; x++) assert.equal(g.blockAt(x, y, 4), "minecraft:crimson_planks");
  assert.equal(g.blockAt(3, 1, 3), "minecraft:crimson_trapdoor");
});

// ---- report --------------------------------------------------------------------------------------------------------
if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log(`\nall ${helpers.length} helpers and checks passed`);
