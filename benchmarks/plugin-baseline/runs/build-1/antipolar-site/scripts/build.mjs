// Phase 2: the land works as schematicannon files, in the order they go on.
//   0. staging.nbt: one cannon places a scaffolding tower with a deck for every section's cannon (the section's letter
//      in pink wool on its deck), PINK wool at each section box's corners (eaten by the section's own paste) and MAGENTA
//      wool at each below-water box's corners (they stay until you take them away). Placement only: no air in it.
//   1. 1-<S>-fill.nbt (every section): the works above the water line, full box, the polder brought up to y 0 as solid
//      fill. 1-<S>-fill-below.nbt (ring sections A, C, E): everything from y -4 to -1 under the ring made solid: water
//      under the levees and the polder replaced by fill, so nothing is dug yet and no water can move.
//   2. 2-<S>-dig.nbt (ring sections, once A, C and E are all filled: the ring is then closed): the polder dug out to its
//      floor at y -2, the ditches, canals and paddies cut. Digging solid fill inside a closed ring lets no water in.
// Every file holds the whole of its box (the cannon reads a missing cell as air). Cells below y 0 appear only inside the
// ring's own rectangle, where every block is set by us. Towers are kept in every file that covers them.
// Frame: the export's (its corner is Polarton's (18, 3, 64)); world y = the export's y.
import { computeLayout, RING, LOWER_BOX, FLOOR } from "./layout.mjs";
import { sectionBoxes } from "./sections.mjs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { writeFileSync, mkdirSync, statSync, readdirSync, unlinkSync } from "node:fs";

const OUT = process.argv[2] ?? "delivery/cannon";
mkdirSync(OUT, { recursive: true }); for (const f of readdirSync(OUT)) if (/\.nbt$/.test(f)) unlinkSync(`${OUT}/${f}`);
const L = computeLayout(), { site, T } = L, { g: orig, X, Z, H } = site;
const YS = 4, TOP = 24, YN = YS + TOP; // world y -4..23 held at grid y 0..27
const strip = (b) => String(b ?? "air").replace(/^minecraft:/, "");
const K = (x, z) => `${x},${z}`, KC = (x, y, z) => `${x},${y},${z}`;
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const RIPRAP = (x, y, z) => { const r = hash(x, y, z); return r < 0.4 ? "cobblestone" : r < 0.65 ? "mossy_cobblestone" : r < 0.85 ? "stone" : "andesite"; };
const inLower = (x, z) => x >= LOWER_BOX.x0 && x <= LOWER_BOX.x1 && z >= LOWER_BOX.z0 && z <= LOWER_BOX.z1;

// ---- the world: the export, then below it (inside the ring's rectangle only) what the works set -----------------------
const world = new Grid([X, YN, Z], { dataVersion: orig.dataVersion });
for (const c of orig.cells.values()) world.set(c.pos[0], c.pos[1] + YS, c.pos[2], c.block, c.state, c.nbt);
const W = { get: (x, y, z) => world.get(x, y + YS, z), at: (x, y, z) => strip(world.blockAt(x, y + YS, z)), set: (x, y, z, b, s) => world.set(x, y + YS, z, b, s), air: (x, y, z) => world.set(x, y + YS, z, "air") };
const before = world.clone();

// ---- trees standing on or overhanging the works come down (whole trunks; their leaves; floating leftovers after) ----
const LOGISH = /_log$|_wood$|mushroom_stem|_stem$/, LEAFY = /leaves|mushroom_block/;
const PLANTY = /plants\d?$|grass$|watergrass|fern|flower|tulip|poppy|dandelion|bush|azalea|sprouts|cucumbers|twigs|rocks$|leaf_pile|fallen_leaves|bark_mushroom|mushroom$|nodule|cobweb|vine|tall_grass|dead_bush|sapling|cattail|reeds|duckweed|clover|lupine|wild_rice|bones|remains|sugar_cane|lily_pad|seagrass|moss_carpet/;
const removeLog = new Set();
for (const [k, v] of T) { const [x, z] = k.split(",").map(Number); for (let y = 0; y < 18; y++) if (LOGISH.test(W.at(x, y, z)) && y > Math.floor(v.t) - 3) removeLog.add(KC(x, y, z)); }
{ const q = [...removeLog].map((s) => s.split(",").map(Number));
  while (q.length) { const [x, y, z] = q.pop(); for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[1,1,0],[-1,1,0],[0,1,1],[0,1,-1]]) { const nx = x + dx, ny = y + dy, nz = z + dz; if (nx < 0 || nz < 0 || nx >= X || nz >= Z || ny < 0 || ny > 17) continue; const kk = KC(nx, ny, nz); if (removeLog.has(kk) || !LOGISH.test(W.at(nx, ny, nz))) continue; removeLog.add(kk); q.push([nx, ny, nz]); } } }
