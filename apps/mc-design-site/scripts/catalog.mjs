// Builds the public catalog from the owner-approved kits: writes each module's .nbt (as 1.21.1 blocks) and its render
// into public/, and src/data/catalog.json with what a town generator needs to place it (footprint, height, front,
// blocks, materials) and where it came from (the run and plot a fix goes back to).
// Run: node scripts/catalog.mjs   (renders are made with `mcd render` into .cache/renders when missing)
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";

const HERE = resolve(import.meta.dirname, ".."), REPO = resolve(HERE, "../..");
const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs", RUNS = "benchmarks/plugin-baseline/runs/build-1";
const KITS = [{
  series: "Polarton kit", dir: `${RUNS}/polarton-kit/delivery`, run: `${RUNS}/polarton-kit`, project: "dh-01",
  approved: "Delivered and pasted in Dragonholde (DH-01)", style: "Southern mill village, 1880–1930", modules: {
    "polarton-00-cotton-gin": { name: "Cotton gin", type: "industry" },
    "polarton-01-schoolhouse": { name: "Schoolhouse", type: "civic" },
    "polarton-02-hill-farmhouse": { name: "Hill farmhouse", type: "house" },
    "polarton-03-smithy": { name: "Smithy", type: "workshop" },
    "polarton-04-church": { name: "Church", type: "civic" },
    "polarton-05-tobacco-barn": { name: "Tobacco barn", type: "farm" },
    "polarton-06-corn-crib-granary": { name: "Corn crib and granary", type: "farm" },
    "polarton-07-owners-house": { name: "Owner's house", type: "house" },
  },
}, {
  series: "Mail-order houses", dir: `${RUNS}/sears-kit/modules`, run: `${RUNS}/sears-kit`, project: "oak-lake",
  approved: "Placed in the Oak Lake showcase town", style: "After the Sears Modern Homes catalog, 1908–1940", modules: {
    "sears-00-magnolia": { name: "Magnolia", type: "house" },
    "sears-01-alhambra": { name: "Alhambra", type: "house" },
    "sears-02-vallonia": { name: "Vallonia", type: "house" },
    "sears-03-puritan": { name: "Puritan", type: "house" },
    "sears-04-cornell": { name: "Cornell", type: "house" },
    "sears-05-stanford": { name: "Stanford", type: "house" },
    "sears-06-winona": { name: "Winona", type: "house" },
    "sears-07-craftsman": { name: "Craftsman two-storey", type: "house" },
  },
}, {
  // colour variants of the mail-order houses (mcd reskin of the base module; a fix goes to the base, then re-skins)
  series: "Mail-order houses", dir: `${RUNS}/oak-lake-sears/delivery/houses`, run: `${RUNS}/sears-kit`, project: "oak-lake",
  approved: "Placed in the Oak Lake showcase town", style: "After the Sears Modern Homes catalog, 1908–1940", modules: {
    "sears-01-alhambra-b": { name: "Alhambra, yellow stucco", type: "house", variantOf: "sears-01-alhambra", swap: "white=yellow" },
    "sears-02-vallonia-b": { name: "Vallonia, grey with dark trim", type: "house", variantOf: "sears-02-vallonia", swap: "lime=light_gray,spruce=dark_oak" },
    "sears-03-puritan-b": { name: "Puritan, dark shingle", type: "house", variantOf: "sears-03-puritan", swap: "birch=spruce" },
    "sears-04-cornell-b": { name: "Cornell, grey with a red roof", type: "house", variantOf: "sears-04-cornell", swap: "cyan=light_gray,deepslate_tiles=bricks" },
    "sears-05-stanford-b": { name: "Stanford, red roof", type: "house", variantOf: "sears-05-stanford", swap: "deepslate_tiles=bricks" },
    "sears-06-winona-b": { name: "Winona, white and oak", type: "house", variantOf: "sears-06-winona", swap: "spruce=oak,smooth_sandstone=white_terracotta" },
    "sears-07-craftsman-b": { name: "Craftsman, dark shingle", type: "house", variantOf: "sears-07-craftsman", swap: "spruce=dark_oak" },
  },
}];
// the server is 1.21.1: blocks from newer versions as their 1.21.1 equivalents
const FOR_1_21_1 = [[/^minecraft:pale_oak_log$/, "minecraft:stripped_birch_log"], [/^minecraft:pale_oak_/, "minecraft:birch_"], [/^minecraft:iron_chain$/, "minecraft:chain"]];
const older = (b) => { for (const [re, to] of FOR_1_21_1) if (re.test(b)) return b.replace(re, to); return b; };
const AIRISH = /air$|^minecraft:(short_grass|tall_grass|fern|large_fern)$/;
const entries = [];
for (const kit of KITS) for (const [id, meta] of Object.entries(kit.modules)) {
  const src = resolve(REPO, kit.dir, id + ".nbt"), g = load(src);
  const out = new Grid(g.size, { dataVersion: 3955 }), counts = {};
  let top = 0; // height of the building itself, not the file's box
  for (const c of g.cells.values()) { const b = older(c.block); out.set(...c.pos, b, c.state, c.nbt);
    if (!AIRISH.test(b)) { top = Math.max(top, c.pos[1] + 1); const n = b.replace("minecraft:", ""); counts[n] = (counts[n] || 0) + 1; } }
  const nbt = resolve(HERE, "public/nbt", id + ".nbt"); out.save(nbt);
  const tiles = resolve(HERE, ".cache/renders", id);
  if (!existsSync(`${tiles}/front-right.png`)) { mkdirSync(tiles, { recursive: true }); execFileSync("node", [MCD, "render", nbt, "--out", `${tiles}/sheet.png`, "--tiles", tiles]); }
  execFileSync("magick", [`${tiles}/front-right.png`, "-strip", "-quality", "82", resolve(HERE, "public/img/catalog", id + ".jpg")]);
  const plot = Number(/-(\d+)/.exec(id)[1]);
  entries.push({ id, ...meta, series: kit.series, style: kit.style, project: kit.project, approved: kit.approved,
    footprint: [g.size[0], g.size[2]], height: top, front: "north", blocks: Object.values(counts).reduce((a, b) => a + b, 0),
    materials: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([block, n]) => ({ block, n })),
    image: `/img/catalog/${id}.jpg`, nbt: `/nbt/${id}.nbt`, version: "1.21.1", source: { run: kit.run, plot, file: `${kit.dir}/${id}.nbt` } });
}
writeFileSync(resolve(HERE, "src/data/catalog.json"), JSON.stringify(entries, null, 2) + "\n");
console.log(entries.map((e) => `${e.id} ${e.footprint.join("x")}x${e.height} ${e.blocks}`).join("\n"));
