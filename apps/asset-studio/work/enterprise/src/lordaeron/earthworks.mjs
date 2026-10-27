// Earthworks: retaining-wall tiles for the cuts a placer's levelling leaves in a slope. A tile is drawn from a role map
// (T the high ground, W the wall, A the low apron), so corners and buttresses come from the same builder as straights.
// Authored with the low ground to the south: z = depth-1 is the low edge (all tiles align on it), the wall face looks
// south, the high ground runs north. Layers 0-1 ground, 2 the low surface, 2+h the high surface.
// Depth by default: a cobble footing course, mixed coursed stone (mossy, cracked) seeded per tile, a battered footing
// of stairs where the wall is 2 or more, a coping course and a low parapet from 2 up, ivy down the taller faces.
import { Grid } from "../grid.mjs";

const GRASS = "grass_block[snowy=false]";
const stairs = (b, facing, half = "bottom") => `${b}_stairs[facing=${facing},half=${half},shape=straight,waterlogged=false]`;
const slab = (b) => `${b}_slab[type=bottom,waterlogged=false]`;
const LANTERN_UP = "lantern[hanging=false,waterlogged=false]";
// a small deterministic hash: the same tile and seed always build the same blocks
const hash = (...n) => { let h = 2166136261; for (const v of n) { h ^= v + 0x9e3779b9; h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };
const COURSE = (r) => (r < 0.58 ? "stone_bricks" : r < 0.8 ? "mossy_stone_bricks" : r < 0.94 ? "cracked_stone_bricks" : "andesite");
const FOOT = (r) => (r < 0.65 ? "cobblestone" : "mossy_cobblestone");
const LOW = (r) => (r < 0.7 ? GRASS : r < 0.88 ? "coarse_dirt" : "gravel");

/** Build a tile from rows of roles (row 0 the north edge). opts: h (rise), seed, lamp: [x, z] of a parapet lamp, buttress: [[x, z]] apron piers. */
export function retain(rows, { h, seed = 0, lamp = null, buttress = [] }) {
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
      g.set(x, 2, z, atFoot ? (hash(seed, x, z, 7) < 0.5 ? "coarse_dirt" : "gravel") : LOW(hash(seed, x, z)));
    } else if (r === "W") {
      g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, FOOT(hash(seed, x, z, 1)));
      for (let y = 3; y <= top; y++) g.set(x, y, z, y === 3 ? FOOT(hash(seed, x, y, z, 2)) : y === top && h >= 2 ? "stone_bricks" : COURSE(hash(seed, x, y, z, 3)));
      // the parapet: a low wall along the coping, joined to its neighbours, from a rise of 2
      if (h >= 2) {
        const p = Object.fromEntries(N4.map(([dx, dz, f]) => [f, isWall(x + dx, z + dz) ? "low" : "none"]));
        const ends = Object.values(p).filter((v) => v === "low").length;
        const post = (lamp && lamp[0] === x && lamp[1] === z) || ends !== 2 || (p.east === "low") !== (p.west === "low");
        g.set(x, top + 1, z, `cobblestone_wall[east=${p.east},north=${p.north},south=${p.south},up=${post},waterlogged=false,west=${p.west}]`);
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
      for (let y = 3; y < top - 1; y++) g.set(x, y, z, y === 3 ? FOOT(hash(seed, x, y, z, 4)) : "stone_bricks");
      g.set(x, top - 1, z, stairs("stone_brick", f));
      continue;
    }
    if (faces.length !== 1 || h < 2) continue;
    const f = faces[0][2];
    g.set(x, 3, z, hash(seed, x, z, 5) < 0.8 ? stairs("stone_brick", f) : stairs("mossy_stone_brick", f));
    if (h >= 3 && hash(seed, x, z, 6) < 0.4) {
      const n = 1 + Math.floor(hash(seed, x, z, 8) * (h - 2));
      for (let y = top; y > top - n && y > 3; y--) g.set(x, y, z, `vine[east=${f === "east"},north=${f === "north"},south=${f === "south"},up=false,west=${f === "west"}]`);
    }
  }
  return g;
}

