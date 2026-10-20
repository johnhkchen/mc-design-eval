// Kit briefs and compose placements for the Brooklyn Bridge and DUMBO, from one spec (kits.json). Three kinds of plot:
//   module plots ("size": [W, D, H]): a bridge module built square, every coordinate given in the spec's text; y 0 is
//     the East River's surface (world y WATER), dropped on placement so the river stays
//   turned footprint plots ("id", "turn"): a DUMBO building on DUMBO's street grid, which lies 46.1 degrees off the place's
//     axes (the place is turned to the bridge): drawn square in its own frame (north = true north, Water Street along x)
//     as a footprint map with its ground and lidar roof heights; placed turned back onto the footprint (centre mode)
//   the bridges' placements are computed here (sections along the deck, cables over them, towers, anchorages, approach):
//     the Brooklyn Bridge runs straight along z at x 723..740; the Manhattan Bridge's straight layout is turned as one
//     group (place.mjs turn) onto its real line, 20.6 degrees off z
//   node work/nyc/brooklyn-bridge/briefs.mjs [kit]  -> runs/brooklyn-bridge/<kit>-kit/brief.txt, places/nyc/brooklyn-bridge.compose.json
//     (fill placements already in the compose file are kept)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
const R = "/Volumes/ext1/swe/repos/mc-design-eval", A = `${R}/apps/irl-copy`, P = "nyc/brooklyn-bridge", RUNS = `${R}/benchmarks/plugin-baseline/runs/brooklyn-bridge`;
const m = JSON.parse(readFileSync(`${A}/out/${P}/manifest.json`, "utf8")), place = JSON.parse(readFileSync(`${A}/places/${P}.json`, "utf8")), sc = place.scale, N = m.size[0];
const f32 = (r) => new Float32Array(readFileSync(`${A}/.cache/${P}/usgs-lidar.lidar.${r}.f32`).buffer.slice(0));
const G = f32("ground"), S = f32("surface");
let lo = Infinity; for (const v of G) lo = Math.min(lo, v * sc);
const floor = Math.floor(lo) - Math.round(4 * sc), ground = (x, z) => Math.round(G[z * N + x] * sc) - floor, surf = (x, z) => Math.round(S[z * N + x] * sc) - floor;
export const WATER = 5;                        // the river's top water block (build.mjs: the sea's median lidar ground, levelled)
const spec = JSON.parse(readFileSync(new URL("./kits.json", import.meta.url), "utf8"));
const byId = new Map(m.buildings.map((b) => [b.id, b])), boxOf = (cells) => { const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
  return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]; };

// a footprint in its own square frame turned back by deg (as bin/fill.mjs --turn): local cells with their world cells
export function turned(b, deg) {
  const n = b.footprint.length, cx = b.footprint.reduce((a, f) => a + f[0], 0) / n + 0.5, cz = b.footprint.reduce((a, f) => a + f[1], 0) / n + 0.5;
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), set = new Set(b.footprint.map(([x, z]) => `${x},${z}`));
  const uv = b.footprint.map(([x, z]) => { const dx = x + 0.5 - cx, dz = z + 0.5 - cz; return [dx * c + dz * s, -dx * s + dz * c]; });
  const us = uv.map((p) => p[0]), vs = uv.map((p) => p[1]), W = Math.round(Math.max(...us) - Math.min(...us)) + 1, D = Math.round(Math.max(...vs) - Math.min(...vs)) + 1;
  const uc = (Math.max(...us) + Math.min(...us)) / 2, vc = (Math.max(...vs) + Math.min(...vs)) / 2, cells = [];
  for (let lz = 0; lz < D; lz++) for (let lx = 0; lx < W; lx++) {
    const u = uc + lx + 0.5 - W / 2, v = vc + lz + 0.5 - D / 2, wx = Math.floor(cx + u * c - v * s), wz = Math.floor(cz + u * s + v * c);
    if (set.has(`${wx},${wz}`)) cells.push([lx, lz, wx, wz]);
  }
  return { cells, W, D, shift: [+(uc * c - vc * s).toFixed(3), +(uc * s + vc * c).toFixed(3)] };
}

