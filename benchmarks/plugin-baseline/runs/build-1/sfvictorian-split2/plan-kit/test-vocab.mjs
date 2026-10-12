// Calls every vocab.mjs helper once on a lot-sized grid and checks that each one placed blocks, that every placed
// block is in palette.json, and that a few block states are the ones plan.md names. Run: node test-vocab.mjs
import { readFileSync } from "node:fs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as V from "./vocab.mjs";

const palette = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const allowed = new Set([...Object.values(palette.roles).flat(), ...palette.objects].map((id) => `minecraft:${id}`));

// chimneys rise to y22, so the grid is the lot (x0..15, z0..49) plus the chimney headroom
const g = new Grid([16, 24, 50], { dataVersion: 5023 });
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? `  (${detail})` : ""}`);
};
const solids = () => g.solids().length;
const at = (x, y, z) => g.get(x, y, z) ?? { block: "minecraft:air" };

// [name, call, placesBlocks]: every helper once, in the order the parts use them
const runs = [
  ["frontWallZone", () => { const b = [0, 4, 8, 9].map(V.frontWallZone); if (b.join() !== ["dark_prismarine", "crimson_planks", "bamboo_mosaic", "warped_planks"].join()) throw new Error(b.join()); }, false],
  ["fishScaleBand", () => V.fishScaleBand(g, 8, [[1, 7], [2, 7]]), true],
  ["sashWindow", () => V.sashWindow(g, { x0: 8, x1: 8, y0: 5, y1: 7, z: 7 }), true],
  ["sill", () => V.sill(g, 8, 9, 5, 6), true],
  ["hood", () => V.hood(g, 9, 9, 15, 7, true), true],
  ["bracket", () => V.bracket(g, 7, 16, 6), true],
  ["corniceRun", () => V.corniceRun(g, 7, 14, 17, 6, 5), true],
  ["corbel", () => V.corbel(g, 2, 3, 6), true],
  ["column", () => V.column(g, 2, 5, 8, 5), true],
  ["archSpring", () => V.archSpring(g, 11, 12, 7, 7), true],
  ["parapet", () => V.parapet(g, 1, 14, 18, 7, [1, 5, 10, 14], [[1, 4], [11, 14]]), true],
  ["pediment", () => V.pediment(g), true],
  ["bayCourse", () => V.bayCourse(g, 8), true],
  ["garageDoor", () => V.garageDoor(g), true],
  ["doorPair", () => V.doorPair(g, 11, 5, 10, "north"), true],
  ["frontStair", () => V.frontStair(g), true],
  ["newel", () => V.newel(g, 9, 2), true],
  ["stairRun", () => V.stairRun(g, 12, 13, 23, 1, "north", 3, V.BIRCH_STAIRS), true],
  ["neighbour", () => V.neighbour(g, 0, 13, 14, V.YELLOW_TERRACOTTA), true],
  ["roofCall", () => V.roofCall(g), true],
  ["chimney", () => V.chimney(g, 1, 12), true],
  ["ironFence", () => V.ironFence(g), true],
  ["streetLamp", () => V.streetLamp(g), true],
  ["gardenBed", () => V.gardenBed(g), true],
  ["deck", () => V.deck(g), true],
  ["deckStair", () => V.deckStair(g), true],
  ["gardenTree", () => V.gardenTree(g), true],
  ["vegBed", () => V.vegBed(g), true],
  ["fireplace", () => V.fireplace(g, 12), true],
  ["clawfootTub", () => V.clawfootTub(g, 12, 5, 15, "z"), true],
  ["bed", () => V.bed(g, 3, 5, 9, "red", "south"), true],
  ["nightstand", () => V.nightstand(g, 2, 5, 9), true],
  ["wardrobe", () => V.wardrobe(g, 3, 5, 20, "north"), true],
  ["desk", () => V.desk(g, 3, 5, 24), true],
  ["sofa", () => V.sofa(g, 3, 5, 28, 3, "north"), true],
  ["table", () => V.table(g, 6, 5, 28), true],
  ["chair", () => V.chair(g, 6, 5, 26, "north"), true],
  ["rug", () => V.rug(g, 2, 4, 5, 16, 18, "red"), true],
  ["bookwall", () => V.bookwall(g, 2, 3, 5, 30, 2), true],
  ["lampPost", () => V.lampPost(g, 4, 5, 22), true],
  ["stove", () => V.stove(g, 2, 5, 31, "south"), true],
  ["counter", () => V.counter(g, 4, 5, 5, 31), true],
  ["windowSeat", () => V.windowSeat(g, 3, 4, 5, 30), true],
];

for (const [name, call, places] of runs) {
  const before = solids();
  try {
    call();
    if (places) check(`${name} placed blocks`, solids() > before, `+${solids() - before}`);
    else check(`${name} returned its block`, true);
  } catch (e) {
    check(`${name} ran`, false, e.message);
  }
}

// block states named in plan.md
const stateOf = (x, y, z) => at(x, y, z).state ?? {};
check("frontStair tread: smooth_quartz_stairs facing south, bottom", at(10, 1, 2).block === "minecraft:smooth_quartz_stairs" && stateOf(10, 1, 2).facing === "south" && stateOf(10, 1, 2).half === "bottom");
check("frontStair cheek cap: smooth_quartz_slab bottom at tread+2", at(9, 5, 5).block === "minecraft:smooth_quartz_slab" && stateOf(9, 5, 5).type === "bottom");
check("bracket: smooth_quartz_stairs half top facing south", at(7, 16, 6).block === "minecraft:smooth_quartz_stairs" && stateOf(7, 16, 6).half === "top" && stateOf(7, 16, 6).facing === "south");
check("sashWindow: 3-high window has a slab rail in its middle row", at(8, 6, 7).block === "minecraft:smooth_quartz_slab" && at(8, 5, 7).block === "minecraft:glass_pane");
check("sill: smooth_quartz_slab type top one row below the window", at(8, 4, 6).block === "minecraft:smooth_quartz_slab" && stateOf(8, 4, 6).type === "top");
check("garageDoor: crimson_trapdoor open facing north", at(2, 1, 7).block === "minecraft:crimson_trapdoor" && stateOf(2, 1, 7).open === "true" && stateOf(2, 1, 7).facing === "north");
check("doorPair: lower-left hinge left, lower-right hinge right", stateOf(11, 5, 10).hinge === "left" && stateOf(12, 5, 10).hinge === "right" && stateOf(11, 6, 10).half === "upper");
check("stairRun: step k=0 at (x,yStart,zStart) facing north", at(12, 1, 23).block === "minecraft:birch_stairs" && stateOf(12, 1, 23).facing === "north");
check("stairRun: fill under step k=1 is birch_planks at yStart", at(12, 1, 22).block === "minecraft:birch_planks");
check("newel lantern standing: hanging false", at(9, 3, 2).block === "minecraft:lantern" && stateOf(9, 3, 2).hanging === "false");
check("chimney: brick_slab bottom capping y22", at(1, 22, 12).block === "minecraft:brick_slab" && stateOf(1, 22, 12).type === "bottom");
check("deck rail: spruce_fence on the z37 run links east", at(2, 5, 37).block === "minecraft:spruce_fence" && stateOf(2, 5, 37).east === "true");
check("deck gap: no rail at (11,5,37)", at(11, 5, 37).block === "minecraft:air");
check("vegBed: water cell at (8,0,45)", at(8, 0, 45).block === "minecraft:water");
check("fireplace: netherrack firebox with fire above", at(1, 5, 12).block === "minecraft:netherrack" && at(1, 6, 12).block === "minecraft:fire");
check("bed: head one cell in facing", stateOf(3, 5, 10).part === "head" && stateOf(3, 5, 9).part === "foot");
check("wardrobe: closed trapdoor above barrel", at(3, 6, 20).block === "minecraft:dark_oak_trapdoor" && stateOf(3, 6, 20).open === "false" && at(3, 5, 20).block === "minecraft:barrel");

check("grid frame unchanged after roofCall (no shift or grow)", g.size.join() === "16,24,50", g.size.join(","));

// every block placed is in palette.json (the roof tool's own materials are palette roles too)
const offPalette = g.solids().map((c) => c.block).filter((b) => !allowed.has(b));
const unique = [...new Set(offPalette)];
check("every placed block is in palette.json", unique.length === 0, unique.join(", ") || "all in palette");

console.log(failed ? `\n${failed} check(s) failed` : "\nall vocab checks passed");
process.exitCode = failed ? 1 : 0;