const keptLogs = [], remLogs = [...removeLog].map((s) => s.split(",").map(Number));
for (const c of orig.cells.values()) if (LOGISH.test(strip(c.block)) && !removeLog.has(KC(...c.pos))) keptLogs.push(c.pos);
const near = (list, x, y, z, r) => { let best = Infinity; for (const [a, b, c] of list) { const d = Math.max(Math.abs(a - x), Math.abs(b - y) * 0.6, Math.abs(c - z)); if (d < best) best = d; if (best <= 1) break; } return best <= r ? best : Infinity; };
const removeLeaf = new Set();
for (const c of orig.cells.values()) { const b = strip(c.block); if (!LEAFY.test(b) || String(c.state?.persistent) === "true") continue; const [x, y, z] = c.pos; const dr = near(remLogs, x, y, z, 5); if (dr === Infinity) continue; if (near(keptLogs, x, y, z, 5) <= dr) continue; removeLeaf.add(KC(x, y, z)); }
for (const s of [...removeLog, ...removeLeaf]) { const [x, y, z] = s.split(",").map(Number); W.air(x, y, z); }

// ---- each column of the works --------------------------------------------------------------------------------
const slabOf = (v) => (v.deck ? "spruce_slab" : "mud_brick_slab");
const surfState = (b) => (b === "grass_block" ? { snowy: "false" } : /_log$/.test(b) ? { axis: "y" } : undefined);
let piles = 0;
for (const [k, v] of T) {
  const [x, z] = k.split(",").map(Number), g = H[z][x], top = Math.floor(v.t), slab = v.t % 1 !== 0, lower = inLower(x, z);
  const bottom = lower ? LOWER_BOX.y0 : 0;
  // clear the column above the new top (and plants and snow on it), keeping nothing but what we set
  for (let y = Math.max(bottom, top + 1); y < 18; y++) { const b = W.at(x, y, z); if (b === "air") continue; if (y <= Math.max(g, 0) || PLANTY.test(b) || LEAFY.test(b) && y <= top + 4 || b === "snow" || b === "water") W.air(x, y, z); }
  if (v.deck) {
    // planks on piles: earth up to what was under it (a bank it covers), stripped logs every other cell down to the water
    const under = v.under ?? (g >= 0 ? Math.min(g, top - 1) : null);
    if (under != null) for (let y = Math.max(bottom, g >= 0 ? g + 1 : 0); y <= under; y++) W.set(x, y, z, "dirt");
    const pile = (x + z) % 2 === 0 && ((x % 3 === 0) || (z % 3 === 0));
    for (let y = (under != null ? under + 1 : (g >= 0 ? g + 1 : 0)); y < top; y++) { if (pile) { W.set(x, y, z, "stripped_spruce_log", { axis: "y" }); piles++; } else if (W.at(x, y, z) !== "water") W.air(x, y, z); }
    if (top >= bottom) W.set(x, top, z, v.surf, surfState(v.surf));
    if (slab) W.set(x, top + 1, z, slabOf(v), { type: "bottom", waterlogged: "false" });
    if (v.water != null) for (let y = v.water; y < top; y++) W.set(x, y, z, "water", { level: "0" }); // a bridge over a canal
    if (v.water != null) for (let y = bottom; y < v.water; y++) W.set(x, y, z, y === v.water - 1 ? "mud" : "dirt");
    continue;
  }
  if (v.dredge) { W.set(x, 0, z, "water", { level: "0" }); continue; }
  // solid to the top: the core (packed mud under levee crests and banks), dirt, the surface; riprap on the swamp face
  const leveeish = /levee|street|bank/.test(v.kind) && (L.ringD(x, z) <= 6);
  for (let y = bottom; y < top; y++) {
    const keep = y <= g && !lower && y < top - 1; // natural ground left as it is where we only build on it
    if (keep && !/water|air/.test(W.at(x, y, z))) continue;
    W.set(x, y, z, v.kind === "bulkhead" ? "stripped_spruce_log" : v.kind === "sluice" ? "stone_bricks" : v.riprap && y >= top - 1 ? RIPRAP(x, y, z) : leveeish && y < top - 1 ? "packed_mud" : "dirt", v.kind === "bulkhead" ? { axis: "y" } : undefined);
  }
  if (top >= bottom) { const s = v.riprap ? RIPRAP(x, top, z) : slab ? "dirt" : v.surf; W.set(x, top, z, s, surfState(s)); }
  if (slab) W.set(x, top + 1, z, slabOf(v), { type: "bottom", waterlogged: "false" });
  if (v.water != null) for (let y = top + 1; y <= v.water; y++) W.set(x, y, z, "water", { level: "0" });
  // inside the lower box everything above the top up to y -1 is air (dug) unless water stands there
  if (lower) for (let y = top + 1 + (slab ? 1 : 0); y <= -1; y++) if (!(v.water != null && y <= v.water)) W.air(x, y, z);
}
// every column of the lower box not in the works (the corners of the rectangle beyond the levee's banks): solid fill
for (let z = LOWER_BOX.z0; z <= LOWER_BOX.z1; z++) for (let x = LOWER_BOX.x0; x <= LOWER_BOX.x1; x++) if (!T.has(K(x, z))) for (let y = LOWER_BOX.y0; y <= -1; y++) W.set(x, y, z, "dirt");
// tree remnants left floating by the clearing
const looseOf = (grid) => { const solids = [...grid.cells.values()].filter((c) => !/air$|water|lava/.test(strip(c.block))); const at = new Set(solids.map((c) => c.pos.join(",")));
  const seen = new Set(), q = []; for (const c of solids) if (c.pos[1] <= YS) { seen.add(c.pos.join(",")); q.push(c.pos); }
  while (q.length) { const [x, y, z] = q.pop(); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 2) continue; const nk = `${x + dx},${y + dy},${z + dz}`; if (at.has(nk) && !seen.has(nk)) { seen.add(nk); q.push([x + dx, y + dy, z + dz]); } } }
  return new Set(solids.filter((c) => !seen.has(c.pos.join(","))).map((c) => c.pos.join(","))); };
