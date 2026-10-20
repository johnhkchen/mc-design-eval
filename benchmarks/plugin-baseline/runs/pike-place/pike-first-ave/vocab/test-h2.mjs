// Calls every helper in h2.mjs once on a fresh 1.21.1 grid and checks each wrote blocks only inside the box it was given.
// Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const DATA_VERSION = 3955; // 1.21.1
const SIZE = [64, 48, 64];
const plot = { ground: Array.from({ length: 16 }, () => Array(16).fill(3)) };
plot.ground[1][1] = null; // a '.' cell: its G comes from the nearest neighbour

const fresh = () => new Grid(SIZE, { dataVersion: DATA_VERSION });

function run(name, box, fn) {
  const g = fresh();
  const n = fn(g);
  const [x0, y0, z0, x1, y1, z1] = box;
  assert.ok(n > 0, `${name}: placed nothing`);
  for (const { pos: [x, y, z], block } of g.cells.values())
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name}: ${block} at ${x},${y},${z} is outside ${box}`);
  console.log(`ok ${name}: ${n} blocks in ${box}`);
  return g;
}

// groundColumn: G at (2,2) is the neighbour's 3, so the column runs y3..y9 and nothing below 3
run("groundColumn", [2, 3, 2, 2, 9, 2], (g) => {
  assert.equal(h2.groundAt(plot, 2, 2), 3);
  return h2.groundColumn(g, plot, { x: 2, z: 2, top: 9, block: "smooth_sandstone" });
});
{ // only into air: an existing block in the column is left alone
  const g = fresh();
  g.set(2, 5, 2, "stone");
  h2.groundColumn(g, plot, { x: 2, z: 2, top: 9, block: "smooth_sandstone" });
  assert.equal(g.blockAt(2, 5, 2), "minecraft:stone");
}

// shopGlow: window on the north face at (10,10), floor 3; ring 2 is z 11, ring 3 is z 12
run("shopGlow", [10, 3, 11, 10, 7, 12], (g) => h2.shopGlow(g, { x: 10, z: 10, floor: 3, face: "N" }));

// quoin: a riser along x at z 20, courses y9..y12
run("quoin", [5, 9, 20, 8, 12, 20], (g) => h2.quoin(g, [[5, 20], [6, 20], [7, 20], [8, 20]], { y0: 9, y1: 12 }));

// awning: tread on the north face at z 10, so the awning is at z 9, y12..13 (hem at y12)
run("awning", [5, 12, 9, 8, 13, 9], (g) =>
  h2.awning(g, { cells: [[5, 10], [6, 10], [7, 10], [8, 10]], face: "N" }, { y: 13, colors: ["green", "white"] }));

// archGate: the S gate at x24..26, z49, y5..8; springers at y8 and the lintel at y9 (z48..49 passage)
run("archGate", [23, 5, 48, 27, 9, 49], (g) => h2.archGate(g, { x: 24, z: 49, w: 3, h: 4, y: 5, face: "S" }));
{ // carve: the opening is cut through solid wall
  const g = fresh();
  for (let x = 23; x <= 27; x++) for (let y = 5; y <= 9; y++) g.set(x, y, 49, "stone");
  h2.archGate(g, { x: 24, z: 49, w: 3, h: 4, y: 5, face: "S", carve: true });
  assert.equal(g.blockAt(25, 6, 49), "minecraft:air");
  assert.equal(g.blockAt(23, 5, 49), "minecraft:stone");
}

// azaleaPlanter: 3x3 box at x29..31 z39..41, rim at y14, soil y14, leaves y15
run("azaleaPlanter", [29, 14, 39, 31, 15, 41], (g) => {
  const n = h2.azaleaPlanter(g, [30, 14, 40]);
  assert.equal(g.get(30, 15, 40).state.persistent, "true");
  return n;
});

// steppedCrest: 8-cell tread along x at z5, bricks y39..40 with slab caps up to y41
run("steppedCrest", [4, 39, 5, 11, 41, 5], (g) =>
  h2.steppedCrest(g, { cells: [4, 5, 6, 7, 8, 9, 10, 11].map((x) => [x, 5]), face: "N" }, { y0: 39, y1: 41 }));

// pergola: posts on a 3-cell lattice, slab beams at y33
run("pergola", [30, 30, 6, 39, 33, 14], (g) => h2.pergola(g, [30, 30, 6, 39, 33, 14]));

console.log("all h2 helpers ok");
