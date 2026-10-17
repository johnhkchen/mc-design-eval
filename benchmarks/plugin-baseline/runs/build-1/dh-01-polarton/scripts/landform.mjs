// The landform as a picture for the art chain (mcd-agent --site): a three-quarter view of the built site from the
// village, beside a labelled plan of its plots. The server's modded blocks render as their nearest vanilla look-alike
// (the renderer has no textures for them; unknown blocks draw dark and the hill read as basalt).
//   node landform.mjs [outDir]   -> after-vanilla.nbt, land-view.png, land-plan.png, site.png
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { decodePng, encodePng } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/png.mjs";
import { drawText } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/render/font.mjs";
import { computeLayout, GREEN, WILD } from "./layout.mjs";
import { renderSite } from "./render.mjs";
import { readSite } from "./site.mjs";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? new URL("../art", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const AFTER = new URL("../delivery/after.nbt", import.meta.url).pathname;

// ---- the server's blocks as vanilla look-alikes (a first per-server lexicon: name and properties -> render as) ------
const LOOKS = [
  [/willow_leaves|hanging_willow/, "jungle_leaves"], [/red_maple_leaves/, "cherry_leaves"], [/orange_maple_leaves|yellow_maple_leaves/, "acacia_leaves"],
  [/leaves$/, "oak_leaves"], [/leaf_pile|fallen_leaves/, null], [/_log$|_wood$/, "oak_log"],
  [/deepslate/, "deepslate"], [/limestone/, "calcite"], [/rocky_dirt/, "coarse_dirt"], [/stone|_ore$|rocks$/, "stone"],
  [/plants|grass|sprouts|cucumbers|twigs|mushroom|nodule|cobweb|remains/, null],
];
const g = load(AFTER), v = new Grid(g.size, { dataVersion: g.dataVersion }), swapped = {};
for (const c of g.cells.values()) {
  const [ns, name] = c.block.split(":");
  if (ns === "minecraft") { v.set(...c.pos, c.block, c.state); continue; }
  const hit = LOOKS.find(([re]) => re.test(name)), to = hit ? hit[1] : "stone";
  swapped[c.block] = to ?? "(left out)";
  if (to) v.set(...c.pos, to, to === "oak_log" && c.state?.axis ? { axis: c.state.axis } : /leaves/.test(to) ? { persistent: "true" } : undefined);
}
v.save(`${OUT}/after-vanilla.nbt`);

// ---- the view: from the village (east), looking west up the hill ---------------------------------------------------
const z = spawnSync("node", [MCD, "render", `${OUT}/after-vanilla.nbt`, "--out", `${OUT}/view-sheet.png`, "--view", "hill:96,34,84->44,8,44", "--tiles", `${OUT}/vtiles`], { encoding: "utf8" });
if (z.status !== 0) throw new Error(z.stderr);
import("node:fs").then(({ copyFileSync }) => copyFileSync(`${OUT}/vtiles/hill.png`, `${OUT}/land-view.png`));
await new Promise((r) => setTimeout(r, 50));

// ---- the plan: heights, streets, plots numbered as the brief names them --------------------------------------------
const L = computeLayout();
const site = L.site;
const COL = { "small build": [255, 170, 60], farm: [240, 230, 80], pasture: [150, 230, 120], park: [60, 200, 120] };
const P = 8;
renderSite(site, `${OUT}/land-plan.png`, { P, roads: L.streets, plots: [...L.plots, ...L.extras.map((e) => ({ ...e, color: COL[e.kind] }))], wild: WILD, green: GREEN });
const plan = decodePng(readFileSync(`${OUT}/land-plan.png`));
const label = (txt, x0, z0, x1, z1) => { const w = txt.length * 12, cx = ((x0 + x1 + 1) / 2) * P - w / 2, cz = ((z0 + z1 + 1) / 2) * P - 7;
  for (let y = cz - 3; y < cz + 17; y++) for (let x = cx - 3; x < cx + w + 1; x++) { if (x < 0 || y < 0 || x >= plan.width || y >= plan.height) continue; const o = (y * plan.width + x) * 4; plan.rgba.set([255, 255, 255, 255], o); }
  drawText(plan, txt, Math.round(cx), Math.round(cz), { scale: 2, color: [30, 30, 40] }); };
L.plots.forEach((p, i) => label(String(i + 1), p.x0, p.z0, p.x1, p.z1));
let f = 0, k = 0;
for (const e of L.extras) label(e.kind === "small build" ? "S" : e.kind === "farm" ? `F${++f}` : e.kind === "pasture" ? "P" : `K${++k}`, e.x0, e.z0, e.x1, e.z1);
label("VILLAGE", 82, 40, 92, 62); label("STREAM", 66, 18, 81, 30);

// ---- one sheet: the view left, the plan right, the same height ------------------------------------------------------
const view = decodePng(readFileSync(`${OUT}/land-view.png`));
const Ht = Math.max(plan.height, 720), sv = Ht / view.height, sp = Ht / plan.height;
const W = Math.round(view.width * sv) + Math.round(plan.width * sp) + 24, img = { width: W, height: Ht + 40, rgba: new Uint8Array(W * (Ht + 40) * 4).fill(255) };
const blit = (src, s, ox) => { const w = Math.round(src.width * s), h = Math.round(src.height * s);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = Math.min(src.width - 1, Math.floor(x / s)), sy = Math.min(src.height - 1, Math.floor(y / s)), so = (sy * src.width + sx) * 4, o = (y * W + ox + x) * 4; img.rgba.set(src.rgba.subarray(so, so + 4), o); img.rgba[o + 3] = 255; } };
blit(view, sv, 0); blit(plan, sp, Math.round(view.width * sv) + 24);
drawText(img, "THE SITE FROM ABOVE THE VILLAGE (SOUTH-EAST), LOOKING UP THE HILL", 8, Ht + 12, { scale: 2 });
drawText(img, "PLAN, N UP: 1-8 HOUSES S SMALL F FARM P PASTURE K PARK", Math.round(view.width * sv) + 32, Ht + 12, { scale: 2 });
import("node:fs").then(({ writeFileSync }) => { writeFileSync(`${OUT}/site.png`, encodePng(img)); console.log(JSON.stringify({ out: `${OUT}/site.png`, swapped }, null, 1)); });