const modules = {}, placements = [], only = process.argv[2];
const runFile = (kit) => `../../benchmarks/plugin-baseline/runs/brooklyn-bridge/${kit.key}-kit/${kit.file ?? "build.nbt"}`;
for (const kit of spec.kits) {
  let px = 0; const plots = [], maps = [];
  for (const [i, p] of kit.plots.entries()) {
    const key = `${kit.key}-${i}`;
    if (p.size) {
      const [W, D, H] = p.size;
      plots.push(` plot ${i}, x ${px}..${px + W - 1}, z 0..${D - 1} (${W} x ${D}), up to y ${H}: ${p.label}: ${p.text}`);
      modules[key] = { file: runFile(kit), plot: [px, 0, px + W - 1, D - 1] };
      px += W + 4; continue;
    }
    const b = byId.get(p.id); if (!b) throw new Error(`${kit.key}: no building ${p.id}`);
    const T = turned(b, p.turn), base = Math.min(...b.footprint.map(([x, z]) => ground(x, z)));
    const cap = b.base + Math.round(((b.peak ?? Infinity) + 1) * sc), roofAt = (x, z) => Math.max(ground(x, z), Math.min(surf(x, z), cap)) - base;
    const roof = Math.max(...T.cells.map(([, , x, z]) => roofAt(x, z))), top = p.maxY ?? roof + 10;
    const at = new Map(T.cells.map(([lx, lz, x, z]) => [`${lx},${lz}`, [x, z]]));
    const k = Math.max(1, Math.ceil(Math.max(T.W, T.D) / 46)), mask = [], gmap = [], rmap = [];
    for (let z = 0; z < T.D; z += k) { let s = "", g = [], r = []; for (let x = 0; x < T.W; x += k) {
      const gs = [], rs = []; for (let dz = 0; dz < k; dz++) for (let dx = 0; dx < k; dx++) { const w = at.get(`${x + dx},${z + dz}`); if (w) { gs.push(ground(...w)); rs.push(roofAt(...w)); } }
      rs.sort((a, q) => a - q);
      s += gs.length * 2 >= k * k ? "#" : "."; g.push(gs.length ? String(Math.max(...gs) - base).padStart(4) : "   ."); r.push(rs.length ? String(rs[rs.length >> 1]).padStart(4) : "   ."); }
      mask.push(s); gmap.push(g.join("")); rmap.push(r.join("")); }
    plots.push(` plot ${i}, x ${px}..${px + T.W - 1}, z 0..${T.D - 1} (${T.W} x ${T.D}), up to y ${top}: ${p.label}: ${p.text}`);
    maps.push(`PLOT ${i} (${p.label}): ${T.W} x ${T.D}; y 0 = its lowest ground; the real roofs reach about y ${roof} (lidar); 1 column = ${k}x${k} blocks\n`
      + `FOOTPRINT (# = build here, nothing outside it):\n${mask.join("\n")}\nGROUND above y 0 (highest ground in each cell; build down to it, never float or bury):\n${gmap.join("\n")}`
      + `\nROOF HEIGHT above y 0 (lidar, median in each cell: the real massing and its setbacks):\n${rmap.join("\n")}`);
    modules[key] = { file: runFile(kit), plot: [px, 0, px + T.W - 1, T.D - 1] };
    placements.push({ building: b.id, module: key, mode: "centre", angle: p.turn, shift: T.shift, y: base - b.base });
    px += T.W + 4;
  }
  const brief = `${kit.intro}\n\n${spec.common}\n\n${kit.frame ?? ""}\n\nPlots along x, each standing at its own y 0:\n${plots.join("\n")}${maps.length ? `\n\n${maps.join("\n\n")}` : ""}\n\n${spec.closing}\n`;
  if (!only || only === kit.key) { mkdirSync(`${RUNS}/${kit.key}-kit`, { recursive: true }); writeFileSync(`${RUNS}/${kit.key}-kit/brief.txt`, brief.replace(/\n{3,}/g, "\n\n")); }
  console.log(`${kit.key}: ${kit.plots.length} plots, ${brief.length} chars`);
}

