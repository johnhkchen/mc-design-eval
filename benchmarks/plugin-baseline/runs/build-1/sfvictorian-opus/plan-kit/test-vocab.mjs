// Calls every vocab.mjs helper once on a lot-sized grid (plan.md coordinates) and checks it placed real blocks with the
// right states, and that every placed block is a palette.json id. Run: node test-vocab.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as V from "./vocab.mjs";

const palette = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const allowed = new Set([...Object.values(palette.roles).flat(), ...palette.objects].map((id) => `minecraft:${id}`));

const g = new Grid([16, 21, 50], { dataVersion: 5023 });
const run = (name, fn) => {
  const before = g.cells.size;
  fn();
  const n = g.cells.size - before;
  assert.ok(n > 0, `${name} placed nothing`);
  console.log(`ok ${name}: ${n} cells`);
};
const expect = (x, y, z, block, state = {}) => {
  assert.equal(g.blockAt(x, y, z), `minecraft:${block}`, `${x},${y},${z} block`);
  for (const [k, v] of Object.entries(state)) assert.equal(g.get(x, y, z)?.state?.[k], v, `${x},${y},${z} ${k}`);
};

// Openings on the front wall (z7) stay air so the window, door and porch helpers can place into them.
const frontOpen = [[2, 1, 7, 5, 3, 7], [8, 5, 7, 8, 7, 7], [8, 9, 7, 8, 11, 7], [8, 13, 7, 8, 15, 7], [10, 5, 7, 14, 7, 7]];

run("wallCell front", () => V.wallCell(g, 9, 8, 30, "back"));
run("wallCell party", () => { V.wallCell(g, 14, 4, 20, "party"); V.wallCell(g, 14, 2, 20, "party"); });
run("wallCell inner", () => V.wallCell(g, 3, 6, 25, "inner"));
run("wallLine", () => V.wallLine(g, 2, 7, 13, 7, 0, 16, "front", { open: frontOpen }));
run("slab", () => V.slab(g, 4, 2, 8, 13, 29, V.DARK_OAK_PLANKS, { holes: [[13, 4, 16], [13, 4, 17]] }));
run("tallWindow hood", () => V.tallWindow(g, 8, 5, 7, "north", { hood: true }));
run("tallWindow plain", () => V.tallWindow(g, 8, 9, 7, "north"));
run("tallWindow side", () => V.tallWindow(g, 20, 5, 3, "west", { hood: true }));
run("pairedWindow", () => V.pairedWindow(g, 5));
run("diagWindow", () => V.diagWindow(g, 1, 5));
run("bracket", () => V.bracket(g, 7, 16, 6));
run("crown", () => V.crown(g, 8, 17, 6));
run("corbel", () => V.corbel(g, 2, 5));
run("column", () => V.column(g, 10, 7));
run("entryDoor", () => V.entryDoor(g));
run("carriageDoor", () => V.carriageDoor(g));
run("door", () => V.door(g, 7, 1, 19, "south", "left"));
run("stairFlight", () => V.stairFlight(g, 13, 13, 5, 3, "south", V.DARK_OAK_STAIRS));
run("stairRail", () => V.stairRail(g, 10, 3, 6));
run("newelLamp", () => V.newelLamp(g, 10, 2));
run("ironFence", () => V.ironFence(g, [[[7, 2], [8, 2], [9, 2]], [[6, 3], [6, 4], [6, 5], [6, 6]]]));
run("gardenBed", () => V.gardenBed(g, V.FRONT_GARDEN, [
  [7, 3, V.ROSE_BUSH], [9, 3, V.PEONY], [8, 5, V.AZALEA], [7, 6, V.FLOWERING_AZALEA], [9, 5, V.FERN], [9, 6, V.LILAC],
]));
g.set(12, 8, 14, V.DARK_OAK_PLANKS); // ceiling for the hall lamp
run("hangLamp", () => V.hangLamp(g, 12, 7, 14));
run("lampPost", () => V.lampPost(g, V.LAMP_POST.x, V.LAMP_POST.z));
run("citrusTree", () => V.citrusTree(g, V.CITRUS_TREE.x, V.CITRUS_TREE.z));
run("vegBed", () => V.vegBed(g, V.VEG_BED, V.VEG_WATER, { skip: [[V.LAMP_POST.x, 1, V.LAMP_POST.z]] }));
run("deckRail", () => V.deckRail(g, [[2, 33], [2, 34]]));
run("deckTable", () => V.deckTable(g, 5, 33));
run("bench", () => V.bench(g, V.BENCH.x0, V.BENCH.x1, V.BENCH.z));

