// Calls each h2 helper once at its plan.md position on an empty grid, then checks: everything it wrote lies in the box
// it returned, nothing was refused, and the air rule holds (ground and walls already standing are kept and reported).
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

let failed = 0;
const check = (ok, msg) => { if (!ok) { failed++; console.log(`FAIL ${msg}`); } };
// Kit-frame coordinates reach x and z into the 200s, so the grid is that big; the grid is sparse, so it costs nothing.
const newGrid = () => new Grid([260, 40, 260], { dataVersion: 3955 });
// Every cell a helper wrote (a new object in g.cells), as [x, y, z].
const written = (g, before) => [...g.cells.values()].filter((c) => !before.has(c)).map((c) => c.pos);
const inBox = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

const g = newGrid();
const calls = {
  pilingRun: () => h2.pilingRun(g, [[70, 70], [72, 70], [74, 72]]),
  shedWindow: () => h2.shedWindow(g, "east", 120),
  fishMural: () => h2.fishMural(g, "east", 140, 155, 5, 9),
  aquariumSign: () => h2.aquariumSign(g, 117, 13, 141),
  lampPost: () => h2.lampPost(g, 150, 4, 150),
  hallBox: () => h2.hallBox(g, [128, 8, 169, 11], 4, 11),
  deckRail: () => h2.deckRail(g, [156, 44, 173, 61], 8),
  loggia: () => h2.loggia(g, "east", 56, 10, 239),
  terraceRail: () => h2.terraceRail(g, [221, 12, 239, 38], 26, { penthouse: { box: [227, 18, 235, 30], cap: 30 } }),
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

// Air rule: a pile that would stand in ground is kept, and the rest of the run still lands.
const g2 = newGrid();
g2.set(70, 1, 70, "stone");
const r2 = h2.pilingRun(g2, [[70, 70], [72, 70]]);
check(g2.blockAt(70, 1, 70) === "minecraft:stone", "pilingRun overwrote ground at 70,1,70");
check(r2.skipped.some(([x, y, z]) => x === 70 && y === 1 && z === 70), "pilingRun did not report the ground cell it kept");
check(g2.blockAt(72, 1, 70) === "minecraft:stripped_spruce_log", "pilingRun did not place the free pile at 72,1,70");

// Windows need their wall cut: air-only refuses the shed's birch wall (no pane lands), { replace } cuts it.
const g3 = newGrid();
for (let sv = 120; sv <= 123; sv++) {
  const d = ((sv - 15) & 1) === 0 ? -15 : -14;
  for (let y = 6; y <= 14; y++) g3.set((sv + d) / 2, y, (sv - d) / 2, "birch_planks");
}
const panes = () => [...g3.cells.values()].filter((c) => c.block === "minecraft:glass_pane").length;
const r3a = h2.shedWindow(g3, "east", 120);
check(panes() === 0 && r3a.skipped.length > 0, "shedWindow wrote glass into a birch wall without { replace }");
const r3b = h2.shedWindow(g3, "east", 120, { replace: "birch_planks" });
check(panes() === 24, `shedWindow { replace: birch_planks } placed ${panes()} panes, wanted 24`);

console.log(failed ? `h2 test: ${failed} failure(s)` : "h2 test: all helpers passed");
process.exitCode = failed ? 1 : 0;
