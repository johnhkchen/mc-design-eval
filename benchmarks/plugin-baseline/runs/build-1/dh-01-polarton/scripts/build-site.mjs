// Build the agreed site into the export: streets, levelled pads with retaining walls, accessible driveways, fences and
// gates like the village's, field tracks. Writes after.nbt (whole area) and changes.nbt (only what changed, with explicit
// air where earth was dug), in the export's own frame.
import { computeLayout } from "./layout.mjs";
import { GRADE } from "./site.mjs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { slabProfile } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/terrain.mjs";
import { rampProfile, rampLength, approachReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/approach.mjs";
import { writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? "out";
const L = computeLayout(), { site, streets, plots, extras } = L, { g, X, Z, H } = site;
const before = g.clone(), Y = g.size[1];
const strip = (b) => String(b ?? "air").replace(/^minecraft:/, "");
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const LOGISH = /_log$|_wood$|mushroom_stem|_stem$/, LEAFY = /leaves|mushroom_block/, PLANTY = /plants|grass$|fern|flower|tulip|poppy|dandelion|bush|azalea|sprouts|cucumbers|twigs|rocks$|leaf_pile|fallen_leaves|bark_mushroom|mushroom$|nodule|cobweb|vine|tall_grass|giant_tall_grass|dead_bush|sapling/;
const MASONRY = (x, y, z) => { const r = hash(x, y, z); return r < 0.18 ? "mossy_stone_bricks" : r < 0.27 ? "cracked_stone_bricks" : "stone_bricks"; };
const STEP_SLAB = "mud_brick_slab";

// ---- target surface per column: { t (top block y relative to grade; .5 = a slab over a full block), kind, surf } -----
const T = new Map(); const K = (x, z) => `${x},${z}`;
const OUTD = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const setT = (x, z, t, kind, surf, prio) => { if (x < 0 || z < 0 || x >= X || z >= Z) return; const o = T.get(K(x, z)); if (o && o.prio > prio) return; T.set(K(x, z), { t, kind, surf, prio }); };

// streets: re-profile each centre line at 1-block spacing under the approach standard (half steps, 3 then a landing)
const streetCells = new Map();
for (const st of streets) {
  const P = st.pts.filter((_, i) => i % 2 === 0), Ys = st.y.filter((_, i) => i % 2 === 0);
  const s = st.spec;
  // a street that starts or ends on one already laid takes its height there, and stays level for its first and last
  // few blocks (a landing across the junction, so no step where the two meet)
  const onStreet = ([px, pz]) => streetCells.get(K(Math.round(px), Math.round(pz)))?.t;
  let y0 = s.from?.[3] ?? s.startY ?? s.level ?? onStreet(P[0]) ?? null, y1 = s.endY ?? s.level ?? onStreet(P.at(-1)) ?? null;
  if (y0 != null) y0 = Math.round(y0 * 2) / 2; if (y1 != null) y1 = Math.round(y1 * 2) / 2;
  const LAND = 5, headL = y0 != null && s.from?.[3] == null ? LAND : 0, tailL = y1 != null ? LAND : 0;
  const mid = slabProfile(Ys.slice(headL, Ys.length - tailL), { startY: y0, endY: y1 });
  const prof = [...Array(headL).fill(y0), ...mid, ...Array(tailL).fill(y1)];
  st.prof = prof; st.P = P;
  for (let i = 0; i < P.length; i++) { const [px, pz] = P[i];
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const cx = Math.round(px) + dx, cz = Math.round(pz) + dz, d = Math.hypot(cx - px, cz - pz); if (d > 2.5) continue;
      const k = K(cx, cz), o = streetCells.get(k); if (!o || o.d > d) streetCells.set(k, { x: cx, z: cz, t: prof[i], d, off: d, st: st.name }); } }
}
// where a curving street's cells meet cells of a centre point two steps on (or another street), lower the higher to
// within half a block of its neighbour, until no step over half a block is left
for (let pass = 0, changed = true; changed && pass < 40; pass++) { changed = false;
  for (const c of streetCells.values()) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = streetCells.get(K(c.x + dx, c.z + dz)); if (n && c.t - n.t > 0.5) { c.t = n.t + 0.5; changed = true; } } }
// the cross-section like the lanes: gravel down the middle, dirt path either side, coarse dirt at the edges
for (const c of streetCells.values()) { if (c.x >= 82) continue; const surf = c.d < 0.75 ? "gravel" : c.d < 1.75 ? "dirt_path" : "coarse_dirt"; setT(c.x, c.z, c.t, "street", surf, 3); }