const wasLoose = looseOf(before); let remnants = 0;
for (const k of looseOf(world)) { if (wasLoose.has(k)) continue; const [x, y, z] = k.split(",").map(Number); if (/leaves|vine|mushroom|_log$|_wood$|_stem$|leaf/.test(strip(world.blockAt(x, y, z)))) { world.set(x, y, z, "air"); remnants++; } }
// vines whose leaves came down: a vine holds while a face it clings to (or the vine above it) is there; take away the
// ones that held before the clearing and no longer do
const heldIn = (grid, x, y, z, st) => [["north", 0, 0, -1], ["south", 0, 0, 1], ["east", 1, 0, 0], ["west", -1, 0, 0], ["up", 0, 1, 0]].some(([f, dx, dy, dz]) => { const b = strip(grid.blockAt(x + dx, y + dy, z + dz)); return st[f] === "true" && !/^(air|water)$/.test(b) && !/vine$/.test(b); }) || /vine$/.test(strip(grid.blockAt(x, y + 1, z)));
for (let changed = true, pass = 0; changed && pass < 30; pass++) { changed = false;
  for (const c of [...world.cells.values()]) { if (strip(c.block) !== "vine") continue; const [x, y, z] = c.pos, st = c.state ?? {};
    if (!heldIn(world, x, y, z, st) && heldIn(before, x, y, z, st)) { world.set(x, y, z, "air"); remnants++; changed = true; } } }
const final = world; // world y = grid y - YS

// ---- the landfill state: the final works, but below y 1 inside the ring nothing open: dug cells and standing water
// there are solid fill (grass on top at y 0 so the fill is walkable)
const landfill = final.clone();
for (let z = LOWER_BOX.z0; z <= LOWER_BOX.z1; z++) for (let x = LOWER_BOX.x0; x <= LOWER_BOX.x1; x++) for (let y = LOWER_BOX.y0; y <= 0; y++) {
  const b = strip(landfill.blockAt(x, y + YS, z)); if (b !== "air" && b !== "water" && !/slab|planks/.test(b)) continue;
  if (/slab|planks/.test(b) && y < 0) { landfill.set(x, y + YS, z, "dirt"); continue; } if (/slab|planks/.test(b)) continue;
  landfill.set(x, y + YS, z, y === 0 ? "coarse_dirt" : "dirt"); }

