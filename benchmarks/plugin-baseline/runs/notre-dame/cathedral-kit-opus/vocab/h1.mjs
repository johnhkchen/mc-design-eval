// plan.md VOCABULARY helpers 1, 5, 9, 13, 17, 21, 25, 29, 33, 37: plinthCourse, radialPier, stoneGable, apseRoof,
// stringCourse, flyerRadial, portal, belfryLancet, apostle, pierLantern. Every one takes the grid `g` first and its
// position (and face) as arguments; it writes only its own footprint and only into air unless { overwrite: true }.
// Each returns { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for a write onto a non-air cell,
// off the grid, or refused by a guard. Block ids are literals from plan.md's PALETTE.
// Polar helpers work about C = (152, 38) (cell centres); angle 0 points east (+x), +90 south (+z), -90 north.
import { DIRS, OPPOSITE, face as F } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Deterministic per-cell hash in [0, 1): the 1-in-n mixes never change between runs.
const hash = (x, y, z) => {
  let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
};

// States exactly as `$MCD states` lists them for 1.21.1 (no waterlogged on these blocks).
const stairs = (mat, facing, half = "bottom", shape = "straight") => [`${mat}_stairs`, { facing, half, shape }];
const slab = (mat, type = "bottom") => [`${mat}_slab`, { type }];
const facingTo = ([dx, dz]) => (Math.abs(dx) >= Math.abs(dz) ? (dx >= 0 ? "east" : "west") : (dz >= 0 ? "south" : "north"));
const C = [152, 38];
const rad = (deg) => (deg * Math.PI) / 180;

function writer(g, overwrite = false) {
  const out = { cells: 0, refused: [] };
  out.put = (x, y, z, block, state) => {
    if (!g.inBounds(x, y, z) || (!overwrite && !g.isAir(x, y, z))) { out.refused.push([x, y, z, block]); return false; }
    g.set(x, y, z, block, state);
    if (g.blockAt(x, y, z) !== `minecraft:${block}`) { out.refused.push([x, y, z, block]); return false; } // a guard said no
    out.cells++;
    return true;
  };
  return out;
}
const done = ({ cells, refused }, extra = {}) => ({ cells, refused, ...extra });

// iron_bars / panes joined to their like neighbours on the same course.
function joinBars(g, cells, re = /iron_bars$|_pane$/) {
  for (const [x, y, z] of cells) {
    const b = g.blockAt(x, y, z);
    if (!re.test(b)) continue;
    const st = {};
    for (const [d, [dx, , dz]] of Object.entries(DIRS)) st[d] = String(g.inBounds(x + dx, y, z + dz) && re.test(g.blockAt(x + dx, y, z + dz)));
    g.set(x, y, z, b.replace(/^minecraft:/, ""), st);
  }
}

// GROUND (brief): first air y over the rock per 5x5 cell (row r = z 5r.., col c = x 5c..); '.' = null.
const GROUND = [
  "-332322332222222222222222222222222----",
  "333333333222222222222222222222222222--",
  "3333333332222222222222222222222222222-",
  "3333333332222222222222222222222222222-",
  "33333333322222222222222222222222222232",
  "33333333322222222222222222222222222233",
  "33333333222222222222222222222222222233",
  "33333333222222222222222222222211222223",
  "33333333222222222222222221222211112222",
  "33333332222222222222111121122211112222",
  "3333333222222222221111111111111111222-",
  "3333333222222222211111111111111111122-",
  "333333322222222221111111111111111112--",
  "33333322222222211111111111111111111---",
  "-3332-222222221111111111122221--1-----",
  "----------------------11122110--------",
  "----------------------1111211000------",
  "----------------------0111111000------",
  "----------------------0111110100------",
  "----------------------0111111110------",
  "------------------------11-111--------",
  "--------------------------11110-------",
  "---------------------------1-1--------",
].map((s) => [...s].map((ch) => (ch === "-" ? null : +ch)));
/** The ground (first air y) at a block column; a '.' cell takes the highest of its nearest read cells (0 if none). */
export function groundAt(x, z) {
  const r0 = Math.max(0, Math.min(GROUND.length - 1, Math.floor(z / 5))), c0 = Math.max(0, Math.min(37, Math.floor(x / 5)));
  for (let d = 0; d < 40; d++) {
    let best = null;
    for (let r = r0 - d; r <= r0 + d; r++) for (let c = c0 - d; c <= c0 + d; c++) {
      if (Math.max(Math.abs(r - r0), Math.abs(c - c0)) !== d) continue;
      const v = GROUND[r]?.[c];
      if (v != null) best = Math.max(best ?? v, v);
    }
    if (best != null) return best;
  }
  return 0;
}

