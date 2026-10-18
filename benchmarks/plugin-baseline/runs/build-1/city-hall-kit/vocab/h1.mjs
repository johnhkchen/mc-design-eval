// Helpers from plan.md VOCABULARY for the City Hall kit: faceFrame, ringFill, recessedWall, deck, antaPilaster,
// balustrade, glassRun, pediment, drumUrn, standingLantern. Each takes its own position as arguments, writes only the
// cells of its own footprint, and writes only into air: a cell an earlier part owns is refused and reported (never
// overwritten) unless opts.over is set. Every helper returns { placed, refused, box } (box = its footprint).
// Structure-local coordinates: x east, y up, z south; FRONT = north (z low). Block ids are plan.md PALETTE literals.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const CENTRE = [31.5, 31.5]; // the dome centre: dx = x - 31.5, dz = z - 31.5 (plan VOCABULARY conventions)
const COMPASS = ["north", "east", "south", "west"];
// A full block's top face: anything else (slab, stairs, wall, fence, trapdoor, door, pane...) cannot carry a lantern.
const NOT_FULL_TOP = /(slab|stairs|wall|fence|trapdoor|door|pane|carpet|sign|torch|lantern|chain|bars|glass)$/;

/** Compass name of the unit step (dx, dz). */
const compassOf = (dx, dz) => COMPASS.find((c) => DIRS[c][0] === dx && DIRS[c][2] === dz);

/** Inclusive world box covering the frame cells u0..u1 x d0..d1 at y0..y1. */
function boxOf(F, u0, u1, d0, d1, y0, y1) {
  const pts = [F.at(u0, d0), F.at(u0, d1), F.at(u1, d0), F.at(u1, d1)];
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return [Math.min(...xs), y0, Math.min(...zs), Math.max(...xs), y1, Math.max(...zs)];
}

/** A writer bound to one footprint: put() writes into air inside the box and records what it refused. */
function writer(g, box, over = false) {
  const res = { placed: 0, refused: [], box };
  const put = (x, y, z, block, state) => {
    const [name, st] = Array.isArray(block) ? block : [block, state];
    const [x0, y0, z0, x1, y1, z1] = box;
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
    if (!inside || !g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) { res.refused.push([x, y, z, name]); return; }
    g.set(x, y, z, name, st);
    res.placed++;
  };
  return { put, res };
}

/** Write through a face frame: facing tokens out / in / left / right become compass directions. */
function fset(put, F, u, d, y, block, state) {
  const [x, z] = F.at(u, d);
  const [name, st] = Array.isArray(block) ? block : [block, state];
  put(x, y, z, name, st && st.facing ? { ...st, facing: F.dir(st.facing) } : st);
}

/**
 * A front written once in (u, d, y) and turned to any face. box = the plot [x0, z0, x1, z1] (or a 6-box, its x and z
 * taken), inclusive. u runs along the face, d is the depth in from the plot's edge on that face.
 * at(u, d) -> [x, z]; dir(token) -> compass ("out" = the face, "in" = into the building, "left"/"right" as seen by
 * someone walking in from the face: on the north face, left is east); along(s) -> compass of increasing (s > 0) or
 * decreasing u.
 */
export function faceFrame(face, box) {
  const [x0, z0, x1, z1] = box.length === 6 ? [box[0], box[2], box[3], box[5]] : box;
  const at = {
    north: (u, d) => [u, z0 + d],
    south: (u, d) => [u, z1 - d],
    east: (u, d) => [x1 - d, u],
    west: (u, d) => [x0 + d, u],
  }[face];
  if (!at) throw new Error(`faceFrame: no face "${face}"`);
  const inward = OPPOSITE[face];
  const [ix, , iz] = DIRS[inward];
  const left = compassOf(iz, -ix);
  const right = OPPOSITE[left];
  const tokens = { out: face, in: inward, left, right };
  const dir = (token) => tokens[token] ?? token;
  const plusU = face === "north" || face === "south" ? "east" : "south";
  const along = (s) => (s < 0 ? OPPOSITE[plusU] : plusU);
  return { face, box: [x0, z0, x1, z1], at, dir, along };
}

/** Fill the ring rIn < r <= rOut about the dome centre, y0..y1. skip(x, y, z) -> true leaves that cell out. */
export function ringFill(g, rIn, rOut, y0, y1, block, skip, opts = {}) {
  const [cx, cz] = opts.center ?? CENTRE;
  const box = [Math.floor(cx - rOut), y0, Math.floor(cz - rOut), Math.ceil(cx + rOut), y1, Math.ceil(cz + rOut)];
  const { put, res } = writer(g, box, opts.over);
  for (let x = box[0]; x <= box[3]; x++)
    for (let z = box[2]; z <= box[5]; z++) {
      const r = Math.hypot(x - cx, z - cz);
      if (!(r > rIn && r <= rOut)) continue;
      for (let y = y0; y <= y1; y++) if (!skip?.(x, y, z)) put(x, y, z, block);
    }
  return res;
}

