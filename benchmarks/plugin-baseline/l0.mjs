// Layer 0 metrics, measured from the .nbt by code (free, deterministic): breakage, colour and form.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const PLUGIN = "/Volumes/ext1/swe/repos/minecraft-design";
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const { load } = await import(join(PLUGIN, "tools", "src", "structure.mjs"));
const { faceMaps } = await import(join(PLUGIN, "tools", "src", "detail.mjs"));
const { plainMaps } = await import(join(PLUGIN, "tools", "src", "treatments.mjs"));
const DETAIL = /(stairs|slab|fence|wall$|_wall|trapdoor|lantern|torch|pane|bars|door|sign|banner|button|chain|candle|pot|carpet|leaves|flower|vine|campfire|anvil|barrel|bell|grindstone|lectern|rod|scaffolding|head|skull|azalea|bamboo|hay|ladder)/;
const AGED = /(mossy|cracked|weathered|exposed|oxidized|chipped|damaged|cobweb|vine)/;

function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

export function l0(dir) {
  const nbt = existsSync(join(dir, "build.fixed.nbt")) ? join(dir, "build.fixed.nbt") : join(dir, "build.nbt");
  const g = load(nbt), [X, Y, Z] = g.size;
  const cells = [...g.cells.values()].filter((c) => !/air$/.test(c.block));
  const blocks = cells.map((c) => c.block.replace("minecraft:", ""));
  const share = (re) => blocks.filter((b) => re.test(b)).length / Math.max(1, blocks.length);
  const chk = JSON.parse(spawnSync("node", [MCD, "check", nbt, "--json"], { encoding: "utf8" }).stdout);
  const pal = JSON.parse(spawnSync("node", [MCD, "palette", nbt, "--json"], { encoding: "utf8" }).stdout);

  // what a player sees: the four faces and the roof
  const maps = faceMaps(g), plain = plainMaps(g, maps), seen = [];
  let blankWalls = 0, rough = 0;
  for (const f of ["north", "south", "east", "west"]) {
    let n = 0, p = 0;
    maps[f].blocks.forEach((row, v) => row.forEach((b, u) => { if (b && !/air$/.test(b)) { n++; if (plain[f][v][u]) p++; } }));
    if (n && p / n >= 0.5) blankWalls++;
    // roofline: top occupied row per column; share of adjacent columns whose top differs
    const rows = maps[f].blocks.length, cols = maps[f].blocks[0]?.length || 0, top = [];
    for (let u = 0; u < cols; u++) { let t = -1; for (let v = rows - 1; v >= 0; v--) if (maps[f].blocks[v][u] && !/air$/.test(maps[f].blocks[v][u])) { t = v; break; } if (t >= 0) top.push(t); }
    let ch = 0; for (let i = 1; i < top.length; i++) if (top[i] !== top[i - 1]) ch++;
    rough += top.length > 1 ? ch / (top.length - 1) : 0;
  }
  for (const f of ["north", "south", "east", "west", "roof"]) for (const row of maps[f].blocks) for (const b of row) if (b && !/air$/.test(b)) seen.push(b.replace("minecraft:", ""));
  const vis = {}; for (const b of seen) vis[b] = (vis[b] || 0) + 1 / seen.length;

  // colour, from the palette report's measured block colours (exterior roles), weighted by cell count
  const mats = {};
  for (const role of Object.values(pal.roles || {})) for (const m of (role.materials || []).filter((x) => Array.isArray(x.rgb))) { mats[m.block] ||= { n: 0, rgb: m.rgb }; mats[m.block].n += m.n; }
  const tot = Object.values(mats).reduce((t, m) => t + m.n, 0) || 1, cs = Object.values(mats).map((m) => ({ w: m.n / tot, hsl: hsl(m.rgb), lum: 0.299 * m.rgb[0] + 0.587 * m.rgb[1] + 0.114 * m.rgb[2] }));
  const bins = new Set(cs.filter((c) => c.hsl[1] >= 0.2 && c.w >= 0.04).map((c) => Math.floor(c.hsl[0] / 30)));
  const lumMean = cs.reduce((t, c) => t + c.w * c.lum, 0);
  const lum = (r) => pal.roles?.[r]?.lum;
  const ground = new Set(cells.filter((c) => c.pos[1] <= 1).map((c) => `${c.pos[0]},${c.pos[2]}`));

  return {
    valid: existsSync(join(dir, "format-defect.json")) ? 0 : 1,
    floating: chk.structure?.floatingCells ?? 0,
    stray: (chk.structure?.orphans?.length ?? 0) + (chk.structure?.floatingCells ?? 0),
    blankWalls,
    paletteFlags: (pal.flags || []).length,
    visibleMaterials: Object.values(vis).filter((x) => x >= 0.03).length,
    hueFamilies: bins.size,
    neutralShare: +cs.filter((c) => c.hsl[1] < 0.2).reduce((t, c) => t + c.w, 0).toFixed(3),
    satMean: +cs.reduce((t, c) => t + c.w * c.hsl[1], 0).toFixed(3),
    lumStd: +Math.sqrt(cs.reduce((t, c) => t + c.w * (c.lum - lumMean) ** 2, 0)).toFixed(1),
    wallRoofContrast: lum("walls") != null && lum("roof") != null ? Math.abs(lum("walls") - lum("roof")) : 0,
    agedShare: +share(AGED).toFixed(3),
    detailShare: +share(DETAIL).toFixed(3),
    stairShare: +share(/stairs/).toFixed(3),
    slabShare: +share(/slab/).toFixed(3),
    fenceWallTrapShare: +share(/(fence|_wall|trapdoor)/).toFixed(3),
    rooflineVariety: +(rough / 4).toFixed(3),
    footprintFill: +(ground.size / (X * Z)).toFixed(3),
    heightToWidth: +(Y / Math.max(X, Z)).toFixed(2),
    blocks: blocks.length,
  };
}