// Spot checks: block ids and the states the plan names.
expect(9, 8, 30, "bamboo_mosaic");
expect(14, 4, 20, "birch_planks");
expect(14, 2, 20, "cyan_terracotta");
expect(3, 6, 25, "birch_planks");
expect(8, 8, 7, "bamboo_mosaic");
expect(8, 5, 7, "glass_pane");
expect(8, 4, 6, "smooth_quartz_slab", { type: "top" });
expect(7, 8, 6, "smooth_quartz_stairs", { facing: "east", half: "bottom" });
expect(8, 8, 6, "chiseled_quartz_block");
expect(9, 8, 6, "smooth_quartz_stairs", { facing: "west", half: "bottom" });
expect(13, 4, 16, "air");
expect(5, 4, 10, "dark_oak_planks");
expect(2, 3, 5, "smooth_quartz_stairs", { facing: "south", half: "top" });
expect(10, 7, 7, "chiseled_quartz_block");
expect(12, 5, 10, "crimson_door", { facing: "north", half: "lower", hinge: "left" });
expect(12, 6, 10, "crimson_door", { half: "upper" });
expect(2, 1, 7, "crimson_door", { hinge: "left" });
expect(3, 1, 7, "crimson_door", { hinge: "right" });
expect(7, 2, 19, "birch_door", { half: "upper" });
expect(13, 7, 15, "dark_oak_stairs", { facing: "south", half: "bottom" });
expect(10, 2, 3, "cyan_terracotta");
expect(10, 3, 3, "birch_fence");
expect(10, 2, 2, "quartz_pillar", { axis: "y" });
expect(10, 3, 2, "lantern", { hanging: "false" });
expect(8, 1, 2, "iron_bars");
expect(7, 2, 2, "polished_blackstone_wall");
expect(7, 0, 3, "podzol");
expect(7, 1, 3, "rose_bush", { half: "lower" });
expect(7, 2, 3, "rose_bush", { half: "upper" });
expect(12, 7, 14, "iron_chain", { axis: "y" });
expect(12, 6, 14, "lantern", { hanging: "true" });
expect(9, 3, 46, "lantern", { hanging: "false" });
expect(4, 2, 44, "oak_log", { axis: "y" });
expect(5, 4, 45, "oak_leaves", { persistent: "true" });
expect(10, 0, 42, "farmland", { moisture: "7" });
expect(11, 0, 44, "water");
expect(10, 1, 42, "carrots", { age: "7" });
expect(10, 1, 44, "potatoes", { age: "7" });
expect(9, 1, 44, "spruce_trapdoor", { open: "false" });
expect(5, 5, 33, "spruce_fence");
expect(5, 6, 33, "spruce_pressure_plate");
expect(5, 5, 32, "spruce_stairs", { facing: "north" });
expect(5, 5, 34, "spruce_stairs", { facing: "south" });
expect(6, 1, 48, "spruce_stairs", { facing: "south" });
expect(5, 1, 48, "spruce_trapdoor", { open: "true" });

// Every placed block is a palette id.
const offPalette = [...g.cells.values()].map((c) => c.block).filter((b) => !allowed.has(b) && b !== "minecraft:air");
assert.deepEqual([...new Set(offPalette)], [], "blocks outside palette.json");
console.log(`all ${g.cells.size} cells placed; every block in palette.json`);
