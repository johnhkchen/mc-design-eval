// plan.md VOCABULARY, part 1: legStage, bandCourse, xBrace, saddleCap, walkway, cableCell, lanternAt.
// Every helper takes its position as arguments and returns { placed, refused }; refused = [x, y, z, block, reason].
// Writes stay inside the footprint the helper computes from its arguments, go only into air (opts.over replaces),
// and never touch y < 1 (nothing at y 0). Side "east" mirrors the west-frame x as x' = span - x (plot 0 span 46).
import { face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SPAN = 46;
const WALK_ANCHOR = [12, 38, 6];

const tally = (g) => ({ g, placed: 0, refused: [] });
const result = (t) => ({ placed: t.placed, refused: t.refused });

// One cell: refused unless it is inside the footprint box [x0, y0, z0, x1, y1, z1], at y >= 1, and (unless over) air.
function put(t, [x0, y0, z0, x1, y1, z1], x, y, z, block, state, over) {
  if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1 || y < 1) return t.refused.push([x, y, z, block, "outside"]);
  if (!over && !t.g.isAir(x, y, z)) return t.refused.push([x, y, z, block, "occupied"]);
  t.g.set(x, y, z, block, state);
  t.placed++;
}

// West-frame x to the placed x: west stays, east mirrors across the tower's centre line.
function sideX(side, x, span = SPAN) {
  if (side === "west") return x;
  if (side === "east") return span - x;
  throw new Error(`side must be "west" or "east", got ${side}`);
}

// One solid orange_terracotta box of a leg stage. x0..x1 are given in the west frame; side "east" mirrors them.
export function legStage(g, side, y0, y1, x0, x1, z0, z1, opts = {}) {
  const a = sideX(side, x0, opts.span), b = sideX(side, x1, opts.span);
  const fp = [Math.min(a, b), y0, z0, Math.max(a, b), y1, z1];
  const t = tally(g);
  for (let y = y0; y <= y1; y++) for (let x = fp[0]; x <= fp[3]; x++) for (let z = z0; z <= z1; z++) put(t, fp, x, y, z, "orange_terracotta", undefined, opts.over);
  return result(t);
}

// One full orange_concrete course at height y across the plan rectangle box = [x0, z0, x1, z1] (a leg's face band).
export function bandCourse(g, y, box, opts = {}) {
  const [x0, z0, x1, z1] = box;
  const fp = [x0, y, z0, x1, y, z1];
  const t = tally(g);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(t, fp, x, y, z, "orange_concrete", undefined, opts.over);
  return result(t);
}

// The X cross brace: two red_terracotta diagonals across box = [x0, y0, z0, x1, y1, z1]; the second is mirrored
// about the box's centre (x' = x0 + x1 - x). Where the diagonal jumps more than one x between rows, the gap cells fill.
export function xBrace(g, box, opts = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const t = tally(g);
  let prev = null;
  for (let y = y0; y <= y1; y++) {
    const a = x0 + Math.round(((y - y0) * (x1 - x0)) / (y1 - y0));
    const b = x0 + x1 - a;
    const pa = prev ? prev[0] : a, pb = prev ? prev[1] : b;
    for (const [p, c] of [[pa, a], [pb, b]]) {
      const lo = Math.min(p, c), hi = Math.max(p, c);
      const xs = [c];
      for (let x = lo + 1; x < hi; x++) xs.push(x);
      for (const x of xs) for (let z = z0; z <= z1; z++) put(t, box, x, y, z, "red_terracotta", undefined, opts.over);
    }
    prev = [a, b];
  }
  return result(t);
}

// Cable saddle housing over a tower top. box = [x0, y0, z0, x1, z1] in the west frame, the 4-wide leg top
// (x0..x0+3), y0 = the leg's top course (112). The groove is the column x0+1: open at y0 and y0+1, roofed at y0+2,
// glowstone and aircraft light above it. Side "east" mirrors the whole cap.
export function saddleCap(g, side, box, opts = {}) {
  const [x0, y0, z0, x1, z1] = box;
  const span = opts.span ?? SPAN;
  const groove = x0 + 1, zm = [z0 + 1, z0 + 2];
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x !== groove) cells.push([x, y0, z, "orange_terracotta"]);
  for (const x of [x0, x0 + 2, x1]) for (let z = z0; z <= z1; z++) cells.push([x, y0 + 1, z, "orange_terracotta"]);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cells.push([x, y0 + 2, z, "orange_terracotta"]);
  for (const z of zm) {
    cells.push([groove, y0 + 3, z, "glowstone"], [x0 + 2, y0 + 3, z, "orange_terracotta"]);
    cells.push([groove, y0 + 4, z, "red_stained_glass"]);
  }
  const a = sideX(side, x0, span), b = sideX(side, x1, span);
  const fp = [Math.min(a, b), y0, z0, Math.max(a, b), y0 + 4, z1];
  const t = tally(g);
  for (const [x, y, z, block] of cells) put(t, fp, sideX(side, x, span), y, z, block, undefined, opts.over);
  return result(t);
}