// an extra plot's gate goes in the middle of the side that faces its street (not at a corner, where the post stands)
for (const e of extras.filter((e) => e.kind !== "park")) {
  const face = faceOf(e), [ox, oz] = OUTD[face];
  const mid = ox ? [face === "west" ? e.x0 - 1 : e.x1 + 1, Math.floor((e.z0 + e.z1) / 2) - 0] : [Math.floor((e.x0 + e.x1) / 2) - 1, face === "north" ? e.z0 - 1 : e.z1 + 1];
  for (let k = 0; k <= 12; k++) { if (streetCells.has(K(mid[0] + ox * k, mid[1] + oz * k)) && streetCells.has(K(mid[0] + ox * k + (ox ? 0 : 1), mid[1] + oz * k + (ox ? 1 : 0)))) { e.gate = mid; e.track = k; break; } }
}
// the streets' final heights can differ from the planning ones: re-fit each pad so its driveway ramp still fits
for (const p of [...plots, ...extras.filter((e) => e.kind === "small build")]) {
  const face = p.face ?? faceOf(p), [ox, oz] = OUTD[face], len = p.setback ?? p.track ?? 0;
  let hit = null;
  for (const k of [len, len + 1, len - 1, len + 2]) { if (k < 0) continue; hit = streetCells.get(K(p.gate[0] + ox * k, p.gate[1] + oz * k)) ?? streetCells.get(K(p.gate[0] + ox * k + (ox ? 0 : 1), p.gate[1] + oz * k + (ox ? 1 : 0))); if (hit) { if (k !== len) { if (p.setback != null) p.setback = k; else p.track = k; } break; } }
  if (!hit) { console.error("no street at driveway end", p.x0, p.z0); continue; }
  p.road = hit.t; const len2 = p.setback ?? p.track ?? 0;
  if (rampLength(p.pad - p.road) > len2) { const opts = [-3, -2, -1, 0, 1, 2, 3].map((o) => Math.round(p.road) + o).filter((y) => rampLength(y - p.road) <= len2).sort((a, b) => Math.abs(a - p.pad) - Math.abs(b - p.pad)); console.error(`pad ${p.x0},${p.z0}: ${p.pad} -> ${opts[0]} (street ${p.road}, driveway ${len2})`); p.pad = opts[0]; }
  p.ramp = rampProfile(p.road, p.pad, len2);
}
// module plots and small builds: a level pad, grass, fenced; driveways from the street to the gate
const fenced = [], drives = [];
const pads = [...plots.map((p) => ({ ...p, kind: "module" })), ...extras.filter((e) => e.kind === "small build" || e.kind === "farm").map((e) => ({ ...e, face: faceOf(e) }))];
function faceOf(e) { if (e.gate[1] < e.z0) return "north"; if (e.gate[1] > e.z1) return "south"; if (e.gate[0] < e.x0) return "west"; return "east"; }
for (const p of pads) {
  for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= p.x1; x++) setT(x, z, p.pad, "pad", p.kind === "farm" ? "farm" : "grass_block", 2);
  fenced.push(p);
}
// driveways (module plots and small builds): 3 wide from the gate out to the street, the ramp profile from the street end
for (const p of [...plots, ...extras.filter((e) => e.kind === "small build")]) {
  const face = p.face ?? faceOf(p), [ox, oz] = OUTD[face];
  const len = p.setback ?? p.track ?? 0, roadY = p.road;
  const prof = p.ramp ?? rampProfile(roadY, p.pad, len);
  const along = ox ? [0, 1] : [1, 0];
  for (let k = 0; k < len; k++) { const y = prof[len - 1 - k];
    for (const d of [0, 1, 2]) { const x = p.gate[0] + ox * k + along[0] * d, z = p.gate[1] + oz * k + along[1] * d; setT(x, z, y, "drive", "dirt_path", 4); } }
  drives.push({ p, face, len, prof });
}
// field tracks to farms and pastures: 2 wide, ground-following by half steps
for (const e of extras.filter((e) => (e.kind === "farm" || e.kind === "pasture") && e.track > 0)) {
  const face = faceOf(e), [ox, oz] = OUTD[face], along = ox ? [0, 1] : [1, 0];
  const hs = []; for (let k = 0; k < e.track; k++) hs.push(H[e.gate[1] + oz * k][e.gate[0] + ox * k]);
  const entry = e.kind === "farm" ? e.pad : H[e.gate[1] - oz][e.gate[0] - ox];
  const prof = slabProfile([entry, ...hs, e.road].reverse(), { startY: e.road, endY: entry }).reverse().slice(1, -1);
  for (let k = 0; k < e.track; k++) for (const d of [0, 1]) setT(e.gate[0] + ox * k + along[0] * d, e.gate[1] + oz * k + along[1] * d, prof[k], "track", "coarse_dirt", 1);
}

