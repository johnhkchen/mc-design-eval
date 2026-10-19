// Kit briefs and compose placements for Rockefeller Center, from one spec (kits.json), as for Pike Place: each plot is a
// building footprint, a part of one (a predicate on place x, z), or a box of open ground anchored on a footprint (the
// sunken plaza, the Channel Gardens); drawn as a footprint map with the ground under it and the lidar's roof heights
// over it (the setbacks); the compose file gets each module at its box with the ground offset of its plot.
//   node work/nyc/rockefeller-center/briefs.mjs   -> runs/rockefeller-center/<kit>-kit/brief.txt, places/nyc/rockefeller-center.compose.json
//   (the compose file's fill placements, from bin/fill.mjs, are kept)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
const R = "/Volumes/ext1/swe/repos/mc-design-eval", A = `${R}/apps/irl-copy`, P = "nyc/rockefeller-center", RUNS = `${R}/benchmarks/plugin-baseline/runs/rockefeller-center`;
const m = JSON.parse(readFileSync(`${A}/out/${P}/manifest.json`, "utf8"));
const place = JSON.parse(readFileSync(`${A}/places/${P}.json`, "utf8")), sc = place.scale, N = m.size[0];
const f32 = (r) => new Float32Array(readFileSync(`${A}/.cache/${P}/usgs-lidar.lidar.${r}.f32`).buffer.slice(0));
const G = f32("ground"), S = f32("surface");
let lo = Infinity; for (const v of G) lo = Math.min(lo, v * sc);
const floor = Math.floor(lo) - Math.round(4 * sc), ground = (x, z) => Math.round(G[z * N + x] * sc) - floor;
const surf = (x, z) => Math.round(S[z * N + x] * sc) - floor;
const spec = JSON.parse(readFileSync(new URL("./kits.json", import.meta.url), "utf8"));
const byId = new Map(m.buildings.map((b) => [b.id, b])), boxOf = (cells) => { const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
  return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]; };
const modules = {}, placements = [], cleared = new Set();
const only = process.argv[2];
for (const kit of spec.kits) {
  let px = 0; const plots = [], maps = [];
  for (const [i, p] of kit.plots.entries()) {
    const anchor = byId.get(p.id); if (!anchor) throw new Error(`${kit.key}: no building ${p.id}`);
    let cells;
    if (p.box) { const [a, b, c, d] = p.box; cells = []; for (let z = b; z <= d; z++) for (let x = a; x <= c; x++) cells.push([x, z]); }
    else { const pred = p.where ? new Function("x", "z", `return ${p.where};`) : () => true; cells = anchor.footprint.filter(([x, z]) => pred(x, z)); }
    const [x0, z0, x1, z1] = boxOf(cells), W = x1 - x0 + 1, D = z1 - z0 + 1;
    const set = new Set(cells.map(([x, z]) => `${x},${z}`)), base = Math.min(...cells.map(([x, z]) => ground(x, z)));
    const [bx0, bz0] = boxOf(anchor.footprint);
    const rise = Math.max(...cells.map(([x, z]) => ground(x, z))) - base;
    // the lidar's roof per cell, capped at the footprint's recorded roof (+2 m) where it has one (a crane is not roof)
    const cap = p.box ? Infinity : anchor.base + Math.round(((anchor.peak ?? Infinity) + 1) * sc);
    const roofAt = (x, z) => Math.max(ground(x, z), Math.min(surf(x, z), cap)) - base;
    const roof = p.box ? 0 : Math.max(...cells.map(([x, z]) => roofAt(x, z))), top = p.maxY ?? roof + rise + 10;
    const k = Math.max(2, Math.ceil(Math.max(W, D) / (p.box ? 52 : 46))), mask = [], gmap = [], rmap = [];
    for (let z = z0; z <= z1; z += k) { let s = "", g = [], r = []; for (let x = x0; x <= x1; x += k) {
      let n = 0; const gs = [], rs = []; for (let dz = 0; dz < k; dz++) for (let dx = 0; dx < k; dx++) if (set.has(`${x + dx},${z + dz}`)) { n++; gs.push(ground(x + dx, z + dz)); rs.push(roofAt(x + dx, z + dz)); }
      rs.sort((a, b) => a - b);
      s += n * 2 >= k * k ? "#" : "."; g.push(gs.length ? String(Math.max(...gs) - base).padStart(4) : "   ."); r.push(rs.length ? String(rs[rs.length >> 1]).padStart(4) : "   ."); }
      mask.push(s); gmap.push(g.join("")); rmap.push(r.join("")); }
    plots.push(` plot ${i}, x ${px}..${px + W - 1}, z 0..${D - 1} (${W} x ${D}), up to y ${top}: ${p.label} — ${p.text}`);
    maps.push(`PLOT ${i} (${p.label}): place box x ${x0}..${x1}, z ${z0}..${z1}; y 0 = its lowest ground${p.box ? "" : `; the real roofs reach about y ${roof} (lidar)`}; 1 column = ${k}x${k} blocks\n`
      + (p.box ? "" : `FOOTPRINT (# = build here):\n${mask.join("\n")}\n`)
      + `GROUND above y 0 (highest ground in each cell${p.box ? ": the plaza's real levels, from the lidar" : "; build down to it, never float or bury"}):\n${gmap.join("\n")}`
      + (p.box ? "" : `\nROOF HEIGHT above y 0 (lidar, median in each cell: the real massing and its setbacks; follow it closely):\n${rmap.join("\n")}`));
    const key = `${kit.key}-${i}`;
    modules[key] = { file: `../../benchmarks/plugin-baseline/runs/rockefeller-center/${kit.key}-kit/${kit.file ?? "build.nbt"}`, plot: [px, 0, px + W - 1, D - 1] };
    placements.push({ building: anchor.id, module: key, mode: "at", at: [x0 - bx0, z0 - bz0], y: base - anchor.base, quarter: 0, ...(cleared.has(anchor.id) ? {} : { clear: "all" }) });
    cleared.add(anchor.id); px += W + 4;
  }
  const brief = `${kit.intro}\n\n${spec.common}\n\nPlots along x, each standing at y 0:\n${plots.join("\n")}\n\n${maps.join("\n\n")}\n\n${spec.closing}\n`;
  if (!only || only === kit.key) { mkdirSync(`${RUNS}/${kit.key}-kit`, { recursive: true }); writeFileSync(`${RUNS}/${kit.key}-kit/brief.txt`, brief); }
  console.log(`${kit.key}: ${kit.plots.length} plots, ${brief.length} chars`);
}
const compose = `${A}/places/${P}.compose.json`, old = existsSync(compose) ? JSON.parse(readFileSync(compose, "utf8")) : { modules: {}, placements: [] };
const fillMods = Object.fromEntries(Object.entries(old.modules).filter(([k]) => k.startsWith("fill-")));
const fillPl = old.placements.filter((p) => p.module?.startsWith("fill-"));
writeFileSync(compose, JSON.stringify({ note: spec.note, modules: { ...modules, ...fillMods },
  placements: [...placements, ...fillPl] }, null, 1) + "\n");
