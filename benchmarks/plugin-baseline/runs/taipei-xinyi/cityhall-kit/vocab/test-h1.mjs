// Calls each h1 helper once on an empty grid and checks it wrote the expected count, all inside its footprint.
// Then checks it leaves an occupied cell alone. Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { plinth, stringCourse, quoin, plantBox, floodCourse, canopyLight, slabRamp, flagpole, fountain } from "./h1.mjs";

const fresh = () => new Grid([40, 80, 40], { dataVersion: 3955 });
const inside = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// [name, call, footprint box, expected cells written]
const cases = [
  ["plinth", (g) => plinth(g, [2, 0, 2, 12, 2, 12]), [2, 0, 2, 12, 2, 12], 363],
  ["stringCourse", (g) => stringCourse(g, "west", 20, [4, 14], 7), [19, 7, 4, 19, 7, 14], 11],
  ["quoin", (g) => quoin(g, [20, 20], 7, 60), [20, 7, 20, 20, 60, 20], 54],
  ["plantBox", (g) => plantBox(g, 20, 20), [18, 68, 18, 22, 71, 22], 60],
  ["floodCourse", (g) => floodCourse(g, "south", 30, [4, 14], 62), [4, 62, 30, 14, 62, 30], 11],
  ["canopyLight", (g) => canopyLight(g, 5, 9), [5, 12, 9, 5, 12, 9], 1],
  ["slabRamp", (g) => slabRamp(g, [0, 1, 4, 1, 1, 12]), [0, 1, 4, 1, 1, 12], 18],
  ["flagpole", (g) => flagpole(g, 10, 10, "national"), [9, 1, 10, 10, 21, 10], 22],
  ["fountain", (g) => fountain(g, [20, 1, 20, 29, 2, 29]), [20, 1, 20, 29, 2, 29], 200],
];

for (const [name, call, box, expected] of cases) {
  const g = fresh();
  const out = call(g);
  assert.equal(out.placed, expected, `${name}: placed ${out.placed}, expected ${expected}`);
  assert.equal(out.refused, 0, `${name}: refused ${out.refused} on an empty grid`);
  for (const { pos } of g) assert.ok(inside(box, pos), `${name}: wrote ${pos} outside its footprint`);
  console.log(`ok ${name} (${out.placed} cells)`);
}

// Air only: a stone already in the plinth's footprint stays, and the write is counted as refused.
{
  const g = fresh();
  g.set(5, 2, 5, "stone");
  const out = plinth(g, [2, 0, 2, 12, 2, 12]);
  assert.equal(g.blockAt(5, 2, 5), "minecraft:stone", "plinth overwrote an occupied cell");
  assert.equal(out.refused, 1);
  console.log("ok plinth leaves occupied cells (1 refused)");
}

// replace: true dresses an occupied cell.
{
  const g = fresh();
  g.set(5, 2, 5, "stone");
  plinth(g, [2, 0, 2, 12, 2, 12], { replace: true });
  assert.equal(g.blockAt(5, 2, 5), "minecraft:polished_andesite");
  console.log("ok plinth replace: true overwrites");
}
