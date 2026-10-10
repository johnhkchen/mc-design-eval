// DETERMINISTIC FACADE: build the front from the right-sized redraw instead of asking an agent to re-interpret the concept.
//   layout   the redraw's crisp cells (trace-raw.png, W x H), clustered by colour so each region (an arch, a pier, a glass
//            bay, a sign band) is one material
//   material each cluster gets the vanilla block whose texture colour is closest (CIELAB) to what the CONCEPT shows in
//            those cells (the concept's front resampled to the same grid); blocks named in spec.md's material map win ties
//   glass    clusters the redraw paints sky blue become glass panes (with a dark interior behind them)
//   relief   depth.txt: +2..-2 blocks proud/recessed per cell
//   body     a plain shell behind the front, to the side drawing's depth, in the front's edge materials per storey
// The agents then only touch up (doors, signs, lettering) and design the sides/roof; arches and palette come from the drawing.
//
//   node benchmarks/gauntlet/facade.mjs <run-dir> [--out facade.nbt] [--k 9]
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOLS = join(HERE, "..", "..", "..", "minecraft-design", "tools", "src");
const { Grid, DATA_VERSIONS } = await import(join(TOOLS, "structure.mjs"));
const { Assets } = await import(join(TOOLS, "assets.mjs"));
const { decodePng } = await import(join(TOOLS, "png.mjs"));

function lab([r, g, b]) {
  const f = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
  const [R, G, B] = [f(r), f(g), f(b)];
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const t = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  return [116 * t(Y) - 16, 500 * (t(X) - t(Y)), 200 * (t(Y) - t(Z))];
}
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const rgbGrid = (path, w, h, crop) => {
  const buf = execFileSync("magick", [path, ...(crop ? ["-crop", `${crop.w}x${crop.h}+${crop.x}+${crop.y}`, "+repage"] : []), "-filter", "box", "-resize", `${w}x${h}!`, "-depth", "8", "rgb:-"], { maxBuffer: 1 << 24 });
  return Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => [0, 1, 2].map((k) => buf[3 * (r * w + c) + k])));
};

// full-cube building blocks a facade may use (plus whatever the spec names)
const BASE = ["deepslate_bricks", "cracked_deepslate_bricks", "polished_deepslate", "deepslate_tiles", "cobbled_deepslate", "chiseled_deepslate", "tuff", "polished_tuff",
  "stone_bricks", "mossy_stone_bricks", "chiseled_stone_bricks", "stone", "smooth_stone", "andesite", "polished_andesite", "diorite", "polished_diorite", "calcite",
  "smooth_quartz", "quartz_bricks", "quartz_block", "quartz_pillar", "chiseled_quartz_block", "white_concrete", "light_gray_concrete", "gray_concrete", "black_concrete",
  "sandstone", "smooth_sandstone", "cut_sandstone", "bricks", "mud_bricks", "packed_mud", "terracotta", "white_terracotta", "light_gray_terracotta",
  "oak_planks", "spruce_planks", "dark_oak_planks", "birch_planks", "stripped_oak_log", "stripped_spruce_log", "stripped_dark_oak_log", "oak_log", "dark_oak_log",
  "gold_block", "yellow_terracotta", "cyan_terracotta", "light_blue_terracotta", "blue_concrete", "cyan_concrete", "moss_block", "mossy_cobblestone", "blackstone",
  "polished_blackstone_bricks", "gilded_blackstone", "copper_block", "cut_copper"];
const NOT_CUBE = /stairs|slab|wall$|fence|pane|door|trapdoor|bars|chain|lantern|button|sign|banner|carpet|torch|rod|pot|leaves|sapling|flower|tulip|azalea|glass|barrel|chest|table|furnace|bookshelf|^light$|^stone$|^deepslate$|lamp|ore$/;

