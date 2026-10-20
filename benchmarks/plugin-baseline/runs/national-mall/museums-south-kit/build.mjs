// The whole build: lay the ground from the site maps, run the six parts in plan order, save the .nbt named on the
// command line. make.sh runs it into a temp file and moves the result to build.nbt. A part whose file is not written
// yet builds nothing, so the build runs in any state of the work.
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { runParts, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, SITE_MAPS, GRASS_BLOCK, COARSE_DIRT } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the six parts in plan order (plan.md PARTS); each file exports build(g)
const PARTS = [
  ["NASM shell", "parts/nasm-shell.mjs"],
  ["NASM glass bays", "parts/nasm-glass.mjs"],
  ["NASM fittings", "parts/nasm-fittings.mjs"],
  ["NASM grounds", "parts/nasm-grounds.mjs"],
  ["NMAI shell", "parts/nmai-shell.mjs"],
  ["NMAI grounds", "parts/nmai-grounds.mjs"],
];

async function load([name, file]) {
  if (!existsSync(file)) {
    console.log(`part ${name}: ${file} not written yet, built empty`);
    return [name, () => {}];
  }
  try {
    const mod = await import(pathToFileURL(file).href);
    return [name, mod.build ?? (() => {})];
  } catch (e) {
    console.log(`part ${name}: ${file} does not load (${e.message.split("\n")[0]}), built empty`);
    return [name, () => {}];
  }
}

// the ground under each footprint cell: grass on the surface block at g, coarse dirt beneath it (g 0 = one course)
function layGround(g, { x0, z0, footprint, ground }) {
  footprint.forEach((row, dz) => [...row].forEach((ch, dx) => {
    if (ch !== "#") return;
    const top = Number(ground[dz][dx]);
    for (let y = 0; y <= top; y++) g.set(x0 + dx, y, z0 + dz, y === top ? GRASS_BLOCK : COARSE_DIRT);
  }));
}

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });   // the server is Minecraft 1.21.1
for (const map of Object.values(SITE_MAPS)) layGround(g, map);

const list = [];
for (const p of PARTS) list.push(await load(p));
runParts(g, list, { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
