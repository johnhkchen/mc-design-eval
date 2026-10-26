// Seven plan.md VOCABULARY helpers: plinthCourse, roseWindow, balustrade, pinnacle, leadRoof, spireStage, floodlight.
// Each takes its position (and facing, where it has one) as arguments and writes only its own footprint, and only into
// air unless { overwrite: true }. Returns { cells, refused }: cells = blocks placed, refused = [x, y, z, block] for every
// write that was not air (or was out of the grid). Block ids are literals from plan.md's PALETTE.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Stair and slab states without `waterlogged`: `mcd states` lists none for these blocks, so B.stairs / B.slab would add an invalid key.
const stairs = (mat, facing, half) => [`${mat}_stairs`, { facing, half, shape: "straight" }];
const slab = (mat, type = "bottom") => [`${mat}_slab`, { type }];

function sink(g, opts) {
  const out = { cells: 0, refused: [] };
  const put = (x, y, z, [block, state = {}]) => {
    if (!g.inBounds(x, y, z) || (!opts.overwrite && !g.isAir(x, y, z))) { out.refused.push([x, y, z, block]); return; }
    g.set(x, y, z, block, state);
    out.cells++;
  };
  return { put, out };
}

// Inclusive integer range between a and b, either direction.
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

/**
 * Plinth course: stone_bricks through the box, its top layer polished_andesite. box = [x0, y0, z0, x1, y1, z1], from the
 * ground up (the caller gives the ground-to-plinth-top box, so nothing floats).
 */
export function plinthCourse(g, [x0, y0, z0, x1, y1, z1], opts = {}) {
  const { put, out } = sink(g, opts);
  const top = Math.max(y0, y1);
  for (const x of span(x0, x1)) for (const y of span(y0, y1)) for (const z of span(z0, z1))
    put(x, y, z, y === top ? ["polished_andesite"] : ["stone_bricks"]);
  return out;
}

/**
 * Rose window. centre = [x, y, z] of the rose's centre cell in its glass plane; face = the way it looks out
 * ("north" | "south" | "east" | "west"): the plane is perpendicular to that axis. r = radius in cells. glass: false leaves
 * the disc open for the glazier (tracery, ring and frame are still placed). Panes: yellow centre, purple inner ring,
 * red outer ring (r-1..r), blue field; 12 chiseled spokes; chiseled ring at r+1; square cut_sandstone frame at r+2.
 */
export function roseWindow(g, [cx, cy, cz], face, r, glass = true, opts = {}) {
  if (!["north", "south", "east", "west"].includes(face)) throw new Error(`roseWindow: face must be a compass direction, got ${face}`);
  const { put, out } = sink(g, opts);
  const inZPlane = face === "north" || face === "south";      // plane z = cz, in-plane u runs along x
  const at = (du, dv) => (inZPlane ? [cx + du, cy + dv, cz] : [cx, cy + dv, cz + du]);
  const [uPlus, uMinus] = inZPlane ? ["east", "west"] : ["south", "north"];
  const R = r + 2;
  // A spoke is a chiseled ray from the centre out to the ring: 12 rays 30 degrees apart, one cell wide.
  const spoke = (du, dv) => {
    const d = Math.hypot(du, dv), th = Math.atan2(dv, du);
    if (d < 2 || d > r - 1) return false;
    for (let k = 0; k < 12; k++) {
      const diff = th - (k * Math.PI) / 6;
      if (Math.cos(diff) > 0 && d * Math.abs(Math.sin(diff)) < 0.5) return true;
    }
    return false;
  };
  const pane = (du, dv) => Math.hypot(du, dv) <= r && !spoke(du, dv);
  for (let dv = -R; dv <= R; dv++) for (let du = -R; du <= R; du++) {
    const d = Math.hypot(du, dv), [x, y, z] = at(du, dv);
    if (Math.max(Math.abs(du), Math.abs(dv)) === R) put(x, y, z, ["cut_sandstone"]);
    else if (d > r && d <= r + 1) put(x, y, z, ["chiseled_sandstone"]);
    else if (spoke(du, dv)) put(x, y, z, ["chiseled_sandstone"]);
    else if (glass && d <= r) {
      // pane connections: only to neighbours in the plane (north/south, or east/west); vertical neighbours don't connect
      const conn = { north: "false", east: "false", south: "false", west: "false" };
      conn[uPlus] = String(pane(du + 1, dv));
      conn[uMinus] = String(pane(du - 1, dv));
      const colour = d === 0 ? "yellow" : d <= 1 ? "purple" : d > r - 1 ? "red" : "blue";
      put(x, y, z, [`${colour}_stained_glass_pane`, conn]);
    }
  }
  return out;
}

