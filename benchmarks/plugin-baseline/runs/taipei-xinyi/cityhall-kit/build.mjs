// Builds Taipei City Hall: node build.mjs <out.nbt>. Lays the ground, then runs the six parts in plan order.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, groundAt, grassBlock, dirt } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(1); }

// the parts, in plan order; a part whose file is missing or fails to load is left empty and reported, not fatal
const PARTS = [
  ["Massing and shell", "parts/shell.mjs"],
  ["Roofs and terraces", "parts/roofs.mjs"],
  ["Facades", "parts/facades.mjs"],
  ["Portico and west front", "parts/portico.mjs"],
  ["Courtyards and grounds", "parts/grounds.mjs"],
  ["Dusk lighting and crown", "parts/lights.mjs"],
];
const warn = (msg) => console.error(`WARNING: ${msg}`);

async function loadPart(name, module) {
  const path = fileURLToPath(new URL(module, import.meta.url));
  if (!existsSync(path)) { warn(`part ${name}: ${module} is missing; left empty`); return null; }
  try {
    const m = await import(new URL(module, import.meta.url).href);
    if (typeof m.build !== "function") { warn(`part ${name}: ${module} exports no build(g); left empty`); return null; }
    return m.build;
  } catch (e) {
    warn(`part ${name}: ${module} failed to load (${String(e.message).split("\n")[0]}); left empty`);
    return null;
  }
}

// a part that throws keeps the blocks it placed; the other parts still run
const guarded = (name, build) => (g) => {
  try { build(g); } catch (e) { warn(`part ${name}: build threw (${String(e.message).split("\n")[0]}); kept what it placed`); }
};

// the ground: grass_block at y = height (courtyards at y 2, spurs at y 0), dirt below, untouched slots left open
function layGround(g) {
  let cells = 0;
  for (let x = 0; x < SIZE[0]; x++) {
    for (let z = 0; z < SIZE[2]; z++) {
      const h = groundAt(x, z);
      if (h < 0) continue;
      for (let y = 0; y < h; y++) g.set(x, y, z, dirt);
      g.set(x, h, z, grassBlock);
      cells++;
    }
  }
  return cells;
}

const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
console.log(`ground: ${layGround(g)} columns laid`);

const list = [];
for (const [name, module] of PARTS) {
  const build = await loadPart(name, module);
  list.push([name, build ? guarded(name, build) : () => {}]);
}

// roof.json is laid right after the shell when it exists; until then runParts skips it
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