// ---- clear trees that stand on or overhang what we level ---------------------------------------------------------
const removeLog = new Set(), keyC = (x, y, z) => `${x},${y},${z}`;
for (const [k, v] of T) { const [x, z] = k.split(",").map(Number); for (let y = 0; y < Y; y++) { const b = strip(g.blockAt(x, y, z)); if (LOGISH.test(b) && y > GRADE + Math.floor(v.t) - 2) removeLog.add(keyC(x, y, z)); } }
// whole trunks: logs connected to a removed log
const q = [...removeLog].map((s) => s.split(",").map(Number));
while (q.length) { const [x, y, z] = q.pop(); for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[1,1,0],[-1,1,0],[0,1,1],[0,1,-1]]) { const nx = x + dx, ny = y + dy, nz = z + dz; if (!g.inBounds(nx, ny, nz)) continue; const kk = keyC(nx, ny, nz); if (removeLog.has(kk) || !LOGISH.test(strip(g.blockAt(nx, ny, nz)))) continue; if (ny <= GRADE + (H[nz][nx] ?? 0) - 1) continue; removeLog.add(kk); q.push([nx, ny, nz]); } }
const keptLogs = []; for (const c of g.cells.values()) if (LOGISH.test(strip(c.block)) && !removeLog.has(keyC(...c.pos))) keptLogs.push(c.pos);
const remLogs = [...removeLog].map((s) => s.split(",").map(Number));
const near = (list, x, y, z, r) => { let best = Infinity; for (const [a, b, c] of list) { const d = Math.max(Math.abs(a - x), Math.abs(b - y) * 0.6, Math.abs(c - z)); if (d < best) best = d; if (best <= 1) break; } return best <= r ? best : Infinity; };
const removeLeaf = new Set();
for (const c of g.cells.values()) { const b = strip(c.block); if (!LEAFY.test(b) || String(c.state?.persistent) === "true") continue; const [x, y, z] = c.pos;
  const dr = near(remLogs, x, y, z, 5); if (dr === Infinity) continue; const dk = near(keptLogs, x, y, z, 5); if (dk <= dr) continue; removeLeaf.add(keyC(x, y, z)); }
for (const s of [...removeLog, ...removeLeaf]) { const [x, y, z] = s.split(",").map(Number); g.set(x, y, z, "air"); }

// ---- earthworks: cut and fill each column to its target, surface on top --------------------------------------------
let cut = 0, fill = 0;
for (const [k, v] of T) { const [x, z] = k.split(",").map(Number); const top = GRADE + Math.floor(v.t), slab = v.t % 1 !== 0, gy = GRADE + H[z][x];
  for (let y = top + 1; y < Y; y++) { const b = strip(g.blockAt(x, y, z)); if (b === "air") continue; if (y <= gy || PLANTY.test(b) || (LEAFY.test(b) && y <= top + 3) || b === "snow") { if (y <= gy) cut++; g.set(x, y, z, "air"); } }
  for (let y = Math.max(0, gy + 1); y < top; y++) { g.set(x, y, z, "dirt"); fill++; }
  if (top > gy) fill++;
  const surf = v.surf === "farm" ? "grass_block" : v.surf;
  g.set(x, top, z, slab ? "dirt" : surf, surf === "grass_block" && !slab ? { snowy: "false" } : undefined);
  if (slab) g.set(x, top + 1, z, STEP_SLAB, { type: "bottom", waterlogged: "false" });
  // a surface over a dug column: dirt under grass and paths
  if (top - 1 >= 0 && /^(air|water)$/.test(strip(g.blockAt(x, top - 1, z)))) g.set(x, top - 1, z, "dirt");
}