async function blockColours(assets, names) {
  const out = new Map();
  for (const n of names) {
    for (const t of [n, `${n}_side`, `${n}_front`, `${n.replace(/_block$/, "")}`, `${n}_top`]) {
      const buf = assets.texturePng(`block/${t}`);
      if (!buf) continue;
      try {
        const img = decodePng(buf); let r = 0, g = 0, b = 0, k = 0;
        for (let i = 0; i < img.rgba.length; i += 4) if (img.rgba[i + 3] > 128) { r += img.rgba[i]; g += img.rgba[i + 1]; b += img.rgba[i + 2]; k++; }
        if (k) { out.set(n, lab([r / k, g / k, b / k])); break; }
      } catch { /* skip */ }
    }
  }
  return out;
}

function kmeans(points, k, iters = 25) {
  // deterministic init: spread over the sorted-by-lightness list
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  let cents = Array.from({ length: k }, (_, i) => sorted[Math.floor(((i + 0.5) / k) * sorted.length)].slice());
  let assign = new Array(points.length).fill(0);
  for (let it = 0; it < iters; it++) {
    assign = points.map((p) => cents.reduce((bi, c, i) => (dE(p, c) < dE(p, cents[bi]) ? i : bi), 0));
    cents = cents.map((c, i) => {
      const m = points.filter((_, j) => assign[j] === i);
      return m.length ? [0, 1, 2].map((d) => m.reduce((s, p) => s + p[d], 0) / m.length) : c;
    });
  }
  return { assign, cents };
}