/**
 * Balustrade along a straight line = [x0, z0, x1, z1] (it must run along x or z), at height y: sandstone_wall run,
 * end_stone_brick_wall posts every 4 cells and at the far end.
 */
export function balustrade(g, [x0, z0, x1, z1], y, opts = {}) {
  if (x0 !== x1 && z0 !== z1) throw new Error("balustrade: the line must run along x or z");
  const { put, out } = sink(g, opts);
  const alongX = x0 !== x1;
  const n = Math.abs(x1 - x0) + Math.abs(z1 - z0) + 1;
  const sx = Math.sign(x1 - x0), sz = Math.sign(z1 - z0);
  const [minus, plus] = alongX ? ["west", "east"] : ["north", "south"];
  for (let i = 0; i < n; i++) {
    const state = { up: "true" };
    if (i > 0) state[minus] = "low";
    if (i < n - 1) state[plus] = "low";
    const post = i % 4 === 0 || i === n - 1;
    put(x0 + sx * i, y, z0 + sz * i, [post ? "end_stone_brick_wall" : "sandstone_wall", state]);
  }
  return out;
}

/**
 * Pinnacle on a 3x3 pier top: base 3x3 smooth_sandstone (2 high, from y0), ring course at y0+2 (corners full, edge
 * middles stairs with the solid back outward), end_stone_brick_wall spike up the middle, lightning_rod finial at
 * y0+h-1. h >= 4. Plan.md's tops are y 43 / 44 (pass h so that y0+h-1 is 43 or 44).
 */
export function pinnacle(g, cx, cz, y0, h, opts = {}) {
  if (h < 4) throw new Error("pinnacle: h must be at least 4 (base 2, ring 1, finial 1)");
  const { put, out } = sink(g, opts);
  for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
    for (const y of [y0, y0 + 1]) put(cx + dx, y, cz + dz, ["smooth_sandstone"]);
    if (!dx && !dz) continue;
    const x = cx + dx, z = cz + dz;
    if (dx && dz) put(x, y0 + 2, z, ["smooth_sandstone"]);
    else {
      // the open front of a step points at the spike, so the solid back is on the outside
      const facing = dz === -1 ? "south" : dz === 1 ? "north" : dx === -1 ? "east" : "west";
      put(x, y0 + 2, z, stairs("smooth_sandstone", facing, "bottom"));
    }
  }
  for (let y = y0 + 2; y < y0 + h - 1; y++) put(cx, y, cz, ["end_stone_brick_wall", { up: "true" }]);
  put(cx, y0 + h - 1, cz, ["lightning_rod", { facing: "up", powered: "false" }]);
  return out;
}

/**
 * Lead roof over the 2-D footprint box = [x0, z0, x1, z1], its eave at eaveY (the wall plate; the walls below are the
 * caller's). Gable (opts.ridge "x" | "z", default "x"): pitch 1, a stair per row, polished_deepslate ridge with an iron_bars
 * crest on every other ridge cell. Lean-to (opts.lean "north" | "south" | "east" | "west" = the side the roof is high
 * on): deepslate_tile_slab steps, half a block per cell. Every column is filled solid with deepslate_tiles under the
 * skin. The gable ends are the caller's masonry.
 */
export function leadRoof(g, [x0, z0, x1, z1], eaveY, opts = {}) {
  const { lean = null, ridge = "x" } = opts;
  if (!lean && !["x", "z"].includes(ridge)) throw new Error(`leadRoof: ridge must be "x" or "z", got ${ridge}`);
  if (lean && !["north", "south", "east", "west"].includes(lean)) throw new Error(`leadRoof: lean must be a compass side, got ${lean}`);
  const { put, out } = sink(g, opts);
  // the slope runs across the box: `a` is that axis, `b` the other (the ridge line or eave line)
  const across = lean ? (lean === "north" || lean === "south" ? "z" : "x") : ridge === "x" ? "z" : "x";
  const [a0, a1] = across === "z" ? [z0, z1] : [x0, x1];
  const [b0, b1] = across === "z" ? [x0, x1] : [z0, z1];
  const at = (a, b) => (across === "z" ? [b, a] : [a, b]);   // -> [x, z]
  const peak = Math.floor((a1 - a0) / 2);                      // highest row, a0..a1 of length L gives (L-1)/2
  for (const a of span(a0, a1)) for (const b of span(b0, b1)) {
    const [x, z] = at(a, b);
    if (lean) {
      // half a block per cell: even k a bottom slab, odd k a top slab, so the surface climbs 1 block per 2 cells
      const k = lean === "south" || lean === "east" ? a - a0 : a1 - a;
      const y0 = eaveY + Math.floor(k / 2);
      put(x, y0, z, slab("deepslate_tile", k % 2 === 0 ? "bottom" : "top"));
      for (let y = eaveY; y < y0; y++) put(x, y, z, ["deepslate_tiles"]);
      continue;
    }
    const dd = Math.min(a - a0, a1 - a), top = eaveY + dd;
    if (dd === peak) {
      put(x, top, z, ["polished_deepslate"]);
      if ((b - b0) % 2 === 0) put(x, top + 1, z, ["iron_bars", { north: "false", east: "false", south: "false", west: "false" }]);
    } else {
      // the step's solid back is on the high side, so it faces down the slope
      const low = a - a0 < a1 - a;
      const facing = across === "z" ? (low ? "north" : "south") : (low ? "west" : "east");
      put(x, top, z, stairs("deepslate_tile", facing, "bottom"));
    }
    for (let y = eaveY; y < top; y++) put(x, y, z, ["deepslate_tiles"]);
  }
  return out;
}

