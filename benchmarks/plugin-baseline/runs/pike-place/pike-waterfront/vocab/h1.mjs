// vocab/h1.mjs: the plan's VOCABULARY helpers, set h1: deckFill, shedBay, skylight, curtainWall, canopy,
// planterTree, glassDome, cornerBay, awning. Kit-frame coordinates, absolute, nothing turned.
//
// Each helper takes the Grid first (the plan's signatures leave it out), then its position and facing. It writes
// only inside its own footprint and only into air, so an earlier part's blocks are refused and reported.
// { replace: true } lets a helper cut through a built layer (a skylight through the roof, a bay through a wall).
// Each returns { cells, refused }: cells as [x, y, z], refused as [x, y, z, block, why].
import { B, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const mod2 = (n) => ((n % 2) + 2) % 2;                        // parity that also works for negative s and d
const OUT = { east: ["x", 1], west: ["x", -1], south: ["z", 1], north: ["z", -1] };

// The cell on facade plane p (x for east/west, z for north/south) at span t and height y, k cells outward.
function at(face, p, t, y, k = 0) {
  const [axis, out] = OUT[face];
  const n = p + out * k;
  return axis === "x" ? [n, y, t] : [t, y, n];
}
// Inclusive box [x0, y0, z0, x1, y1, z1] spanning two cells.
const boxOf = (a, b) => [0, 1, 2].map((i) => Math.min(a[i], b[i])).concat([0, 1, 2].map((i) => Math.max(a[i], b[i])));
const inBox = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
const rect = ([x0, z0, x1, z1]) => { const out = []; for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) out.push([x, z]); return out; };

// The writes of one call: only inside inFoot, only into air unless replace. put() returns whether it wrote.
function writer(g, inFoot, replace) {
  const cells = [], refused = [];
  const put = (x, y, z, block, state) => {
    const why = !inFoot(x, y, z) ? "outside footprint" : !g.inBounds(x, y, z) ? "outside grid"
      : !replace && !g.isAir(x, y, z) ? "not air" : null;
    if (why) { refused.push([x, y, z, block, why]); return false; }
    const before = g.refused?.length ?? 0;                     // a guard() wrapper may refuse it too
    g.set(x, y, z, block, state);
    if ((g.refused?.length ?? 0) > before) { refused.push([x, y, z, block, "guarded"]); return false; }
    cells.push([x, y, z]);
    return true;
  };
  return { put, cells, refused };
}

// ---- deckFill ---------------------------------------------------------------------------------------------------
/**
 * Deck: `mat` (default spruce_planks) on each cell of `area` at y, where area is a box [x0, z0, x1, z1] or a list of
 * [x, z] cells. With piles (default), stripped_spruce_log runs down from y-1 to `ground` (default 0) under each laid
 * cell, stopping at the first solid block (the ground is never written). piles: false for a deck that pilingRun owns.
 */
export function deckFill(g, area, y, mat = "spruce_planks", { piles = true, ground = 0, replace = false } = {}) {
  const cols = Array.isArray(area[0]) ? area : rect(area);
  const keys = new Set(cols.map(([x, z]) => `${x},${z}`));
  const wr = writer(g, (x, yy, z) => keys.has(`${x},${z}`) && yy >= ground && yy <= y, replace);
  for (const [x, z] of cols) {
    if (!wr.put(x, y, z, ...B.block(mat))) continue;
    if (piles) for (let yy = y - 1; yy >= ground && g.isAir(x, yy, z); yy--) wr.put(x, yy, z, ...B.log("stripped_spruce", "y"));
  }
  return { cells: wr.cells, refused: wr.refused };
}

// ---- shedBay ----------------------------------------------------------------------------------------------------
// Pier 59 shed: the long walls are diagonal (d = x - z), one cell per s, so each wall is a gapless stair.
// out: the outer d of the band; dir: the way into the shed.
const SHED_WALL = { west: { out: -40, dir: 1 }, east: { out: -14, dir: -1 } };
const SHED_S = [100, 243];
const bandD = (w, s) => (mod2(s - w.out) === 0 ? w.out : w.out + w.dir);
const lightD = (w, s) => (mod2(s - (w.out + 3 * w.dir)) === 0 ? w.out + 3 * w.dir : w.out + 4 * w.dir);   // 2 in
const xzOf = (s, d) => [(s + d) / 2, (s - d) / 2];