/**
 * 1. Plinth over the outer box x0..x1, z0..z1 (the caller passes the box 1 proud of the wall above): from the local
 * ground (GROUND map; `ground` = a number or (x, z) => y overrides it) up to top-1, `stone_bricks` with 1 in 10
 * `cracked_stone_bricks` (cell hash), the course at top-1 `smooth_stone`. Only into air, so it never buries the ground
 * and, starting at the ground, never floats. Where the ground is already at `top` it writes nothing.
 */
export function plinthCourse(g, x0, z0, x1, z1, { top = 3, ground = groundAt, overwrite = false } = {}) {
  const out = writer(g, overwrite);
  const gy = typeof ground === "function" ? ground : () => ground;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
      for (let y = gy(x, z); y < top; y++)
        out.put(x, y, z, y === top - 1 ? "smooth_stone" : hash(x, y, z) < 0.1 ? "cracked_stone_bricks" : "stone_bricks");
  return done(out);
}

/**
 * 5. A chevet pier on the radius at `angle` about `centre` (C): 2 wide tangentially (the centreline cell and the next
 * one clockwise-of-outward, so +-90 deg is x 152..153), radial r0..r1. Set-offs: the outer row r1 to y 20, r1-1 to y 30,
 * the rest to y 38; `smooth_sandstone`, `sandstone` on ~1/8 of its face cells; weatherings as setoffPier:
 * `smooth_sandstone_stairs` (bottom, facing back toward C) at yTop+1 on each stepped-back row, the topmost (the
 * pinnacle's, y 39) skipped unless capTop. South (angle >= 0) is drawn and the north one is its mirror z' = 2C.z - z.
 */
export function radialPier(g, { angle, r0 = 27, r1 = 33, y0 = 3, centre = C, steps = [20, 30, 38], capTop = false, overwrite = false }) {
  const out = writer(g, overwrite);
  const [cx, cz] = centre;
  const a = rad(Math.abs(angle)), N = angle < 0;
  const d = [Math.cos(a), Math.sin(a)], perp = [Math.sin(a), -Math.cos(a)];
  const zz = (z) => (N ? 2 * cz - z : z);
  const tops = new Map(); // "x,z" (south frame) -> [top, t]
  const R = r1 + 2;
  for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) {
    const [dx, dz] = [x - cx, z - cz];
    const t = dx * d[0] + dz * d[1], s = dx * perp[0] + dz * perp[1];
    if (t < r0 - 0.5 || t >= r1 + 0.5 || s < -0.5 || s >= 1.5) continue;
    const top = t >= r1 - 0.5 ? steps[0] : t >= r1 - 1.5 ? steps[1] : steps[2];
    tops.set(`${x},${z}`, [top, t]);
  }
  for (const [k, [top]] of tops) {
    const [x, z] = k.split(",").map(Number);
    const faceCell = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ez]) => !tops.has(`${x + ex},${z + ez}`));
    for (let y = y0; y <= top; y++) out.put(x, y, zz(z), faceCell && hash(x, y, zz(z)) < 0.125 ? "sandstone" : "smooth_sandstone");
    // a weathering where the column steps back: its top is lower than the next one toward C
    const inner = Math.max(...[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([ex, ez]) => tops.get(`${x + ex},${z + ez}`)?.[0] ?? -1));
    if (top < inner || (capTop && top === steps[2])) {
      const f = facingTo([cx - x, cz - z]);
      out.put(x, top + 1, zz(z), ...stairs("smooth_sandstone", N ? F.mirrorZ(f) : f));
    }
  }
  return done(out);
}