// ---- towers and markers ------------------------------------------------------------------------------------------
// a section's box: everything that changes inside its rectangle (works, felled trees and their leaves)
const changedCols = new Set();
for (const k of new Set([...before.cells.keys(), ...final.cells.keys()])) { const a = before.cells.get(k), b = final.cells.get(k); const an = a && !/air$/.test(a.block) ? a.block + JSON.stringify(a.state ?? {}) : "air", bn = b && !/air$/.test(b.block) ? b.block + JSON.stringify(b.state ?? {}) : "air"; if (an === bn) continue; const [x, , z] = k.split(",").map(Number); changedCols.add(K(x, z)); }
const secs = sectionBoxes(new Map([...T, ...[...changedCols].map((k) => [k, true])]));
const unclaimed = [...changedCols].filter((k) => { const [x, z] = k.split(",").map(Number); return !secs.some((s) => x >= s.rect[0] && x <= s.rect[2] && z >= s.rect[1] && z <= s.rect[3]); });
if (unclaimed.length) console.error("changed columns in no section:", unclaimed.slice(0, 10));
const ringSec = (s) => !(s.x1 < LOWER_BOX.x0 || s.x0 > LOWER_BOX.x1 || s.z1 < LOWER_BOX.z0 || s.z0 > LOWER_BOX.z1);
const DECK_Y = 22;
const FONT = { A: ["010", "101", "111", "101", "101"], B: ["110", "101", "110", "101", "110"], C: ["011", "100", "100", "100", "011"], D: ["110", "101", "101", "101", "110"], E: ["111", "100", "110", "100", "111"], F: ["111", "100", "110", "100", "100"], G: ["011", "100", "101", "101", "011"], H: ["101", "101", "111", "101", "101"] };
const towers = [];
for (const s of secs) {
  // a spot the works leave alone, on firm ground, as near the section's middle as there is (else the nearest anywhere)
  const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2; let best = null;
  for (let z = 2; z < Z - 2; z++) for (let x = 2; x < X - 2; x++) { let ok = true;
    for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, zz = z + dz; if (T.has(K(xx, zz)) || H[zz][xx] < 0 || site.built[zz][xx]) { ok = false; break; } }
    if (!ok || site.tree[z][x] || towers.some((t) => Math.abs(t.x - x) < 6 && Math.abs(t.z - z) < 6)) continue;
    const inside = x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1, d = Math.hypot(x - cx, z - cz) + (inside ? 0 : 1000);
    if (!best || d < best.d) best = { x, z, d, inside }; }
  towers.push({ section: s.name, x: best.x, z: best.z, ground: H[best.z][best.x], inside: best.inside });
}
const towerCells = new Map(); // world key -> [block, state]
for (const [i, t] of towers.entries()) { const letter = FONT[secs[i].name[0]];
  for (let y = t.ground + 1; y < DECK_Y; y++) towerCells.set(KC(t.x, y, t.z), ["scaffolding", { distance: "0", bottom: "false", waterlogged: "false" }]);
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const px = letter[dz + 2]?.[dx + 1] === "1" && Math.abs(dx) <= 1; towerCells.set(KC(t.x + dx, DECK_Y, t.z + dz), px ? ["pink_wool"] : ["scaffolding", { distance: String(Math.max(Math.abs(dx), Math.abs(dz))), bottom: "false", waterlogged: "false" }]); } }
const surfaceY = (grid, x, z) => { for (let y = 17; y >= -4; y--) { const b = strip(grid.blockAt(x, y + YS, z)); if (b !== "air" && !LEAFY.test(b) && !PLANTY.test(b)) return y; } return 0; };
const markers = new Map(); // world key -> block
const boxes = [];
for (const s of secs) {
  // the box above the water line: x/z as cropped, y from 0 to the highest cell the section changes
  let yTop = 0; for (let z = s.z0; z <= s.z1; z++) for (let x = s.x0; x <= s.x1; x++) for (let y = 0; y < 18; y++) { const a = before.get(x, y + YS, z), b = landfill.get(x, y + YS, z); const an = a && !/air$/.test(a.block) ? a.block + JSON.stringify(a.state ?? {}) : "air", bn = b && !/air$/.test(b.block) ? b.block + JSON.stringify(b.state ?? {}) : "air"; if (an !== bn) yTop = Math.max(yTop, y); }
  const up = { file: `1-${s.name[0]}-fill.nbt`, section: s.name, kind: "fill", x0: s.x0, z0: s.z0, x1: s.x1, z1: s.z1, y0: 0, y1: yTop, mode: "Replace Solid with Empty" };
  boxes.push(up);
  for (const [x, z] of [[up.x0, up.z0], [up.x1, up.z0], [up.x0, up.z1], [up.x1, up.z1]]) markers.set(KC(x, surfaceY(before, x, z) + 1, z), "pink_wool");
  if (ringSec(s)) { const lb = { x0: Math.max(s.x0, LOWER_BOX.x0), z0: Math.max(s.z0, LOWER_BOX.z0), x1: Math.min(s.x1, LOWER_BOX.x1), z1: Math.min(s.z1, LOWER_BOX.z1) };
    boxes.push({ file: `1-${s.name[0]}-fill-below.nbt`, section: s.name, kind: "fill below", ...lb, y0: LOWER_BOX.y0, y1: -1, mode: "Replace Solid with Empty" });
    boxes.push({ file: `2-${s.name[0]}-dig.nbt`, section: s.name, kind: "dig", ...lb, y0: LOWER_BOX.y0, y1: 0, mode: "Replace Solid with Empty" });
    // magenta: the below-water boxes' corners, a block above the finished fill so they outlast the fill paste
    for (const [x, z] of [[lb.x0, lb.z0], [lb.x1, lb.z0], [lb.x0, lb.z1], [lb.x1, lb.z1]]) { const y = Math.max(surfaceY(landfill, x, z), 0) + 1; markers.set(KC(x, y, z), "magenta_wool"); } }
}
// magenta markers and towers stand through the fill pastes: put them into every state the files are cut from
const withKeep = (grid, { magenta = true } = {}) => { const g = grid.clone(); for (const [k, [b, s]] of towerCells) { const [x, y, z] = k.split(",").map(Number); g.set(x, y + YS, z, b, s); } if (magenta) for (const [k, b] of markers) if (b === "magenta_wool") { const [x, y, z] = k.split(",").map(Number); g.set(x, y + YS, z, b); } return g; };
const fillState = withKeep(landfill), finalState = withKeep(final);

