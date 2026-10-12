// Tidies the roof step's output (make.sh runs it right after `mcd roof`). The roof tool mixes its own slate stairs and slabs
// (cobbled and polished deepslate, polished blackstone brick), which are not in palette.json, so each maps to the palette's
// deepslate_tile twin with the same state. Then the orphans the structure check reports are removed: cornice corbels that
// hang under an eave with no wall beneath (the open portico and garage fronts), and two stubs off the turret cone's eave.
// Usage: node roof-tidy.mjs <in.nbt> <out.nbt>
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { structureReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/check.mjs";
import { readFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) throw new Error("usage: node roof-tidy.mjs <in.nbt> <out.nbt>");

const palette = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const allowed = new Set([...Object.values(palette.roles).flat(), ...(palette.objects ?? [])].map((b) => b.replace(/^minecraft:/, "")));

const TWIN = {
  cobbled_deepslate_stairs: "deepslate_tile_stairs",
  polished_deepslate_stairs: "deepslate_tile_stairs",
  polished_blackstone_brick_stairs: "deepslate_tile_stairs",
  cobbled_deepslate_slab: "deepslate_tile_slab",
  polished_deepslate_slab: "deepslate_tile_slab",
};

const g = load(inPath);

for (const c of g.solids()) {
  const name = c.block.replace(/^minecraft:/, "");
  if (allowed.has(name)) continue;
  const twin = TWIN[name];
  if (!twin) throw new Error(`roof-tidy: off-palette ${name} at ${c.pos.join(",")} has no palette twin`);
  g.set(c.pos[0], c.pos[1], c.pos[2], twin, c.state, c.nbt);
}

const report = structureReport(g, { top: 99 });
for (const o of report.orphans) g.unset(...o.pos);

g.save(outPath);
console.log(`roof-tidy: mapped off-palette roof blocks, removed ${report.orphans.length} orphan(s) -> ${outPath}`);
