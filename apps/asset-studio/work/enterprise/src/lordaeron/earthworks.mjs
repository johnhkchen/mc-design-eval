// Earthworks: retaining-wall tiles for the cuts a placer's levelling leaves in a slope. A tile is drawn from a role map
// (T the high ground, W the wall, A the low apron), so corners and buttresses come from the same builder as straights.
// Authored with the low ground to the south: z = depth-1 is the low edge (all tiles align on it), the wall face looks
// south, the high ground runs north. Layers 0-1 ground, 2 the low surface, 2+h the high surface.
// Depth by default: a cobble footing course, mixed coursed stone (mossy, cracked) seeded per tile, a battered footing
// of stairs where the wall is 2 or more, a coping course and a low parapet from 2 up, ivy down the taller faces.
// The geometry is the contract; the materials and ornament come from a style (LORDAERON here, a kingdom passes its own).
import { Grid } from "../grid.mjs";

const GRASS = "grass_block[snowy=false]";
const stairs = (b, facing, half = "bottom") => `${b}_stairs[facing=${facing},half=${half},shape=straight,waterlogged=false]`;
const slab = (b) => `${b}_slab[type=bottom,waterlogged=false]`;
const LANTERN_UP = "lantern[hanging=false,waterlogged=false]";
// a small deterministic hash: the same tile and seed always build the same blocks
export const hash = (...n) => {
  // FNV over the inputs, then a murmur finaliser: neighbouring seeds and layers must not give neighbouring values
  let h = 2166136261; for (const v of n) { h ^= v + 0x9e3779b9; h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return ((h >>> 0) % 1000) / 1000;
};
const cobbleWall = (p, up) => `cobblestone_wall[east=${p.east},north=${p.north},south=${p.south},up=${up},waterlogged=false,west=${p.west}]`;

/** Lordaeron's earthworks: cobble footings, coursed stone gone mossy, a cobble parapet, ivy, a planted grass terrace. */
export const LORDAERON = {
  foot: (r) => (r < 0.65 ? "cobblestone" : "mossy_cobblestone"),
  course: (r) => (r < 0.58 ? "stone_bricks" : r < 0.8 ? "mossy_stone_bricks" : r < 0.94 ? "cracked_stone_bricks" : "andesite"),
  low: (r) => (r < 0.7 ? GRASS : r < 0.88 ? "coarse_dirt" : "gravel"),
  drain: (r) => (r < 0.5 ? "coarse_dirt" : "gravel"),
  coping: "stone_bricks",                                  // the wall's top course, the steps' landing, the plinth's top
  stair: "stone_brick", batter: (r) => (r < 0.8 ? "stone_brick" : "mossy_stone_brick"), tread: "stone_bricks", tread_slab: "stone_brick",
  // the parapet along the coping: p the joins (low/none) to the wall's neighbours, post where it stands up
  parapet: (p, post) => cobbleWall(p, post),
  cheek_post: "cobblestone_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]", cheek_lamps: [0],
  guard: (e, w) => `cobblestone_wall[east=${e ? "low" : "none"},north=none,south=none,up=${!e || !w},waterlogged=false,west=${w ? "low" : "none"}]`,
  vine: 0.4,
  // the terrace between courses: planted at the upper course's foot, grass to walk on along the lower course's edge
  terrace_bed: (r) => (r < 0.3 ? "moss_block" : r < 0.4 ? "rooted_dirt" : GRASS),
  terrace_walk: (q) => (q < 0.25 ? "moss_block" : GRASS),
  terrace_plants: ["azalea", "flowering_azalea", "fern", "large_fern", "oxeye_daisy", "cornflower", "allium", "oak_leaves"],
  terrace_carpet: (q) => q >= 0.25,
  lamp_post: ["mossy_cobblestone_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]", "mossy_cobblestone_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]"],
};
// a plant name to its blocks, bottom up
const PLANT_BLOCKS = {
  large_fern: ["large_fern[half=lower]", "large_fern[half=upper]"], peony: ["peony[half=lower]", "peony[half=upper]"],
  rose_bush: ["rose_bush[half=lower]", "rose_bush[half=upper]"], lilac: ["lilac[half=lower]", "lilac[half=upper]"],
  oak_leaves: ["oak_leaves[distance=1,persistent=true,waterlogged=false]"],                   // a clipped shrub
  flowering_azalea_leaves: ["flowering_azalea_leaves[distance=1,persistent=true,waterlogged=false]"],
  bamboo: ["bamboo[age=0,leaves=none,stage=0]", "bamboo[age=0,leaves=small,stage=0]", "bamboo[age=0,leaves=large,stage=0]"],
  pink_petals: ["pink_petals[facing=north,flower_amount=4]"],
};

/** Build a tile from rows of roles (row 0 the north edge). opts: h (rise), seed, lamp: [x, z] of a parapet lamp, buttress: [[x, z]] apron piers. */
export function retain(rows, { h, seed = 0, lamp = null, buttress = [], style: S = LORDAERON }) {
  const d = rows.length, w = rows[0].length, g = new Grid([w, 2 + h + 3, d]);
  const role = (x, z) => (x < 0 || z < 0 || x >= w || z >= d ? null : rows[z][x]);
  // past the tile's edge the wall runs on (the neighbouring tile continues it), so the parapet joins across tiles
  const clamp = (v, n) => Math.max(0, Math.min(n - 1, v));
  const isWall = (x, z) => rows[clamp(z, d)][clamp(x, w)] === "W";
  const N4 = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
  const top = 2 + h;
  for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
    const r = role(x, z);
    if (r === "T") { for (let y = 0; y < top; y++) g.set(x, y, z, "dirt"); g.set(x, top, z, GRASS); }
    else if (r === "A") {
      g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt");
      // the drain strip at the wall's foot is coarse; further out it greens over
      const atFoot = N4.some(([dx, dz]) => isWall(x + dx, z + dz));
      g.set(x, 2, z, atFoot ? S.drain(hash(seed, x, z, 7)) : S.low(hash(seed, x, z)));
    } else if (r === "W") {
      g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, S.foot(hash(seed, x, z, 1)));
      for (let y = 3; y <= top; y++) g.set(x, y, z, y === 3 ? S.foot(hash(seed, x, y, z, 2)) : y === top && h >= 2 ? S.coping : S.course(hash(seed, x, y, z, 3)));
      // the parapet: a low wall along the coping, joined to its neighbours, from a rise of 2
      if (h >= 2) {
        const p = Object.fromEntries(N4.map(([dx, dz, f]) => [f, isWall(x + dx, z + dz) ? "low" : "none"]));
        const ends = Object.values(p).filter((v) => v === "low").length;
        const post = (lamp && lamp[0] === x && lamp[1] === z) || ends !== 2 || (p.east === "low") !== (p.west === "low");
        g.set(x, top + 1, z, S.parapet(p, post));
        if (lamp && lamp[0] === x && lamp[1] === z) g.set(x, top + 2, z, LANTERN_UP);
      } else if (lamp && lamp[0] === x && lamp[1] === z) g.set(x, top + 1, z, LANTERN_UP);
    }
  }
  // the battered footing: a stair against each wall face from a rise of 2, ivy hung down the faces from 3
  for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
    if (role(x, z) !== "A") continue;
    const faces = N4.filter(([dx, dz]) => isWall(x + dx, z + dz));
    if (buttress.some(([bx, bz]) => bx === x && bz === z) && faces.length === 1) {
      // a pier: coursed up to a stair weathering a course below the coping
      const f = faces[0][2];
      for (let y = 3; y < top - 1; y++) g.set(x, y, z, y === 3 ? S.foot(hash(seed, x, y, z, 4)) : S.coping);
      g.set(x, top - 1, z, stairs(S.stair, f));
      continue;
    }
    if (faces.length !== 1 || h < 2) continue;
    const f = faces[0][2];
    g.set(x, 3, z, stairs(S.batter(hash(seed, x, z, 5)), f));
    if (h >= 3 && hash(seed, x, z, 6) < S.vine) {
      const n = 1 + Math.floor(hash(seed, x, z, 8) * (h - 2));
      for (let y = top; y > top - n && y > 3; y--) g.set(x, y, z, `vine[east=${f === "east"},north=${f === "north"},south=${f === "south"},up=false,west=${f === "west"}]`);
    }
  }
  return g;
}

