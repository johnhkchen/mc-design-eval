// Kit briefs and compose placements for the National Mall place, from one spec (kits.json), after work/pike-place/briefs.mjs.
// Two kinds of plot:
//   building plots ("id"): a footprint drawn as a map with the ground under it; the module stands in site orientation at
//     y 0 = the footprint's lowest ground, placed at its footprint box (the mass cleared)
//   landscape plots ("box": [x0, z0, x1, z1] in the place): the module rebuilds the whole ground of the box from a ground
//     height map (base 36 per cell), module y 0 = world y G0 (2 under the box's lowest ground); it replaces everything in
//     the box from y 1 up (ground: false), and is placed by offset from a reference footprint ("ref")
// The ground is the build's own (buildPlace, smoothed as the land is), so the module's edges meet the land exactly.
//   node work/dc/national-mall/briefs.mjs   -> runs/national-mall/<kit>/brief.txt, places/dc/national-mall.compose.json
//     (fill placements already in the compose file are kept)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
const R = "/Volumes/ext1/swe/repos/mc-design-eval", A = `${R}/apps/irl-copy`, RUNS = `${R}/benchmarks/plugin-baseline/runs/national-mall`, n = "dc/national-mall";
const { frameFor } = await import(`${A}/src/frame.mjs`), { LAYERS, plan } = await import(`${A}/src/sources/index.mjs`), { buildPlace } = await import(`${A}/src/build.mjs`);
const place = { id: n, ...JSON.parse(readFileSync(`${A}/places/${n}.json`, "utf8")) }, frame = frameFor(place), p = plan(place), L = {}, cache = (s) => `${A}/.cache/${n}/${s}`;
for (const layer of LAYERS) { const s = p[layer]; if (!s || !existsSync(cache(`${s.id}.json`))) continue; const d = JSON.parse(readFileSync(cache(`${s.id}.json`), "utf8")).layers[layer]; if (!d) continue;
  const f32 = (f) => new Float32Array(readFileSync(cache(f)).buffer.slice(0));
  L[layer] = d.kind === "raster" ? { ...d, data: f32(`${s.id}.${layer}.f32`) } : d.kind === "rasters" ? { ...d, rasters: Object.fromEntries(d.names.map((r) => [r, f32(`${s.id}.${layer}.${r}.f32`)])) } : d; }