/**
 * 9. A triangular masonry gable. axis "x": the gable spans x from..to in the wall plane z = at; axis "z": spans z
 * from..to in x = at; `thick` layers go inward from `at` (away from `face`, the way it looks out). `smooth_sandstone`
 * from eaveY up under the rake; the rake cells `smooth_sandstone_stairs` facing in (toward the peak); a `sandstone_wall`
 * crocket stub on every 2nd rake cell; at the peak column(s) masonry to peakY-1, finial `end_stone_brick_wall` at
 * peakY and `end_rod` (up) at peakY+1. Footprint: from..to x eaveY..peakY+1 x the thick layers.
 */
export function stoneGable(g, { axis, at, from, to, eaveY, peakY, face, thick = 1, overwrite = false }) {
  const out = writer(g, overwrite);
  const [a, b] = [Math.min(from, to), Math.max(from, to)];
  const into = DIRS[OPPOSITE[face]], dIn = axis === "x" ? into[2] : into[0];
  const mid = (a + b) / 2, c0 = (b - a) % 2 ? 0.5 : 0, half = (b - a) / 2 - c0, rise = peakY - eaveY;
  const put = (u, y, k, ...blk) => (axis === "x" ? out.put(u, y, at + k * dIn, ...blk) : out.put(at + k * dIn, y, u, ...blk));
  const toPeak = (u) => (axis === "x" ? (u < mid ? "east" : "west") : (u < mid ? "south" : "north"));
  for (let u = a; u <= b; u++) {
    const dd = Math.max(0, Math.abs(u - mid) - c0);
    const peak = dd === 0;
    const top = peak ? peakY : eaveY + Math.floor(rise * (1 - dd / half) + 1e-9);
    const i = Math.round(half - dd); // rake index from the eave end
    for (let k = 0; k < thick; k++) {
      for (let y = eaveY; y < top; y++) put(u, y, k, "smooth_sandstone");
      if (peak) { put(u, peakY, k, "end_stone_brick_wall"); if (k === 0) put(u, peakY + 1, k, "end_rod", { facing: "up" }); }
      else {
        put(u, top, k, ...stairs("smooth_sandstone", toPeak(u)));
        if (i % 2 === 1 && k === 0) put(u, top + 1, k, "sandstone_wall");
      }
    }
  }
  return done(out);
}

/**
 * 13. R3, the apse roof: the cells x >= C.x within r of C. Ring r-1 < d <= r is the parapet line: an `iron_bars` crest at
 * the eave y (48). Inside it each cell rises to h = peak - floor(d) (>= eave): `deepslate_tiles` from the eave to h-1, a
 * `deepslate_tile_stairs` at h facing toward C; the hip lines (rays to the half-decagon's vertices `verts`) in
 * `polished_deepslate_stairs`; the centre cell a full `deepslate_tiles` at the peak, and over it the ridge cross
 * `end_stone_brick_wall` peak+1..peak+2 and `end_rod` (up) at peak+3 (= (152, 60..62, 38)).
 */
