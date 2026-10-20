// Sun Yat-sen Memorial Hall: lay the ground, then run the six parts in order, and save to the path in argv[2].
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, GROUND_Y, GRASS_BLOCK, onFootprint } from "./vocab/base.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const PARTS = [
  ["shell", "parts/shell.mjs"],
  ["roof", "parts/roof.mjs"],
  ["portal", "parts/portal.mjs"],
  ["facade", "parts/facade.mjs"],
  ["lights", "parts/lights.mjs"],
  ["grounds", "parts/grounds.mjs"],
];

// A part file that is not there (its worker is mid-copy) builds nothing; that is never an error.
async function partBuild(file) {
  const path = resolve(here, file);
  if (!existsSync(path)) { console.log(`part ${file}: missing, built as nothing`); return () => {}; }
  return (await import(pathToFileURL(path).href)).build;
}

const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) if (onFootprint(x, z)) g.set(x, GROUND_Y, z, GRASS_BLOCK);

const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file)]);
runParts(g, list, { palette: resolve(here, "palette.json"), roof: resolve(here, "roof.json") });
g.save(out);
console.log(`saved ${out}`);
