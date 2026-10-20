// Calls each h3 helper once at a plan.md position on an empty grid, then checks: everything it wrote lies in the box it
// returned, nothing was refused, and the air rule holds (a block already in a footprint is kept and reported).
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

let failed = 0;
const check = (ok, msg) => { if (!ok) { failed++; console.log(`FAIL ${msg}`); } };

// Every cell a helper wrote.
const written = (g, before) => [...g.cells.values()].filter((c) => !before.has(c)).map((c) => c.pos);
const inBox = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// Lanterns need a block above them: laid before any snapshot, as an earlier part would.
const g = new Grid([120, 30, 120], { dataVersion: 3955 });
g.set(10, 11, 10, "stone");
g.set(11, 11, 10, "stone");

const calls = {
  diagBand: () => h3.diagBand(g, -40, -39, 100, 120, 4, 17, "birch_planks"),
  shedRoofSlice: () => h3.shedRoofSlice(g, 120),
  doorPair: () => h3.doorPair(g, [90, 5, 90], "east"),
  waveArch: () => h3.waveArch(g, 60, 45, 50, 5, 12),
  poolRim: () => h3.poolRim(g, [8, 24, 19, 35], 4, 5),
  ribbon: () => h3.ribbon(g, "north", 40, 30, 40, 6, 8),
  stuccoBlock: () => h3.stuccoBlock(g, [56, 60, 66, 70], 22, [1, 6]),
  shopBay: () => h3.shopBay(g, "east", 70, 50),
  lanternRow: () => h3.lanternRow(g, [[10, 10, 10], [11, 10, 10]]),
};

for (const [name, run] of Object.entries(calls)) {
  const before = new Set(g.cells.values());
  const r = run();
  const cells = written(g, before);
  check(r.placed > 0, `${name}: placed nothing`);
  check(cells.length === r.placed, `${name}: placed ${r.placed} but the grid gained ${cells.length}`);
  const outside = cells.filter((p) => !inBox(p, r.box));
  check(outside.length === 0, `${name}: ${outside.length} blocks outside box ${r.box}, e.g. ${outside[0]}`);
  check(r.skipped.length === 0, `${name}: refused ${r.skipped.length} cells on bare air, e.g. ${r.skipped[0]}`);
  console.log(`${name}: ${r.placed} placed, box ${r.box.join(",")}`);
}

// Gapless band: 21 s values, one d of the two-wide band per s, 14 levels.
const band = new Grid([120, 30, 120]);
check(h3.diagBand(band, -40, -39, 100, 120, 4, 17, "birch_planks").placed === 21 * 14, "diagBand is not gapless (expected 294 cells)");

// Doors: both leaves in full, the two lower halves hinged opposite ways.
const doors = new Grid([120, 30, 120]);
h3.doorPair(doors, [90, 5, 90], "east");
check(doors.blockAt(90, 6, 91) === "minecraft:spruce_door" && doors.get(90, 5, 91).state.half === "lower", "doorPair: second leaf missing");
check(doors.get(90, 5, 90).state.hinge !== doors.get(90, 5, 91).state.hinge, "doorPair: hinges not mirrored");

// Air rule: a block standing in a band cell is kept and reported, not overwritten.
const g2 = new Grid([120, 30, 120]);
g2.set(30, 10, 70, "stone");
const r2 = h3.diagBand(g2, -40, -39, 100, 120, 4, 17, "birch_planks");
check(g2.blockAt(30, 10, 70) === "minecraft:stone", "diagBand overwrote stone");
check(r2.skipped.some(([x, y, z]) => x === 30 && y === 10 && z === 70), "diagBand did not report the refused cell");

console.log(failed ? `${failed} check(s) failed` : "all h3 checks passed");
process.exitCode = failed ? 1 : 0;