/** Steps up through the cut: half steps only (bottom slab, then a full block, and so on), 2 wide between cheek walls. */
export function steps({ h, seed = 0, flight = 2, style: S = LORDAERON }) {
  const w = flight + 2, d = 2 * h + 1, top = 2 + h, g = new Grid([w, top + 3, d]);
  for (let z = 0; z < d; z++) {
    // from the low edge north: row d-1 is a slab on the low ground, each further row half a block higher
    const k = d - 1 - z, up = (k + 1) / 2;           // the walking surface's rise above the low ground at this row
    const level = Math.min(h, up);                    // row 0 is the landing on the high ground
    for (let x = 0; x < w; x++) {
      const cheek = x === 0 || x === w - 1;
      for (let y = 0; y < 3; y++) g.set(x, y, z, y === 2 && !cheek ? "dirt" : "dirt");
      if (cheek) {
        // the cheek walls: coursed stone up to the bank, a stair coping stepping down with the flight, a post at the top
        const hi = 2 + Math.ceil(level) + (z === 0 ? 0 : 1);
        for (let y = 2; y < hi; y++) g.set(x, y, z, y === 2 ? S.foot(hash(seed, x, z, 1)) : S.course(hash(seed, x, y, z, 3)));
        g.set(x, hi, z, z === 0 ? S.coping : stairs(S.stair, "north"));
        if (z === 0) g.set(x, hi + 1, z, S.cheek_post);
        if (z === 0 && S.cheek_lamps.includes(x === 0 ? 0 : 1)) g.set(x, hi + 2, z, LANTERN_UP);
        continue;
      }
      const whole = Math.floor(level), half = level !== whole;
      for (let y = 3; y < 3 + whole; y++) g.set(x, y, z, z === 0 && y === 2 + whole ? "dirt" : S.tread);
      if (z === 0) g.set(x, 2 + h, z, S.tread);
      if (half) g.set(x, 3 + whole, z, slab(S.tread_slab));
      else if (whole === 0) g.set(x, 2, z, "gravel");
    }
  }
  return g;
}

