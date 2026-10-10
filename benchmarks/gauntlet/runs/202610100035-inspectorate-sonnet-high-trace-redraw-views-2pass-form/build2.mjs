// The Inspectorate — pass 2 (FORM: sides, back, roof). Loads round-1.nbt (the front, untouched) and writes round-2.nbt.
// Side/back walls are two layers inside the 22x22 wall footprint, so nothing new shows on the front elevation:
//   layer 0 = proud plane (x=2 west, x=23 east, z=22 back)   layer 1 = field plane (one block recessed)   layer 2 = behind it
// t = position along the wall (z for the sides, x for the back).
import { Grid, load, B, arch } from "../../../../../minecraft-design/tools/src/build.mjs";
import { fullBlockOf } from "../../../../../minecraft-design/tools/src/shapes-massing.mjs";

const IN = new URL("./round-1.nbt", import.meta.url).pathname;
const OUT = new URL("./round-2.nbt", import.meta.url).pathname;
const g = load(IN);

const M = {
  field: "deepslate_bricks", crack: "cracked_deepslate_bricks", cobble: "cobbled_deepslate",
  mossy: "mossy_stone_bricks", moss: "moss_block",
  surround: "polished_deepslate", tiles: "deepslate_tiles", stone: "stone_bricks",
  oak: "stripped_oak_log", oakPlank: "oak_planks", lobby: "birch_planks",
  pier: "smooth_quartz", fascia: "quartz_bricks",
  glass: "glass_pane", mullion: "light_blue_stained_glass_pane", dark: "black_stained_glass_pane",
  doorPlank: "spruce_planks", copper: "copper_block",
};
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const weathered = (x, y, z) => { const h = hash(x, y, z); return h < 0.12 ? M.crack : h < 0.2 ? M.cobble : M.field; };
const fullBlocks = (target) => { const p = Object.create(target); p.set = (x, y, z, b, s) => (/_(stairs|slab)$/.test(b) ? target.set(x, y, z, fullBlockOf(b)) : target.set(x, y, z, b, s)); return p; };
const fg = fullBlocks(g);
const air = (x, y, z) => g.unset(x, y, z);

// ---- wall frames: (t, y, layer) -> world -------------------------------------------------------------------------
const WALLS = {
  west: { P: (t, y, l) => [2 + l, y, t], axis: "z", at: (t0) => [2, 3, t0] },
  east: { P: (t, y, l) => [23 - l, y, t], axis: "z", at: (t0) => [23, 3, t0] },
  back: { P: (t, y, l) => [t, y, 22 - l], axis: "x", at: (t0) => [t0, 3, 22] },
};
/** A pane in a wall must be told to connect along the wall or it renders as a bare post. */
const pane = (axis, b) => [b, axis === "z" ? { north: true, south: true, east: false, west: false, waterlogged: false } : { east: true, west: true, north: false, south: false, waterlogged: false }];

/**
 * One wall. cfg: t0..t1 (cells this wall owns), piers [[a,b]], bays [[a,b]], posts [[a,b]] (upper timber),
 * windows [{a,b,jamb}], corners [[a,b]] (polished caps at y8..9), frieze, door {a,b}.
 */
