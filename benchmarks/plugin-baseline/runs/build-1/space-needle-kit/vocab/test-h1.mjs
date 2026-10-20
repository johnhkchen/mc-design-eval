// Calls every H1 helper once and checks each one wrote only inside the footprint it was given, and only into air.
import assert from "node:assert/strict";
import { Grid, circleCells, ringCells } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h1.mjs";

const g = new Grid([64, 260, 64]);
const keys = () => new Set(g.cells.keys());
const newCells = (before) => [...g.cells.values()].filter((c) => !before.has(c.pos.join(",")));
const inBox = (c, [x0, y0, z0], [x1, y1, z1]) => c.pos[0] >= x0 && c.pos[0] <= x1 && c.pos[1] >= y0 && c.pos[1] <= y1 && c.pos[2] >= z0 && c.pos[2] <= z1;
const inDisc = (c, cx, cz, r, y0, y1) => c.pos[1] >= y0 && c.pos[1] <= y1 && circleCells(r, { center: [cx, cz] }).some(([x, z]) => x === c.pos[0] && z === c.pos[2]);
const run = (name, fn, inside, replaced = 0) => {
  const before = keys(), n = fn();
  const cells = newCells(before);
  assert.equal(cells.length + replaced, n, `${name}: returned count ${n} but wrote ${cells.length} new + ${replaced} replaced`);
  for (const c of cells) assert.ok(inside(c), `${name}: wrote outside its footprint at ${c.pos}`);
  console.log(`ok ${name}: ${n} cells`);
  return cells;
};

run("groundPlate", () => H.groundPlate(g, [0, 0], [5, 5], 0), (c) => inBox(c, [0, 0, 0], [5, 0, 5]));
assert.equal(H.groundPlate(g, [0, 0], [5, 5], 0), 0, "groundPlate must not overwrite what is there");

// Sa at y 2: origin steps from (34, 54) to (34, 53); the old cells at z 55 are capped with stairs facing north.
const step = run("legStep", () => H.legStep(g, "Sa", 2), (c) => inBox(c, [34, 2, 55], [35, 2, 55]));
assert.deepEqual(step.map((c) => c.block).sort(), ["minecraft:smooth_quartz_stairs", "minecraft:smooth_quartz_stairs"]);
assert.ok(step.every((c) => c.state.facing === "north" && c.state.half === "bottom"));

run("radialTie S", () => H.radialTie(g, "S", 73), (c) => inBox(c, [31, 73, 36], [33, 73, 43]));
// NE: one cell wide, within a cell of the 60° ray from the axis, between the core face and the pair (R 12.2).
const rayNE = (c) => {
  const th = (60 * Math.PI) / 180, dx = c.pos[0] - 32, dz = c.pos[2] - 32;
  const across = Math.abs(dx * -Math.cos(th) - dz * Math.sin(th)), along = dx * Math.sin(th) - dz * Math.cos(th);
  return c.pos[1] === 73 && across <= 1 && along >= 4 && along <= 12.2;
};
run("radialTie NE", () => H.radialTie(g, "NE", 73), rayNE);

run("elevatorShaft", () => H.elevatorShaft(g, 34, { car: true }), (c) => inBox(c, [34, 2, 27], [35, 222, 28]), 12);
const gold = [...g.cells.values()].filter((c) => c.block === "minecraft:gold_block");
assert.equal(gold.length, 12, "gold car is 2x2x3");
assert.ok(gold.every((c) => c.pos[1] >= 150 && c.pos[1] <= 152));

// Pavilion glass wall, then 12 mullions dressing it.
const ring14 = new Set(ringCells(14, { center: [32, 32] }).map((c) => c.join(",")));
for (let y = 2; y <= 7; y++) for (const [x, z] of ringCells(14, { center: [32, 32] })) g.set(x, y, z, "glass");
run("mullion", () => H.mullion(g, 14, 2, 7, 30, 15), (c) => c.block === "minecraft:white_concrete" && ring14.has(`${c.pos[0]},${c.pos[2]}`) && c.pos[1] >= 2 && c.pos[1] <= 7, 72);

run("coneShell", () => H.coneShell(g, 210, 25.43, 23.14), (c) => c.pos[1] === 210 && inDisc(c, 32, 32, 25.43, 210, 210));

run("haloFin", () => H.haloFin(g, 0, 213, 221), (c) => inBox(c, [32, 213, 2], [32, 221, 4]));

run("drumBand", () => H.drumBand(g, 32, 32, 227, 12), (c) => c.pos[1] >= 227 && c.pos[1] <= 229 && inDisc(c, 32, 32, 12, 227, 229));

run("table", () => H.table(g, 20, 213, 20), (c) => inBox(c, [20, 213, 20], [20, 214, 20]));

console.log("H1 helpers: all checks passed");
