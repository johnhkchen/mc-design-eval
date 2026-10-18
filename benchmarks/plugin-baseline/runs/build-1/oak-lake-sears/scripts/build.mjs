// Build the Oak Lake master plan into the land export: streets (half steps only, sidewalks, the avenue's planted
// strip), level house lots at their street's height, the athletic fields and courts, the shore path and trails, the
// swimming beach, docks and the boat launch. Changes as little as it can: trees are felled only where something is
// built, and nothing outside the plan's footprint is touched.
//   node build.mjs [outDir]  -> land.nbt (the built neighbourhood without houses), land-changes.nbt (only the changed
//   cells, explicit air where earth or trees were cleared), build.json (lots with their final pads, counts)
import { computePlan } from "./layout.mjs";
import { GRADE } from "./site.mjs";
import { slabProfile } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/terrain.mjs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? new URL("../delivery", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const P = computePlan(), { site, streets, PARK, lots } = P, { g, X, Z, H, water } = site;
const before = g.clone(), Y = g.size[1], K = (x, z) => `${x},${z}`, AT = (t) => t + GRADE;
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z;
const PLANT = /leaves|_log$|_wood$|short_grass|tall_grass|fern|flower|tulip|poppy|dandelion|bush|sapling|vine|mushroom|lily|orchid|allium|cornflower|daisy|rose|peony|lilac|sunflower|sweet_berry/;
const hash = (x, z) => { let h = (x * 73856093) ^ (z * 83492791); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---- what each built cell becomes: a top height t (half blocks allowed) and its surface ----------------------------
const T = new Map(); // key -> { t, top, slab, prio }
const put = (x, z, t, top, slab, prio) => { if (!inside(x, z)) return; const o = T.get(K(x, z)); if (o && o.prio > prio) return; T.set(K(x, z), { t, top, slab, prio }); };

// streets: each centre line's smoothed heights in half steps (3 then a landing), every cell the height of its nearest
// point; then where streets meet, the higher cell comes down to within half a block of its neighbour
// (a street that starts or ends on one already laid takes that street's height there: the avenue and Lake Drive go
// first, the side streets after them)
const sc = new Map(), main = (st) => (st.kind === "avenue" ? 0 : st.kind === "drive" && st.name.startsWith("Lake") ? 1 : 2);
for (const st of [...streets].sort((a, b) => main(a) - main(b))) {
  const on = ([x, z]) => { let best = null; for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = sc.get(K(Math.round(x) + dx, Math.round(z) + dz)); if (c && c.st !== st && (!best || Math.abs(dx) + Math.abs(dz) < best.d)) best = { t: c.t, d: Math.abs(dx) + Math.abs(dz) }; } return best?.t; };
  const ys = st.y.filter((_, i) => i % 2 === 0), y0 = on(st.pts[0]), y1 = on(st.pts.at(-1));
  const prof = slabProfile(ys, { startY: y0, endY: y1 });
  for (const c of st.cells) { const t = prof[Math.min(prof.length - 1, c.i >> 1)], o = sc.get(K(c.x, c.z)); if (!o || o.d > c.d) sc.set(K(c.x, c.z), { ...c, t, st }); }
}
// each lot's frontage is level at one height (the walk meets the sidewalk with no step); the street between lots
// takes up the difference in half steps
// (only the near carriageway and sidewalk: the far side belongs to the lots across the street)
const front = (l) => { const w = sc.get(K(...l.gate))?.st.half ?? 2, out = [];
  for (const c of sc.values()) { const inSpan = l.face === "west" || l.face === "east" ? c.z >= l.z0 && c.z <= l.z1 : c.x >= l.x0 && c.x <= l.x1;
    const gap = l.face === "west" ? l.x0 - c.x : l.face === "east" ? c.x - l.x1 : l.face === "north" ? l.z0 - c.z : c.z - l.z1;
    if (inSpan && gap >= 1 && gap <= w) out.push(c); }
  return out; };
const base = new Map([...sc].map(([k, c]) => [k, c.t]));
const fronts = lots.map((l) => { const cs = front(l); return { l, cs, lv: cs.length ? Math.round(cs.reduce((a, c) => a + c.t, 0) / cs.length) : null }; });
// relax the free cells to within half a block of their neighbours; where a lot's front can't be reached in half steps
// in the street left between, move that front a block toward its neighbour and try again
for (let round = 0; round < 8; round++) {
  for (const [k, t] of base) { const c = sc.get(k); c.t = t; c.pinned = false; c.front = null; }
  for (const f of fronts) if (f.lv != null) for (const c of f.cs) { c.t = f.lv; c.pinned = true; c.front = f; }
  for (let pass = 0, changed = true; changed && pass < 4000; pass++) { changed = false;
    for (const c of sc.values()) { if (c.pinned) continue; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = sc.get(K(c.x + dx, c.z + dz)); if (!n) continue;
      if (c.t - n.t > 0.5) { c.t = n.t + 0.5; changed = true; } else if (n.t - c.t > 0.5) { c.t = n.t - 0.5; changed = true; } } } }
  const moved = new Set();
  for (const c of sc.values()) { if (!c.front || moved.has(c.front)) continue; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = sc.get(K(c.x + dx, c.z + dz));
    if (n && n.front !== c.front && Math.abs(n.t - c.t) > 0.5) { c.front.lv += Math.sign(n.t - c.t); moved.add(c.front); break; } } }
  if (!moved.size) break;
}
for (const f of fronts) f.l.frontLevel = f.lv;
// what's left at junctions: lower the higher free cell (or raise the lower) a half step at a time, locally
for (let pass = 0; pass < 30; pass++) { let n0 = 0;
  for (const c of sc.values()) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = sc.get(K(c.x + dx, c.z + dz)); if (!n || c.t - n.t <= 0.5) continue;
    if (!c.pinned) c.t -= 0.5; else if (!n.pinned) n.t += 0.5; else continue; n0++; }
  if (!n0) break; }