/**
 * One bay of a long wall: wall ('west' | 'east'), s0 = the bay's post (a multiple of 8). The bay runs s0..s0+7,
 * clipped to the shed. Birch planks y5..16 over a dark_oak plinth at y4; posts (log, axis y) at s % 8 == 0; head
 * log at y16; mid rail log at y10. With windows (default), glass_pane at y6..8 and y12..14 over the 4 cells
 * s % 8 in 2..5, with a shroomlight 2 cells inside each window at y7 and y13. windows: false for a mural bay.
 */
export function shedBay(g, wall, s0, { windows = true, replace = false } = {}) {
  const w = SHED_WALL[wall];
  const dlo = Math.min(w.out, w.out + 4 * w.dir), dhi = Math.max(w.out, w.out + 4 * w.dir);
  const wr = writer(g, (x, y, z) => { const s = x + z, d = x - z; return s >= s0 && s < s0 + 8 && d >= dlo && d <= dhi && y >= 4 && y <= 16; }, replace);
  const sA = Math.max(s0, SHED_S[0]), sB = Math.min(s0 + 7, SHED_S[1]);
  const win = (s) => windows && s % 8 !== 0 && s % 8 >= 2 && s % 8 <= 5;
  const panes = new Set();                                    // panes connect to their neighbours in the wall
  for (let s = sA; s <= sB; s++) if (win(s)) { const [x, z] = xzOf(s, bandD(w, s)); for (const y of [6, 7, 8, 12, 13, 14]) panes.add(`${x},${y},${z}`); }
  const paneState = (x, y, z) => ({
    north: String(panes.has(`${x},${y},${z - 1}`)), east: String(panes.has(`${x + 1},${y},${z}`)),
    south: String(panes.has(`${x},${y},${z + 1}`)), west: String(panes.has(`${x - 1},${y},${z}`)),
  });
  for (let s = sA; s <= sB; s++) {
    const [x, z] = xzOf(s, bandD(w, s));
    const post = s % 8 === 0;
    wr.put(x, 4, z, ...B.block("dark_oak_planks"));
    for (let y = 5; y <= 16; y++) {
      if (y === 16) wr.put(x, y, z, ...B.log("stripped_spruce", "x"));                 // head plate
      else if (post) wr.put(x, y, z, ...B.log("stripped_spruce", "y"));
      else if (panes.has(`${x},${y},${z}`)) wr.put(x, y, z, "glass_pane", paneState(x, y, z));
      else if (y === 10) wr.put(x, y, z, ...B.log("stripped_spruce", "x"));             // mid rail
      else wr.put(x, y, z, ...B.block("birch_planks"));
    }
    if (win(s) && s % 8 === 3) for (const y of [7, 13]) {
      const [lx, lz] = xzOf(s, lightD(w, s));
      wr.put(lx, y, lz, ...B.block("shroomlight"));
    }
  }
  return { cells: wr.cells, refused: wr.refused };
}

// ---- skylight ---------------------------------------------------------------------------------------------------
/**
 * Skylight on the shed roof: 3 steps of s from s0 by e 6..8 on one slope (slope +1: d > -27, -1: d < -27). Glass
 * fills each roof column (both blocks where e is odd), with a shroomlight under it. The roof's full block at e is
 * at y = 25 - ceil(e/2); the odd-e slab sits above. Lay skylights before the roof (or pass replace) so the
 * roof leaves these cells.
 */
export function skylight(g, s0, slope, { replace = false } = {}) {
  const cols = [];
  for (let s = s0; s <= s0 + 2; s++) for (let e = 6; e <= 8; e++) {
    const d = -27 + slope * e;
    if (mod2(s - d) === 0) cols.push({ x: (s + d) / 2, z: (s - d) / 2, e });
  }
  const top = (c) => 25 - Math.ceil(c.e / 2);
  const lo = Math.min(...cols.map((c) => top(c) - 1)), hi = Math.max(...cols.map((c) => top(c) + (c.e % 2)));
  const keys = new Set(cols.map((c) => `${c.x},${c.z}`));
  const wr = writer(g, (x, y, z) => keys.has(`${x},${z}`) && y >= lo && y <= hi, replace);
  for (const c of cols) {
    wr.put(c.x, top(c), c.z, ...B.block("light_blue_stained_glass"));
    if (c.e % 2) wr.put(c.x, top(c) + 1, c.z, ...B.block("light_blue_stained_glass"));
    wr.put(c.x, top(c) - 1, c.z, ...B.block("shroomlight"));
  }
  return { cells: wr.cells, refused: wr.refused };
}

