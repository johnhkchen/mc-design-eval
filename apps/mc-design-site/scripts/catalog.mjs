// Builds the public catalog from approved kits: copies each module's .nbt and its render into public/, and writes
// src/data/catalog.json with what a town generator needs to place it (footprint, height, front, blocks, materials).
// Run: node scripts/catalog.mjs <renders dir>   (renders dir: <module>/front-right.png from `mcd render --tiles`)
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";

const HERE = resolve(import.meta.dirname, ".."), REPO = resolve(HERE, "../..");
const RENDERS = process.argv[2];
const KITS = [{
  dir: "benchmarks/plugin-baseline/runs/build-1/polarton-kit/delivery", project: "dh-01", approved: "Delivered and pasted in Dragonholde (DH-01)",
  style: "Southern mill village, 1880–1930", modules: {
    "polarton-00-cotton-gin": { name: "Cotton gin", type: "industry" },
    "polarton-01-schoolhouse": { name: "Schoolhouse", type: "civic" },
    "polarton-02-hill-farmhouse": { name: "Hill farmhouse", type: "house" },
    "polarton-03-smithy": { name: "Smithy", type: "workshop" },
    "polarton-04-church": { name: "Church", type: "civic" },
    "polarton-05-tobacco-barn": { name: "Tobacco barn", type: "farm" },
    "polarton-06-corn-crib-granary": { name: "Corn crib and granary", type: "farm" },
    "polarton-07-owners-house": { name: "Owner's house", type: "house" },
  },
}];
const AIRISH = /air$|^minecraft:(short_grass|tall_grass|fern|large_fern)$/;
const entries = [];
for (const kit of KITS) for (const [id, meta] of Object.entries(kit.modules)) {
  const src = resolve(REPO, kit.dir, id + ".nbt"), g = load(src);
  const counts = {};
  let top = 0; // height of the building itself, not the file's box
  for (const c of g.cells.values()) if (!AIRISH.test(c.block)) { top = Math.max(top, c.pos[1] + 1); const b = c.block.replace("minecraft:", ""); counts[b] = (counts[b] || 0) + 1; }
  const blocks = Object.values(counts).reduce((a, b) => a + b, 0);
  copyFileSync(src, resolve(HERE, "public/nbt", id + ".nbt"));
  execFileSync("magick", [resolve(RENDERS, id, "front-right.png"), "-strip", "-quality", "82", resolve(HERE, "public/img/catalog", id + ".jpg")]);
  entries.push({ id, ...meta, style: kit.style, project: kit.project, approved: kit.approved,
    footprint: [g.size[0], g.size[2]], height: top, front: "north", blocks,
    materials: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([block, n]) => ({ block, n })),
    image: `/img/catalog/${id}.jpg`, nbt: `/nbt/${id}.nbt`, version: "1.21.1" });
}
writeFileSync(resolve(HERE, "src/data/catalog.json"), JSON.stringify(entries, null, 2) + "\n");
console.log(entries.map((e) => `${e.id} ${e.footprint.join("x")}x${e.height} ${e.blocks}`).join("\n"));
