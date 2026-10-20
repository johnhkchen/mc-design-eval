// The Pacific Science Center: the site grid, the ground, then every part in plan.md order. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOT, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order (the stair joiner before any room; the rooms last, furnished around the finished building).
const PARTS = [
  ["shell", "parts/shell.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs"],
  ["facade", "parts/facade.mjs"],
  ["courtyard", "parts/courtyard.mjs"],
  ["arches", "parts/arches.mjs"],
  ["dome", "parts/dome.mjs"],
  ["fittings", "parts/fittings.mjs"],
  ["room: main lobby and exhibit hall", "parts/room-1.mjs"],
  ["room: B upper exhibit floor", "parts/room-2.mjs"],
  ["room: planetarium and labs", "parts/room-3.mjs"],
  ["room: N1 north hall", "parts/room-4.mjs"],
  ["room: E wing exhibit halls", "parts/room-5.mjs"],
  ["room: E wing upper halls", "parts/room-6.mjs"],
  ["room: S wing halls", "parts/room-7.mjs"],
  ["room: IMAX theatre", "parts/room-8.mjs"],
];

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([PLOT.x0, GROUND_Y, PLOT.z0], [PLOT.x1, GROUND_Y, PLOT.z1], SMOOTH_STONE);

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build]);
}

// The roof sits on the shell's walls: while the shell is still a stub there is nothing to roof and runParts would throw,
// so the roof waits. roof.json is already written for the workers; it lays as soon as the shell builds something.
const shellModule = PARTS[0][1];
let roofed = false;
if (existsSync(shellModule)) {
  const probe = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  probe.fill([PLOT.x0, GROUND_Y, PLOT.z0], [PLOT.x1, GROUND_Y, PLOT.z1], SMOOTH_STONE);
  await (await import(`./${shellModule}`)).build(probe);
  roofed = [...probe].some((c) => c.pos[1] > GROUND_Y);
}
if (!roofed) console.log("roof: waiting for the shell's walls (roof.json lays once the shell builds)");

runParts(g, list, { palette: "palette.json", roof: roofed ? "roof.json" : undefined });
g.save(out);
console.log(`saved ${out}`);
