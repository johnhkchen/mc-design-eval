// Kit briefs and compose placements for Taipei Xinyi, from one spec (kits.json), as for Rockefeller Center: each plot is a
// building footprint (or a part of one: a predicate on place x, z), a box of open ground anchored on a footprint (the
// Elephant Mountain viewpoint), or a free-standing MODULE (W x D x H, no site of its own) that compose stacks where the
// spec says: Taipei 101 is its pedestal and mall on the footprint, one flared segment placed eight times up the tower, and
// the crown and spire on top. Footprint plots are drawn as a map with the ground under them (the Taiwan ground raster,
// as build.mjs rounds it); there is no lidar here, so heights are given in the text.
//   node work/taipei/xinyi/briefs.mjs [kit]   -> runs/taipei-xinyi/<kit>-kit/brief.txt, places/taipei/xinyi.compose.json
//   (the compose file's fill placements, from bin/fill.mjs, are kept)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
const R = "/Volumes/ext1/swe/repos/mc-design-eval", A = `${R}/apps/irl-copy`, P = "taipei/xinyi", RUNS = `${R}/benchmarks/plugin-baseline/runs/taipei-xinyi`;
const m = JSON.parse(readFileSync(`${A}/out/${P}/manifest.json`, "utf8"));
const place = JSON.parse(readFileSync(`${A}/places/${P}.json`, "utf8")), sc = place.scale, N = m.size[0];
const G = new Float32Array(readFileSync(`${A}/.cache/${P}/taiwan-ground.ground.f32`).buffer.slice(0));
let lo = Infinity; for (const v of G) lo = Math.min(lo, v * sc);
const floor = Math.floor(lo) - Math.round(4 * sc), ground = (x, z) => Math.round(G[z * N + x] * sc) - floor;
const spec = JSON.parse(readFileSync(new URL("./kits.json", import.meta.url), "utf8"));
const byId = new Map(m.buildings.map((b) => [b.id, b])), boxOf = (cells) => { const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
  return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]; };
const modules = {}, placements = [], cleared = new Set(), only = process.argv[2];
for (const kit of spec.kits) {
  let px = 0; const plots = [], maps = [];
  for (const [i, p] of kit.plots.entries()) {
    const key = `${kit.key}-${i}`, file = `../../benchmarks/plugin-baseline/runs/taipei-xinyi/${kit.key}-kit/${kit.file ?? "build.nbt"}`;
    if (p.module) {
      // a free-standing module: its own box, placed by the spec (relative to an anchor footprint's box and base)
      const [W, D, H] = p.module;
      plots.push(` plot ${i}, x ${px}..${px + W - 1}, z 0..${D - 1} (${W} x ${D}), up to y ${H - 1}: ${p.label} — ${p.text}`);
      modules[key] = { file, plot: [px, 0, px + W - 1, D - 1] };
      for (const q of p.place) placements.push({ building: q.building, module: key, mode: "at", at: q.at, y: q.y, quarter: 0, ...(q.keep ? { keep: true } : {}) });
      px += W + 4; continue;
    }
    const anchor = byId.get(p.id); if (!anchor) throw new Error(`${kit.key}: no building ${p.id}`);
    let cells;
    if (p.box) { const [a, b, c, d] = p.box; cells = []; for (let z = b; z <= d; z++) for (let x = a; x <= c; x++) cells.push([x, z]); }
    else { const pred = p.where ? new Function("x", "z", `return ${p.where};`) : () => true; cells = anchor.footprint.filter(([x, z]) => pred(x, z)); }
    const [x0, z0, x1, z1] = boxOf(cells), W = x1 - x0 + 1, D = z1 - z0 + 1;
    const set = new Set(cells.map(([x, z]) => `${x},${z}`)), base = Math.min(...cells.map(([x, z]) => ground(x, z)));
    const [bx0, bz0] = boxOf(anchor.footprint), rise = Math.max(...cells.map(([x, z]) => ground(x, z))) - base, top = p.maxY ?? rise + 40;
    const k = Math.max(2, Math.ceil(Math.max(W, D) / (p.box ? 48 : 46))), mask = [], gmap = [];
    for (let z = z0; z <= z1; z += k) { let s = "", g = []; for (let x = x0; x <= x1; x += k) {
      let n = 0; const gs = []; for (let dz = 0; dz < k; dz++) for (let dx = 0; dx < k; dx++) if (set.has(`${x + dx},${z + dz}`)) { n++; gs.push(ground(x + dx, z + dz)); }
      s += n * 2 >= k * k ? "#" : "."; g.push(gs.length ? String(Math.max(...gs) - base).padStart(4) : "   ."); }
      mask.push(s); gmap.push(g.join("")); }
    plots.push(` plot ${i}, x ${px}..${px + W - 1}, z 0..${D - 1} (${W} x ${D}), up to y ${top}: ${p.label} — ${p.text}`);
    maps.push(`PLOT ${i} (${p.label}): place box x ${x0}..${x1}, z ${z0}..${z1}; y 0 = its lowest ground; 1 column = ${k}x${k} blocks\n`
      + (p.box ? "" : `FOOTPRINT (# = build here):\n${mask.join("\n")}\n`)
      + `GROUND above y 0 (highest ground in each cell${p.box ? ": the real hillside, from the terrain model; rebuild it as it is" : "; build down to it, never float or bury"}):\n${gmap.join("\n")}`);
    modules[key] = { file, plot: [px, 0, px + W - 1, D - 1] };
    placements.push({ building: anchor.id, module: key, mode: "at", at: [x0 - bx0, z0 - bz0], y: base - anchor.base, quarter: 0, ...(p.box ? { keep: true, trees: false } : cleared.has(anchor.id) ? {} : { clear: "all" }) });
    if (!p.box) cleared.add(anchor.id); px += W + 4;
  }
  const brief = `${kit.intro}\n\n${spec.common}\n\nPlots along x, each standing at y 0:\n${plots.join("\n")}\n\n${maps.join("\n\n")}\n\n${spec.closing}\n`;
  if (!only || only === kit.key) { mkdirSync(`${RUNS}/${kit.key}-kit`, { recursive: true }); writeFileSync(`${RUNS}/${kit.key}-kit/brief.txt`, brief); }
  console.log(`${kit.key}: ${kit.plots.length} plots, ${brief.length} chars, plots ${px - 4} blocks along x`);
}
const compose = `${A}/places/${P}.compose.json`, old = existsSync(compose) ? JSON.parse(readFileSync(compose, "utf8")) : { modules: {}, placements: [] };
const fillMods = Object.fromEntries(Object.entries(old.modules).filter(([k]) => k.startsWith("fill-")));
const fillPl = old.placements.filter((p) => p.module?.startsWith("fill-"));
writeFileSync(compose, JSON.stringify({ note: spec.note, ...(old.swaps ? { swaps: old.swaps } : {}), modules: { ...modules, ...fillMods },
  placements: [...placements, ...fillPl] }, null, 1) + "\n");
