// Builds the whole site (one grid) from scratch: ground first, then every part in plan order. Usage: node build.mjs <out.nbt>
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, PLOT_X } from "./vocab/base.mjs";

const out = process.argv[2] ?? "build.nbt";
const PARTS = [
  ["marble shell", "parts/shell.mjs"],
  ["west front and towers", "parts/westfront.mjs"],
  ["roofs", "parts/roofs.mjs"],
  ["spires pinnacles flyers", "parts/spires.mjs"],
  ["glazing and light", "parts/glazing.mjs"],
  ["residences", "parts/residences.mjs"],
];

// Ground from the brief's per-cell maps (site.json): a cell with walking level L (L >= 1) is solid from y 0 to L-1,
// grass on top and dirt below. Only footprint cells ('#') get ground. Laid before runParts, so parts may replace it.
// dirt is the hidden fill below the ground line: not a palette block, and laid before runParts, so it is never reported.
function layGround(g) {
  const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));
  let n = 0;
  for (const plot of Object.values(site)) {
    const width = plot.x1 - plot.x0 + 1, depth = plot.z1 - plot.z0 + 1;
    plot.footprint.forEach((row, j) => [...row].forEach((ch, i) => {
      const level = plot.ground[j][i];
      if (ch !== "#" || level < 1) return;
      for (let dx = 0; dx < plot.cell; dx++) for (let dz = 0; dz < plot.cell; dz++) {
        const x = i * plot.cell + dx, z = j * plot.cell + dz;
        if (x >= width || z >= depth) continue;
        for (let y = 0; y < level; y++) g.set(PLOT_X[plot.n] + x, y, z, y === level - 1 ? "grass_block" : "dirt");
        n++;
      }
    }));
  }
  return n;
}

// A part whose file is not there yet (its worker has not written it) is an empty part, never a failed build.
async function loadPart(name, path) {
  const file = fileURLToPath(new URL(`./${path}`, import.meta.url));
  if (!existsSync(file)) { console.log(`part ${name}: ${path} not there yet; built as empty`); return () => {}; }
  return (await import(file)).build;
}

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });   // the server is 1.21.1
console.log(`ground: ${layGround(g)} footprint columns laid`);
const list = [];
for (const [name, path] of PARTS) list.push([name, await loadPart(name, path)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} blocks, size ${SITE_SIZE.join(" x ")}`);
