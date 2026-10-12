// Smoke test for vocab.mjs: calls every helper once on a lot-sized grid and checks that it placed blocks, that every placed
// block is a palette.json id, and that every state is one `mcd states` lists. Run: node test-vocab.mjs
import * as V from "./vocab.mjs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const palette = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const allowed = new Set([...Object.values(palette.roles).flat(), ...palette.objects]);
const failures = [];
const fail = (msg) => { failures.push(msg); console.log(`  FAIL ${msg}`); };

// 1. constants: every exported palette constant is a palette.json id, and every palette id has a constant
const constValues = Object.entries(V).filter(([k, v]) => typeof v === "string" && k === k.toUpperCase()).map(([, v]) => v);
for (const v of constValues) if (!allowed.has(v)) fail(`constant ${v} is not in palette.json`);
for (const id of allowed) if (!constValues.includes(id)) fail(`palette id ${id} has no named constant`);
const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const unknown = JSON.parse(execFileSync(process.execPath, [MCD, "blocks", "--check", [...allowed].join(",")], { encoding: "utf8" })).unknown;
if (unknown.length) fail(`unknown block ids: ${unknown.join(", ")}`);
console.log(`palette: ${allowed.size} ids, ${constValues.length} constants, ${unknown.length} unknown`);

// `mcd states` lists the values its blockstate file names per block (cached). It omits some properties (powered,
// waterlogged, persistent, distance) and lists only "true" for fence connections, so those are not checked.
const statesCache = new Map();
const validStates = (block) => {
  if (!statesCache.has(block)) statesCache.set(block, JSON.parse(execFileSync(process.execPath, [MCD, "states", block], { encoding: "utf8" })).properties);
  return statesCache.get(block);
};
const UNLISTED = new Set(["waterlogged", "powered", "persistent", "distance"]);

// 2. a lot-sized grid, with a massing stub under the main roof: the upper storey as the plan has it (white daub with a
// spruce head plate at the eave, y=10), walls x 6..16, z 8..22
const g = new Grid([V.LOT.x1 + 1, V.LOT.height + 1, V.LOT.z1 + 1]);
for (let y = 1; y <= 5; y++) for (let x = 6; x <= 16; x++) for (let z = 9; z <= 22; z++) {
  if (x === 6 || x === 16 || z === 22) g.set(x, y, z, V.DEEPSLATE_BRICKS);
}
for (let y = 6; y <= 10; y++) for (let x = 6; x <= 16; x++) for (let z = 8; z <= 22; z++) {
  if (x === 6 || x === 16 || z === 8 || z === 22) g.set(x, y, z, y === 10 ? V.STRIPPED_SPRUCE_WOOD : V.WHITE_WOOL);
}
for (let x = 17; x <= 21; x++) for (let z = 13; z <= 22; z++) if (x === 17 || x === 21 || z === 13) for (let y = 1; y <= 5; y++) g.set(x, y, z, V.COBBLED_DEEPSLATE);
g.set(20, 8, 20, V.COBBLED_DEEPSLATE);  // a support two cells above a lantern, for the chain branch

