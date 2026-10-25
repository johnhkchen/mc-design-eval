// Vocabulary helpers from plan.md VOCABULARY (second batch): granite_wall, tracery_window, slate_stair_roof,
// pinnacle, colonnade_bay, chimney_stack, degre_flight. Built on the build library (tools/src/build.mjs).
// Each takes the grid first, then its position (and facing) as arguments, and returns { placed, refused }.
// Writes stay inside the helper's own footprint and only go into air, unless opts.overwrite is set; anything
// refused is listed in `refused` (never thrown). Nothing is written below the footprint: ground, sand and
// floor under a helper belong to an earlier part.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const WALL = { up: "true", north: "none", east: "none", south: "none", west: "none" };
const WALL_PANE_X = { north: "false", south: "false", east: "true", west: "true" };
const WALL_PANE_Z = { north: "true", south: "true", east: "false", west: "false" };

// Corners in any order -> [minX, minY, minZ, maxX, maxY, maxZ].
const span = ([a, b, c, d, e, f]) => [Math.min(a, d), Math.min(b, e), Math.min(c, f), Math.max(a, d), Math.max(b, e), Math.max(c, f)];

// Deterministic per-cell hash, so weathering is the same on every run.
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// A writer that refuses anything outside `box` or (unless overwrite) not air.
function writer(g, box, opts = {}) {
  const w = { placed: 0, refused: [] };
  w.set = (x, y, z, block, state = {}) => {
    const inside = x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];
    if (!inside || (!opts.overwrite && !g.isAir(x, y, z))) { w.refused.push([x, y, z, block]); return; }
    g.set(x, y, z, block, state);
    w.placed++;
  };
  return w;
}

const done = (w) => ({ placed: w.placed, refused: w.refused });

/**
 * A granite wall: stone_bricks over the box. Plinth course (bottom row) cobblestone, mossy about a third of it;
 * about 1 in 10 bricks cracked or mossy; on the `face` plane (north = the z0 side, south = z1, west = x0, east = x1)
 * a string course of stone_brick_slab every 5 rows and chiseled quoins at the two ends of that face.
 */
export function granite_wall(g, box, face = "north", opts = {}) {
  const bx = span(box);
  const [x0, y0, z0, x1, y1, z1] = bx;
  const w = writer(g, bx, opts);
  const ns = face === "north" || face === "south";
  const onFace = (x, z) => (face === "north" ? z === z0 : face === "south" ? z === z1 : face === "west" ? x === x0 : x === x1);
  const along = (x, z) => (ns ? x : z);
  const [lo, hi] = ns ? [x0, x1] : [z0, z1];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    const h = hash(x, y, z) % 20;
    if (y === y0) {
      w.set(x, y, z, h % 3 === 0 ? "mossy_cobblestone" : "cobblestone");
    } else if (onFace(x, z) && (along(x, z) === lo || along(x, z) === hi)) {
      w.set(x, y, z, (y - y0) % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks");
    } else if (onFace(x, z) && (y - y0) % 5 === 4) {
      w.set(x, y, z, ...B.slab("stone_brick", "top"));
    } else {
      w.set(x, y, z, h === 1 ? "cracked_stone_bricks" : h === 2 ? "mossy_stone_bricks" : "stone_bricks");
    }
  }
  return done(w);
}

/**
 * A 3-wide, 5-high lancet-style window on the `face` plane: (x, y, z) is the bottom cell of its first column.
 * Side lights are gray glass panes, the centre is a stone_brick_wall mullion, and the head (top row) is upside-down
 * stone_brick_stairs turning in to a wall centre, an ogee-like arch. The opening is cut by the shell part, so
 * this only writes into air.
 */
export function tracery_window(g, x, y, z, face = "north", opts = {}) {
  const ax = face === "north" || face === "south" ? "x" : "z";
  const at = (i, j) => (ax === "x" ? [x + i, y + j, z] : [x, y + j, z + i]);
  const box = ax === "x" ? [x, y, z, x + 2, y + 4, z] : [x, y, z, x, y + 4, z + 2];
  const w = writer(g, box, opts);
  const pane = ax === "x" ? WALL_PANE_X : WALL_PANE_Z;
  const [leftFacing, rightFacing] = ax === "x" ? ["east", "west"] : ["south", "north"];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
    if (i === 1) w.set(...at(i, j), "stone_brick_wall", WALL);
    else w.set(...at(i, j), "gray_stained_glass_pane", pane);
  }
  w.set(...at(1, 4), "stone_brick_wall", WALL);
  w.set(...at(0, 4), ...B.stairs("stone_brick", leftFacing, "top"));
  w.set(...at(2, 4), ...B.stairs("stone_brick", rightFacing, "top"));
  return done(w);
}

/**
 * A steep slate roof of stairs over the box, ridge along `ridge` ("x" or "z"). The box's (x0, y0, z0) is the eave
 * corner at y0 and its y1 is the highest y allowed. `pitch` is [rise, run]: [1, 1] is 1:1, [3, 2] is 3:2 (stair
 * courses rise 3 for every 2 cells). Each slope cell is a deepslate_tile_stairs facing the ridge; the ridge row is
 * a stone_brick_slab; cobbled_deepslate fills under each stair so nothing floats. Gable ends are the walls' job.
 */
