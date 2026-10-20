// Smoke test for vocab/h3.mjs: calls each helper once at its plan.md position and checks that every cell it placed is
// inside the footprint it was given, that empty ground refuses nothing, and that the air-only rule holds on the platform.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { corinthianColumn, domeRibbed, thermalWindow, tallWindow, penthouse, glassBase, floodBase } from "./h3.mjs";

let failed = 0;
const inside = (cells, [x0, y0, z0, x1, y1, z1]) => cells.every(([x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);
const check = (name, box, res, expectPlaced = true) => {
  const ok = inside(res.cells, box) && (!expectPlaced || res.cells.length > 0) && res.refused.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${res.cells.length} placed, ${res.refused.length} refused`);
};

const g = new Grid([230, 32, 48]);
check("corinthianColumn", [49, 5, 42, 49, 10, 42], corinthianColumn(g, 49, 5, 42));
check("domeRibbed", [48, 20, 18, 66, 26, 36], domeRibbed(g, [57, 20, 27], { radius: 8, rise: 7 }));
check("thermalWindow", [52, 12, 40, 62, 15, 40], thermalWindow(g, 57, 12, 40, "south"));
check("tallWindow", [25, 5, 40, 25, 9, 41], tallWindow(g, 25, 5, 41, "south"));
check("penthouse", [140, 10, 8, 164, 12, 20], penthouse(g, { x0: 140, x1: 164, z0: 8, z1: 20, y: 10, skylight: [146, 158, 11, 17] }));
check("glassBase", [193, 4, 5, 209, 7, 21], glassBase(g, { x0: 193, x1: 209, z0: 5, z1: 21, y0: 4, y1: 7, leave: [[199, 4, 21, 203, 5, 21]] }));

// Air-only: on the platform top (solid y 4) the floods are refused unless over is set.
const p = new Grid([230, 32, 48]);
p.fill([47, 1, 40], [67, 4, 42], "smooth_stone");
const refused = floodBase(p, 49, 4, 41);
const landed = floodBase(p, 49, 4, 41, { over: true });
const floodOk = refused.cells.length === 0 && refused.refused.length === 2 && landed.cells.length === 2 && inside(landed.cells, [48, 4, 41, 50, 4, 41]);
if (!floodOk) failed++;
console.log(`${floodOk ? "ok  " : "FAIL"} floodBase: refused on solid platform without over, placed 2 with over`);

if (failed) { console.log(`${failed} check(s) failed`); process.exitCode = 1; } else console.log("all helpers inside their footprints");
