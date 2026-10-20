// Taipei WTC group kit: lays the site (grid + ground from site.json), runs the six parts in order, saves to argv[2].
// Usage: node build.mjs <out.nbt>   (make.sh runs it to a temp file, then moves it into place)
import { existsSync, readFileSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSION, GROUND_FILL, PLANTER_TOP, SITE } from "./vocab/base.mjs";

const PARTS = [
  ["ITB shell and lobby", "parts/itb-shell.mjs"],
  ["ITB crown and plaza", "parts/itb-crown.mjs"],
  ["Exhibition Hall 1", "parts/hall.mjs"],
  ["Grand Hyatt", "parts/hyatt.mjs"],
  ["TICC", "parts/ticc.mjs"],
  ["Dusk lighting and street", "parts/lighting.mjs"],
];

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// A part whose module file is not there yet is skipped with a note, so one missing part never breaks the build.
const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) {
    console.log(`part ${name}: ${file} missing, skipped`);
    list.push([name, () => {}]);
    continue;
  }
  const mod = await import(new URL(file, import.meta.url).href);
  list.push([name, mod.build]);
}

const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSION });

// Ground: on every footprint cell (#) dirt from y 0 up to the cell's ground height, grass on top; air above.
const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));
let columns = 0;
for (const plot of site.plots) {
  plot.footprint.forEach((row, r) => [...row].forEach((ch, c) => {
    const h = plot.ground[r][c];
    if (ch !== "#" || !h) return;
    for (let dx = 0; dx < plot.cell; dx++) for (let dz = 0; dz < plot.cell; dz++) {
      const x = plot.x0 + c * plot.cell + dx, z = plot.z0 + r * plot.cell + dz;
      if (!g.inBounds(x, 0, z)) continue;
      for (let y = 0; y < h; y++) g.set(x, y, z, y === h - 1 ? PLANTER_TOP : GROUND_FILL);
      columns++;
    }
  }));
}
console.log(`ground: ${columns} columns laid from site.json`);

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
