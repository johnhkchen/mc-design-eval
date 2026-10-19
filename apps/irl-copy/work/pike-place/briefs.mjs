// Kit briefs and compose placements for the Pike Place Market place, from one spec (kits.json): each plot is a building
// footprint, or a part of one (a predicate on place x, z), drawn as a footprint map with the ground under it; the
// compose file gets each module at its footprint box with the ground offset of its part.
//   node work/pike-place/briefs.mjs   -> runs/pike-place/<kit>/brief.txt, places/seattle/pike-place.compose.json
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const R = "/Volumes/ext1/swe/repos/mc-design-eval", A = `${R}/apps/irl-copy`, RUNS = `${R}/benchmarks/plugin-baseline/runs/pike-place`;
const m = JSON.parse(readFileSync(`${A}/out/seattle/pike-place/manifest.json`, "utf8"));
const place = JSON.parse(readFileSync(`${A}/places/seattle/pike-place.json`, "utf8")), sc = place.scale, N = m.size[0];
const G = new Float32Array(readFileSync(`${A}/.cache/seattle/pike-place/usgs-lidar.lidar.ground.f32`).buffer.slice(0));
let lo = Infinity; for (const v of G) lo = Math.min(lo, v * sc);
const floor = Math.floor(lo) - Math.round(4 * sc), ground = (x, z) => Math.round(G[z * N + x] * sc) - floor;
const spec = JSON.parse(readFileSync(new URL("./kits.json", import.meta.url), "utf8"));
const modules = {}, placements = [], cleared = new Set();
for (const kit of spec.kits) {
  let px = 0; const plots = [], maps = [];
  for (const [i, p] of kit.plots.entries()) {
    const b = m.buildings.find((q) => q.id === p.id), pred = p.where ? new Function("x", "z", `return ${p.where};`) : () => true;
    const cells = b.footprint.filter(([x, z]) => pred(x, z)), xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
    const x0 = Math.min(...xs), z0 = Math.min(...zs), x1 = Math.max(...xs), z1 = Math.max(...zs), W = x1 - x0 + 1, D = z1 - z0 + 1;
    const set = new Set(cells.map(([x, z]) => `${x},${z}`)), base = Math.min(...cells.map(([x, z]) => ground(x, z)));
    const bx0 = Math.min(...b.footprint.map((c) => c[0])), bz0 = Math.min(...b.footprint.map((c) => c[1])), bBase = Math.min(...b.footprint.map(([x, z]) => ground(x, z)));
    const rise = Math.max(...cells.map(([x, z]) => ground(x, z))) - base, roof = Math.max(8, b.top - b.base - (base - bBase)), top = roof + rise + 10;
    const k = Math.max(2, Math.ceil(Math.max(W, D) / 50)), mask = [], hmap = [];
    for (let z = z0; z <= z1; z += k) { let s = "", h = []; for (let x = x0; x <= x1; x += k) {
      let n = 0, gs = []; for (let dz = 0; dz < k; dz++) for (let dx = 0; dx < k; dx++) if (set.has(`${x + dx},${z + dz}`)) { n++; gs.push(ground(x + dx, z + dz)); }
      s += n * 2 >= k * k ? "#" : "."; h.push(gs.length ? String(Math.max(...gs) - base).padStart(2) : " ."); } mask.push(s); hmap.push(h.join(" ")); }
    plots.push(` plot ${i}, x ${px}..${px + W - 1}, z 0..${D - 1} (${W} x ${D}), up to y ${top}: ${p.label} — ${p.text}`);
    maps.push(`PLOT ${i} (${p.label}): place box x ${x0}..${x1}, z ${z0}..${z1}; y 0 = its lowest ground; the real roofs reach about y ${roof} (lidar); 1 char = ${k}x${k} blocks\nFOOTPRINT (# = build here):\n${mask.join("\n")}\nGROUND above y 0 (highest ground in each cell; build down to it, never float or bury):\n${hmap.join("\n")}`);
    const key = `${kit.key}-${i}`;
    modules[key] = { file: `../../benchmarks/plugin-baseline/runs/pike-place/${kit.key}/build.nbt`, plot: [px, 0, px + W - 1, D - 1] };
    placements.push({ building: b.id, module: key, mode: "at", at: [x0 - bx0, z0 - bz0], y: base - bBase, quarter: 0, ...(cleared.has(b.id) ? {} : { clear: "all" }) });
    cleared.add(b.id); px += W + 4;
  }
  const brief = `${kit.intro}\n\n${spec.common}\n\nPlots along x, each standing at y 0:\n${plots.join("\n")}\n\n${maps.join("\n\n")}\n`;
  mkdirSync(`${RUNS}/${kit.key}`, { recursive: true }); writeFileSync(`${RUNS}/${kit.key}/brief.txt`, brief);
  console.log(`${kit.key}: ${kit.plots.length} plots, ${brief.length} chars`);
}
writeFileSync(`${A}/places/seattle/pike-place.compose.json`, JSON.stringify({ note: "Pike Place Market: six lean kits (runs/pike-place), each module on its footprint, parts of the market parcel at their own ground level", modules, placements }, null, 1) + "\n");
