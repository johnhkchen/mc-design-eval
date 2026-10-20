// Helpers from plan.md VOCABULARY (part 2): curtain_bay, window_backing, lit_rim, floodlight, lamp_post, pier_bay,
// flag_pole, ahu_box, ticc_pier, roof_light. Kit-local coordinates; every position and facing is an argument.
//
// Rules every helper keeps (workers rely on them):
//   - writes only its own footprint, and only into air; a cell in `opts.over` (block ids) may also be replaced.
//   - all or nothing: if any footprint cell is blocked, or a standing piece has no solid cell under it, nothing is
//     written. The result says why: { ok, placed, blocked: [[x,y,z]], unsupported: [[x,y,z]] }.
//   - nothing is written below the footprint (ground, sand and deck belong to earlier parts).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air", "minecraft:structure_void"]);
const id = (b) => (b.includes(":") ? b : `minecraft:${b}`);

/** cells: [[x, y, z, block, state?], ...]. Writes the lot or none of it. */
function place(g, cells, { over = [], support = [] } = {}) {
  const replaceable = new Set(over.map(id));
  const want = new Map();
  for (const c of cells) want.set(c.slice(0, 3).join(","), c);
  const blocked = [...want.values()].filter(([x, y, z]) => !g.inBounds(x, y, z) || !(AIR.has(g.blockAt(x, y, z)) || replaceable.has(g.blockAt(x, y, z))))
    .map((c) => c.slice(0, 3));
  const unsupported = support.filter(([x, y, z]) => !g.inBounds(x, y, z) || g.isAir(x, y, z));
  if (blocked.length || unsupported.length) return { ok: false, placed: 0, blocked, unsupported };
  for (const [x, y, z, block, state] of want.values()) g.set(x, y, z, block, state);
  return { ok: true, placed: want.size, blocked: [], unsupported: [] };
}

const FACES = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] };
/** The cell at run coordinate `a`, height `y`, depth `d` (+1 outward, 0 on the wall plane, -1 inside), for a wall on `plane`. */
function at(face, plane, a, y, d) {
  const n = FACES[face];
  if (!n) throw new Error(`face must be north, south, east or west, got ${face}`);
  return n[2] !== 0 ? [a, y, plane + d * n[2]] : [plane + d * n[0], y, a];
}
const alongZ = (face) => FACES[face]?.[2] !== 0;   // north/south walls run along x; east/west walls run along z

const LIT = "ochre_froglight", COOL = "pearlescent_froglight";

/**
 * Curtain wall bay for one face: per storey of 5, a brown_terracotta spandrel row, then 4 rows of brown_terracotta
 * mullions every 3rd cell with brown_stained_glass between, and a black_concrete backing one cell inside each glass.
 * (x0, z0) is the start corner on the wall plane (x0 on east/west, z0 on north/south); the run is opts.length cells
 * (default 50, the ITB shaft face). Returns the backing cells too, for window_backing().
 */
export function curtain_bay(g, face, x0, y0, z0, storeys, opts = {}) {
  const len = opts.length ?? 50;
  const plane = alongZ(face) ? z0 : x0, a0 = alongZ(face) ? x0 : z0;
  const cells = [], backing = [];
  for (let s = 0; s < storeys; s++) for (let r = 0; r < 5; r++) {
    const y = y0 + 5 * s + r;
    for (let i = 0; i < len; i++) {
      const [x, , z] = at(face, plane, a0 + i, y, 0);
      if (r === 0 || i % 3 === 0) { cells.push([x, y, z, "brown_terracotta"]); continue; }
      cells.push([x, y, z, "brown_stained_glass"]);
      const b = at(face, plane, a0 + i, y, -1);
      cells.push([...b, "black_concrete"]);
      backing.push(b);
    }
  }
  return { ...place(g, cells, { over: opts.over }), backing };
}

/**
 * Lit / dark choice for tower backing cells (the cells curtain_bay leaves as black_concrete): clusters of 2-6 adjacent
 * cells (now and then a whole floor) take ochre_froglight (warm) or pearlescent_froglight (cool) until the shares are
 * met, the rest stay black_concrete. Deterministic: the seed is a hash of the cells (or opts.seed).
 */