// ---- cut the files ---------------------------------------------------------------------------------------------
const CAP = 250 * 1024;
const cut = (src, b, z0 = b.z0, z1 = b.z1) => { const g = new Grid([b.x1 - b.x0 + 1, b.y1 - b.y0 + 1, z1 - z0 + 1], { dataVersion: orig.dataVersion });
  for (let z = z0; z <= z1; z++) for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const c = src.get(x, y + YS, z); g.set(x - b.x0, y - b.y0, z - z0, c ? c.block : "air", c?.state, c?.nbt); }
  return g; };
const files = [];
for (const b of boxes) {
  const src = b.kind === "dig" ? finalState : fillState;
  // whole box in one file if it fits, else tiles along z
  for (let n = 1; ; n++) { const span = Math.ceil((b.z1 - b.z0 + 1) / n), out = [];
    for (let t = 0; t < n; t++) { const z0 = b.z0 + t * span, z1 = Math.min(b.z1, z0 + span - 1), g = cut(src, b, z0, z1), f = n === 1 ? b.file : b.file.replace(".nbt", `-${t + 1}of${n}.nbt`); g.save(`${OUT}/${f}`); out.push({ ...b, file: f, corner: [b.x0, b.y0, z0], size: g.size, kb: Math.round(statSync(`${OUT}/${f}`).size / 1024) }); }
    if (out.every((f) => f.kb * 1024 <= CAP)) { files.push(...out); break; } for (const f of out) unlinkSync(`${OUT}/${f.file}`); }
}
// staging: towers and every marker, placement only (no air), one paste at the export's corner
const stLo = [1e9, 1e9, 1e9], stHi = [-1e9, -1e9, -1e9], staged = [...[...towerCells].map(([k, v]) => [k, v]), ...[...markers].map(([k, b]) => [k, [b]])];
for (const [k] of staged) k.split(",").map(Number).forEach((v, i) => { stLo[i] = Math.min(stLo[i], v); stHi[i] = Math.max(stHi[i], v); });
const st = new Grid([stHi[0] - stLo[0] + 1, stHi[1] - stLo[1] + 1, stHi[2] - stLo[2] + 1], { dataVersion: orig.dataVersion });
for (const [k, [b, s]] of staged) { const [x, y, z] = k.split(",").map(Number); st.set(x - stLo[0], y - stLo[1], z - stLo[2], b, s); }
st.save(`${OUT}/0-staging.nbt`);
files.unshift({ file: "0-staging.nbt", section: "all", kind: "staging", corner: stLo, size: st.size, kb: Math.round(statSync(`${OUT}/0-staging.nbt`).size / 1024), mode: "Don't Replace Solid (placement only: it holds no air)" });