/** A smooth_stone course over x0..x1 x z0..z1 at y. opts.hole: cells with r <= hole (about the centre) are left out. */
export function deck(g, x0, z0, x1, z1, y, opts = {}) {
  const { hole = 0, block = "smooth_stone" } = opts;
  const { put, res } = writer(g, [x0, y, z0, x1, y, z1], opts.over);
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (hole && Math.hypot(x - CENTRE[0], z - CENTRE[1]) <= hole) continue;
      put(x, y, z, block);
    }
  return res;
}

/**
 * The recessed wall: polished_diorite at d w..w+1, y 10..33. The lintels (y 20, 31) and the spandrel panel (y 21) sit on
 * the face cell d w. opts.windows: the first u of each 2-wide window; opts.tall: each window is open y 11..30 in one piece,
 * otherwise y 11..19 and 23..30. Open cells: d w stays air and d w+1 is left for glassRun (the glazier).
 */
export function recessedWall(g, F, u0, u1, w, opts = {}) {
  const { windows = [], tall = false } = opts;
  const { put, res } = writer(g, boxOf(F, u0, u1, w, w + 1, 10, 33), opts.over);
  const glazed = new Set(windows.flatMap((wu) => [wu, wu + 1]));
  for (let u = u0; u <= u1; u++)
    for (let y = 10; y <= 33; y++) {
      const open = glazed.has(u) && (tall ? y >= 11 && y <= 30 : (y >= 11 && y <= 19) || (y >= 23 && y <= 30));
      if (open) continue;
      const face = y === 20 || y === 31 ? "smooth_quartz" : y === 21 ? "calcite" : "polished_diorite";
      fset(put, F, u, w, y, face);
      fset(put, F, u, w + 1, y, "polished_diorite");
    }
  return res;
}

/** A 3-wide smooth_quartz pilaster at depth d, y0..y1, with a chiseled_quartz_block capital course at y1. */
export function antaPilaster(g, F, u0, d, y0 = 10, y1 = 33, opts = {}) {
  const { put, res } = writer(g, boxOf(F, u0, u0 + 2, d, d, y0, y1), opts.over);
  for (let u = u0; u <= u0 + 2; u++)
    for (let y = y0; y <= y1; y++) fset(put, F, u, d, y, y === y1 ? "chiseled_quartz_block" : "smooth_quartz");
  return res;
}

/**
 * A balustrade on the d line at y: polished_diorite pedestals where u mod 4 is 0 or 3 and at both ends, diorite_wall
 * balusters elsewhere (their sides face the neighbours along the face), and a continuous polished_diorite bottom slab rail
 * at y + 1.
 */
export function balustrade(g, F, u0, u1, d, y, opts = {}) {
  const { put, res } = writer(g, boxOf(F, u0, u1, d, d, y, y + 1), opts.over);
  const along = [F.dir("left"), F.dir("right")];
  const sides = Object.fromEntries(COMPASS.map((c) => [c, along.includes(c) ? "low" : "none"]));
  for (let u = u0; u <= u1; u++) {
    const pedestal = u === u0 || u === u1 || u % 4 === 0 || u % 4 === 3;
    fset(put, F, u, d, y, pedestal ? "polished_diorite" : ["diorite_wall", { ...sides, up: "true" }]);
    fset(put, F, u, d, y + 1, B.slab("polished_diorite", "bottom"));
  }
  return res;
}

/** Glass panes at depth d, y0..y1, connected on the two along-face sides (east/west on N/S faces, north/south on E/W). */
export function glassRun(g, F, u0, u1, d, y0, y1, opts = {}) {
  const { put, res } = writer(g, boxOf(F, u0, u1, d, d, y0, y1), opts.over);
  const along = [F.dir("left"), F.dir("right")];
  const state = Object.fromEntries(COMPASS.map((c) => [c, along.includes(c) ? "true" : "false"]));
  for (let u = u0; u <= u1; u++)
    for (let y = y0; y <= y1; y++) fset(put, F, u, d, y, ["gray_stained_glass_pane", state]);
  return res;
}

/**
 * The triangular pediment over the front from u = left to u = right (inclusive, an odd number of 2-cell pairs), depth 0..depth,
 * base y0. Pair k sits at h = y0 + min(k, n-1-k); the apex pair is the middle one. d = 0: raking cornice (outer cell
 * stairs bottom facing the apex, inner cell slab top) and smooth_quartz apex cells. d = 1: the smooth_quartz course behind.
 * d 2..depth: calcite tympanum under each pair up to h-1. d 1..depth: the tuff roof (outer stairs, inner slab) at y = h, and the
 * ridge with its slab cap at the apex. Acroteria at the ends (y0+1) and on the apex (apexY+1).
 * Note: the course (d 1, y = h) and the roof's first row (d 1, y = h) name the same cells; the course is written first, so the
 * roof's d 1 cells are refused and reported (the course stays).
 */
