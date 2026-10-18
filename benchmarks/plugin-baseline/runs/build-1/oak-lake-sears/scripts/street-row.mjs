// The houses for Oak Lake's 15 lots as one kit row: the 8 catalog houses plus 7 colour variants (mcd reskin, no
// agents), so no two lots look alike. Writes <outDir>/row.nbt (plot i at x 16i..16i+15, z 5..24, as the kit's sample
// row) and row.json (what stands on each plot). place-kit.mjs then sets row plot n on lot n (HOUSES=0,1,...,14).
//   node street-row.mjs <modules dir> [outDir]
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const MD = process.argv[2], OUT = process.argv[3] ?? new URL("../delivery", import.meta.url).pathname;
const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const BASE = ["magnolia", "alhambra", "vallonia", "puritan", "cornell", "stanford", "winona", "craftsman"];
// one variant per house but the Magnolia (it stays the white one, and appears once); colour swaps of the same era
const VARIANT = {
  alhambra: "white_terracotta=smooth_sandstone", // cream stucco (yellow terracotta read garish)
  vallonia: "lime=light_gray,spruce=dark_oak",   // grey siding, dark trim
  puritan: "birch=spruce",                       // darker shingle walls
  cornell: "cyan=light_gray,deepslate_tiles=bricks", // grey siding, red tile roof
  stanford: "deepslate_tiles=bricks",            // red roof Cape
  winona: "spruce=oak,smooth_sandstone=white_terracotta",
  craftsman: "spruce=dark_oak",                  // dark shingle Craftsman
};
// lot order (lot 1 first): no house beside its own variant, the Magnolia on the corner by the green
const ORDER = ["magnolia", "craftsman", "stanford", "cornell", "alhambra", "puritan", "winona", "vallonia",
  "cornell-b", "craftsman-b", "alhambra-b", "stanford-b", "vallonia-b", "puritan-b", "winona-b"];

mkdirSync(`${OUT}/houses`, { recursive: true });
const file = (name) => { const base = name.replace(/-b$/, ""), i = BASE.indexOf(base), src = `${MD}/sears-0${i}-${base}.nbt`;
  if (!name.endsWith("-b")) return src;
  const out = `${OUT}/houses/sears-0${i}-${base}-b.nbt`;
  execFileSync("node", [MCD, "reskin", src, out, "--swap", VARIANT[base], "--json"]); return out; };
const mods = ORDER.map((n) => ({ name: n, g: load(file(n)) }));
const H = Math.max(...mods.map((m) => m.g.size[1]));
const row = new Grid([16 * mods.length, H, 25], { dataVersion: mods[0].g.dataVersion });
mods.forEach((m, i) => { for (const c of m.g.cells.values()) row.set(c.pos[0] + 16 * i, c.pos[1], c.pos[2] + 5, c.block, c.state, c.nbt); });
row.save(`${OUT}/row.nbt`);
writeFileSync(`${OUT}/row.json`, JSON.stringify(ORDER.map((name, i) => ({ lot: i + 1, house: name, swap: name.endsWith("-b") ? VARIANT[name.replace(/-b$/, "")] : null })), null, 1) + "\n");
console.log(ORDER.map((n, i) => `${i + 1}:${n}`).join(" "));