// Octagon outline of odd width w and corner cut c (c cells cut from each side's end): cells [dx, dz] from the centre,
// the outline only unless solid, and the eight vertices where each cut begins.
function octagon(w, cut, solid) {
  if (w % 2 === 0) throw new Error(`octagon: width must be odd, got ${w}`);
  const h = (w - 1) / 2;
  const inside = (dx, dz) => Math.abs(dx) <= h && Math.abs(dz) <= h && Math.abs(dx) + Math.abs(dz) <= 2 * h - cut;
  const cells = [];
  for (let dz = -h; dz <= h; dz++) for (let dx = -h; dx <= h; dx++) {
    if (!inside(dx, dz)) continue;
    const edge = !inside(dx + 1, dz) || !inside(dx - 1, dz) || !inside(dx, dz + 1) || !inside(dx, dz - 1);
    if (solid || edge) cells.push([dx, dz]);
  }
  const vertices = new Set();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    vertices.add(`${sx * (h - cut)},${sz * h}`);
    vertices.add(`${sx * h},${sz * (h - cut)}`);
  }
  return { cells, isVertex: (dx, dz) => vertices.has(`${dx},${dz}`) };
}

/**
 * One course of an octagon at height y, centred on (cx, cz), width w (odd), corner cut `cut`. mat fills it;
 * opts.solid fills the whole octagon, else it is a ring; opts.corner = [block, state] for the eight vertices (the frame line).
 */
function octagonRing(g, cx, cz, y, w, cut, mat, opts = {}) {
  const { put, out } = sink(g, opts);
  const { cells, isVertex } = octagon(w, cut, !!opts.solid);
  for (const [dx, dz] of cells) put(cx + dx, y, cz + dz, isVertex(dx, dz) && opts.corner ? opts.corner : [mat]);
  return out;
}

/**
 * Spire stage: octagonRing for every course from y0 to y1 (dark_oak_log corner lines, a ring unless opts.solid),
 * plus a crocket course at each y in opts.crockets: a ring one cell wider than the stage, upside-down
 * deepslate_tile_stairs facing in. The caller passes one call per plan.md table row. opts: { cut, mat, solid, crockets, overwrite }.
 */
export function spireStage(g, cx, cz, y0, y1, w, opts = {}) {
  const { cut = 0, mat = "deepslate_tiles", solid = false, crockets = [] } = opts;
  const { put, out } = sink(g, opts);
  const corner = B.log("dark_oak", "y");
  for (let y = y0; y <= y1; y++) {
    const r = octagonRing(g, cx, cz, y, w, cut, mat, { solid, corner, overwrite: opts.overwrite });
    out.cells += r.cells;
    out.refused.push(...r.refused);
    if (!crockets.includes(y)) continue;
    const { cells } = octagon(w + 2, cut, false);
    for (const [dx, dz] of cells) {
      const facing = Math.abs(dz) >= Math.abs(dx) ? (dz < 0 ? "south" : "north") : (dx < 0 ? "east" : "west");
      put(cx + dx, y, cz + dz, stairs("deepslate_tile", facing, "top"));
    }
  }
  return out;
}

/** Floodlight: one ochre_froglight at (x, y, z), its axis along the face it is set into (axis "x" | "y" | "z"). */
export function floodlight(g, x, y, z, axis = "y", opts = {}) {
  const { put, out } = sink(g, opts);
  put(x, y, z, B.pillar("ochre_froglight", axis));
  return out;
}
