// Builds the Pike Place north end (Soames-Dunn plot 0, Butterworth plot 1) from its parts, in plan.md's order: the ground,
// then every part. runParts lets each part only ADD into what earlier parts built (writes into an earlier part's cells are
// refused and reported) and reports off-palette blocks per part. A part whose file is not there yet builds as nothing.
// Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, groundAt } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// The build function of one part's module; a missing file (another copy still writing it) is a part that builds nothing.
async function partBuild(file) {
  if (!existsSync(new URL(file, import.meta.url))) {
    console.log(`part file missing: ${file} (built as nothing)`);
    return () => {};
  }
  return (await import(new URL(file, import.meta.url).href)).build;
}

const g = new Grid(SITE.size, { dataVersion: SITE.dataVersion });
// The ground: dirt up to each cell's GROUND height, grass_block on top, wherever the map gives a height. Footings, paving
// and walls are written over it, down to their own cell's ground.
for (let x = 0; x < SITE.size[0]; x++)
  for (let z = 0; z < SITE.size[2]; z++) {
    const gy = groundAt(x, z);
    if (gy == null) continue;
    for (let y = 0; y < gy; y++) g.set(x, y, z, "dirt");
    g.set(x, gy, z, "grass_block");
  }

runParts(
  g,
  [
    ["Soames-Dunn masonry shell", await partBuild("./parts/soames-shell.mjs")],
    ["Butterworth masonry shell", await partBuild("./parts/butter-shell.mjs")],
    ["Roofs and stacks", await partBuild("./parts/roofs.mjs")],
    ["Soames front and shopfronts", await partBuild("./parts/soames-front.mjs")],
    ["Butterworth east front, pavilion, back and Kells", await partBuild("./parts/butter-front.mjs")],
    ["Glazing, signs, lights, sidewalk", await partBuild("./parts/finish.mjs")],
  ],
  { palette: fileURLToPath(new URL("./palette.json", import.meta.url)), roof: fileURLToPath(new URL("./roof.json", import.meta.url)) },
);

g.save(out);
console.log(`saved ${out}`);
