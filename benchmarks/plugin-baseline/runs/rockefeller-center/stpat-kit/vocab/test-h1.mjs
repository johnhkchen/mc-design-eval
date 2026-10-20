// Smoke test for vocab/h1.mjs: calls each helper once on its own footprint in a fresh 1.21.1 grid. Checks that every cell
// a helper wrote lies inside its footprint, that the one stone in the marble box is refused and kept, and that every block
// id and state is one `mcd` lists for 1.21.1. Run: node vocab/test-h1.mjs
import * as H from "./h1.mjs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { execFileSync } from "node:child_process";

const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const VERSION = "1.21.1";
const mcd = (...args) => JSON.parse(execFileSync(process.execPath, [MCD, ...args, "--version", VERSION], { encoding: "utf8" }));
const failures = [];
const fail = (msg) => { failures.push(msg); console.log(`  FAIL ${msg}`); };

const g = new Grid([48, 100, 48], { dataVersion: 3955 });
g.set(3, 1, 3, "stone");  // one non-air cell in the marble box: the helper must refuse it and keep it

const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// [name, footprint box, call, cells expected placed (null = any), cells expected refused]
const cases = [
  ["marble_wall", [2, 0, 2, 6, 3, 6], () => H.marble_wall(g, [2, 0, 2, 6, 3, 6], ["west"]), 99, 1],
  ["pointed_head", [10, 5, 11, 10, 6, 13], () => H.pointed_head(g, 12, 4, "west", 3, 10), 3, 0],
  ["louvre_opening", [30, 4, 20, 30, 10, 21], () => H.louvre_opening(g, 20, 4, 9, "east", 30), 8, 0],
  ["pierced_parapet", [2, 20, 30, 12, 21, 30], () => H.pierced_parapet(g, [2, 30, 12, 30], 20), 17, 0],
  ["lucarne", [19, 44, 39, 21, 48, 39], () => H.lucarne(g, 20, 44, "north", 40), 13, 0],
  ["tracery_window", [30, 10, 30, 38, 20, 30], () => H.tracery_window(g, [30, 10, 30, 38, 20, 30], "south"), null, 0],
  ["lean_to", [2, 20, 34, 8, 23, 38], () => H.lean_to(g, [2, 34, 8, 38], 20, 23, "east"), 35, 0],
  ["lamp_post", [40, 1, 40, 40, 4, 40], () => H.lamp_post(g, 40, 1, 40), 4, 0],
  ["house_window", [10, 1, 7, 11, 4, 9], () => H.house_window(g, 10, 2, 8, false, "north"), null, 0],
  ["house_window (pointed)", [14, 1, 7, 15, 4, 9], () => H.house_window(g, 14, 2, 8, true, "north"), null, 0],
];

for (const [name, box, call, expectPlaced, expectRefused] of cases) {
  const out = call();
  const outside = out.placed.filter((c) => !inside(box, c));
  if (outside.length) fail(`${name}: wrote outside its footprint at ${outside.slice(0, 3).map((c) => c.join(",")).join(" ")}`);
  if (out.placed.length === 0) fail(`${name}: placed nothing`);
  if (expectPlaced !== null && out.placed.length !== expectPlaced) fail(`${name}: placed ${out.placed.length}, expected ${expectPlaced}`);
  if (out.refused !== expectRefused) fail(`${name}: refused ${out.refused}, expected ${expectRefused}`);
  console.log(`  ${name}: ${out.placed.length} placed, ${out.refused} refused`);
}
if (g.blockAt(3, 1, 3) !== "minecraft:stone") fail("marble_wall overwrote the stone it should have refused");

// block ids and states, as mcd lists them for 1.21.1
const UNLISTED = new Set(["waterlogged", "powered", "persistent", "distance"]);
const solids = g.solids();
const ids = [...new Set(solids.map((c) => c.block.replace(/^minecraft:/, "")))];
for (const id of mcd("blocks", "--check", ids.join(",")).unknown) fail(`unknown block id ${id}`);
const props = new Map();
for (const c of solids) {
  const id = c.block.replace(/^minecraft:/, "");
  if (!props.has(id)) props.set(id, mcd("states", id).properties);
  const listed = props.get(id);
  for (const [k, v] of Object.entries(c.state ?? {})) {
    if (listed[k]) { if (!listed[k].includes(v)) fail(`${id} ${k}=${v} is not a 1.21.1 value (${listed[k].join(", ")})`); }
    else if (!UNLISTED.has(k)) fail(`${id} has an unknown property ${k}`);
  }
}

if (failures.length) { console.log(`${failures.length} failure(s)`); process.exit(1); }
console.log("h1: all helpers pass");