export function apseRoof(g, { centre = C, r = 11, peak = 59, eave = 48, cross = true,
  verts = [[152, 49], [158, 47], [162, 41], [162, 35], [158, 29], [152, 27]], overwrite = false } = {}) {
  const out = writer(g, overwrite);
  const [cx, cz] = centre;
  const hips = verts.map(([x, z]) => { const l = Math.hypot(x - cx, z - cz); return [(x - cx) / l, (z - cz) / l]; });
  const crest = [];
  for (let x = cx; x <= cx + r; x++) for (let z = cz - r; z <= cz + r; z++) {
    const [dx, dz] = [x - cx, z - cz], d = Math.hypot(dx, dz);
    if (d > r) continue;
    if (d > r - 1) { if (out.put(x, eave, z, "iron_bars")) crest.push([x, eave, z]); continue; }
    const h = Math.max(eave, peak - Math.floor(d));
    for (let y = eave; y < h; y++) out.put(x, y, z, "deepslate_tiles");
    if (d < 0.5) { out.put(x, h, z, "deepslate_tiles"); continue; }
    const onHip = hips.some(([ux, uz]) => dx * ux + dz * uz > 0 && Math.abs(dx * uz - dz * ux) < 0.5);
    out.put(x, h, z, ...stairs(onHip ? "polished_deepslate" : "deepslate_tile", facingTo([-dx, -dz])));
  }
  joinBars(g, crest);
  if (cross) {
    out.put(cx, peak + 1, cz, "end_stone_brick_wall");
    out.put(cx, peak + 2, cz, "end_stone_brick_wall");
    out.put(cx, peak + 3, cz, "end_rod", { facing: "up" });
  }
  return done(out);
}

/**
 * 17. One string course on the wall-face cells [x, z] (or [x, z, face] for a turning run such as the ambulatory), 1 proud
 * at y: upside-down `block` stairs facing the wall (a non-stairs `block` goes in as a full block).
 */
export function stringCourse(g, { cells, y, face, block = "smooth_sandstone_stairs", overwrite = false }) {
  const out = writer(g, overwrite);
  for (const [x, z, f = face] of cells) {
    const [px, pz] = [x + DIRS[f][0], z + DIRS[f][2]];
    if (/_stairs$/.test(block)) out.put(px, y, pz, block, { facing: OPPOSITE[f], half: "top", shape: "straight" });
    else out.put(px, y, pz, block);
  }
  return done(out);
}

// plan.md's nave flyer coping profile (z 64 -> 51), resampled along a chevet flyer's length.
const FLYER_TOPS = [36, 37, 37, 38, 39, 39, 40, 41, 42, 42, 43, 44, 44, 45];

/**
 * 21. A chevet flying buttress on the radius at `angle` about C, one block thick: Bresenham cells from rFrom (26, just
 * inside the pier's inner face r 27) to rTo (12, against the apse wall r 11), the nave flyer's coping profile (y 36 at
 * the pier -> 45 at the apse) resampled over them. Each column: the coping (`smooth_sandstone_stairs` bottom facing
 * toward C where the next column is higher, else a bottom `smooth_sandstone_slab`), one `smooth_sandstone` body under
 * it (two at the 2 cells of each end), then an upside-down `smooth_sandstone_stairs` soffit facing outward. Air below.
 */
export function flyerRadial(g, { angle, rFrom = 26, rTo = 12, centre = C, tops = FLYER_TOPS, overwrite = false }) {
  const out = writer(g, overwrite);
  const [cx, cz] = centre, a = rad(angle);
  const P = (r) => [Math.round(cx + r * Math.cos(a)), Math.round(cz + r * Math.sin(a))];
  const [[x0, z0], [x1, z1]] = [P(rFrom), P(rTo)];
  const line = [];
  { // Bresenham
    let [x, z] = [x0, z0];
    const [dx, dz] = [Math.abs(x1 - x0), -Math.abs(z1 - z0)], [sx, sz] = [x0 < x1 ? 1 : -1, z0 < z1 ? 1 : -1];
    let err = dx + dz;
    for (;;) {
      line.push([x, z]);
      if (x === x1 && z === z1) break;
      const e2 = 2 * err;
      if (e2 >= dz) { err += dz; x += sx; }
      if (e2 <= dx) { err += dx; z += sz; }
    }
  }
  const n = line.length, topAt = (i) => tops[Math.round((i * (tops.length - 1)) / Math.max(1, n - 1))];
  line.forEach(([x, z], i) => {
    const top = topAt(i), next = i + 1 < n ? topAt(i + 1) : top;
    const inward = facingTo([cx - x, cz - z]);
    out.put(x, top, z, ...(next > top ? stairs("smooth_sandstone", inward) : slab("smooth_sandstone")));
    const body = i < 2 || i >= n - 2 ? 2 : 1;
    for (let k = 1; k <= body; k++) out.put(x, top - k, z, "smooth_sandstone");
    out.put(x, top - body - 1, z, ...stairs("smooth_sandstone", OPPOSITE[inward], "top"));
  });
  return done(out, { line });
}