// ---- retaining walls: where neighbouring final tops differ by 2 or more, the higher column is masonry down to the lower
const finalTop = (x, z) => { const v = T.get(K(x, z)); return v ? Math.floor(v.t) : H[z]?.[x]; };
let wallCells = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < 82; x++) { if (!T.has(K(x, z))) {
  // an untouched bank next to a cut: its face becomes masonry
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = T.get(K(x + dx, z + dz)); if (!v) continue; const lo = Math.floor(v.t), hi = H[z][x]; if (hi - lo < 2 || hi < -4) continue;
    for (let y = GRADE + lo + 1; y <= GRADE + hi; y++) { g.set(x, y, z, MASONRY(x, y, z)); wallCells++; } }
  continue; }
  const v = T.get(K(x, z)); if (v.kind === "street" || v.kind === "drive" || v.kind === "track") {
    // a street or driveway on fill: its edge column is masonry where the ground beside drops 2 or more
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = finalTop(x + dx, z + dz); if (n == null) continue; if (Math.floor(v.t) - n >= 2 && !T.has(K(x + dx, z + dz))) { for (let y = GRADE + n + 1; y < GRADE + Math.floor(v.t); y++) { g.set(x, y, z, MASONRY(x, y, z)); wallCells++; } } }
    continue; }
  // a pad above its neighbour: its edge is a plinth of masonry
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = finalTop(x + dx, z + dz); if (n == null || n < -4) continue; if (Math.floor(v.t) - n >= 2) { for (let y = GRADE + n + 1; y <= GRADE + Math.floor(v.t); y++) { g.set(x, y, z, MASONRY(x, y, z)); wallCells++; } } }
}

// ---- fences, gates and lantern posts like the village's (spruce fence, 2-wide gate, fence-post lanterns) ------------
const fenceAt = new Set();
for (const p of [...pads, ...extras.filter((e) => e.kind === "pasture").map((e) => ({ ...e, face: faceOf(e), follow: true }))]) {
  const face = p.face ?? faceOf(p), [ox, oz] = OUTD[face];
  const gateCells = new Set([K(p.gate[0] - ox, p.gate[1] - oz), K(p.gate[0] - ox + (ox ? 0 : 1), p.gate[1] - oz + (ox ? 1 : 0))]);
  const ring = []; for (let x = p.x0; x <= p.x1; x++) ring.push([x, p.z0], [x, p.z1]); for (let z = p.z0 + 1; z < p.z1; z++) ring.push([p.x0, z], [p.x1, z]);
  for (const [x, z] of ring) { const top = GRADE + finalTop(x, z) + (T.get(K(x, z))?.t % 1 ? 1 : 0), y = top + 1; if (!g.inBounds(x, y, z)) continue;
    if (gateCells.has(K(x, z))) { g.set(x, y, z, "spruce_fence_gate", { facing: face, open: "false", in_wall: "false", powered: "false" }); continue; }
    g.set(x, y, z, "spruce_fence", {}); fenceAt.add(keyC(x, y, z)); }
  // lantern posts at the two front corners (3 fences and a lantern, as at the village's lane corners)
  const corners = face === "north" ? [[p.x0, p.z0], [p.x1, p.z0]] : face === "south" ? [[p.x0, p.z1], [p.x1, p.z1]] : face === "west" ? [[p.x0, p.z0], [p.x0, p.z1]] : [[p.x1, p.z0], [p.x1, p.z1]];
  if (p.kind === "module" || p.kind === "small build") for (const [x, z] of corners) { const y = GRADE + finalTop(x, z) + 1; for (const dy of [1, 2]) { g.set(x, y + dy, z, "spruce_fence", {}); fenceAt.add(keyC(x, y + dy, z)); } g.set(x, y + 3, z, "lantern", { hanging: "false", waterlogged: "false" }); }
}
// fence connections
const connects = (x, y, z) => { const b = strip(g.blockAt(x, y, z)); return /fence|fence_gate/.test(b) || /bricks|planks|stone$|cobblestone/.test(b); };
for (const s of fenceAt) { const [x, y, z] = s.split(",").map(Number); g.set(x, y, z, "spruce_fence", { north: String(connects(x, y, z - 1)), south: String(connects(x, y, z + 1)), east: String(connects(x + 1, y, z)), west: String(connects(x - 1, y, z)), waterlogged: "false" }); }

// ---- tree remnants left floating by the clearing (leaves, vines, cap blocks, branch logs): remove them -------------
const looseOf = (grid) => { const solids = [...grid.cells.values()].filter((c) => !/air$|water|lava/.test(strip(c.block))); const at = new Set(solids.map((c) => c.pos.join(",")));
  const seen = new Set(), q = []; for (const c of solids) if (c.pos[1] === 0) { seen.add(c.pos.join(",")); q.push(c.pos); }
  while (q.length) { const [x, y, z] = q.pop(); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 2) continue; const nk = `${x + dx},${y + dy},${z + dz}`; if (at.has(nk) && !seen.has(nk)) { seen.add(nk); q.push([x + dx, y + dy, z + dz]); } } }
  return new Set(solids.filter((c) => !seen.has(c.pos.join(","))).map((c) => c.pos.join(","))); };
