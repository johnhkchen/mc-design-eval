// Presidio fill kit: the ground, then the six parts in order under the roof. Usage: node build.mjs <out.nbt>
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, PLOTS, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the parts, in build order; each is { name, module } as plan.md's PARTS
const PARTS = [
  { name: "Masonry shells", module: "parts/shells.mjs" },
  { name: "Roofs", module: "parts/roofs.mjs" },
  { name: "Chimneys", module: "parts/chimneys.mjs" },
  { name: "Openings and trim", module: "parts/fittings.mjs" },
  { name: "Coastal battery", module: "parts/battery.mjs" },
  { name: "Lighting and grounds", module: "parts/grounds.mjs" },
];

// a part whose module is missing or broken is skipped with a warning, so make.sh still writes a build
async function partBuild({ name, module }) {
  try {
    const mod = await import(pathToFileURL(resolve(here, module)).href);
    if (typeof mod.build === "function") return mod.build;
    console.warn(`${name}: ${module} exports no build(); skipped`);
  } catch (e) {
    console.warn(`${name}: ${module} not loaded (${String(e.message).split("\n")[0]}); skipped`);
  }
  return () => {};
}

// the ground course: smooth stone over each plot box, nothing else at y0 (this is laid before runParts, so parts may use it)
function ground() {
  const g = new Grid(SITE.size, { dataVersion: DATA_VERSIONS["1.21.1"] });
  for (const p of PLOTS) g.fill([p.x0, GROUND_Y, p.z0], [p.x1, GROUND_Y, p.z1], `minecraft:${SMOOTH_STONE}`);
  return g;
}

const list = [];
for (const part of PARTS) list.push([part.name, await partBuild(part)]);

const options = { palette: resolve(here, "palette.json"), report: resolve(here, "parts-report.json") };
let g = ground();
try {
  runParts(g, list, { ...options, roof: resolve(here, "roof.json") });
} catch (e) {
  // the roof is laid over the shell's walls: until the shells part builds them (stubs build none) it cannot be laid
  if (!/detectEave: no walls found/.test(e.message)) throw e;
  console.warn("roof.json not laid: no walls yet from the shells part; building without the roof");
  g = ground();
  runParts(g, list, options);
}

g.save(out);
console.log(`saved ${out}`);
