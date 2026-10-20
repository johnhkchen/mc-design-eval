// Radio City build: the site ground, then the six parts in plan.md order, saved to the path given as the first argument.
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { revise } from "./parts/revise.mjs";
import { SITE_SIZE, Z_SOUTH, PLOT1, PLOT1_RAISED_FROM, PLOT2_RAISED_FROM, SIDEWALK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Part order and module files, as plan.md. A part whose file is not there yet is skipped, not an error.
const PARTS = [
  ["Plot 0 tower shell", "parts/tower.mjs"],
  ["Music Hall shell", "parts/hall.mjs"],
  ["East end shell", "parts/east.mjs"],
  ["Marquees", "parts/marquee.mjs"],
  ["Blade, roundels, glazing", "parts/facade.mjs"],
  ["Lights and grounds", "parts/lights.mjs"],
];

// The ground: sidewalk course on y0 across the whole site; where plot 1 and plot 2 stand on ground 1, y1 too.
function layGround(g) {
  const [sx] = SITE_SIZE;
  for (let x = 0; x < sx; x++) for (let z = 0; z <= Z_SOUTH; z++) {
    g.set(x, 0, z, SIDEWALK);
    const raised = (x >= PLOT1_RAISED_FROM && x <= PLOT1.x1) || x >= PLOT2_RAISED_FROM;
    if (raised) g.set(x, 1, z, SIDEWALK);
  }
}

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });   // the server is 1.21.1
layGround(g);

const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} not there yet, skipped`); continue; }
  const { build } = await import(`./${file}`);
  list.push([name, build]);
}

// The roof is laid right after the first part, and the roof tool needs walls to find its eave: while that part is a stub
// (it places nothing) the roof waits. Probed on a scratch grid so the real one is untouched.
const probe = new Grid(SITE_SIZE);
if (list.length) list[0][1](probe);
const roof = undefined;   // roof tool cleared the crown above its eave; roofs are hand-built decks
if (!roof) console.log("roof: waits, the first part places no blocks yet");

runParts(g, list, { palette: "palette.json", roof });
revise(g);   // revision v2 (comment-v2.txt): marquee, blade, roundels, hall skylights
g.save(out);
console.log(`saved ${out}`);
