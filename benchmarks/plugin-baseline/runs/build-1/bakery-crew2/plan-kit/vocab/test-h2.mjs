// Smoke test for h2.mjs: calls each helper once on a small grid and checks that it wrote only inside its footprint
// (and inside its room, for furniture), never over an existing block, and that every state is one `mcd states` lists.
// Run: node test-h2.mjs
import * as H from "./h2.mjs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { execFileSync } from "node:child_process";

const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const failures = [];
const fail = (msg) => { failures.push(msg); console.log(`  FAIL ${msg}`); };
const inBox = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const keyOf = (c) => `${c.pos.join(",")}=${c.block}${JSON.stringify(c.state ?? {})}`;
const posOf = (k) => k.split("=")[0];

const g = new Grid([24, 28, 32]);
g.fill([0, 0, 0], [23, 0, 31], "grass_block");          // the ground: helpers must leave it alone
g.set(6, 9, 8, "stone");                                 // an existing block inside postRun's footprint

// [name, call, footprint box, room box (furniture only)]
const cases = [
  ["postRun", () => H.postRun(g, 6, 7, 10, 8), [6, 7, 8, 6, 10, 8]],
  ["masonryWall", () => H.masonryWall(g, "x", 9, 6, 16, 1, 5, { piers: [6, 16], openings: [[10, 12, 2, 4], [7, 9, 2, 4], [13, 15, 2, 4]] }), [6, 1, 9, 16, 5, 9]],
  ["shopWindow", () => H.shopWindow(g, 7, 9, 2, 9), [7, 2, 8, 9, 4, 9]],
  ["frontStep", () => H.frontStep(g, 11, 1, 8, "south"), [10, 1, 8, 12, 1, 8]],
  ["hoistAssembly", () => H.hoistAssembly(g, 11, 19, 8), [10, 15, 5, 12, 19, 8]],
  ["chimneyStack", () => H.chimneyStack(g, 19, 24, 4, 17, 12), [19, 4, 24, 20, 17, 25]],
  ["shopCounter", () => H.shopCounter(g, 7, 14, 2, 14), [7, 2, 14, 14, 3, 14], [7, 2, 10, 15, 5, 15]],
  ["workTable", () => H.workTable(g, 7, 2, 18, 4), [7, 2, 18, 10, 3, 18], [7, 2, 17, 15, 5, 21]],
  ["bedFrame", () => H.bedFrame(g, 12, 7, 16, "north"), [12, 7, 16, 12, 7, 18], [9, 7, 15, 15, 10, 21]],
];

// the default wheatPatch must not touch the grass; the ground option replaces it
const grassBefore = g.blockAt(2, 0, 21);
const plain = H.wheatPatch(g, 1, 6, 20, 25);
if (plain.length) fail(`wheatPatch wrote ${plain.length} cells over the grass with no ground option`);
if (g.blockAt(2, 0, 21) !== grassBefore) fail("wheatPatch changed the grass");
cases.push(["wheatPatch", () => H.wheatPatch(g, 1, 6, 20, 25, { ground: true }), [1, 0, 20, 6, 1, 25]]);

for (const [name, call, box, room] of cases) {
  const before = new Set(g.solids().map(keyOf));
  const cells = call();
  const changed = g.solids().map(keyOf).filter((k) => !before.has(k)).map(posOf);
  if (!cells.length) fail(`${name} wrote nothing`);
  if (cells.length !== changed.length) fail(`${name} returned ${cells.length} cells but ${changed.length} changed`);
  for (const c of changed) if (!inBox(c.split(",").map(Number), box)) fail(`${name} changed ${c} outside its footprint ${box}`);
  for (const c of cells) if (!inBox(c, box)) fail(`${name} wrote ${c} outside its footprint ${box}`);
  if (room && !(inBox(box.slice(0, 3), room) && inBox(box.slice(3), room))) fail(`${name} footprint ${box} is outside its room ${room}`);
  console.log(`${name}: ${cells.length} cells`);
}

// the existing stone survived postRun; postRun wrote its other three cells
if (g.blockAt(6, 9, 8) !== "minecraft:stone") fail("postRun replaced an existing block");
if (H.postRun(g, 6, 7, 10, 8).length !== 0) fail("postRun wrote again into its own cells");

// every placed state must be one `mcd states` lists (waterlogged and friends are not listed; skipped)
const UNLISTED = new Set(["waterlogged", "powered", "persistent", "distance"]);
const listed = new Map();
const validStates = (block) => {
  if (!listed.has(block)) listed.set(block, JSON.parse(execFileSync(process.execPath, [MCD, "states", block], { encoding: "utf8" })).properties);
  return listed.get(block);
};
for (const c of g.solids()) {
  const name = c.block.replace("minecraft:", ""), props = validStates(name);
  for (const [k, v] of Object.entries(c.state ?? {})) {
    if (UNLISTED.has(k)) continue;
    if (!(k in props)) fail(`${name} at ${c.pos}: state ${k} is not one mcd lists`);
    else if (!props[k].includes(v)) fail(`${name} at ${c.pos}: ${k}=${v} is not one of ${props[k]}`);
  }
}

if (failures.length) { console.log(`${failures.length} failure(s)`); process.exit(1); }
console.log("all helpers pass");
