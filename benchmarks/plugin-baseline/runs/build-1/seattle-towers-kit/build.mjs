// Seattle Center kit: the site grid, the ground, then every part in the order the brief gives. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order. The stair joiner carves its stairwells through the floors and ceilings the shell laid.
const PARTS = [
  ["KOMO shells", "parts/komo-shell.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs", { carve: true }],
  ["Hyatt and Aperture shells", "parts/hotel-apartments.mjs"],
  ["Roofs and crowns", "parts/roofs.mjs"],
  ["Satellite dishes", "parts/dishes.mjs"],
  ["Facade fittings", "parts/fittings.mjs"],
  ["Grounds and lighting", "parts/grounds.mjs"],
  ["room: KOMO E drum restaurant", "parts/room-1.mjs"],
  ["room: KOMO E atrium lobby", "parts/room-2.mjs"],
  ["room: KOMO E newsroom", "parts/room-3.mjs"],
  ["room: KOMO E east offices", "parts/room-4.mjs"],
  ["room: KOMO E drum meeting room", "parts/room-5.mjs"],
  ["room: KOMO E broadcast studio", "parts/room-6.mjs"],
  ["room: KOMO E south wing offices", "parts/room-7.mjs"],
  ["room: KOMO W bow lobby", "parts/room-8.mjs"],
  ["room: KOMO W office floor", "parts/room-9.mjs"],
  ["room: KOMO W podium studio", "parts/room-10.mjs"],
  ["room: Hyatt lobby and breakfast room", "parts/room-11.mjs"],
  ["room: Hyatt wedge breakfast hall", "parts/room-12.mjs"],
  ["room: Hyatt guest floor corridor", "parts/room-13.mjs"],
  ["room: Hyatt annex meeting rooms", "parts/room-14.mjs"],
  ["room: Hyatt rooftop plant room", "parts/room-15.mjs"],
  ["room: Aperture shops", "parts/room-16.mjs"],
  ["room: Aperture residents lobby", "parts/room-17.mjs"],
  ["room: Aperture bike room", "parts/room-18.mjs"],
  ["room: Aperture apartments north", "parts/room-19.mjs"],
  ["room: Aperture apartments south", "parts/room-20.mjs"],
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
g.save(out);
console.log(`saved ${out}`);