// 3. every helper, once, in plan order; each must return cells that are placed
const calls = [
  ["beamRun", () => V.beamRun(g, "x", 6, 16, 8, 6)],
  ["postRun", () => V.postRun(g, 6, 7, 10, 8)],
  ["daubPanel", () => V.daubPanel(g, "x", 7, 7, 8, 9, 8, { brace: "left" })],
  ["fachwerkWall", () => V.fachwerkWall(g, "x", 8, 6, 16, 6, 10, [6, 8, 11, 14, 16], [[9, 10, 8, 9], [12, 13, 8, 9]], [0, 3])],
  ["mannBrace", () => V.mannBrace(g, 15, 8, 8, "w")],
  ["masonryWall", () => V.masonryWall(g, "x", 9, 6, 16, 1, 5, { plinth: true, openings: [[7, 9, 3, 4], [13, 15, 3, 4], [11, 11, 2, 3]] })],
  ["jettyBracket", () => V.jettyBracket(g, 11, 5, 8)],
  ["gableFrame", () => V.gableFrame(g, V.GABLE.front)],
  ["glazedWindow", () => V.glazedWindow(g, "x", 9, 10, 8, 9, 8)],
  ["shopWindow", () => V.shopWindow(g, 7, 9)],
  ["counterSlab", () => V.counterSlab(g, 13, 15, 8)],
  ["shutterPair", () => V.shutterPair(g, 6, 3, 4, 8, "south")],
  ["doorAt", () => V.doorAt(g, 11, 2, 9, "north")],
  ["frontStep", () => V.frontStep(g)],
  ["flowerBox", () => V.flowerBox(g, 9, 10, 7)],
  ["signArm", () => V.signArm(g)],
  ["hangingLantern (lantern under the sill beam)", () => V.hangingLantern(g, 9, 5, 8)],
  ["hangingLantern (chain to a support)", () => V.hangingLantern(g, 20, 9, 20)],
  ["hoistAssembly", () => V.hoistAssembly(g)],
  ["roofMain", () => V.roofMain(g)],
  ["roofWing", () => V.roofWing(g)],
  ["ovenVault", () => V.ovenVault(g)],
  ["chimneyStack", () => V.chimneyStack(g)],
  ["woodpile", () => V.woodpile(g, 7, 10, 24, 25)],
  ["yardFence", () => V.yardFence(g, V.YARD_RUNS)],
  ["benchRun", () => V.benchRun(g, 2, 4, 10)],
  ["wheatPatch", () => V.wheatPatch(g, 2, 5, 24, 28)],
  ["smallSpruce", () => V.smallSpruce(g, 2, 15, 8)],
  ["propCluster", () => V.propCluster(g, 12, 24)],
  ["scatterBlend", () => V.scatterBlend(g, 0, 23, 4, 7, V.COBBLESTONE, V.MOSSY_COBBLESTONE, 0.15)],
  ["shopCounter", () => V.shopCounter(g, 8, 14, 14)],
  ["breadRack", () => V.breadRack(g, 18, 2, 15, "z", 5)],
  ["flourStore", () => V.flourStore(g, 13, 2, 17)],
  ["kneadingTrough", () => V.kneadingTrough(g, 18, 2, 18, 3)],
  ["workTable", () => V.workTable(g, 8, 2, 19, 4)],
  ["peelWall", () => V.peelWall(g, 21 - 3, 2, 14, "south")],
  ["tileStove", () => V.tileStove(g, 8, 7, 11, "south")],
  ["tableSet", () => V.tableSet(g, 12, 2, 12)],
  ["bedFrame", () => V.bedFrame(g, 10, 7, 19, "north")],
  ["shelfWall", () => V.shelfWall(g, 12, 7, 20, "x", 3, 2)],
  ["atticLadder", () => V.atticLadder(g)],
  ["stairHousing", () => V.stairHousing(g)],
];
console.log(`helpers: ${calls.length} calls covering the 41 plan items (hangingLantern twice)`);

for (const [name, run] of calls) {
  let cells;
  try {
    cells = run();
  } catch (e) {
    fail(`${name} threw: ${e.message}`);
    continue;
  }
  if (!Array.isArray(cells) || cells.length === 0) { fail(`${name} placed nothing`); continue; }
  let bad = 0;
  for (const [x, y, z] of cells) {
    const cell = g.get(x, y, z);
    if (!cell || cell.block === "minecraft:air") { bad++; continue; }
    const id = cell.block.replace("minecraft:", "");
    if (!allowed.has(id)) { fail(`${name}: ${id} at ${x},${y},${z} is not a palette id`); bad++; continue; }
    const props = validStates(id);
    for (const [k, v] of Object.entries(cell.state ?? {})) {
      if (UNLISTED.has(k) || !props || !Object.keys(props).length) continue;
      const listed = props[k];
      const ok = listed && (listed.includes(v) || (v === "false" && listed.length === 1 && listed[0] === "true"));
      if (!ok) { fail(`${name}: ${id} at ${x},${y},${z} has state ${k}=${v}, not valid`); bad++; }
    }
  }
  if (bad) fail(`${name}: ${bad} of ${cells.length} returned cells are not placed blocks`);
  console.log(`  ${name}: ${cells.length} cells${bad ? ` (${bad} bad)` : ""}`);
}

console.log(failures.length ? `\n${failures.length} failure(s)` : "\nall helpers placed valid blocks");
process.exitCode = failures.length ? 1 : 0;
