// Rockefeller Center, Fifth Avenue front: lays the ground, then every part in plan.md's order, and saves the build.
// usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { post as towerPost } from "./parts/tower.mjs";
import { SITE_SIZE, PLOT_ORIGIN, PLOT_SIZE, onLot, groundAt, PLINTH } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the parts, in plan.md's order
const PARTS = [
  ["massing shell", "parts/shell.mjs"],
  ["portal and forecourt", "parts/portal.mjs"],
  ["Atlas and armillary sphere", "parts/atlas.mjs"],
  ["facades and fittings", "parts/facades.mjs"],
  ["roofs, gardens and lighting", "parts/roofs.mjs"],
  ["final check", "parts/finish.mjs"],
];

// a part whose file is not there yet (another copy mid-write) builds nothing, so the make never fails on it
const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} missing, building nothing`); list.push([name, () => {}]); continue; }
  list.push([name, (await import(`./${file}`)).build]);
}

// the ground: plinth course at each cell's ground y, solid below it (kit coordinates; plots 1 and 2 are offset)
function layGround(g) {
  for (let p = 0; p < PLOT_ORIGIN.length; p++) {
    const [ox, oz] = PLOT_ORIGIN[p], [sx, sz] = PLOT_SIZE[p];
    for (let lx = 0; lx < sx; lx++)
      for (let lz = 0; lz < sz; lz++) {
        if (!onLot(p, lx, lz)) continue;
        for (let y = 0; y <= groundAt(p, lx, lz); y++) g.set(ox + lx, y, oz + lz, PLINTH);
      }
  }
}

function makeSite(roof) {
  const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  layGround(g);
  runParts(g, list, { palette: "palette.json", roof });
  towerPost(g);
  return g;
}

let g;
try {
  g = makeSite("roof.json");
} catch (e) {
  // the roof hangs on the massing shell's walls: while the shell has none (a stub, or not written yet) build without it
  if (!/detectEave: no walls found/.test(e.message)) throw e;
  console.log("roof: no walls yet (the massing shell is empty), building without the roof");
  g = makeSite(undefined);
}
g.save(out);
console.log(`saved ${out}`);