export function slate_stair_roof(g, box, ridge = "x", pitch = [1, 1], opts = {}) {
  const bx = span(box);
  const [x0, y0, z0, x1, , z1] = bx;
  const [rise, run] = pitch;
  const w = writer(g, bx, opts);
  const across = ridge === "x" ? [z0, z1] : [x0, x1];
  const along = ridge === "x" ? [x0, x1] : [z0, z1];
  const W = across[1] - across[0] + 1;
  const emax = Math.floor((W - 1) / 2);
  const kOf = (e) => Math.floor((e * rise) / run);
  const at = (u, h, v) => (ridge === "x" ? [u, h, v] : [v, h, u]);
  for (let i = 0; i < W; i++) {
    const v = across[0] + i;
    const e = Math.min(i, W - 1 - i);
    const k = kOf(e);
    const low = i < W / 2;
    const facing = ridge === "x" ? (low ? "south" : "north") : (low ? "east" : "west");
    for (let u = along[0]; u <= along[1]; u++) {
      for (let h = y0; h < y0 + k; h++) w.set(...at(u, h, v), "cobbled_deepslate");
      if (e === emax) w.set(...at(u, y0 + k, v), ...B.slab("stone_brick", "bottom"));
      else w.set(...at(u, y0 + k, v), ...B.stairs("deepslate_tile", facing, "bottom"));
    }
  }
  return done(w);
}

/** A pinnacle: polished_deepslate_wall shaft h cells tall from (x, y, z), capped by a deepslate_tile_wall tip. */
export function pinnacle(g, x, y, z, h = 3, opts = {}) {
  const w = writer(g, [x, y, z, x, y + h - 1, z], opts);
  for (let j = 0; j < h - 1; j++) w.set(x, y + j, z, "polished_deepslate_wall", WALL);
  w.set(x, y + h - 1, z, "deepslate_tile_wall", WALL);
  return done(w);
}

/**
 * One colonnade bay: a polished_andesite stylobate at y over `span` cells, quartz_pillar columns at both ends rising
 * `height` cells from the stylobate, and a stone_brick_slab lintel over the columns. (x, y, z) is the first end cell;
 * axis "x" runs the bay east, "z" south. The open cells between the columns stay air (a double row is two bays).
 */
export function colonnade_bay(g, x, y, z, axis = "x", span = 4, height = 4, opts = {}) {
  const at = (i) => (axis === "x" ? [x + i, y, z] : [x, y, z + i]);
  const box = axis === "x" ? [x, y, z, x + span, y + height + 1, z] : [x, y, z, x, y + height + 1, z + span];
  const w = writer(g, box, opts);
  for (let i = 0; i <= span; i++) {
    const [cx, , cz] = at(i);
    w.set(cx, y, cz, "polished_andesite");
    if (i === 0 || i === span) {
      for (let j = 1; j <= height; j++) w.set(cx, y + j, cz, "quartz_pillar", { axis: "y" });
      w.set(cx, y + height + 1, cz, ...B.slab("stone_brick", "bottom"));
    }
  }
  return done(w);
}

/**
 * A 2x2 chimney stack at (x..x+1, y.., z..z+1), h cells of masonry tall, capped by a stone_brick_slab ring. The fire
 * is a lit campfire in the flue foot at (x, y, z), so the smoke comes up from the bottom; the flue (x, z) stays air
 * to the top and the top is open to the sky. A chiseled band runs at mid height. The stack sits on the caller's
 * ground: nothing is written below y (the build library's chimney() would write a footing down to the ground).
 */
export function chimney_stack(g, x, y, z, h = 6, opts = {}) {
  const w = writer(g, [x, y, z, x + 1, y + h, z + 1], opts);
  const ring = [[x + 1, z], [x, z + 1], [x + 1, z + 1]];
  w.set(x, y, z, "campfire", { facing: "north", lit: "true" });
  for (const [cx, cz] of ring) w.set(cx, y, cz, "stone_bricks");
  for (let j = 1; j < h; j++) for (const [cx, cz] of ring) {
    w.set(cx, y + j, cz, j === Math.floor(h / 2) ? "chiseled_stone_bricks" : "stone_bricks");
  }
  for (const [cx, cz] of ring) w.set(cx, y + h, cz, ...B.slab("stone_brick", "bottom"));
  return done(w);
}

/**
 * A Grand Degré style flight: stairs from (x0, y0, z0) to the end column (x1, y1), one tread per column with
 * run and drop both 1 (|y1 - y0| must equal |x1 - x0|). Treads are stone_brick_stairs facing up-slope, `width`
 * wide along z, with stone_bricks walls on both sides (z0 - 1 and z0 + width) rising 8 above each tread and a
 * stone_brick_slab coping. Ground under the treads and walls is the caller's footing, not written here.
 */
export function degre_flight(g, [x0, y0, z0], [x1, y1], width = 3, opts = {}) {
  const dx = x1 - x0, dy = y1 - y0;
  if (dx === 0 || Math.abs(dx) !== Math.abs(dy)) throw new Error("degre_flight: run and drop must be equal and non-zero");
  const slope = dy / dx;
  const rising = slope > 0 ? "east" : "west";
  const sx = Math.sign(dx);
  const tread = (x) => y0 + slope * (x - x0);
  const xs = Array.from({ length: Math.abs(dx) + 1 }, (_, i) => x0 + sx * i);
  const tops = xs.map((x) => tread(x));
  const box = [Math.min(x0, x1), Math.min(...tops), z0 - 1, Math.max(x0, x1), Math.max(...tops) + 8, z0 + width];
  const w = writer(g, box, opts);
  for (const x of xs) {
    const t = tread(x);
    for (let z = z0; z < z0 + width; z++) w.set(x, t, z, ...B.stairs("stone_brick", rising, "bottom"));
    for (const wz of [z0 - 1, z0 + width]) {
      for (let yy = t; yy < t + 8; yy++) w.set(x, yy, wz, "stone_bricks");
      w.set(x, t + 8, wz, ...B.slab("stone_brick", "bottom"));
    }
  }
  return done(w);
}
