// Calls every h1 helper once on a small grid: each placed cell must lie in the footprint it was given, and a helper
// must not overwrite a block already there (run: node vocab/test-h1.mjs).
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const SIZE = [60, 40, 60];
const STONE = "minecraft:stone";
const fill = (g, b, block) => { for (let x = b.x0; x <= b.x1; x++) for (let y = b.y0; y <= b.y1; y++) for (let z = b.z0; z <= b.z1; z++) g.set(x, y, z, block); };
const snap = (g) => new Map([...g].map((c) => [c.pos.join(), JSON.stringify([c.block, c.state ?? null])]));
const changed = (before, g) => [...g].filter((c) => before.get(c.pos.join()) !== JSON.stringify([c.block, c.state ?? null])).map((c) => c.pos);
const within = (p, b) => p[0] >= b.x0 && p[0] <= b.x1 && p[1] >= b.y0 && p[1] <= b.y1 && p[2] >= b.z0 && p[2] <= b.z1;

// [name, footprint, call(g), setup(g) that gives it a wall or ground to attach to]
const cases = [
  ["tierMass", { x0: 2, x1: 12, y0: 0, y1: 8, z0: 4, z1: 20 }, (g) => h1.tierMass(g, { x0: 2, x1: 12, z0: 4, z1: 20, deck: 8 })],
  ["timberPost", { x0: 30, x1: 30, y0: 2, y1: 8, z0: 5, z1: 5 }, (g) => h1.timberPost(g, { x: 30, z: 5, y0: 2, y1: 8 })],
  ["balconyBay", { x0: 40, x1: 43, y0: 6, y1: 9, z0: 10, z1: 16 }, (g) => h1.balconyBay(g, { z0: 10, F: 6, x: 42 })],
  ["awningStall", { x0: 20, x1: 27, y0: 5, y1: 10, z0: 30, z1: 40 }, (g) => h1.awningStall(g, { x0: 20, x1: 26, z0: 30, z1: 40, floor: 4 })],
  ["planterBed", { x0: 10, x1: 17, y0: 3, y1: 8, z0: 30, z1: 37 }, (g) => h1.planterBed(g, { x0: 10, x1: 17, z0: 30, z1: 37, y: 3, tree: true })],
  ["bronzePig", { x0: 40, x1: 44, y0: 3, y1: 6, z0: 30, z1: 31 }, (g) => h1.bronzePig(g, { x: 40, z: 30, y: 3 })],
  ["terraceMass", { x0: 46, x1: 56, y0: 0, y1: 7, z0: 5, z1: 20 }, (g) => h1.terraceMass(g, { box: { x0: 46, x1: 56, z0: 5, z1: 20 }, deck: 6 })],
  // the board stands one out from the west wall at x = 30; the wall is the test's stand-in for the shell
  // the board goes on a wall; the first pass replaces that wall (replace: true), the solid pass must not (default air only)
  ["plaque", { x0: 28, x1: 31, y0: 12, y1: 16, z0: 46, z1: 54 }, (g, solid) => h1.plaque(g, "HILLCLIMB", { face: "west", at: [30, 12, 46], width: 9, height: 5, replace: !solid }),
    (g) => fill(g, { x0: 30, x1: 30, y0: 12, y1: 16, z0: 46, z1: 54 }, STONE)],
];

let failed = 0;
for (const [name, box, call, setup] of cases) {
  try {
    // 1. on an empty grid (plus any wall the helper needs): writes happen, and only inside the footprint
    const g = new Grid(SIZE);
    if (setup) setup(g);
    const before = snap(g);
    const r = call(g);
    const moved = changed(before, g);
    assert.ok(moved.length > 0, "placed nothing");
    const stray = moved.filter((p) => !within(p, box));
    assert.equal(stray.length, 0, `wrote outside its footprint: ${stray.slice(0, 3).map((p) => p.join(",")).join(" ")}`);
    // 2. over a solid grid of the same footprint: nothing is overwritten
    const solid = new Grid(SIZE);
    fill(solid, box, STONE);
    const solidBefore = snap(solid);
    call(solid, true);
    assert.equal(changed(solidBefore, solid).length, 0, "overwrote a block that was already there");
    console.log(`ok   ${name.padEnd(12)} ${moved.length} cells, placed ${r.placed}, skipped ${r.skipped}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name.padEnd(12)} ${e.message}`);
  }
}
if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("all h1 helpers passed");