/** A cut-face finish: the levelled face left natural, not walled: stone and tuff with moss and roots, grass lipping over. */
export function cutFace({ h, seed = 0 }) {
  const top = 2 + h, g = new Grid([1, top + 1, 3]);
  // the face is rock: stone, andesite, tuff and mossy cobble; moss and roots only in its upper half
  const FACE = (r, upper) => (r < 0.34 ? "stone" : r < 0.56 ? "andesite" : r < 0.72 ? "tuff" : r < 0.88 || !upper ? "mossy_cobblestone" : r < 0.95 ? "moss_block" : "rooted_dirt");
  for (let y = 0; y < top; y++) g.set(0, y, 0, "dirt"); g.set(0, top, 0, "grass_block[snowy=false]");
  for (let y = 0; y < 2; y++) g.set(0, y, 1, "dirt");
  // the root lip, moss and roots only on faces 3 and up: a low face is all rock, or it reads as a raw cut
  for (let y = 2; y < top; y++) g.set(0, y, 1, h >= 3 && y === top - 1 ? (hash(seed, y, 9) < 0.5 ? "rooted_dirt" : "mossy_cobblestone") : FACE(hash(seed, y, 3), h >= 3 && y - 2 >= h / 2));
  g.set(0, top, 1, hash(seed, 11) < 0.6 ? "moss_block" : "grass_block[snowy=false]");
  for (let y = 0; y < 2; y++) g.set(0, y, 2, "dirt");
  g.set(0, 2, 2, hash(seed, 12) < 0.5 ? "coarse_dirt" : "grass_block[snowy=false]");
  // roots hang from the lip and a scree of stone at the foot
  if (h >= 2) g.set(0, top - 1, 2, "hanging_roots[waterlogged=false]");
  if (hash(seed, 13) < 0.5) g.set(0, 3, 2, hash(seed, 14) < 0.5 ? "moss_carpet" : "cobblestone_slab[type=bottom,waterlogged=false]");
  return g;
}