export function window_backing(g, cells, warm = 0.12, cool = 0.06, opts = {}) {
  const rnd = mulberry32(opts.seed ?? hashCells(cells));
  const lit = pickLit(cells, warm, cool, rnd);
  const writes = cells.map((c) => [...c.slice(0, 3), lit.get(c.join(",")) ?? "black_concrete"]);
  const res = place(g, writes, { over: opts.over ?? ["black_concrete"] });
  const count = (b) => [...lit.values()].filter((v) => v === b).length;
  return { ...res, warm: count(LIT), cool: count(COOL) };
}

/**
 * Crown rim: on the box [x0, z0, x1, z1] at height y, the outer ring is light_gray_stained_glass and the ring one cell in
 * is sea_lantern, so the light sits behind the glass. The interior is left alone.
 */
export function lit_rim(g, box, y, opts = {}) {
  const [x0, z0, x1, z1] = box;
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const outer = x === x0 || x === x1 || z === z0 || z === z1;
    const inner = x >= x0 + 1 && x <= x1 - 1 && z >= z0 + 1 && z <= z1 - 1 &&
      (x === x0 + 1 || x === x1 - 1 || z === z0 + 1 || z === z1 - 1);
    if (outer) cells.push([x, y, z, "light_gray_stained_glass"]);
    else if (inner) cells.push([x, y, z, "sea_lantern"]);
  }
  return place(g, cells, { over: opts.over });
}

/** Deck floodlight: an end_rod facing up at (x, y, z). The cell below must be solid (the deck). */
export function floodlight(g, x, y, z, opts = {}) {
  return place(g, [[x, y, z, "end_rod", { facing: "up" }]], { over: opts.over, support: [[x, y - 1, z]] });
}