function wall(name, cfg) {
  const W = WALLS[name], P = W.P;
  // z=2 is the front wall's own cell column: the sides never write it, so the front elevation is round-1's
  const set = (t, y, l, b, s) => { const p = P(t, y, l); if (name !== "back" && p[2] <= 2) return; g.set(...p, b, s); };
  const clear = (t, y, l) => { const p = P(t, y, l); if (name !== "back" && p[2] <= 2) return; air(...p); };
  const bayOf = new Map(); cfg.bays.forEach(([a, b]) => { for (let t = a; t <= b; t++) bayOf.set(t, [a, b]); });
  for (let t = cfg.t0; t <= cfg.t1; t++) {
    // base course y2 (plinth shoulder), both layers
    for (const l of [0, 1]) set(t, 2, l, weathered(...P(t, 2, l)));
    // ground storey: quartz field behind, proud layer cleared then dressed below
    for (let y = 3; y <= 8; y++) { set(t, y, 1, M.pier); clear(t, y, 0); }
    // string course y9 proud across the wall, field behind
    set(t, 9, 0, M.surround); set(t, 9, 1, weathered(...P(t, 9, 1)));
    // upper field y10..14 recessed; proud layer cleared
    for (let y = 10; y <= 14; y++) { set(t, y, 1, weathered(...P(t, y, 1))); clear(t, y, 0); }
    // quartz fascia band y8, proud
    set(t, 8, 0, M.fascia);
  }
  // quartz proud wall over the bays (the arches are carved out of it)
  for (const [a, b] of cfg.bays) for (let t = a; t <= b; t++) for (let y = 3; y <= 7; y++) set(t, y, 0, M.pier);
  // timber piers: log shaft, plank capital, both layers
  for (const [a, b] of cfg.piers) for (let t = a; t <= b; t++) {
    for (const l of [0, 1]) { for (let y = 3; y <= 6; y++) set(t, y, l, ...B.log("stripped_oak", "y")); set(t, 7, l, M.oakPlank); }
  }
  // corner caps: polished deepslate at y8..9 over the corner piers
  for (const [a, b] of cfg.corners ?? []) for (let t = a; t <= b; t++) for (const y of [8, 9]) { set(t, y, 0, M.surround); set(t, y, 1, M.surround); }
  // arches: one per bay, glass at the field plane
  for (const [a, b] of cfg.bays) {
    const w = b - a + 1, h = w >= 6 ? 4 : 5;
    arch(fg, { at: W.at(a), width: w, height: h, depth: 1, axis: W.axis, profile: "round", block: M.pier, edge: "none", frame: M.fascia });
    for (let t = a; t <= b; t++) for (let y = 3; y <= 7; y++) {
      if (!g.isAir(...P(t, y, 0))) continue;
      const edge = t === a || t === b || y === 5;
      set(t, y, 1, ...pane(W.axis, edge ? M.mullion : M.glass));
    }
  }
  // warm lobby wall two behind the glass (the concept shows a lit oak interior)
  // (sides start at z=8: nearer cells sit behind the front glass and would tint it)
  for (let t = cfg.t0 + 2; t <= cfg.t1 - 2; t++) for (let y = 3; y <= 8; y++) if (name === "back" || t >= 8) set(t, y, 2, M.lobby);
  // door on the back
  if (cfg.door) {
    const { a, b } = cfg.door;
    for (let t = a; t <= b; t++) { for (let y = 3; y <= 5; y++) { clear(t, y, 0); clear(t, y, 1); } set(t, 5, 1, ...pane(W.axis, M.glass)); set(t, 6, 1, ...pane(W.axis, M.glass)); }
    const f = "south";
    set(a, 3, 1, ...B.door("spruce", f, "lower", "left")); set(a, 4, 1, ...B.door("spruce", f, "upper", "left"));
    set(b, 3, 1, ...B.door("spruce", f, "lower", "right")); set(b, 4, 1, ...B.door("spruce", f, "upper", "right"));
    for (let t = a - 1; t <= b + 1; t++) { set(t, 2, 0, M.pier); }
    for (let t = a; t <= b; t++) g.set(...P(t, 2, -1), M.pier);        // one step proud
    for (let t = a - 1; t <= b + 1; t++) for (let y = 3; y <= 4; y++) if (t === a - 1 || t === b + 1) { set(t, y, 0, M.doorPlank); set(t, y, 1, M.doorPlank); }
    for (let t = a - 1; t <= b + 1; t++) set(t, 5, 0, M.fascia);
  }
  // upper storey: timber posts proud, windows recessed in polished-deepslate surrounds
  for (const [a, b] of cfg.posts) for (let t = a; t <= b; t++) for (let y = 10; y <= 14; y++) set(t, y, 0, ...B.log("stripped_oak", "y"));
  for (const wd of cfg.windows) {
    const ja = wd.jamb ? wd.a - 1 : wd.a, jb = wd.jamb ? wd.b + 1 : wd.b;
    for (let t = ja; t <= jb; t++) set(t, 13, 0, M.surround);
    if (wd.jamb) for (const t of [ja, jb]) for (let y = 10; y <= 12; y++) set(t, y, 0, M.surround);
    for (let t = wd.a; t <= wd.b; t++) for (let y = 10; y <= 12; y++) {
      clear(t, y, 0); set(t, y, 1, ...pane(W.axis, M.dark)); set(t, y, 2, M.tiles);   // unlit room behind the glass
    }
  }
  // frieze y14: oak dentil blocks every other cell, proud
  if (cfg.frieze) {
    const posts = new Set(cfg.posts.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i)));
    for (let t = cfg.t0; t <= cfg.t1; t++) if ((t - cfg.t0) % 2 === 0 && !posts.has(t)) set(t, 14, 0, M.oakPlank);
  }
}

