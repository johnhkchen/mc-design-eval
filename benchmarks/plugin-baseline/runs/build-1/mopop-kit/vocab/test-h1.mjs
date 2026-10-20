// Calls every h1 helper once on a fresh 40x24x40 grid with a ground layer at y 0, then checks that each helper
// changed only cells inside the footprint it reported, never touched the ground, and placed what it said it placed.
// Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const inBox = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
const snapshot = (g) => new Map([...g.cells.values()].map((c) => [c.pos.join(","), `${c.block}${JSON.stringify(c.state ?? {})}`]));

function run(name, setup, call) {
  const g = new Grid([40, 24, 40], { dataVersion: 3955 });
  g.fill([0, 0, 0], [39, 0, 39], "smooth_stone");
  setup?.(g);
  const before = snapshot(g);
  const out = call(g);
  const after = snapshot(g);
  const changed = [...after.keys()].filter((k) => after.get(k) !== before.get(k)).map((k) => k.split(",").map(Number));
  for (const p of changed) assert.ok(inBox(out.box, p), `${name}: wrote ${p} outside its footprint ${out.box}`);
  for (let x = 0; x < 40; x++) for (let z = 0; z < 40; z++) assert.equal(g.blockAt(x, 0, z), "minecraft:smooth_stone", `${name}: touched ground at ${x},${z}`);
  assert.equal(changed.length, out.placed + (out.cut ?? 0), `${name}: ${changed.length} cells changed, report says ${out.placed + (out.cut ?? 0)}`);
  assert.ok(out.placed > 0, `${name}: placed nothing`);
  console.log(`ok ${name}: ${out.placed} placed, ${out.skipped} skipped, footprint ${out.box}`);
  return { g, out };
}

const shellArgs = { name: "test", center: [10, 10], rx: 6, rz: 6, y0: 1, top: 10, profile: [[1, 1], [6, 1.1], [10, 1]],
  body: "iron_block", stairs: "polished_diorite_stairs", slab: "polished_diorite_slab", keepOut: [] };
run("billowShell", null, (g) => h1.billowShell(g, shellArgs));

let shell;
run("streaks", (g) => { shell = h1.billowShell(g, shellArgs); },
  (g) => h1.streaks(g, shell, { block: "magenta_concrete", every: 7 }));

run("fin", null, (g) => h1.fin(g, { x0: 20, x1: 27, z0: 16, z1: 21, y0: 1, yTop: 20 }));

run("beamRun", null, (g) => h1.beamRun(g, { x0: 4, x1: 9, z0: 0, z1: 30, y: 9, h: 2 }));

run("monorailTrain", null, (g) => h1.monorailTrain(g, { x0: 16, y0: 9, z0: 5, z1: 22 }));

const door = run("doorPair", (g) => { g.set(10, 1, 20, "glass_pane"); g.set(10, 2, 20, "glass_pane"); },
  (g) => h1.doorPair(g, { x: 10, z: 20, y0: 1, facing: "north", over: ["glass_pane"] }));
let halves = 0;
for (const c of door.g) if (c.block === "minecraft:birch_door") halves++;
assert.equal(halves, 2, "doorPair must write both door halves");

run("connector", (g) => g.fill([29, 1, 20], [32, 4, 20], "stone"),
  (g) => h1.connector(g, { box: [30, 1, 20, 31, 3, 20] }));

run("tiers", null, (g) => h1.tiers(g, { x0: 4, x1: 16, z0: 4, z1: 13, y0: 1 }));

run("birchTree", null, (g) => h1.birchTree(g, { x: 25, z: 30, y: 1 }));

console.log("h1: all helpers passed");