const steps = [...sc.values()].filter((c) => [[1, 0], [0, 1]].some(([dx, dz]) => { const n = sc.get(K(c.x + dx, c.z + dz)); return n && Math.abs(n.t - c.t) > 0.5; })).length;
if (steps) { const at = {}; for (const c of sc.values()) for (const [dx, dz] of [[1, 0], [0, 1]]) { const n = sc.get(K(c.x + dx, c.z + dz)); if (n && Math.abs(n.t - c.t) > 0.5) { const key = `${c.st.name.trim()}${c.pinned || n.pinned ? " (lot front)" : ""}`; (at[key] ??= []).push(`${c.x},${c.z}:${c.t}/${n.t}`); } }
  console.warn(`${steps} street cells still a full step from a neighbour:`, Object.entries(at).map(([k, v]) => `${k} ${v.length} e.g. ${v.slice(0, 3).join(" ")}`).join(" | ")); }
for (const c of sc.values()) {
  const half = c.st.half, edge = c.d > half - 0.5;
  if (half === 3 && c.d <= 0.5) put(c.x, c.z, Math.floor(c.t), "grass_block", null, 5);          // the avenue's planted strip
  else if (edge) put(c.x, c.z, c.t, "smooth_stone", "smooth_stone_slab", 5);                      // sidewalk
  else put(c.x, c.z, c.t, "gravel", "andesite_slab", 5);                                          // carriageway
}
// lots: level at the street's height where the front walk meets it, so the walk needs no step at the sidewalk
const built = lots.map((l, n) => {
  const gate = [l.gate, l.face === "west" || l.face === "east" ? [l.gate[0], l.gate[1] + 1] : [l.gate[0] + 1, l.gate[1]]];
  const ts = gate.map(([x, z]) => sc.get(K(x, z))?.t).filter((t) => t != null);
  const pad = l.frontLevel ?? (ts.length ? Math.floor(Math.min(...ts)) : l.pad);
  for (let z = l.z0; z <= l.z1; z++) for (let x = l.x0; x <= l.x1; x++) put(x, z, pad, "grass_block", null, 4);
  // the verge between the lot's front and the sidewalk (where the street curves away) comes to the lot's level too
  const [ox, oz] = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] }[l.face];
  for (let k = 1; k <= 3; k++) for (let j = 0; j < 16; j++) { const x = ox ? (ox < 0 ? l.x0 : l.x1) + ox * k : l.x0 + j, z = oz ? (oz < 0 ? l.z0 : l.z1) + oz * k : l.z0 + j;
    if (!sc.has(K(x, z))) put(x, z, pad, "grass_block", null, 4); }
  return { lot: n + 1, ...l, pad, plannedPad: l.pad };
});
// fields and courts: level pads at their least-earth height; the ball field gets a dirt infield, the courts a surface
for (const a of PARK.areas.filter((a) => a.level)) {
  const [x0, z0, x1, z1] = a.rect;
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    let top = "grass_block";
    if (a.kind === "courts") top = (x === x0 + 1 || x === x1 - 1 || z === z0 + 1 || z === z1 - 1 || x === ((x0 + x1) >> 1)) ? "white_concrete" : "green_terracotta";
    // the diamond from home plate in the south-east corner: 18-block base paths in dirt, grass inside them
    if (a.name === "Ball field") { const u = x1 - 3 - x, v = z1 - 3 - z; if (u >= 0 && v >= 0 && u <= 19 && v <= 19 && !(u >= 2 && v >= 2 && u <= 16 && v <= 16)) top = "coarse_dirt"; }
    put(x, z, a.pad, top, null, 3);
  }
}
// trails and the shore path: follow the ground, a path surface on the top block
for (const t of PARK.trails) for (const k of t.cells) { const [x, z] = k.split(",").map(Number); if (!T.has(k) && inside(x, z) && !water[z][x]) put(x, z, H[z][x], t.name === "Shore path" ? "dirt_path" : "coarse_dirt", null, 2); }
// the beach: sand on the land within two blocks of the lake, inside its area
const beach = PARK.areas.find((a) => a.kind === "beach");
if (beach) { const [x0, z0, x1, z1] = beach.rect; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (!water[z][x] && !T.has(K(x, z)) && [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dz]) => water[z + dz]?.[x + dx])) put(x, z, H[z][x], "sand", null, 2); }

