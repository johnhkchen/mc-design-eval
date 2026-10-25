// Kit brief and compose placement for Mont-Saint-Michel, from kits.json: footprint plots ("ids": one or more footprints
// drawn as one plot over their union's box, the place's own axes) with their ground and roof heights from IGN's
// elevation models (the RGE ALTI terrain and the photogrammetric surface), placed whole on the union (mode "at").
//   node work/fr/mont-saint-michel/briefs.mjs [kit]  -> runs/mont-saint-michel/<kit>-kit/brief.txt, places/fr/mont-saint-michel.compose.json
//     (fill placements already in the compose file are kept)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
const R = "/Volumes/ext1/swe/repos/mc-design-eval", A = `${R}/apps/irl-copy`, P = "fr/mont-saint-michel", RUNS = `${R}/benchmarks/plugin-baseline/runs/mont-saint-michel`;
const m = JSON.parse(readFileSync(`${A}/out/${P}/manifest.json`, "utf8")), place = JSON.parse(readFileSync(`${A}/places/${P}.json`, "utf8")), sc = place.scale, N = m.size[0];
const f32 = (r) => new Float32Array(readFileSync(`${A}/.cache/${P}/ign-lidar-hd.lidar.${r}.f32`).buffer.slice(0));
const G = f32("ground"), S = f32("surface");
let lo = Infinity; for (const v of G) lo = Math.min(lo, v * sc);
const floor = Math.floor(lo) - Math.round(4 * sc), ground = (x, z) => Math.round(G[z * N + x] * sc) - floor, surf = (x, z) => Math.round(S[z * N + x] * sc) - floor;
const spec = JSON.parse(readFileSync(new URL("./kits.json", import.meta.url), "utf8"));
const byId = new Map(m.buildings.map((b) => [b.id, b]));

const modules = {}, placements = [], only = process.argv[2];
for (const kit of spec.kits) {
  let px = 0; const plots = [], maps = [];
  for (const [i, p] of kit.plots.entries()) {
    const key = `${kit.key}-${i}`, bs = p.ids.map((id) => byId.get(id) ?? (() => { throw new Error(`${kit.key}: no building ${id}`); })());
    const own = new Set(bs.flatMap((b) => b.footprint.map(([x, z]) => `${x},${z}`)));
    const cells = [...own].map((s) => s.split(",").map(Number)), xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
    const x0 = Math.min(...xs), z0 = Math.min(...zs), W = Math.max(...xs) - x0 + 1, D = Math.max(...zs) - z0 + 1;
    const base = Math.min(...cells.map(([x, z]) => ground(x, z))), roofAt = (x, z) => Math.max(ground(x, z), surf(x, z)) - base;
    const roof = Math.max(...cells.map(([x, z]) => roofAt(x, z))), spire = p.spireTopM != null ? Math.round(p.spireTopM * sc) - floor - base : null, top = Math.max(roof + 10, (spire ?? 0) + 2);
    const k = Math.max(1, Math.ceil(Math.max(W, D) / 46)), mask = [], gmap = [], rmap = [];
    for (let z = 0; z < D; z += k) { let s = "", g = [], r = []; for (let x = 0; x < W; x += k) {
      const gs = [], rs = []; for (let dz = 0; dz < k; dz++) for (let dx = 0; dx < k; dx++) { const wx = x0 + x + dx, wz = z0 + z + dz; if (own.has(`${wx},${wz}`)) { gs.push(ground(wx, wz)); rs.push(roofAt(wx, wz)); } }
      rs.sort((a, q) => a - q);
      s += gs.length * 2 >= k * k ? "#" : "."; g.push(gs.length ? String(Math.max(...gs) - base).padStart(4) : "   ."); r.push(rs.length ? String(rs[rs.length >> 1]).padStart(4) : "   ."); }
      mask.push(s); gmap.push(g.join("")); rmap.push(r.join("")); }
    plots.push(` plot ${i}, x ${px}..${px + W - 1}, z 0..${D - 1} (${W} x ${D}), up to y ${top}: ${p.label}: ${p.text.replaceAll("SPIRE_TOP", String(spire))}`);
    maps.push(`PLOT ${i} (${p.label}): ${W} x ${D}; y 0 = its lowest ground; the real roofs reach about y ${roof} (surface model)${spire != null ? `, the archangel's top y ${spire}` : ""}; 1 column = ${k}x${k} blocks\n`
      + `FOOTPRINT (# = build here, nothing outside it):\n${mask.join("\n")}\nGROUND above y 0 (highest ground in each cell: the rock; build down to it, never float or bury):\n${gmap.join("\n")}`
      + `\nROOF HEIGHT above y 0 (surface model, median in each cell: the real massing; the spire is too thin for it):\n${rmap.join("\n")}`);
    modules[key] = { file: `../../benchmarks/plugin-baseline/runs/mont-saint-michel/${kit.key}-kit/${kit.file ?? "v1.nbt"}`, plot: [px, 0, px + W - 1, D - 1] };
    const ref = bs[0], [rx, rz] = [Math.min(...ref.footprint.map((c) => c[0])), Math.min(...ref.footprint.map((c) => c[1]))];
    placements.push({ building: ref.id, module: key, mode: "at", at: [x0 - rx, z0 - rz], y: base - ref.base, covers: p.ids });
    px += W + 4;
  }
  const brief = `${kit.intro}\n\n${spec.common}\n\n${kit.frame ?? ""}\n\nPlots along x, each standing at its own y 0:\n${plots.join("\n")}\n\n${maps.join("\n\n")}\n\n${spec.closing}\n`;
  if (!only || only === kit.key) { mkdirSync(`${RUNS}/${kit.key}-kit`, { recursive: true }); writeFileSync(`${RUNS}/${kit.key}-kit/brief.txt`, brief.replace(/\n{3,}/g, "\n\n")); }
  console.log(`${kit.key}: ${kit.plots.length} plots, ${brief.length} chars`);
}
const compose = `${A}/places/${P}.compose.json`, old = existsSync(compose) ? JSON.parse(readFileSync(compose, "utf8")) : { modules: {}, placements: [] };
const keep = (k) => k.startsWith("fill-");
writeFileSync(compose, JSON.stringify({ note: spec.note, modules: { ...Object.fromEntries(Object.entries(old.modules).filter(([k]) => keep(k))), ...modules },
  placements: [...old.placements.filter((p) => keep(p.module ?? "")), ...placements] }, null, 1) + "\n");
console.log(`compose: ${placements.length} kit placements`);
