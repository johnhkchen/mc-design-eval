// Calls every h4 helper once on a small grid and checks each placed block lies inside the footprint it was given.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { fachwerkWall, gableFrame, shutterPair, signArm, roofWing, yardFence, propCluster, flourStore, tileStove, atticLadder } from "./h4.mjs";

const newCells = (g, before) => [...g.cells.values()].filter((c) => !before.has(c.pos.join())).map((c) => c.pos);
const inBox = (p, [a, b]) => p.every((v, i) => v >= Math.min(a[i], b[i]) && v <= Math.max(a[i], b[i]));

// [name, footprint box [min, max], grid setup, call]
const cases = [
  ["fachwerkWall front", [[6, 6, 8], [16, 10, 8]], null,
    (g) => fachwerkWall(g, "x", 8, 6, 16, 6, 10, [6, 8, 11, 14, 16], [[9, 10, 8, 9], [12, 13, 8, 9]], [0, 3])],
  ["fachwerkWall west", [[6, 6, 8], [6, 10, 22]], null,
    (g) => fachwerkWall(g, "z", 6, 8, 22, 6, 10, [8, 10, 13, 15, 18, 20, 22], [], [1])],
  ["gableFrame front", [[8, 11, 8], [14, 14, 8]], null,
    (g) => gableFrame(g, 8, { collar: [8, 14, 14], skip: ["11,15,8"] })],
  ["shutterPair", [[6, 3, 8], [16, 4, 8]], null,
    (g) => shutterPair(g, 6, 3, 4, 8, "south", { second: 16 })],
  ["signArm", [[16, 6, 6], [16, 7, 7]], null,
    (g) => signArm(g, 16, 7, 7)],
  ["roofWing", [[17, 4, 12], [22, 12, 23]],     // y=4..5: the default east fascia under the overhang
    (g) => { for (let x = 17; x <= 21; x++) for (let z = 13; z <= 22; z++) for (let y = 1; y <= 5; y++) g.set(x, y, z, "cobbled_deepslate"); },
    (g) => roofWing(g)],
  ["yardFence", [[1, 1, 10], [23, 1, 30]],
    (g) => g.set(1, 1, 15, "stone"),
    (g) => yardFence(g, [[1, 10, 1, 30], [1, 30, 23, 30], [23, 10, 23, 30]], { gates: [[1, 20, "east"], [23, 16, "east"]] })],
  ["propCluster", [[12, 1, 24], [15, 2, 26]], null,
    (g) => propCluster(g, 12, 24)],
  ["flourStore", [[10, 12, 15], [10, 14, 15]], null,
    (g) => flourStore(g, 10, 12, 15)],
  ["tileStove", [[8, 2, 16], [9, 4, 17]], null,
    (g) => tileStove(g, 8, 2, 16, "south")],
  ["atticLadder", [[9, 7, 20], [9, 11, 21]], null,
    (g) => atticLadder(g, 9, 7, 11, 20)],
];

for (const [name, box, setup, call] of cases) {
  const g = new Grid([30, 14, 32]);
  if (setup) setup(g);
  const before = new Set([...g.cells.values()].map((c) => c.pos.join()));
  const wrote = call(g);
  const placed = newCells(g, before);
  assert.ok(placed.length > 0, `${name}: placed nothing`);
  for (const p of placed) assert.ok(inBox(p, box), `${name}: wrote ${p} outside its footprint ${box}`);
  assert.equal(wrote.length, placed.length, `${name}: returned ${wrote.length} cells, placed ${placed.length}`);
  console.log(`ok ${name}: ${placed.length} cells inside footprint`);
}

// Air only: an existing block is never overwritten, and the helper does not report it as placed.
{
  const g = new Grid([30, 14, 32]);
  g.set(1, 1, 15, "stone");
  const wrote = yardFence(g, [[1, 10, 1, 30]]);
  assert.equal(g.blockAt(1, 1, 15), "minecraft:stone");
  assert.ok(!wrote.some((p) => p.join() === "1,1,15"));
  console.log("ok air only: existing stone kept");
}