/**
 * 25. A pointed portal recessed into a wall. at = [x, y, z]: the door plane's bottom centre cell (y = the sill/floor);
 * face = the way it looks out; w x h = the clear door opening (an even w puts its extra column clockwise of `face`);
 * archTop = the keystone y over the door plane. Planes k = 0..rings-1 step out from the door plane (k = rings-1 is the
 * wall's outer face): each is 2*step wider and its keystone 1 higher than the one behind; in each plane the jambs
 * (`cut_sandstone`, both sides, up to the head) and the pointed head (upside-down `smooth_sandstone_stairs`, back
 * against the jamb side, `cut_sandstone` keystone, `smooth_sandstone` spandrels up to the keystone row); the ring
 * planes' openings stay air. Door plane: `dark_oak_door` pairs at y, y+1 (both halves, facing out, hinges on the outer
 * sides), `cut_sandstone` lintel at y+2, `chiseled_sandstone` tympanum above it up to the head (centre column
 * `end_stone_bricks`); trumeau (true = the centre, or its world x/z) `sandstone_wall` at y, y+1 under a
 * `chiseled_sandstone` statue head at y+2. { cellsOnly: true } writes nothing (the shell's "void only" pass: leave
 * `box` out of the wall). Returns `box`: every cell of the portal, and `opening`: its air cells.
 */