// ---- write the target surfaces into the land -----------------------------------------------------------------------
const clearAbove = (x, z, y0) => { for (let y = y0; y < Y; y++) { const c = g.get(x, y, z); if (c && !/air$/.test(c.block)) g.set(x, y, z, "air"); } };
function column(x, z, { t, top, slab }) {
  const full = Math.floor(t), half = t - full > 0, ty = AT(full);
  for (let y = ty; y >= 0; y--) { const b = g.get(x, y, z)?.block ?? "air";
    if (y < ty - 3 && !/air$|water|leaves|_log$/.test(b)) break;             // reached the land's own fill
    const keep = y < ty - 1 && /stone|ore|andesite|diorite|granite|tuff|deepslate|gravel|dirt|scoria|limestone/.test(b);
    if (y === ty) g.set(x, y, z, top); else if (!keep) g.set(x, y, z, "dirt"); }
  clearAbove(x, z, ty + 1);
  if (half) g.set(x, ty + 1, z, slab ?? "smooth_stone_slab", { type: "bottom" });
}
// trees standing on anything built are felled whole: their trunks and the leaves within 3 of them
const felled = []; for (const k of T.keys()) { const [x, z] = k.split(",").map(Number); if (site.tree[z][x]) felled.push([x, z]); }
for (const [tx, tz] of felled) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const x = tx + dx, z = tz + dz; if (!inside(x, z)) continue;
  for (let y = AT(H[tz][tx]) + 1; y < Y; y++) { const c = g.get(x, y, z); if (c && PLANT.test(c.block)) g.set(x, y, z, "air"); } }