// ---- simulate the cannon: the original (unknown below y 0 taken as water), staging (into air and water only), then
// every fill file (its box replaced, missing = air), then every dig file; compare with the finished state ---------------
const sim = before.clone();
for (let z = LOWER_BOX.z0; z <= LOWER_BOX.z1; z++) for (let x = LOWER_BOX.x0; x <= LOWER_BOX.x1; x++) for (let y = LOWER_BOX.y0; y < 0; y++) sim.set(x, y + YS, z, "water", { level: "0" });
for (const [k, [b, s]] of staged) { const [x, y, z] = k.split(",").map(Number); if (/air|water/.test(strip(sim.blockAt(x, y + YS, z)))) sim.set(x, y + YS, z, b, s); }
const paste = (f) => { const src = f.kind === "dig" ? finalState : fillState; const [cx, cy, cz] = f.corner;
  for (let z = 0; z < f.size[2]; z++) for (let y = 0; y < f.size[1]; y++) for (let x = 0; x < f.size[0]; x++) { const c = src.get(cx + x, cy + y + YS, cz + z); if (c && !/air$/.test(c.block)) sim.set(cx + x, cy + y + YS, cz + z, c.block, c.state, c.nbt); else sim.set(cx + x, cy + y + YS, cz + z, "air"); } };
// check after the fills: below y 1 inside the ring, no air (nothing can flood)
for (const f of files.filter((f) => /^fill/.test(f.kind))) paste(f);
let openBelow = 0; for (let z = LOWER_BOX.z0; z <= LOWER_BOX.z1; z++) for (let x = LOWER_BOX.x0; x <= LOWER_BOX.x1; x++) for (let y = LOWER_BOX.y0; y <= 0; y++) if (strip(sim.blockAt(x, y + YS, z)) === "air") openBelow++;
const stray = []; for (const [k, b] of markers) if (b === "pink_wool") { const [x, y, z] = k.split(",").map(Number); if (strip(sim.blockAt(x, y + YS, z)) === "pink_wool") stray.push(k); }
for (const f of files.filter((f) => f.kind === "dig")) paste(f);
const sigc = (c) => (c && !/air$/.test(c.block) ? strip(c.block) + JSON.stringify(Object.entries(c.state ?? {}).sort()) : "air");
let diff = 0; const diffAt = []; const keys = new Set([...sim.cells.keys(), ...finalState.cells.keys()]);
for (const k of keys) { const [x, y, z] = k.split(",").map(Number); if (y < YS && !inLower(x, z)) continue; if (sigc(sim.cells.get(k)) !== sigc(finalState.cells.get(k))) { diff++; if (diffAt.length < 8) diffAt.push(`${x},${y - YS},${z}: ${sigc(sim.cells.get(k))} vs ${sigc(finalState.cells.get(k))}`); } }

// ---- outputs: finished-state files for checking and rendering, the paste list ------------------------------------------
const shifted = (src) => src; // grid y = world y + 4
shifted(final).save("delivery/final-world.nbt"); shifted(landfill).save("delivery/landfill-world.nbt");
const report = { frame: "the export's: its corner is Polarton's (18,3,64); world y = export y; files' corners are given from the export's corner", worldGridNote: "final-world.nbt / landfill-world.nbt hold world y -4..23 at grid y 0..27", trees: { logs: removeLog.size, leaves: removeLeaf.size, remnants }, piles, towers, files, simulation: { openCellsBelowY1AfterFills: openBelow, pinkMarkersLeftAfterFills: stray.length, mismatchesAfterDigs: diff, examples: diffAt }, earth: L.earth };
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ towers, files: files.map((f) => `${f.file} ${f.size.join("x")} corner ${f.corner.join(",")} ${f.kb} KB`), simulation: report.simulation, trees: report.trees }, null, 1));