// The cantilevered walkway beside a leg: light_gray_concrete platforms and strip at y 38, stair corbels under it at
// y 37, and the edge girder (orange_terracotta, y 38) with its railing (red_sandstone_wall, y 39) on the outline.
// at = where the plot's walkway anchor (12, 38, 6) lands in the west frame; side "east" mirrors it.
export function walkway(g, side, at = WALK_ANCHOR, opts = {}) {
  const span = opts.span ?? SPAN;
  const dx = at[0] - WALK_ANCHOR[0], dy = at[1] - WALK_ANCHOR[1], dz = at[2] - WALK_ANCHOR[2];
  const X = (x) => sideX(side, x + dx, span);
  const cells = [];
  for (const z of [6, 7, 16, 17]) for (let x = 12; x <= 18; x++) cells.push([x, 38, z, "light_gray_concrete"]);
  for (let z = 8; z <= 15; z++) for (let x = 12; x <= 13; x++) cells.push([x, 38, z, "light_gray_concrete"]);
  for (const z of [8, 11, 12, 15]) for (let x = 12; x <= 13; x++) cells.push([x, 37, z, "smooth_red_sandstone_stairs", { facing: "east", half: "top", shape: "straight" }]);
  const outline = new Map();
  const edge = (x, z) => outline.set(`${x},${z}`, [x, z]);
  for (let z = 0; z <= 5; z++) edge(16, z);
  for (let x = 11; x <= 16; x++) edge(x, 5);
  for (let z = 5; z <= 18; z++) edge(11, z);
  for (let x = 11; x <= 16; x++) edge(x, 18);
  for (let z = 18; z <= 23; z++) edge(16, z);
  for (const [x, z] of outline.values()) cells.push([x, 38, z, "orange_terracotta"], [x, 39, z, "red_sandstone_wall"]);

  // placed coordinates: shifted, then mirrored; facings and the railing's connections follow the mirror
  const placed = cells.map(([x, y, z, block, state]) => {
    const px = X(x), py = y + dy, pz = z + dz;
    const st = state && state.facing && side === "east" ? { ...state, facing: face.mirrorX(state.facing) } : state;
    return [px, py, pz, block, st];
  });
  const rail = new Set(placed.filter((c) => c[3] === "red_sandstone_wall").map((c) => `${c[0]},${c[2]}`));
  const joins = (x, y, z) => rail.has(`${x},${z}`) || /red_sandstone_wall/.test(g.blockAt(x, y, z));
  for (const c of placed) {
    if (c[3] !== "red_sandstone_wall") continue;
    const [x, y, z] = c;
    const n = joins(x, y, z - 1), s = joins(x, y, z + 1), e = joins(x + 1, y, z), w = joins(x - 1, y, z);
    const straight = (n && s && !e && !w) || (e && w && !n && !s);
    c[4] = { up: straight ? "false" : "true", north: n ? "low" : "none", south: s ? "low" : "none", east: e ? "low" : "none", west: w ? "low" : "none" };
  }
  const fx = [X(11), X(18)];
  const fp = [Math.min(...fx), 37 + dy, dz, Math.max(...fx), 39 + dy, 23 + dz];
  const t = tally(g);
  for (const [x, y, z, block, state] of placed) put(t, fp, x, y, z, block, state, opts.over);
  return result(t);
}

// One main-span or side-span cable cell at (x, z) on the catenary height f: a full body block at floor(f) (every 4th
// z in orange_concrete, the bands), plus a bottom slab in the cell above when f is at least half a block past it.
export function cableCell(g, x, z, f, opts = {}) {
  const base = Math.floor(f);
  const fp = [x, base, z, x, base + 1, z];
  const band = ((z % 4) + 4) % 4 === 0;
  const t = tally(g);
  put(t, fp, x, base, z, band ? "orange_concrete" : "orange_terracotta", undefined, opts.over);
  if (f - base >= 0.5) put(t, fp, x, base + 1, z, "smooth_red_sandstone_slab", { type: "bottom" }, opts.over);
  return result(t);
}

// One lantern at (x, y, z). Standing (default) needs a solid block under it; opts.hanging hangs it from a block above.
export function lanternAt(g, x, y, z, opts = {}) {
  const hanging = !!opts.hanging;
  const t = tally(g);
  const sy = hanging ? y + 1 : y - 1;
  if (g.isAir(x, sy, z)) {
    t.refused.push([x, y, z, "lantern", "no support"]);
    return result(t);
  }
  put(t, [x, y, z, x, y, z], x, y, z, "lantern", { hanging: hanging ? "true" : "false" }, opts.over);
  return result(t);
}