const side = {
  t0: 2, t1: 22,
  piers: [[2, 3], [8, 9], [15, 16], [21, 22]],
  bays: [[4, 7], [10, 14], [17, 20]],
  posts: [[2, 3], [9, 9], [15, 15], [21, 22]],
  corners: [[2, 3], [21, 22]],
  windows: [{ a: 5, b: 6, jamb: true }, { a: 11, b: 13, jamb: true }, { a: 18, b: 19, jamb: true }],
  frieze: true,
};
const back = {
  t0: 4, t1: 21,
  piers: [[8, 9], [16, 17]],
  bays: [[4, 7], [10, 15], [18, 21]],
  posts: [[9, 9], [16, 16]],
  windows: [{ a: 5, b: 6, jamb: true }, { a: 10, b: 11 }, { a: 14, b: 15 }, { a: 18, b: 19, jamb: true }],
  door: { a: 12, b: 13 },
  frieze: true,
};
wall("west", side); wall("east", side); wall("back", back);

// lobby wall just inside the sides for the first bay (z=5..7 sits behind the front glass, same birch as its backdrop)
// ---- plinth: weathering on the sides and back only (z>=3 keeps the front's plinth ends untouched) ------------------
for (let z = 3; z <= 23; z++) for (const x of [0, 25]) g.set(x, 0, z, weathered(x, 0, z));
for (let x = 0; x <= 25; x++) g.set(x, 0, 23, weathered(x, 0, 23));
for (let z = 3; z <= 23; z++) for (const x of [1, 24]) { const h = hash(x, 1, z); g.set(x, 1, z, h < 0.1 ? M.moss : h < 0.2 ? M.mossy : weathered(x, 1, z)); }
for (let x = 1; x <= 24; x++) { const h = hash(x, 1, 23); g.set(x, 1, 23, h < 0.1 ? M.moss : h < 0.2 ? M.mossy : weathered(x, 1, 23)); }

// ---- roof: low hip stepping up one course at a time; gutter deck of slate behind a stone coping ---------------------
for (let x = 5; x <= 20; x++) for (const z of [21, 22]) air(x, 16, z);          // back eave steps in
for (let x = 6; x <= 19; x++) for (const z of [20, 21]) air(x, 17, z);
for (let x = 3; x <= 22; x++) for (let z = 5; z <= 21; z++) {
  const onGutter = x <= 4 || x >= 21 || z >= 20;
  if (onGutter) g.set(x, 15, z, M.tiles);
}
// stone coping on the outside edge of the deck, hidden behind the front corner stacks
for (let z = 4; z <= 22; z++) for (const x of [2, 23]) g.set(x, 16, z, M.stone);
for (const x of [2, 3, 22, 23]) for (const z of [21, 22]) g.set(x, 16, z, M.stone);
// chimney at the back of the west side, copper cap (x=2 keeps it behind the front stack: front elevation unchanged)
for (const x of [2, 3]) for (const z of [19, 20]) g.set(x, 16, z, M.stone);
for (const z of [19, 20]) g.set(2, 17, z, M.copper);

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused?.length ?? 0, blocks: g.solids().length }));