export function portal(g, { at, face, w, h, archTop, rings = 3, step = 1, trumeau, cellsOnly = false, overwrite = false }) {
  if (w < 1 || h < 3 || archTop < at[1] + h) throw new Error(`portal: needs w >= 1, h >= 3, archTop >= y + h`);
  const out = writer(g, overwrite);
  const outV = DIRS[face], R = DIRS[F.cw(face)];
  const [ax, y0, az] = at;
  const pos = (u, k) => [ax + u * R[0] + k * outV[0], az + u * R[2] + k * outV[2]];
  const spring = y0 + h;
  const uL0 = -Math.floor((w - 1) / 2), uR0 = uL0 + w - 1;
  const tu = trumeau === true ? 0 : trumeau == null ? null : (trumeau - (R[0] ? ax : az)) * (R[0] || R[2]);
  const box = [], opening = [];
  const cell = (u, k, y, blk) => {
    const [x, z] = pos(u, k);
    box.push([x, y, z]);
    if (!blk) { opening.push([x, y, z]); return; }
    if (!cellsOnly) out.put(x, y, z, ...blk);
  };
  for (let k = 0; k < rings; k++) {
    const uL = uL0 - k * step, uR = uR0 + k * step, apex = archTop + k, H = apex - 1 - spring;
    const mid = (uL + uR) / 2, c0 = (uR - uL) % 2 ? 0.5 : 0, half = (uR - uL + 1) / 2 - c0 + 0.5;
    const yTop = (u) => spring - 1 + Math.round((H + 1) * Math.sqrt(Math.max(0, 1 - Math.max(0, Math.abs(u - mid) - c0) / half)));
    for (const u of [uL - 1, uR + 1]) for (let y = y0; y <= apex; y++) cell(u, k, y, [y <= yTop(u === uL - 1 ? uL : uR) ? "cut_sandstone" : "smooth_sandstone", {}]);
    for (let u = uL; u <= uR; u++) {
      const t = yTop(u), keystone = Math.abs(u - mid) <= c0;
      for (let y = y0; y <= apex; y++) {
        if (y <= t) {
          if (k > 0) { cell(u, k, y, null); continue; }
          if (u === tu) cell(u, k, y, [y < y0 + 2 ? "sandstone_wall" : y === y0 + 2 ? "chiseled_sandstone" : keystone ? "end_stone_bricks" : "chiseled_sandstone", {}]);
          else if (y < y0 + 2) cell(u, k, y, null); // the doors, set below as pairs
          else cell(u, k, y, [y === y0 + 2 ? "cut_sandstone" : keystone ? "end_stone_bricks" : "chiseled_sandstone", {}]);
        } else if (y === t + 1) {
          const toJamb = facingTo(u < mid ? [-R[0], -R[2]] : [R[0], R[2]]);
          cell(u, k, y, keystone ? ["cut_sandstone", {}] : stairs("smooth_sandstone", toJamb, "top"));
        } else cell(u, k, y, ["smooth_sandstone", {}]);
      }
    }
  }
  // door pairs in the door plane, run by run either side of the trumeau, from the counter-clockwise (left) end
  if (!cellsOnly) {
    const runs = tu == null || tu < uL0 || tu > uR0 ? [[uL0, uR0]] : [[uL0, tu - 1], [tu + 1, uR0]];
    for (const [s, e] of runs) for (let u = s; u <= e; u++) {
      const hinge = (u - s) % 2 ? "right" : "left"; // pairs hinge on their outer sides
      const [x, z] = pos(u, 0);
      out.put(x, y0, z, "dark_oak_door", { facing: face, half: "lower", hinge, open: "false" });
      out.put(x, y0 + 1, z, "dark_oak_door", { facing: face, half: "upper", hinge, open: "false" });
    }
  }
  return done(out, { box, opening });
}

/**
 * 29. A belfry lancet: box = [x0, y0, z0, x1, y1, z1], the opening (3 wide x 25 tall x 2 deep; the deep axis is face's).
 * Frame (P1): `cut_sandstone` jambs just outside the box both sides, through both layers; sill y0-1 (`smooth_sandstone_slab`
 * top in the front layer, `smooth_sandstone` behind); head as `lancet`: the top two rows narrow by 1 each side, upside-down
 * `smooth_sandstone_stairs` (back against the jamb) on the lower row, `cut_sandstone` on the top row. Fill (P3/P6):
 * `black_stained_glass_pane` in every open cell of the back layer, `spruce_trapdoor` (open, facing out) louvres every
 * 2nd course (from y0) in the front layer. only: "frame" | "fill" picks one half (default both).
 */