export function pediment(g, F, opts = {}) {
  const { left = 73, right = 118, y0 = 37, depth = 11 } = opts;
  const pairs = (right - left + 1) / 2;
  if (!Number.isInteger(pairs) || pairs % 2 === 0) throw new Error("pediment: needs an odd number of 2-cell pairs (one apex pair)");
  const apex = (pairs - 1) / 2;
  const apexY = y0 + apex;
  const { put, res } = writer(g, boxOf(F, left, right, 0, depth, y0, apexY + 1), opts.over);
  const pairsOf = [...Array(pairs).keys()].map((k) => {
    const a = left + 2 * k, b = a + 1, h = y0 + Math.min(k, pairs - 1 - k);
    const outer = k < apex ? a : b, inner = k < apex ? b : a;
    return { k, a, b, h, outer, inner, toward: k < apex ? F.along(1) : F.along(-1) };
  });
  // d 0: the raking cornice and the apex
  for (const p of pairsOf) {
    if (p.k === apex) { fset(put, F, p.a, 0, p.h, "smooth_quartz"); fset(put, F, p.b, 0, p.h, "smooth_quartz"); continue; }
    fset(put, F, p.outer, 0, p.h, B.stairs("smooth_quartz", p.toward, "bottom"));
    fset(put, F, p.inner, 0, p.h, B.slab("smooth_quartz", "top"));
  }
  // d 1: the course behind the cornice (same cells as the cornice)
  for (const p of pairsOf) { fset(put, F, p.a, 1, p.h, "smooth_quartz"); fset(put, F, p.b, 1, p.h, "smooth_quartz"); }
  // d 2..depth: the tympanum, solid under every pair up to h-1
  for (const p of pairsOf)
    for (let d = 2; d <= depth; d++)
      for (let y = y0; y < p.h; y++) { fset(put, F, p.a, d, y, "calcite"); fset(put, F, p.b, d, y, "calcite"); }
  // d 1..depth: the roof on the rake, and the ridge at the apex
  for (let d = 1; d <= depth; d++)
    for (const p of pairsOf) {
      if (p.k === apex) {
        fset(put, F, p.a, d, apexY, "polished_tuff");
        fset(put, F, p.b, d, apexY, "polished_tuff");
        fset(put, F, p.a, d, apexY + 1, B.slab("polished_tuff", "bottom"));
        fset(put, F, p.b, d, apexY + 1, B.slab("polished_tuff", "bottom"));
        continue;
      }
      fset(put, F, p.outer, d, p.h, B.stairs("polished_tuff", p.toward, "bottom"));
      fset(put, F, p.inner, d, p.h, B.slab("polished_tuff", "top"));
    }
  // acroteria: on the two ends and on the apex
  fset(put, F, left, 0, y0 + 1, "chiseled_quartz_block");
  fset(put, F, right, 0, y0 + 1, "chiseled_quartz_block");
  fset(put, F, left + 2 * apex, 0, apexY + 1, "chiseled_quartz_block");
  fset(put, F, left + 2 * apex + 1, 0, apexY + 1, "chiseled_quartz_block");
  return res;
}

/** A chiseled_quartz_block at (x, y, z) with a smooth_quartz slab (bottom) above it. */
export function drumUrn(g, x, z, y = 68, opts = {}) {
  const { put, res } = writer(g, [x, y, z, x, y + 1, z], opts.over);
  put(x, y, z, "chiseled_quartz_block");
  put(x, y + 1, z, B.slab("smooth_quartz", "bottom"));
  return res;
}

/**
 * A standing lantern at (x, y, z) on a full top face (the block at y - 1). Refused, and reported, unless the cell above
 * is air too (the 2-high clear lane past it). Writes the lantern cell only.
 */
export function standingLantern(g, x, y, z, opts = {}) {
  const { put, res } = writer(g, [x, y, z, x, y + 1, z], opts.over);
  const below = g.blockAt(x, y - 1, z).replace("minecraft:", "");
  const fullTop = !g.isAir(x, y - 1, z) && !NOT_FULL_TOP.test(below);
  const clear = g.isAir(x, y + 1, z);
  if (!fullTop || !clear) {
    res.refused.push([x, y, z, "lantern"]);
    res.reason = fullTop ? "no 2-high clear lane above it" : `no full top face under it (${below})`;
    return res;
  }
  put(x, y, z, B.lantern(false));
  return res;
}
