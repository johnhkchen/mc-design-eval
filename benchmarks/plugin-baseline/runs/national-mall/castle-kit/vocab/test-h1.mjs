// Calls each h1 helper once on a small grid and checks every block it placed lies inside the footprint it was given.
// Run: node vocab/test-h1.mjs   (exits 1 on the first failure)
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const g = new Grid([60, 24, 60], { dataVersion: 3955 });   // 1.21.1
const inside = ([x, y, z], [a, b, c, d, e, f]) => x >= a && x <= d && y >= b && y <= e && z >= c && z <= f;

// Run one call, then check every cell it changed sits inside fp. Returns how many cells changed.
function step(name, fp, call) {
  const before = new Map(g.cells);
  const refusedBefore = (g.refused ?? []).length;
  const n = call();
  const changed = [...g.cells.values()].filter((c) => before.get(c.pos.join()) !== c);
  for (const c of changed) assert.ok(inside(c.pos, fp), `${name} wrote ${c.pos} outside [${fp}]`);
  assert.equal(changed.length, n, `${name}: placed count ${n} != changed cells ${changed.length}`);
  assert.ok(n > 0, `${name} placed nothing`);
  assert.equal((g.refused ?? []).length, refusedBefore, `${name} had refused writes`);
  console.log(`ok ${name}: ${n} cells`);
  return n;
}

// 1. A castle wall on the north face, thin in z at z=2.
step("ashlarWall", [2, 0, 2, 12, 9, 2], () => h1.ashlarWall(g, [2, 0, 2, 12, 9, 2], "north", "castle"));

// 2. A round arch cut through it: a solid wall refuses the cut without over, and takes it with over.
const refusedBefore = (g.refused ?? []).length;
assert.equal(h1.roundArch(g, 4, 1, 2, 2, "north", "castle"), 0, "roundArch cut a solid wall without over");
assert.ok((g.refused ?? []).length > refusedBefore, "roundArch did not refuse a solid wall");
g.refused.length = refusedBefore;
step("roundArch", [4, 1, 2, 5, 5, 2], () => h1.roundArch(g, 4, 1, 2, 2, "north", "castle", { over: true }));
assert.equal(g.get(4, 4, 2).state.facing, "east", "roundArch west-end stair must face east (in)");
assert.equal(g.get(4, 4, 2).state.half, "top", "roundArch stair must be upside down");

// 3. A gable infill on the x = 14 plane (thin in x), eave at y10, apex at y13.
step("gableEnd", [14, 10, 2, 14, 13, 9], () => h1.gableEnd(g, [14, 0, 2, 14, 0, 9], 10, 13, "red_terracotta"));

// 4. A crenellated parapet ring on the north tower, and a ring-style one on T3.
step("battlements", [20, 14, 2, 27, 16, 8], () => h1.battlements(g, [20, 2, 27, 8], 15, "crenel"));
step("battlements ring", [34, 14, 10, 41, 16, 16], () => h1.battlements(g, [34, 10, 41, 16], 15, "ring"));

// 5. An uplight on the lawn, at ground level.
step("uplight", [30, 0, 3, 30, 0, 3], () => h1.uplight(g, 30, 3));

// 6. The A&I big arch on a brick wall plane at z=12 (cut with over: true).
step("ashlarWall ai", [31, 0, 12, 39, 11, 12], () => h1.ashlarWall(g, [31, 0, 12, 39, 11, 12], "north", "ai"));
step("bigArch", [33, 1, 12, 37, 10, 12], () => h1.bigArch(g, 33, 37, 5, 9, 12, "north", { over: true }));

// 7. A Freer cornice at y5 round a court.
step("cornice", [43, 5, 1, 53, 5, 13], () => h1.cornice(g, [44, 2, 52, 12], 5, { court: [46, 4, 50, 10] }));

// 8. A court tree (trunk y0..2, crown y3..4).
step("courtTree", [39, 0, 29, 41, 4, 31], () => h1.courtTree(g, 40, 30));

// 9. Soffit lights on the ring of radius 9 (air only, so the soffit is open here).
step("soffitLight", [20, 3, 35, 40, 3, 54], () => h1.soffitLight(g, 30, 45, 9));

console.log("test-h1: all helpers passed");
