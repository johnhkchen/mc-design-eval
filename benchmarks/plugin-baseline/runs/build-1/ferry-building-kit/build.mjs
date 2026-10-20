// Ferry Building kit: the site grid, the ground, then every part in the order the brief gives. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order. The stair joiner carves its stairwells through the floors and ceilings the shell laid.
const PARTS = [
  ["masonry shell", "parts/shell.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs", { carve: true }],
  ["clock tower", "parts/tower.mjs"],
  ["roofs and cornices", "parts/roofs.mjs"],
  ["windows and doors", "parts/fittings.mjs"],
  ["clock faces and lights", "parts/clock-lights.mjs"],
  ["signs and stalls", "parts/signs-stalls.mjs"],
  ["room: arcade walk (plot 1)", "parts/room-1.mjs"],
  ["room: entrance hall", "parts/room-2.mjs"],
  ["room: nave marketplace (plot 1)", "parts/room-3.mjs"],
  ["room: bay hall (plot 2)", "parts/room-4.mjs"],
  ["room: clock room", "parts/room-5.mjs"],
];

const newGrid = () => {
  const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  g.fill([0, 0, 0], [SITE[0] - 1, 0, SITE[2] - 1], SMOOTH_STONE);   // the ground course over the whole site
  return g;
};

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module, opts] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build, opts]);
}

// The roof needs walls to find its eave. While the shell is still a stub it builds none, so the roof waits: a probe
// builds the shell alone on a scratch grid and looks for anything above the ground.
const shellBuild = list.find(([name]) => name === PARTS[0][0])?.[1];
const probe = newGrid();
if (shellBuild) shellBuild(probe);
const shellHasWalls = [...probe].some((c) => c.pos[1] > 0 && !/air$/.test(c.block));
const roof = existsSync("roof.json") && shellHasWalls ? "roof.json" : undefined;
if (existsSync("roof.json") && !roof) console.log("roof: waiting, the shell builds no walls yet");

const g = newGrid();
runParts(g, list, { palette: "palette.json", roof });
// v3: the bay face rebuilt after every part, straight on the grid (it replaces v2 cells, so it runs outside runParts)
if (existsSync("parts/bayside.mjs")) (await import("./parts/bayside.mjs")).build(g);
g.save(out);
console.log(`saved ${out}`);