/** A side flight inside a 3-deep front yard: the landing at the door's column (x 0), the flight running along the yard
 *  (+x) down to the street, half steps only. z 0 against the house (plot level, a guard wall past the landing), z 1 the
 *  flight, z 2 the street edge (a retaining wall with a parapet, open at the flight's foot). Mirror for a flight to -x. */
export function sideSteps({ h, seed = 0, style: S = LORDAERON }) {
  const L = 2 * h + 1, top = 2 + h, g = new Grid([L, top + 3, 3]);
  for (let x = 0; x < L; x++) {
    // z 0: the strip against the house, at plot level; past the landing a guard wall over the flight
    for (let y = 0; y < top; y++) g.set(x, y, 0, "dirt"); g.set(x, top, 0, x === 0 ? S.tread : "grass_block[snowy=false]");
    if (x > 0) g.set(x, top + 1, 0, S.guard(x < L - 1, x > 1));
    // z 1: the landing, then the flight: the walking surface at cell x is h - x/2 above the street
    g.set(x, 0, 1, "dirt"); g.set(x, 1, 1, "dirt");
    const t = h - x / 2, whole = Math.floor(t), half = t !== whole;
    g.set(x, 2, 1, whole === 0 && !half ? S.tread : S.foot(hash(seed, x, 1)));
    for (let y = 3; y <= 2 + whole; y++) g.set(x, y, 1, S.tread);
    if (half) g.set(x, 3 + whole, 1, slab(S.tread_slab));
    // z 2: the street edge: a coursed retaining wall to plot level with a parapet, open at the foot of the flight
    g.set(x, 0, 2, "dirt"); g.set(x, 1, 2, "dirt");
    if (x === L - 1) { g.set(x, 2, 2, S.tread); continue; }
    g.set(x, 2, 2, S.foot(hash(seed, x, 2)));
    for (let y = 3; y <= top; y++) g.set(x, y, 2, y === 3 ? S.foot(hash(seed, x, y, 4)) : y === top ? S.coping : S.course(hash(seed, x, y, 3)));
    g.set(x, top + 1, 2, S.guard(x < L - 2, x > 0));
    if (x === 0) g.set(x, top + 2, 2, LANTERN_UP);
  }
  return g;
}

/** A stepped stone plinth at a house's foot on a fill: rise r (1-3), r + 1 deep, run along the wall (z 0 touches it).
 *  Row 0 is coped flush with the house's ground; each row out is a course lower, topped with a stair (the water table
 *  stepping down); the low ground is layer 2. corner: the outer corner, the house to the north-west. */
export function plinth({ h, seed = 0, corner = false, style: S = LORDAERON }) {
  const d = h + 1, w = corner ? d : 1, g = new Grid([w, 2 + h + 1, d]);
  for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
    const i = corner ? Math.max(x, z) : z, top = 2 + h - i;   // the course's top layer
    g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, i === h ? "coarse_dirt" : S.foot(hash(seed, x, z, 1)));
    for (let y = 3; y <= top; y++) {
      const face = corner && x > z ? "west" : "north";
      g.set(x, y, z, y < top ? (y === 3 ? S.foot(hash(seed, x, y, z, 2)) : S.course(hash(seed, x, y, z, 3))) : i === 0 ? S.coping : stairs(S.stair, face));
    }
    if (i === h) g.set(x, 3, z, stairs(S.stair, corner && x > z ? "west" : "north"));   // the toe
  }
  return g;
}

/** A terrace between two courses: 1 wide, 2 deep, laid on the lower course's top. z 0 at the upper course's foot is
 *  planted (shrubs, ferns, flowers, an azalea), z 1 along the lower course's edge is walkable grass and moss. Layers 0-1
 *  ground, 2 the terrace's surface. lamp: a lantern on a post at the foot instead of the planting. */