export async function buildFacade(dir, { out = join(dir, "facade.nbt"), k = 12 } = {}) {
  const raw = join(dir, "trace-raw.png");
  const [W, H] = execFileSync("magick", [raw, "-format", "%w %h", "info:"], { encoding: "utf8" }).trim().split(" ").map(Number);
  const redraw = rgbGrid(raw, W, H).map((r) => r.map(lab));
  // the concept's front, located (cached box) and resampled to the same grid
  let box = existsSync(join(dir, "concept-front-box.json")) ? JSON.parse(readFileSync(join(dir, "concept-front-box.json"), "utf8")) : null;
  const concept = ["concept.jpg", "concept.png"].map((f) => join(dir, f)).find(existsSync);
  if (!box) { const { locateWithGemini } = await import("./sheet-trace.mjs"); box = await locateWithGemini(concept); writeFileSync(join(dir, "concept-front-box.json"), JSON.stringify(box) + "\n"); }
  const conc = rgbGrid(concept, W, H, box).map((r) => r.map(lab));
  // depth (+2..-2, null outside)
  const depth = readFileSync(join(dir, "depth.txt"), "utf8").trim().split("\n").filter((l) => /^y\d/.test(l))
    .map((l) => l.split(/\s+/).slice(1).map((t) => (t === "." ? null : Number(t))));
  const dAt = (r, c) => (depth[r] && c < depth[r].length ? depth[r][c] : 0);
  // background: the redraw's corner colour
  const bg = redraw[0][0];
  const inside = (r, c) => dE(redraw[r][c], bg) > 8 && dAt(r, c) !== null;
  // clusters over the building's cells
  const cells = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (inside(r, c)) cells.push({ r, c });
  const isGlass = (L) => L[2] < -12 && L[0] > 50 && Math.hypot(L[1], L[2]) > 14;   // the redraw's sky-blue glass
  const solid = cells.filter(({ r, c }) => !isGlass(redraw[r][c]));
  const { assign: sa, cents } = kmeans(solid.map(({ r, c }) => redraw[r][c]), Math.min(k, solid.length));
  const assets = await Assets.open("latest");
  const known = new Set(assets.blocks());
  const spec = existsSync(join(dir, "spec.md")) ? readFileSync(join(dir, "spec.md"), "utf8") : "";
  const specBlocks = [...new Set([...spec.matchAll(/\b([a-z]+(?:_[a-z]+)+)\b/g)].map((m) => m[1]).filter((b) => known.has(b) && !NOT_CUBE.test(b)))];
  const cands = [...new Set([...BASE.filter((b) => known.has(b) && !NOT_CUBE.test(b)), ...specBlocks])];
  const colours = await blockColours(assets, cands);
  // target = the redraw cluster colour; a spec (concept-read) block wins if it is within 12 ΔE of the best overall
  const clusterBlock = cents.map((cent, i) => {
    const n = sa.filter((a) => a === i).length;
    if (!n) return null;
    const ranked = [...colours].map(([b, col]) => [b, dE(cent, col)]).sort((p, q) => p[1] - q[1]);
    const bestSpec = ranked.find(([b]) => specBlocks.includes(b));
    const pick = bestSpec && bestSpec[1] <= ranked[0][1] + 12 ? bestSpec : ranked[0];
    return { block: pick[0], n, redrawColour: cent.map(Math.round), dE: Math.round(pick[1]) };
  });
  const blockAt = new Map();
  solid.forEach(({ r, c }, j) => blockAt.set(`${r},${c}`, clusterBlock[sa[j]]));
  for (const { r, c } of cells) if (isGlass(redraw[r][c])) blockAt.set(`${r},${c}`, { block: "glass_pane", glass: true });
  // build: front plane z = 2 (depth +2 -> z 0), slab back to z = 5; body shell behind to the side drawing's depth
  const sideCols = existsSync(join(dir, "views.json")) ? (JSON.parse(readFileSync(join(dir, "views.json"), "utf8")).side?.cols || Math.round(W * 0.8)) : Math.round(W * 0.8);
  const D = Math.max(8, sideCols + 2), g = new Grid([W, H, D], { dataVersion: DATA_VERSIONS["26.3"] ?? DATA_VERSIONS["1.21.4"] });
  for (const { r, c } of cells) {
    const b = blockAt.get(`${r},${c}`), x = W - 1 - c, y = H - 1 - r;   // seen from the street, the left of the drawing is world +x
    const zf = 2 - Math.max(-2, Math.min(2, dAt(r, c) ?? 0));
    if (b.glass) {
      g.set(x, y, zf, "glass_pane", {});
      for (let z = zf + 1; z <= 5; z++) g.unset(x, y, z);
      g.set(x, y, 6, "spruce_planks");                                  // a warm interior wall seen through the glass
    } else for (let z = zf; z <= 5; z++) g.set(x, y, z, b.block);
  }
  // body: per row, the facade's extent becomes side walls back to the depth plus a back wall, in that row's main
  // material; a flat cap over every column's top course (the roof pass replaces it)
  for (let r = 0; r < H; r++) {
    const row = cells.filter((q) => q.r === r);
    if (!row.length) continue;
    const y = H - 1 - r, xs = row.map((q) => W - 1 - q.c), x0 = Math.min(...xs), x1 = Math.max(...xs);
    if (x1 - x0 < 3) continue;                                             // spires, finials, chimneys: no body
    const count = new Map();
    for (const q of row) { const b = blockAt.get(`${q.r},${q.c}`); if (!b.glass) count.set(b.block, (count.get(b.block) || 0) + 1); }
    const m = [...count].sort((p, q) => q[1] - p[1])[0]?.[0] || "stone_bricks";
    for (let z = 6; z < D; z++) { g.set(x0, y, z, m); g.set(x1, y, z, m); }
    for (let x = x0; x <= x1; x++) g.set(x, y, D - 1, m);
  }
  for (let x = 0; x < W; x++) {
    let top = -1;
    for (let y = H - 1; y >= 0; y--) { const b = g.get(x, y, 5); if (b && !/air|glass/.test(b.block)) { top = y; break; } }
    if (top < 0) continue;
    const m = g.blockAt(x, top, 5).replace("minecraft:", "");
    for (let z = 6; z < D - 1; z++) if (!g.get(x, top, z)) g.set(x, top, z, m);
  }
  g.save(out);
  const report = { out, size: [W, H, D], clusters: clusterBlock.filter(Boolean), candidates: cands.length, specBlocks, cells: cells.length, glassCells: cells.filter(({ r, c }) => isGlass(redraw[r][c])).length };
  writeFileSync(join(dir, "facade.json"), JSON.stringify(report, null, 1) + "\n");
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
  const r = await buildFacade(process.argv[2], { out: arg("--out") ? join(process.argv[2], arg("--out")) : undefined, k: Number(arg("--k", 12)) });
  console.log(JSON.stringify({ out: r.out, size: r.size, glass: r.glassCells, clusters: r.clusters.map((c) => `${c.block} (redraw ${c.redrawColour}, ΔE ${c.dE}) x${c.n}`) }, null, 1));
}