// ---- curtainWall ------------------------------------------------------------------------------------------------
/**
 * Glass curtain wall on the plane p (x for face east/west; z for north/south), its span t0..t1 (z, or x for
 * north/south), heights y0..y1 inclusive. A smooth_quartz mullion every 3rd cell of the span, from t0.
 */
export function curtainWall(g, p, t0, t1, y0, y1, { face = "east", replace = false } = {}) {
  const box = boxOf(at(face, p, t0, y0), at(face, p, t1, y1));
  const wr = writer(g, (x, y, z) => inBox(box, [x, y, z]), replace);
  for (let t = t0; t <= t1; t++) for (let y = y0; y <= y1; y++) {
    const [x, , z] = at(face, p, t, y);
    wr.put(x, y, z, ...B.block((t - t0) % 3 === 0 ? "smooth_quartz" : "glass"));
  }
  return { cells: wr.cells, refused: wr.refused };
}

// ---- canopy -----------------------------------------------------------------------------------------------------
/**
 * Canopy over a facade opening: spruce_slab (top) at y, `depth` cells out from the plane, a dark_oak_trapdoor
 * valance under its outer edge at y-1, and a lantern hanging under the slab every 3rd cell of the span. pos is
 * { plane, from, to }: the facade plane and the span it covers. face is the way it projects.
 */
export function canopy(g, face, { plane, from, to }, y, { depth = 2, replace = false } = {}) {
  const box = boxOf(at(face, plane, from, y - 1, 1), at(face, plane, to, y, depth));
  const wr = writer(g, (x, yy, z) => inBox(box, [x, yy, z]), replace);
  for (let t = from; t <= to; t++) {
    for (let k = 1; k <= depth; k++) wr.put(...at(face, plane, t, y, k), ...B.slab("spruce", "top"));
    wr.put(...at(face, plane, t, y - 1, depth), ...B.trapdoor("dark_oak", face, "top", false));
    if ((t - from) % 3 === 0) wr.put(...at(face, plane, t, y - 1, 1), ...B.lantern(true));
  }
  return { cells: wr.cells, refused: wr.refused };
}

// ---- planterTree ------------------------------------------------------------------------------------------------
/**
 * Planter at the NW corner (x, z) of a 3x3 box, rim at y (default 4): smooth_stone round, dirt in the middle, an
 * oak_log trunk at y+1..y+4 and an oak crown (2 wide, corners cut) up to y+5, azalea_leaves at the four top
 * corners. All leaves persistent.
 */
export function planterTree(g, x, z, { y = 4, replace = false } = {}) {
  const box = [x - 1, y, z - 1, x + 3, y + 5, z + 3];
  const wr = writer(g, (a, b, c) => inBox(box, [a, b, c]), replace);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) wr.put(x + i, y, z + j, ...B.block(i === 1 && j === 1 ? "dirt" : "smooth_stone"));
  const cx = x + 1, cz = z + 1;
  for (let k = 1; k <= 4; k++) wr.put(cx, y + k, cz, ...B.log("oak", "y"));
  for (const [dy, r] of [[2, 2], [3, 2], [4, 1], [5, 1]]) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const corner = Math.abs(dx) === r && Math.abs(dz) === r;
    if (dy !== 4 && corner) continue;                                      // cut corners, the 3x3 layer stays square
    if (dx === 0 && dz === 0 && dy <= 4) continue;                         // the trunk
    const block = corner && dy === 4 ? "azalea_leaves" : "oak_leaves";
    wr.put(cx + dx, y + dy, cz + dz, block, { persistent: "true" });
  }
  return { cells: wr.cells, refused: wr.refused };
}