/** Steps up through the cut: half steps only (bottom slab, then a full block, and so on), 2 wide between cheek walls. */
export function steps({ h, seed = 0, flight = 2 }) {
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
        for (let y = 2; y < hi; y++) g.set(x, y, z, y === 2 ? FOOT(hash(seed, x, z, 1)) : COURSE(hash(seed, x, y, z, 3)));
        g.set(x, hi, z, z === 0 ? "stone_bricks" : stairs("stone_brick", "north"));
        if (z === 0) g.set(x, hi + 1, z, "cobblestone_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]");
        if (z === 0 && x === 0) g.set(x, hi + 2, z, LANTERN_UP);
        continue;
      }
      const whole = Math.floor(level), half = level !== whole;
      for (let y = 3; y < 3 + whole; y++) g.set(x, y, z, z === 0 && y === 2 + whole ? "dirt" : "stone_bricks");
      if (z === 0) g.set(x, 2 + h, z, "stone_bricks");
      if (half) g.set(x, 3 + whole, z, slab("stone_brick"));
      else if (whole === 0) g.set(x, 2, z, "gravel");
    }
  }
  return g;
}

/** A cut-face finish: the levelled face left natural, not walled: stone and tuff with moss and roots, grass lipping over. */
export function cutFace({ h, seed = 0 }) {
  const top = 2 + h, g = new Grid([1, top + 1, 3]);
  const FACE = (r) => (r < 0.3 ? "stone" : r < 0.5 ? "andesite" : r < 0.62 ? "tuff" : r < 0.78 ? "mossy_cobblestone" : r < 0.9 ? "rooted_dirt" : "moss_block");
  for (let y = 0; y < top; y++) g.set(0, y, 0, "dirt"); g.set(0, top, 0, "grass_block[snowy=false]");
  for (let y = 0; y < 2; y++) g.set(0, y, 1, "dirt");
  for (let y = 2; y < top; y++) g.set(0, y, 1, y === top - 1 ? (hash(seed, y, 9) < 0.5 ? "rooted_dirt" : "dirt") : FACE(hash(seed, y, 3)));
  g.set(0, top, 1, hash(seed, 11) < 0.6 ? "moss_block" : "grass_block[snowy=false]");
  for (let y = 0; y < 2; y++) g.set(0, y, 2, "dirt");
  g.set(0, 2, 2, hash(seed, 12) < 0.5 ? "coarse_dirt" : "grass_block[snowy=false]");
  // roots hang from the lip and a scree of stone at the foot
  if (h >= 2) g.set(0, top - 1, 2, "hanging_roots[waterlogged=false]");
  if (hash(seed, 13) < 0.5) g.set(0, 3, 2, hash(seed, 14) < 0.5 ? "moss_carpet" : "cobblestone_slab[type=bottom,waterlogged=false]");
  return g;
}

// the tiles: [id, width, rise, rows, opts, tags]
const STRAIGHT = (w) => ["T".repeat(w), "W".repeat(w), "A".repeat(w)];
export function allEarthworks() {
  const out = [];
  for (let h = 1; h <= 4; h++) {
    for (const v of ["a", "b", "c"]) out.push({ id: `retain_h${h}_1${v}`, grid: retain(STRAIGHT(1), { h, seed: v.charCodeAt(0) * 31 + h }), meta: { width: 1, rise: h, kind_of: "straight", tags: ["straight"] } });
    out.push({ id: `retain_h${h}_lamp_1`, grid: retain(STRAIGHT(1), { h, seed: h, lamp: [0, 1] }), meta: { width: 1, rise: h, kind_of: "straight", tags: ["straight", "lamp"] } });
    if (h >= 3) out.push({ id: `retain_h${h}_buttress_1`, grid: retain(STRAIGHT(1), { h, seed: 90 + h, buttress: [[0, 2]] }), meta: { width: 1, rise: h, kind_of: "straight", tags: ["straight", "buttress"] } });
    out.push({ id: `retain_h${h}_outer_3`, grid: retain(["TWA", "WWA", "AAA"], { h, seed: 50 + h }), meta: { width: 3, rise: h, kind_of: "corner_outer", tags: ["corner"] } });
    out.push({ id: `retain_h${h}_inner_3`, grid: retain(["TTT", "TWW", "TWA"], { h, seed: 70 + h }), meta: { width: 3, rise: h, kind_of: "corner_inner", tags: ["corner"] } });
    for (const v of ["a", "b", "c"]) out.push({ id: `cutface_h${h}_1${v}`, grid: cutFace({ h, seed: v.charCodeAt(0) * 17 + h }), meta: { width: 1, rise: h, kind_of: "cut_face", tags: ["cut_face"] } });
    out.push({ id: `steps_h${h}_3`, grid: steps({ h, seed: 40 + h, flight: 1 }), meta: { width: 3, rise: h, kind_of: "steps", tags: ["steps", "path", "lamp"] } });
    out.push({ id: `steps_h${h}_4`, grid: steps({ h, seed: 20 + h }), meta: { width: 4, rise: h, kind_of: "steps", tags: ["steps", "lamp"] } });
  }
  return out;
}
