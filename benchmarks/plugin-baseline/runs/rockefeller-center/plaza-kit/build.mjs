// Builds the plaza from its parts, in order, into the path given as the first argument.
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE } from "./vocab/base.mjs";

// [name, module] in build order; the ground lays the terrain first, then each part only adds to what came before
const PARTS = [
  ["ground", "parts/ground.mjs"],
  ["sunken well", "parts/well.mjs"],
  ["prometheus", "parts/prometheus.mjs"],
  ["flags", "parts/flags.mjs"],
  ["channel gardens", "parts/gardens.mjs"],
  ["lighting", "parts/lights.mjs"],
];

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

// a part whose module isn't written yet (another copy of the build) is laid as an empty stub, never an error
const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} missing, laid as an empty stub`); list.push([name, () => {}]); continue; }
  const { build } = await import(new URL(`./${file}`, import.meta.url).href);
  list.push([name, build]);
}

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`wrote ${out}`);