for (const [k, v] of T) { const [x, z] = k.split(",").map(Number); column(x, z, v); }
// retaining walls: where a lot or field edge sits 2+ below the land beside it, stone brick up to that land
const masonry = (x, y, z) => (hash(x * 3 + y, z) < 0.15 ? "mossy_stone_bricks" : "stone_bricks");
for (const [k, v] of T) { if (v.prio !== 4 && v.prio !== 3) continue; const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (!inside(nx, nz) || T.has(K(nx, nz)) || water[nz][nx]) continue;
    const h = H[nz][nx]; if (h - v.t >= 2) for (let y = AT(v.t) + 1; y <= AT(h); y++) g.set(x, y, z, masonry(x, y, z)); } }
// the avenue's trees: an oak every 8 blocks down the planted strip
for (const c of sc.values()) if (c.st.half === 3 && c.d <= 0.5 && c.z % 8 === 4) { const y = AT(Math.floor(c.t)) + 1; for (let k = 0; k < 4; k++) g.set(c.x, y + k, c.z, "oak_log", { axis: "y" });
  for (let dy = 2; dy <= 5; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const r = Math.abs(dx) + Math.abs(dz) + (dy === 5 ? 2 : 0); if (r > 3 || (dx === 0 && dz === 0 && dy < 4)) continue; const cx = c.x + dx, cz = c.z + dz, cy = y + dy; if (!g.get(cx, cy, cz) || /air$/.test(g.get(cx, cy, cz).block)) g.set(cx, cy, cz, "oak_leaves", { persistent: "true", distance: "1" }); } }
// docks: a spruce deck one above the water on posts to the lake bed; the launch, smooth stone slabs stepping into it
const W = GRADE; // the lake surface
for (const d of PARK.docks) {
  if (d.kind === "dock") for (const [x, z] of d.cells) { g.set(x, W + 1, z, "spruce_planks"); clearAbove(x, z, W + 2);
    if ((x + z) % 3 === 0) for (let y = W; y >= 0; y--) { const b = g.get(x, y, z)?.block ?? "air"; if (!/water|air$/.test(b)) break; g.set(x, y, z, "spruce_log", { axis: "y" }); } }
  else { const n = d.cells.length / d.width; d.cells.forEach(([x, z], i) => { const j = Math.floor(i / d.width), t = Math.max(-1.5, H[d.from[1]][d.from[0]] * (1 - j / (n - 2)));
    const full = Math.floor(t); for (let y = AT(full); y >= AT(full) - 2; y--) g.set(x, y, z, "stone_bricks"); clearAbove(x, z, AT(full) + 1); if (t - full > 0) g.set(x, AT(full) + 1, z, "smooth_stone_slab", { type: "bottom" }); }); }
}

// ---- outputs -----------------------------------------------------------------------------------------------------------
const changes = new Grid(g.size, { dataVersion: g.dataVersion }); let cleared = 0, placed = 0;
for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const a = before.get(x, y, z), b = g.get(x, y, z), ab = a?.block ?? "minecraft:air", bb = b?.block ?? "minecraft:air";
  if (ab === bb && JSON.stringify(a?.state ?? {}) === JSON.stringify(b?.state ?? {})) continue;
  changes.set(x, y, z, bb, b?.state); if (/air$/.test(bb)) cleared++; else placed++;
}
g.save(`${OUT}/land.nbt`); changes.save(`${OUT}/land-changes.nbt`);
writeFileSync(`${OUT}/build.json`, JSON.stringify({ grade: GRADE, lots: built, docks: PARK.docks.map(({ cells, ...d }) => d) }, null, 1) + "\n");
console.log(JSON.stringify({ lots: built.map((l) => `${l.lot}:${l.pad}${l.pad !== l.plannedPad ? `(was ${l.plannedPad})` : ""}`).join(" "), trees: felled.length, cleared, placed, changed: cleared + placed }));