export function terrace({ seed = 0, lamp = false, style: S = LORDAERON }) {
  const g = new Grid([1, 3 + S.lamp_post.length + 1, 2]);
  for (let z = 0; z < 2; z++) { g.set(0, 0, z, "dirt"); g.set(0, 1, z, "dirt"); }
  const r = hash(seed, 1), q = hash(seed, 2);
  g.set(0, 2, 0, S.terrace_bed(r));
  g.set(0, 2, 1, S.terrace_walk(q));
  if (lamp) {
    S.lamp_post.forEach((b, i) => g.set(0, 3 + i, 0, b));
    g.set(0, 3 + S.lamp_post.length, 0, LANTERN_UP);
  } else {
    const p = S.terrace_plants[Math.floor(hash(seed, 3) * S.terrace_plants.length)];
    (PLANT_BLOCKS[p] || [p]).forEach((b, i) => g.set(0, 3 + i, 0, b));
    if (S.terrace_carpet(q) && hash(seed, 4) < 0.35) g.set(0, 3, 1, "moss_carpet");
  }
  return g;
}

// the tiles: [id, width, rise, rows, opts, tags]
const STRAIGHT = (w) => ["T".repeat(w), "W".repeat(w), "A".repeat(w)];
export function allEarthworks(style = LORDAERON) {
  const out = [];
  for (let h = 1; h <= 4; h++) {
    for (const v of ["a", "b", "c"]) out.push({ id: `retain_h${h}_1${v}`, grid: retain(STRAIGHT(1), { h, seed: v.charCodeAt(0) * 31 + h, style }), meta: { width: 1, rise: h, kind_of: "straight", tags: ["straight"] } });
    out.push({ id: `retain_h${h}_lamp_1`, grid: retain(STRAIGHT(1), { h, seed: h, lamp: [0, 1], style }), meta: { width: 1, rise: h, kind_of: "straight", tags: ["straight", "lamp"] } });
    if (h >= 3) out.push({ id: `retain_h${h}_buttress_1`, grid: retain(STRAIGHT(1), { h, seed: 90 + h, buttress: [[0, 2]], style }), meta: { width: 1, rise: h, kind_of: "straight", tags: ["straight", "buttress"] } });
    out.push({ id: `retain_h${h}_outer_3`, grid: retain(["TWA", "WWA", "AAA"], { h, seed: 50 + h, style }), meta: { width: 3, rise: h, kind_of: "corner_outer", tags: ["corner"] } });
    out.push({ id: `retain_h${h}_inner_3`, grid: retain(["TTT", "TWW", "TWA"], { h, seed: 70 + h, style }), meta: { width: 3, rise: h, kind_of: "corner_inner", tags: ["corner"] } });
    for (const v of ["a", "b", "c"]) out.push({ id: `cutface_h${h}_1${v}`, grid: cutFace({ h, seed: v.charCodeAt(0) * 17 + h }), meta: { width: 1, rise: h, kind_of: "cut_face", tags: ["cut_face"] } });
    out.push({ id: `steps_h${h}_3`, grid: steps({ h, seed: 40 + h, flight: 1, style }), meta: { width: 3, rise: h, kind_of: "steps", tags: ["steps", "path", "lamp"] } });
    if (h >= 2) out.push({ id: `steps_side_h${h}`, grid: sideSteps({ h, seed: 60 + h, style }), meta: { width: 2 * h + 1, rise: h, kind_of: "steps_side", tags: ["steps", "path", "lamp"], landing: [0, 1], door_column: 0 } });
    if (h <= 3) for (const [k, c] of [["1", false], ["corner", true]]) out.push({ id: `plinth_h${h}_${k}`, grid: plinth({ h, seed: 80 + h, corner: c, style }), meta: { width: c ? h + 1 : 1, rise: h, kind_of: c ? "plinth_corner" : "plinth", tags: ["plinth"] } });
    out.push({ id: `steps_h${h}_4`, grid: steps({ h, seed: 20 + h, style }), meta: { width: 4, rise: h, kind_of: "steps", tags: ["steps", "lamp"] } });
  }
  for (const v of ["a", "b", "c", "d", "e", "f"]) out.push({ id: `terrace_1${v}`, grid: terrace({ seed: v.charCodeAt(0) * 13, style }), meta: { width: 1, rise: 0, kind_of: "terrace", tags: ["terrace"] } });
  out.push({ id: "terrace_lamp_1", grid: terrace({ seed: 5, lamp: true, style }), meta: { width: 1, rise: 0, kind_of: "terrace", tags: ["terrace", "lamp"] } });
  return out;
}