const { grid: g, manifest: m, ground } = buildPlace(place, frame, L);
const spec = JSON.parse(readFileSync(new URL("./kits.json", import.meta.url), "utf8"));
const b36 = (v) => Math.max(0, Math.min(35, v)).toString(36);
const boxOf = (b) => { const xs = b.footprint.map((c) => c[0]), zs = b.footprint.map((c) => c[1]); return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]; };
const byId = new Map(m.buildings.map((b) => [b.id, b]));
const old = existsSync(`${A}/places/${n}.compose.json`) ? JSON.parse(readFileSync(`${A}/places/${n}.compose.json`, "utf8")) : { modules: {}, placements: [] };
const modules = {}, landscape = [], buildings = [];
for (const kit of spec.kits) {
  let px = 0; const plots = [], maps = [];
  for (const [i, q] of kit.plots.entries()) {
    const key = `${kit.key}-${i}`;
    if (q.box) {
      const [x0, z0, x1, z1] = q.box, W = x1 - x0 + 1, D = z1 - z0 + 1; let lo = Infinity, hi = -Infinity;
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { lo = Math.min(lo, ground(x, z)); hi = Math.max(hi, ground(x, z)); }
      const G0 = lo - 2, top = hi - G0 + (q.height ?? 20), inB = new Map();
      for (const b of m.buildings) for (const [x, z] of b.footprint) if (x >= x0 && x <= x1 && z >= z0 && z <= z1) inB.set(`${x},${z}`, b);
      const hmap = [], mask = [];
      for (let z = z0; z <= z1; z++) { let h = "", k = ""; for (let x = x0; x <= x1; x++) { h += b36(ground(x, z) - G0); const b = inB.get(`${x},${z}`); k += b ? (q.marks?.[b.id] ?? "B") : "."; } hmap.push(h); mask.push(k); }
      const named = [...new Set(inB.values())].map((b) => `${q.marks?.[b.id] ?? "B"} = ${b.name ?? b.id} (${b.id}, x ${boxOf(b)[0] - x0}..${boxOf(b)[2] - x0}, z ${boxOf(b)[1] - z0}..${boxOf(b)[3] - z0})`);
      plots.push(` plot ${i}, x ${px}..${px + W - 1}, z 0..${D - 1} (${W} x ${D}), up to y ${top}: ${q.label} — ${q.text}`);
      maps.push(`PLOT ${i} (${q.label}): a LANDSCAPE plot, place box x ${x0}..${x1}, z ${z0}..${z1}. VERTICAL DATUM: module y 0 = the land's world y ${G0}; the module replaces EVERYTHING in its box from y 1 up, so rebuild the whole ground: in every column fill solid ground (dirt under the surface, stone below) from y 1 up to the GROUND HEIGHT MAP's value, the surface block at that height, so the box's edges meet the land around it seamlessly (keep the outermost 2 blocks of every edge exactly at the mapped heights). Inside you may reshape by 1-2 blocks for terraces and steps (soften 1-block steps with slabs and stairs). Nothing may leave its plot or exceed y ${top}.\nGROUND HEIGHT MAP: the ground surface block's y in the module, one base-36 digit per cell (0-9 then a=10, b=11, ...), rows z 0..${D - 1}, columns x 0..${W - 1}:\n${hmap.join("\n")}\nSITE MAP (. = open ground; letters = structure footprints in the box):\n${named.join("\n") || "(none)"}\n${mask.join("\n")}`);
      const ref = byId.get(q.ref), [rx, rz] = boxOf(ref);
      modules[key] = { file: `../../benchmarks/plugin-baseline/runs/national-mall/${kit.key}/${q.version ?? "v1"}.nbt`, plot: [px, 0, px + W - 1, D - 1] };
      landscape.push({ building: q.ref, module: key, mode: "at", at: [x0 - rx, z0 - rz], y: G0 - ref.base, ground: false });
      px += W + 4; continue;
    }
    const b = byId.get(q.id), cells = b.footprint, [x0, z0, x1, z1] = boxOf(b), W = x1 - x0 + 1, D = z1 - z0 + 1;
    const set = new Set(cells.map(([x, z]) => `${x},${z}`)), base = b.base;
    const rise = Math.max(...cells.map(([x, z]) => ground(x, z))) - base, roof = q.roof ?? Math.max(8, b.top - b.base), top = roof + rise + (q.extra ?? 8);
    const k = Math.max(1, Math.ceil(Math.max(W, D) / 120)), mask = [], hmap = [];
    for (let z = z0; z <= z1; z += k) { let s = "", h = ""; for (let x = x0; x <= x1; x += k) {
      let c = 0, gs = []; for (let dz = 0; dz < k; dz++) for (let dx = 0; dx < k; dx++) if (set.has(`${x + dx},${z + dz}`)) { c++; gs.push(ground(x + dx, z + dz)); }
      s += c * 2 >= k * k ? "#" : "."; h += gs.length ? b36(Math.max(...gs) - base) : "."; } mask.push(s); hmap.push(h); }
    plots.push(` plot ${i}, x ${px}..${px + W - 1}, z 0..${D - 1} (${W} x ${D}), up to y ${top}: ${q.label} — ${q.text}`);
    maps.push(`PLOT ${i} (${q.label}): place box x ${x0}..${x1}, z ${z0}..${z1}; y 0 = its lowest ground; the real roofs reach about y ${b.top - b.base} (lidar); 1 char = ${k}x${k} blocks\nFOOTPRINT (# = build here):\n${mask.join("\n")}\nGROUND above y 0 (base 36; build down to it, never float or bury):\n${hmap.join("\n")}`);
    modules[key] = { file: `../../benchmarks/plugin-baseline/runs/national-mall/${kit.key}/${q.version ?? "v1"}.nbt`, plot: [px, 0, px + W - 1, D - 1] };
    buildings.push({ building: b.id, module: key, mode: "at", at: [0, 0], quarter: 0, clear: "all" });
    px += W + 4;
  }
  const brief = `${kit.intro}\n\n${spec.common}\n\nPlots along x, each standing at y 0:\n${plots.join("\n")}\n\n${maps.join("\n\n")}\n`;
  mkdirSync(`${RUNS}/${kit.key}`, { recursive: true }); writeFileSync(`${RUNS}/${kit.key}/brief.txt`, brief);
  console.log(`${kit.key}: ${kit.plots.length} plots, ${brief.length} chars, plots to x ${px - 4}`);
}
// landscape modules first (they clear their boxes), then the buildings, then the fill placements kept from before
const fill = old.placements.filter((q) => /^fill-/.test(q.module));
const fillMods = Object.fromEntries(Object.entries(old.modules).filter(([k]) => /^fill-/.test(k)));
writeFileSync(`${A}/places/${n}.compose.json`, JSON.stringify({ note: "The National Mall at 0.42 blocks per metre: hero kits (runs/national-mall) in site orientation, landscape modules (the Capitol's West Front grounds, the Monument grounds) on the land's own ground, each building module on its footprint; the metered fill (bin/fill.mjs) on the rest.",
  modules: { ...modules, ...fillMods }, placements: [...landscape, ...buildings, ...fill] }, null, 1) + "\n");