// --- the Brooklyn Bridge: straight along z, deck x 723..740 (deck-local x 0..17), all by offset from one reference footprint
const REF = byId.get("NYC3346104"), [rx, rz] = boxOf(REF.footprint), ry = (kitY) => WATER + kitY - REF.base;   // module y 0 = the water's surface
const DECK_X = 723;
const bb = (module, x, z, { quarter = 0, y = 0, keep = true } = {}) => ({ building: REF.id, module, mode: "at", at: [x - rx, z - rz], y: ry(y), quarter, keep, ground: false, bridge: "brooklyn" });
const lidarRoad = (z) => { const v = []; for (let x = DECK_X; x <= DECK_X + 17; x++) v.push(S[z * N + x]); v.sort((a, q) => a - q); return Math.round(v[v.length >> 1] * sc); };
const BB = [];
BB.push(bb("bb-0", DECK_X - 8, 670), bb("bb-0", DECK_X - 8, 1010));                                 // towers, centres z 679.5 and 1019.5
for (let k = 0; k < 20; k++) BB.push(bb("bb-1", DECK_X, 690 + 16 * k, { y: Math.abs(k - 9.5) < 7 ? 1 : 0 }));  // main span, crowned
const sideDrop = (k) => Math.round((7 * (k + 0.5)) / 11);                                          // side spans: road 27 at the tower to 20
for (let k = 0; k < 11; k++) { BB.push(bb("bb-1", DECK_X, 1030 + 16 * k, { y: -sideDrop(k) })); BB.push(bb("bb-1", DECK_X, 654 - 16 * k, { y: -sideDrop(k), quarter: 2 })); }
BB.push(bb("bb-2", DECK_X, 850), bb("bb-2", DECK_X, 690, { quarter: 2 }));                          // main-span cables, mid-span at z 849.5
BB.push(bb("bb-3", DECK_X, 1030), bb("bb-3", DECK_X, 494, { quarter: 2 }));                         // side-span cables
BB.push(bb("bb-4", DECK_X - 8, 1206), bb("bb-4", DECK_X - 8, 464, { quarter: 2 }));                 // anchorages (road on top at kit y 20)
// the approaches: masonry sections whose road (module y 20) follows the lidar's deck, down to the street
for (let z = 1236; z + 15 < N; z += 16) BB.push(bb("bb-5", DECK_X, z, { y: Math.min(0, lidarRoad(z + 8) - 20) }));
for (let z = 448; z >= 176; z -= 16) BB.push(bb("bb-5", DECK_X, z, { y: Math.min(0, lidarRoad(z + 8) - 20), quarter: 2 }));

// --- the Manhattan Bridge: laid out straight along z about its Brooklyn tower's centre (s = 0, Manhattan toward low z),
// then turned 20.6 degrees as one group. Deck 24 wide (local x 0..23); tower boxes 28 x 12; deck sections 12 long; main
// span 300 between tower faces (two 150 cable halves); side spans 144 to the anchorages (34 x 40)
const MB_ANGLE = 20.6, MB_PIVOT = [996.4, 1160.8], MB_X = Math.round(MB_PIVOT[0]) - 12, TZ = Math.round(MB_PIVOT[1]);   // deck x MB_X..MB_X+23
const MB_BOX = [MB_X - 30, TZ - 312 - 6 - 144 - 40 - 40, MB_X + 54, TZ + 6 + 144 + 40 + 10];
const mb = (module, x, z, { quarter = 0, y = 0 } = {}) => ({ building: REF.id, module, mode: "at", at: [x - rx, z - rz], y: ry(y), quarter, keep: true, ground: false,
  turn: { angle: MB_ANGLE, pivot: MB_PIVOT, box: MB_BOX } });
const MB = [];
const towerZ = [TZ - 6, TZ - 312 - 6];                                                             // tower boxes (12 deep), centres TZ and TZ - 312
for (const z of towerZ) MB.push(mb("mb-0", MB_X - 2, z));
for (let k = 0; k < 25; k++) MB.push(mb("mb-1", MB_X, TZ - 6 - 300 + 12 * k));                     // main span
for (let k = 0; k < 12; k++) { MB.push(mb("mb-1", MB_X, TZ + 6 + 12 * k, { y: -Math.round((2 * (k + 0.5)) / 12) }));
  MB.push(mb("mb-1", MB_X, TZ - 318 - 12 - 12 * k, { y: -Math.round((2 * (k + 0.5)) / 12) })); }
MB.push(mb("mb-2", MB_X, TZ - 6 - 150), mb("mb-2", MB_X, TZ - 6 - 300, { quarter: 2 }));            // main cables: local z 0 at mid-span
MB.push(mb("mb-3", MB_X, TZ + 6), mb("mb-3", MB_X, TZ - 318 - 144, { quarter: 2 }));                 // side cables: local z 0 at the tower face
MB.push(mb("mb-4", MB_X - 5, TZ + 150), mb("mb-4", MB_X - 5, TZ - 318 - 144 - 40, { quarter: 2 })); // anchorages, local z 0 toward the bridge

const compose = `${A}/places/${P}.compose.json`, old = existsSync(compose) ? JSON.parse(readFileSync(compose, "utf8")) : { modules: {}, placements: [] };
const keep = (k) => k.startsWith("fill-") || k.startsWith("gen-");
const fillMods = Object.fromEntries(Object.entries(old.modules).filter(([k]) => keep(k)));
const fillPl = old.placements.filter((p) => keep(p.module ?? ""));
// order: fill, then the DUMBO kits, then the bridges over everything
writeFileSync(compose, JSON.stringify({ note: spec.note, modules: { ...modules, ...fillMods }, placements: [...fillPl, ...placements, ...BB, ...MB] }, null, 1) + "\n");
console.log(`compose: ${placements.length} kit placements, ${BB.length} Brooklyn Bridge, ${MB.length} Manhattan Bridge, ${fillPl.length} kept`);
