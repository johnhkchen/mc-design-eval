// Calls each h4 helper once at its plan.md position on an empty grid, then checks: everything it wrote lies in the box
// it returned, nothing was refused, and the air rule holds (a block already in a footprint is kept and reported).
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h4 from "./h4.mjs";

const SITE_Y = 4;
let failed = 0;
const check = (ok, msg) => { if (!ok) { failed++; console.log(`FAIL ${msg}`); } };

// Every cell a helper wrote, in site coordinates.
const written = (g, before) => [...g.cells.values()].filter((c) => !before.has(c)).map((c) => [c.pos[0], c.pos[1] - SITE_Y, c.pos[2]]);
const inBox = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

const g = new Grid([96, 40, 96]);
const calls = {
  ventArch: () => h4.ventArch(g, 28, 35, { face: "north" }),
  chimneyStack: () => h4.chimneyStack(g, 33, 46),
  rearPorch: () => h4.rearPorch(g, 37, 58, 75, 79),
  magnolia: () => h4.magnolia(g, 24, 64),
  gatePier: () => h4.gatePier(g, 43, 0),
  gazebo: () => h4.gazebo(g, 13, 81),
  riverBand: () => h4.riverBand(g, 0, 95, 85, 95),
};

for (const [name, run] of Object.entries(calls)) {
  const before = new Set(g.cells.values());
  const r = run();
  const cells = written(g, before);
  check(r.placed > 0, `${name}: placed nothing`);
  check(cells.length === r.placed, `${name}: placed ${r.placed} but grid gained ${cells.length}`);
  const outside = cells.filter((p) => !inBox(p, r.box));
  check(outside.length === 0, `${name}: ${outside.length} blocks outside box ${r.box}, e.g. ${outside[0]}`);
  check(r.skipped.length === 0, `${name}: refused ${r.skipped.length} cells on bare air, e.g. ${r.skipped[0]}`);
  console.log(`${name}: ${r.placed} placed, box ${r.box.join(",")}`);
}

// Air rule: a block already standing in the chimney shaft is kept and reported, not overwritten.
const g2 = new Grid([96, 40, 96]);
g2.set(33, 10 + SITE_Y, 46, "stone");
const r2 = h4.chimneyStack(g2, 33, 46);
check(g2.blockAt(33, 10 + SITE_Y, 46) === "minecraft:stone", "chimneyStack overwrote stone");
check(r2.skipped.some(([x, y, z]) => x === 33 && y === 10 && z === 46), "chimneyStack did not report the refused cell");

// Ground rule: a grass block under the gate pier base (site y0) is never touched.
const g3 = new Grid([96, 40, 96]);
g3.set(43, SITE_Y, 0, "grass_block");
h4.gatePier(g3, 43, 0);
check(g3.blockAt(43, SITE_Y, 0) === "minecraft:grass_block", "gatePier wrote into the grass at y0");

console.log(failed ? `${failed} check(s) failed` : "all h4 checks passed");
process.exitCode = failed ? 1 : 0;