// ---- glassDome --------------------------------------------------------------------------------------------------
/**
 * Hemisphere of light_blue_stained_glass on centre c = [x, y, z] (y is the base row), radius r: a 1-cell shell
 * (r-0.7 .. r+0.3) above the base, four end_rod ribs on the N, S, E and W meridians (up at the crown), and a
 * sea_lantern just inside the base. The inside stays empty. A base cell that is already deck is refused.
 */
export function glassDome(g, [cx, cy, cz], r, { replace = false } = {}) {
  const wr = writer(g, (x, y, z) => y >= cy && Math.hypot(x - cx, y - cy, z - cz) <= r + 0.3, replace);
  const R = Math.ceil(r + 0.3);
  for (let y = cy; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) {
    const dx = x - cx, dy = y - cy, dz = z - cz;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < r - 0.7 || dist > r + 0.3) continue;
    if (dx === 0 || dz === 0) {
      const facing = dy === r && dx === 0 && dz === 0 ? "up" : dx === 0 ? (dz > 0 ? "south" : "north") : (dx > 0 ? "east" : "west");
      wr.put(x, y, z, "end_rod", { facing });
    } else wr.put(x, y, z, ...B.block("light_blue_stained_glass"));
  }
  wr.put(cx, cy + 1, cz, ...B.block("sea_lantern"));
  return { cells: wr.cells, refused: wr.refused };
}

// ---- cornerBay --------------------------------------------------------------------------------------------------
/**
 * Corner bay in the wall plane p of `face` (default east, so p is x), span z0..z1 (5 wide), from y0 (default 6) up
 * to the roof slab `top` (not included; required). Smooth_quartz piers at the span ends and middle,
 * light_blue_stained_glass between, white_concrete floor bands every 4 from y0. wrap: 'north' | 'south' turns the
 * bay round the corner at that end of the span, 3 cells deep onto that face (the same pattern).
 */
export function cornerBay(g, p, z0, z1, { top, y0 = 6, face = "east", wrap = null, replace = false } = {}) {
  if (top == null) throw new Error("cornerBay: top (the roof slab y) is required");
  const zEnd = wrap === "north" ? z0 - 1 : wrap === "south" ? z1 + 1 : null;
  const boxes = [boxOf(at(face, p, z0, y0), at(face, p, z1, top - 1))];
  if (zEnd !== null) boxes.push(boxOf(at(face, p, zEnd, y0), at(face, p, zEnd, top - 1, -2)));
  const wr = writer(g, (x, y, z) => boxes.some((b) => inBox(b, [x, y, z])), replace);
  const mat = (i, y) => ((y - y0) % 4 === 0 ? "white_concrete" : i % 2 === 0 ? "smooth_quartz" : "light_blue_stained_glass");
  for (let y = y0; y < top; y++) {
    for (let t = z0; t <= z1; t++) wr.put(...at(face, p, t, y), ...B.block(mat(t - z0, y)));
    if (zEnd !== null) for (let k = 0; k < 3; k++) wr.put(...at(face, p, zEnd, y, -k), ...B.block(mat(k, y)));
  }
  return { cells: wr.cells, refused: wr.refused };
}

// ---- awning -----------------------------------------------------------------------------------------------------
/**
 * Awning over a shopfront: warped_stairs (teal, the palette's stand-in for cyan_terracotta) at y (default 5), in
 * the top half with the back to the wall, `proud` cells out from the plane (default 1), and a dark_oak_trapdoor
 * valance under it at y-1. pos is { plane, from, to }.
 */
export function awning(g, face, { plane, from, to }, { y = 5, proud = 1, replace = false } = {}) {
  const box = boxOf(at(face, plane, from, y - 1, proud), at(face, plane, to, y, proud));
  const wr = writer(g, (x, yy, z) => inBox(box, [x, yy, z]), replace);
  for (let t = from; t <= to; t++) {
    wr.put(...at(face, plane, t, y, proud), ...B.stairs("warped", OPPOSITE[face], "top"));
    wr.put(...at(face, plane, t, y - 1, proud), ...B.trapdoor("dark_oak", face, "top", false));
  }
  return { cells: wr.cells, refused: wr.refused };
}
