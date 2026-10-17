// The terraformed land alone, as one full-area schematic: the site after the earthworks (streets, pads, retaining walls,
// driveways, fences, tracks; the village's 3 plots as they are), with explicit air in every cell that was dug or cleared,
// so a schematicannon on "Replace with Empty" takes the landmass away. No new buildings (kit-changes.nbt adds them later,
// on the same corner). Same frame and DataVersion as the export (Minecraft 1.21.1).
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const here = (p) => new URL(p, import.meta.url).pathname;
const original = load(here("../input/polarton_expansion_001_xl.nbt")), land = load(here("../delivery/after.nbt"));
let dug = 0;
for (const c of original.cells.values()) { if (/air$/.test(c.block)) continue; const now = land.get(...c.pos); if (!now || /air$/.test(now.block)) { land.set(...c.pos, "air"); dug++; } }
land.save(here("../delivery/landscape.nbt"));
const solids = [...land.cells.values()].filter((c) => !/air$/.test(c.block)).length;
console.log(JSON.stringify({ file: "delivery/landscape.nbt", size: land.size, dataVersion: land.dataVersion, solids, explicitAir: dug }));