/** Street lamp: two stone_brick_wall posts and a standing lantern on top, at (x, y, z). Needs solid ground below. */
export function lamp_post(g, x, y, z, opts = {}) {
  const post = { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" };
  return place(g, [
    [x, y, z, "stone_brick_wall", post],
    [x, y + 1, z, "stone_brick_wall", post],
    [x, y + 2, z, ...B.lantern(false)],
  ], { over: opts.over, support: [[x, y - 1, z]] });
}

/**
 * One pier and bay unit, 7 cells along the face from `x` (x on north/south faces, z on east/west faces): a 2-wide
 * smooth_stone pier proud 1 outward, then a 5-wide gray_stained_glass bay on the wall plane with black_concrete one
 * cell inside (pearlescent_froglight when opts.lit). opts.plane is the wall-plane coordinate (required: z on
 * north/south faces, x on east/west); opts.y0 / opts.y1 default to 3 / 36.
 */
export function pier_bay(g, x, face, opts = {}) {
  if (opts.plane === undefined) throw new Error("pier_bay needs opts.plane (the wall-plane coordinate)");
  const y0 = opts.y0 ?? 3, y1 = opts.y1 ?? 36;
  const cells = [];
  for (let y = y0; y <= y1; y++) for (let i = 0; i < 7; i++) {
    const a = x + i;
    if (i < 2) {
      cells.push([...at(face, opts.plane, a, y, 0), "smooth_stone"]);
      cells.push([...at(face, opts.plane, a, y, 1), "smooth_stone"]);
    } else {
      cells.push([...at(face, opts.plane, a, y, 0), "gray_stained_glass"]);
      cells.push([...at(face, opts.plane, a, y, -1), opts.lit ? COOL : "black_concrete"]);
    }
  }
  return place(g, cells, { over: opts.over });
}

/**
 * Flag pole at (x, z): iron_bars from deck+1 to deck+12 (deck defaults to 26, the porch deck top), standing on the deck.
 * A 2 x 2 wool flag east of the top: colour red, white or blue.
 */
export function flag_pole(g, x, z, colour, opts = {}) {
  const wool = { red: "red_wool", white: "white_wool", blue: "blue_wool" }[colour];
  if (!wool) throw new Error(`flag colour must be red, white or blue, got ${colour}`);
  const d = opts.deck ?? 26;
  const bars = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  const cells = [];
  for (let y = d + 1; y <= d + 12; y++) cells.push([x, y, z, "iron_bars", bars]);
  for (const dx of [1, 2]) for (const y of [d + 10, d + 11]) cells.push([x + dx, y, z, wool]);
  return place(g, cells, { over: opts.over, support: [[x, d, z]] });
}

/**
 * Hall plant box at (x, z): 20 x 13 x 4 of gray_concrete, iron_bars grilles on the middle two rows of each side, and a
 * sea_lantern at the top north-west corner. Bottom at opts.y (default 41: the Hall deck is y 40). Needs the deck below.
 */
export function ahu_box(g, x, z, opts = {}) {
  const y = opts.y ?? 41;
  const W = 20, D = 13, H = 4;
  const inside = (dx, dy, dz) => dx >= 0 && dx < W && dy >= 0 && dy < H && dz >= 0 && dz < D;
  const cells = [];
  for (let dx = 0; dx < W; dx++) for (let dz = 0; dz < D; dz++) for (let dy = 0; dy < H; dy++) {
    const side = dx === 0 || dx === W - 1 || dz === 0 || dz === D - 1;
    const corner = (dx === 0 || dx === W - 1) && (dz === 0 || dz === D - 1);
    const at3 = [x + dx, y + dy, z + dz];
    if (dy === H - 1 && dx === 0 && dz === 0) cells.push([...at3, "sea_lantern"]);
    else if (side && !corner && (dy === 1 || dy === 2)) {
      // a bar joins a neighbour that is bars or box (in the box), not one outside it
      const link = (ddx, ddz) => { const n = inside(dx + ddx, dy, dz + ddz); return n ? "true" : "false"; };
      cells.push([...at3, "iron_bars", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" }]);
    } else cells.push([...at3, "gray_concrete"]);
  }
  const support = [];
  for (let dx = 0; dx < W; dx++) for (let dz = 0; dz < D; dz++) support.push([x + dx, y - 1, z + dz]);
  return place(g, cells, { over: opts.over, support });
}

/**
 * TICC colonnade pier at (x, z), 3 x 3: a smooth_quartz base course at y (default 6), quartz_pillar (axis y) from
 * y+1 to y+49, and a smooth_quartz capital at y+50 (56). Needs the terrace below the base.
 */
export function ticc_pier(g, x, z, opts = {}) {
  const base = opts.y ?? 6;
  const cells = [];
  const support = [];
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
    const px = x + dx, pz = z + dz;
    cells.push([px, base, pz, "smooth_quartz"]);
    for (let y = base + 1; y <= base + 49; y++) cells.push([px, y, pz, ...B.pillar("quartz_pillar", "y")]);
    cells.push([px, base + 50, pz, "smooth_quartz"]);
    support.push([px, base - 1, pz]);
  }
  return place(g, cells, { over: opts.over, support });
}

/** Roof light: sea_lantern at (x, y, z), set in the deck's top row on the solid cell below. */
export function roof_light(g, x, y, z, opts = {}) {
  return place(g, [[x, y, z, "sea_lantern"]], { over: opts.over, support: [[x, y - 1, z]] });
}

// ---- seeded choice for window_backing ---------------------------------------------------------------------------

function hashCells(cells) {
  let h = 0x811c9dc5;
  for (const c of cells) for (const ch of c.join(",") + ";") h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return h >>> 0;
}
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickLit(cells, warm, cool, rnd) {
  const k = (c) => c.join(",");
  const free = new Set(cells.map(k));
  const sorted = [...cells].sort((p, q) => p[1] - q[1] || p[0] - q[0] || p[2] - q[2]);
  const out = new Map();
  let wantW = Math.round(cells.length * warm), wantC = Math.round(cells.length * cool);
  while ((wantW > 0 || wantC > 0) && free.size) {
    const pool = sorted.filter((c) => free.has(k(c)));
    const seed = pool[Math.floor(rnd() * pool.length)];
    const warmPick = wantC <= 0 || (wantW > 0 && rnd() < wantW / (wantW + wantC));
    const block = warmPick ? LIT : COOL;
    const room = warmPick ? wantW : wantC;
    let members;
    if (rnd() < 0.15) members = pool.filter((c) => c[1] === seed[1]).slice(0, room);   // a whole floor
    else {
      const size = Math.min(room, 2 + Math.floor(rnd() * 5));
      members = [seed];
      const seen = new Set([k(seed)]);
      for (let i = 0; i < members.length && members.length < size; i++) {
        const [x, y, z] = members[i];
        for (const n of [[x + 1, y, z], [x - 1, y, z], [x, y, z + 1], [x, y, z - 1]]) {
          if (members.length >= size || seen.has(k(n)) || !free.has(k(n))) continue;
          seen.add(k(n));
          members.push(n);
        }
      }
    }
    for (const m of members) { out.set(k(m), block); free.delete(k(m)); }
    if (warmPick) wantW -= members.length; else wantC -= members.length;
  }
  return out;
}