const wasLoose = looseOf(before); let remnants = 0;
for (const k of looseOf(g)) { if (wasLoose.has(k)) continue; const [x, y, z] = k.split(",").map(Number); if (/leaves|vine|mushroom|_log$|_wood$|_stem$|leaf/.test(strip(g.blockAt(x, y, z)))) { g.set(x, y, z, "air"); remnants++; } }

// ---- checks: street steps, driveway approaches (street to gate), what changed -------------------------------------
let bigSteps = 0; const stepAt = [];
for (const [k, v] of T) { if (v.kind !== "street" && v.kind !== "drive") continue; const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of [[1, 0], [0, 1]]) { const n = T.get(K(x + dx, z + dz)); if (!n || (n.kind !== "street" && n.kind !== "drive")) continue; if (Math.abs(n.t - v.t) > 0.5) { bigSteps++; if (stepAt.length < 6) stepAt.push(`${x},${z}:${v.t}->${n.t}`); } } }
const approach = drives.map(({ p, face, len }) => { const [ox, oz] = OUTD[face], gx = p.gate[0] + 1 - ox * 0, gz = p.gate[1];
  const inside = [p.gate[0] - ox * 2 + (ox ? 0 : 1), GRADE + p.pad + 1, p.gate[1] - oz * 2 + (ox ? 1 : 0)];
  const out = [p.gate[0] + ox * (len + 1) + (ox ? 0 : 1), 0, p.gate[1] + oz * (len + 1) + (ox ? 1 : 0)];
  const tv = T.get(K(out[0], out[2])); out[1] = GRADE + Math.floor(tv?.t ?? p.road) + 1 + ((tv?.t ?? 0) % 1 ? 0.5 : 0);
  // walk from the street to a cell inside the gate (the pad), under the approach standard (gate cell as the "door")
  const r = approachReport(g, { from: [out[0], Math.floor(out[1]), out[2]], to: inside, width: 2 });
  return { plot: `${p.x0},${p.z0}`, face, len, ok: r.ok, faults: r.faults.map((f) => f.kind) };
});
const changes = new Grid(g.size, { dataVersion: g.dataVersion });
let added = 0, removed = 0;
const keys = new Set([...g.cells.keys(), ...before.cells.keys()]);
for (const k of keys) { const a = before.cells.get(k), b = g.cells.get(k); const an = a ? strip(a.block) + JSON.stringify(a.state ?? {}) : "air{}", bn = b ? strip(b.block) + JSON.stringify(b.state ?? {}) : "air{}"; if (an === bn) continue;
  const [x, y, z] = k.split(",").map(Number); if (!b || /^air$/.test(strip(b.block))) { changes.set(x, y, z, "air"); removed++; } else { changes.set(x, y, z, b.block, b.state); added++; } }
g.save(`${OUT}/after.nbt`); changes.save(`${OUT}/changes.nbt`);
const report = { streets: streets.map((s) => ({ name: s.name, length: s.P.length, from: s.prof[0], to: s.prof.at(-1) })), modulePlots: plots.length, extras: extras.map((e) => e.kind), earth: { cut, fill }, retainingWallBlocks: wallCells, treesCleared: { logs: removeLog.size, leaves: removeLeaf.size, floatingRemnants: remnants }, streetStepsOver05: bigSteps, stepExamples: stepAt, driveways: approach, changes: { placed: added, dug: removed } };
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
writeFileSync(`${OUT}/layout.json`, JSON.stringify({ frame: "export (polarton_expansion_001_xl.nbt), y = grade 5 at the lanes", streets: streets.map((s) => ({ name: s.name, centre: s.P.map(([x, z], i) => [+x.toFixed(1), z === undefined ? 0 : +z.toFixed(1), s.prof[i]]) })), plots: plots.map((p) => ({ x0: p.x0, z0: p.z0, x1: p.x1, z1: p.z1, face: p.face, pad: GRADE + p.pad, gate: p.gate, driveway: p.setback })), extras: extras.map((e) => ({ kind: e.kind, x0: e.x0, z0: e.z0, x1: e.x1, z1: e.z1, gate: e.gate })) }, null, 1));
console.log(JSON.stringify(report, null, 1));
