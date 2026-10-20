// Calls every h2 helper once on a 64 x 260 x 64 grid and checks that each placed block sits in the footprint it was
// given, that nothing was refused on empty air, and that a block already there is refused, not overwritten.
// Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const AX = { axis: [32, 32] };
const DOORS = [[2, 4], [43, 45], [213, 215], [219, 221]];

// plan.md LEG TABLE: origins (x0, z0) of each leg at three heights
const LEG_ROWS = {
  1: { Sa: [34, 54], Sb: [29, 54], NEa: [49, 18], NEb: [52, 23], NWa: [11, 23], NWb: [14, 18] },
  120: { Sa: [34, 40], Sb: [29, 40], NEa: [37, 25], NEb: [40, 30], NWa: [23, 30], NWb: [26, 25] },
  205: { Sa: [34, 46], Sb: [29, 46], NEa: [42, 22], NEb: [45, 27], NWa: [18, 27], NWb: [21, 22] },
};
for (const [y, row] of Object.entries(LEG_ROWS))
  for (const [leg, [x0, z0]] of Object.entries(row)) {
    const c = h2.legCentre(leg, Number(y), AX);
    assert.deepEqual([c.x0, c.z0], [x0, z0], `legCentre ${leg} y${y}`);
  }
console.log("ok legCentre: origins match the LEG TABLE rows");

// each helper, its footprint [x0,y0,z0,x1,y1,z1] (inclusive), and a call on a fresh grid
const cases = {
  footPad: { box: [33, 1, 53, 36, 1, 56], run: (g) => h2.footPad(g, "Sa", { ...AX, y: 1 }) },
  coreLattice: { box: [29, 1, 29, 35, 222, 35], run: (g) => h2.coreLattice(g, { ...AX, y0: 1, y1: 222, doors: DOORS }) },
  coreLadder: { box: [32, 2, 34, 32, 221, 34], run: (g) => h2.coreLadder(g, { ...AX, y0: 2, y1: 221, facing: "north" }) },
  pavilionRamp: { box: [13, 1, 13, 51, 1, 51], run: (g) => h2.pavilionRamp(g, { ...AX, y: 1 }) },
  radialRib: { box: [31, 204, 2, 33, 210, 28], run: (g) => h2.radialRib(g, 0, { ...AX, rMin: 4, rMax: 30 }) },
  hoop: { box: [2, 212, 2, 62, 212, 62], run: (g) => h2.hoop(g, 212, { ...AX, r0: 28, r1: 30 }) },
  spire: { box: [32, 236, 32, 32, 258, 32], run: (g) => h2.spire(g, { ...AX, base: 236, top: 258 }) },
};
for (const [name, { box, run }] of Object.entries(cases)) {
  const g = new Grid([64, 260, 64], { dataVersion: 3955 });
  const r = run(g);
  assert.ok(r.placed > 0, `${name}: placed nothing`);
  assert.deepEqual(r.refused, [], `${name}: refused cells on empty air`);
  for (const { pos } of g.cells.values()) {
    const [x, y, z] = pos;
    assert.ok(x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5], `${name}: ${pos} outside ${box}`);
  }
  console.log(`ok ${name}: ${r.placed} blocks in footprint`);
}

// doorways and the ladder cell stay open; the foot pad refuses to write over ground already there
{
  const g = new Grid([64, 260, 64], { dataVersion: 3955 });
  h2.coreLattice(g, { ...AX, y0: 1, y1: 222, doors: DOORS });
  assert.ok(g.isAir(32, 3, 29) && g.isAir(32, 34, 34) && g.isAir(33, 44, 29), "doorway or ladder cell not open");
  assert.equal(g.blockAt(29, 5, 29), "minecraft:white_concrete");
}
{
  const g = new Grid([64, 260, 64], { dataVersion: 3955 });
  g.set(34, 1, 54, "smooth_stone");
  const r = h2.footPad(g, "Sa", { ...AX, y: 1 });
  assert.deepEqual(r.refused, ["34,1,54"]);
  assert.equal(g.blockAt(34, 1, 54), "minecraft:smooth_stone");
}
console.log("ok openings stay open; air-only refusal");