export function belfryLancet(g, { box, face, only, overwrite = false }) {
  const out = writer(g, overwrite);
  const [x0, y0, z0, x1, y1, z1] = [Math.min(box[0], box[3]), Math.min(box[1], box[4]), Math.min(box[2], box[5]), Math.max(box[0], box[3]), Math.max(box[1], box[4]), Math.max(box[2], box[5])];
  const ns = face === "north" || face === "south";
  const [l0, l1] = ns ? [x0, x1] : [z0, z1];
  const [d0, d1] = ns ? [z0, z1] : [x0, x1];
  const sgn = DIRS[face][0] + DIRS[face][2];
  const front = sgn > 0 ? d1 : d0, back = sgn > 0 ? d0 : d1;
  const put = (l, d, y, ...b) => (ns ? out.put(l, y, d, ...b) : out.put(d, y, l, ...b));
  const w = l1 - l0 + 1;
  const [toLow, toHigh] = ns ? ["west", "east"] : ["north", "south"];
  const head = new Map(); // "y,i" -> block for the head cells; others are the opening
  if (w >= 3) {
    head.set(`${y1 - 1},0`, stairs("smooth_sandstone", toLow, "top")); head.set(`${y1 - 1},${w - 1}`, stairs("smooth_sandstone", toHigh, "top"));
    head.set(`${y1},0`, ["cut_sandstone", {}]); head.set(`${y1},${w - 1}`, ["cut_sandstone", {}]);
    if (w > 3) { head.set(`${y1},1`, stairs("smooth_sandstone", toLow, "top")); head.set(`${y1},${w - 2}`, stairs("smooth_sandstone", toHigh, "top")); }
  } else head.set(`${y1},0`, stairs("smooth_sandstone", OPPOSITE[face], "top"));
  const panes = [];
  for (let d = d0; d <= d1; d++) {
    if (only !== "fill") {
      for (let y = y0 - 1; y <= y1; y++) { put(l0 - 1, d, y, "cut_sandstone"); put(l1 + 1, d, y, "cut_sandstone"); }
      for (let l = l0; l <= l1; l++) put(l, d, y0 - 1, ...(d === front ? slab("smooth_sandstone", "top") : ["smooth_sandstone", {}]));
    }
    for (let l = l0; l <= l1; l++) for (let y = y0; y <= y1; y++) {
      const hb = head.get(`${y},${l - l0}`);
      if (hb) { if (only !== "fill") put(l, d, y, ...hb); continue; }
      if (only === "frame") continue;
      if (d === back) {
        if (put(l, d, y, "black_stained_glass_pane", {})) panes.push(ns ? [l, y, d] : [d, y, l]);
      } else if (d === front && (y - y0) % 2 === 0) put(l, d, y, "spruce_trapdoor", { facing: face, half: "bottom", open: "true" });
    }
  }
  joinBars(g, panes, /_pane$/);
  // a pane at the jamb side joins the jamb too
  for (const [x, y, z] of panes) {
    const c = g.get(x, y, z), st = { ...c.state };
    for (const [dname, [dx, , dz]] of Object.entries(DIRS)) if (DIRS[face][0] * dx + DIRS[face][2] * dz === 0 && !g.isAir(x + dx, y, z + dz)) st[dname] = "true";
    g.set(x, y, z, "black_stained_glass_pane", st);
  }
  return done(out);
}

/**
 * 33. A copper apostle at (x, y, z): `oxidized_copper` body at y, `oxidized_cut_copper_slab` (bottom) head at y+1. It
 * stands on a full block: the cell under it becomes `deepslate_tiles` (into air, or replacing a roof stair there unless
 * { replaceBelow: false }; a guard may still refuse it). facing is accepted for the caller's bookkeeping (the blocks
 * have none).
 */
export function apostle(g, { x, y, z, facing, replaceBelow = true, overwrite = false }) {
  const out = writer(g, overwrite);
  void facing;
  const below = g.inBounds(x, y - 1, z) ? g.blockAt(x, y - 1, z) : null;
  if (below && (/air$/.test(below) || (replaceBelow && /_stairs$/.test(below)))) {
    g.set(x, y - 1, z, "deepslate_tiles");
    if (g.blockAt(x, y - 1, z) === "minecraft:deepslate_tiles") out.cells++; else out.refused.push([x, y - 1, z, "deepslate_tiles"]);
  }
  out.put(x, y, z, "oxidized_copper");
  out.put(x, y + 1, z, ...slab("oxidized_cut_copper"));
  return done(out);
}

/**
 * 37. A standing `lantern` (hanging: false) at (x, y, z): on a set-off's top face (y 21 on the y 20 set-off) or a
 * parapet post. Placed only into air with a block under it (never on air): otherwise refused.
 */
export function pierLantern(g, { x, y, z, overwrite = false }) {
  const out = writer(g, overwrite);
  if (!g.inBounds(x, y - 1, z) || g.isAir(x, y - 1, z)) { out.refused.push([x, y, z, "lantern"]); return done(out); }
  out.put(x, y, z, "lantern", { hanging: "false" });
  return done(out);
}
