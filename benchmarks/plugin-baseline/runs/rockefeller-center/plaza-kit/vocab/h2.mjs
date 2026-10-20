// Landscape and architecture helpers from plan.md VOCABULARY: halfStep, paverBand, rinkRim, glassFront, parapet,
// zodiacRing, cascade, goldRing, jet. Block ids are literals from plan.md's PALETTE. Every helper takes the grid g
// first, then its position (and facing) as arguments, and returns { placed, refused }. It writes only its own footprint,
// and only into air: a cell an earlier part already filled is refused and listed, never overwritten, unless opts.overwrite
// is true (the surface block a half step or a paver band replaces, the pool water a jet stands in). Nothing below a
// helper's own cells is ever touched. Circles are read in block-index coordinates, as plan.md gives them (zodiac centre
// y 5.5, z 27.5 spans y 1..10, z 23..32).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const result = () => ({ placed: 0, refused: [] });

// One write: into air (or anywhere, with overwrite) inside the grid; anything else is refused and listed.
function put(g, res, overwrite, x, y, z, block, state) {
  if (!g.inBounds(x, y, z) || (!overwrite && !g.isAir(x, y, z))) { res.refused.push([x, y, z, block]); return; }
  g.set(x, y, z, block, state);
  res.placed++;
}

// The cell at position t along the line, where axis names the coordinate the line is fixed on: "x" = at x = pos, along z;
// "z" = at z = pos, along x.
function at(axis, pos, t) {
  if (axis !== "x" && axis !== "z") throw new Error(`axis must be x or z, got ${axis}`);
  return axis === "x" ? [pos, t] : [t, pos];
}

// The cells of a circle of radius r about centre [cy, cz] in its plane: those whose distance from the centre is within
// half a block of r, so the ring is one block thick.
function circleRing(r, [cy, cz]) {
  const cells = [];
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
    for (let z = Math.floor(cz - r - 1); z <= Math.ceil(cz + r + 1); z++)
      if (Math.abs(Math.hypot(y - cy, z - cz) - r) <= 0.5) cells.push([y, z]);
  return cells;
}

/** Half step: a bottom slab of `material` (polished_andesite, or smooth_stone) at (x, h, z), on the higher cell's edge row.
 *  Lays that one cell; the stone under it is the ground's and is never touched. */
export function halfStep(g, x, z, h, { material = "polished_andesite", overwrite = false } = {}) {
  const res = result(), [id, st] = B.slab(material, "bottom");
  put(g, res, overwrite, x, h, z, id, st);
  return res;
}

/** Paver band: a one-block line of polished_andesite at height y across a smooth_stone field, from..to along the line
 *  (see `at`). overwrite replaces the field block at y; nothing below y is touched. */
export function paverBand(g, axis, pos, from, to, y, { block = "polished_andesite", overwrite = false } = {}) {
  const res = result();
  for (let t = Math.min(from, to); t <= Math.max(from, to); t++) {
    const [x, z] = at(axis, pos, t);
    put(g, res, overwrite, x, y, z, block);
  }
  return res;
}

/** Rink rim: a ring of white_concrete at y on the box x0..x1 × z0..z1 (its outer cells only). gaps: boxes [x0, z0, x1, z1]
 *  left open (the rink gate, the terrace gaps, the fountain's dark rim). A lantern stands on every lanternEvery-th rim cell,
 *  counted round the ring. */
export function rinkRim(g, x0, x1, z0, z1, y, { gaps = [], block = "white_concrete", lanternEvery = 4, overwrite = false } = {}) {
  const res = result(), ring = [];
  for (let x = x0; x <= x1; x++) ring.push([x, z0]);
  for (let z = z0 + 1; z <= z1; z++) ring.push([x1, z]);
  for (let x = x1 - 1; x >= x0; x--) ring.push([x, z1]);
  for (let z = z1 - 1; z > z0; z--) ring.push([x0, z]);
  const open = ([x, z]) => gaps.some(([gx0, gz0, gx1, gz1]) => x >= gx0 && x <= gx1 && z >= gz0 && z <= gz1);
  ring.filter((c) => !open(c)).forEach(([x, z], i) => {
    put(g, res, overwrite, x, y, z, block);
    if (i % lanternEvery === 0) put(g, res, overwrite, x, y + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  });
  return res;
}

/** Restaurant front on the wall line z, from x0 to x1 and y0..y1: polished_andesite piers at x0, every 4th cell, and at x1;
 *  glass_pane bays between them (arms along x). With door = [xa, xb], a double birch_door there (left and right hinge, both
 *  halves) with glass above it. facing: the way the front looks out (south for the north restaurant). */
export function glassFront(g, z, facing, { x0, x1, door = null, y0 = 1, y1 = 3, pier = "polished_andesite", overwrite = false } = {}) {
  if (x0 == null || x1 == null) throw new Error("glassFront needs x0 and x1");
  const res = result(), inDoor = (x) => door && x >= door[0] && x <= door[1];
  for (let x = x0; x <= x1; x++) {
    const isPier = (x - x0) % 4 === 0 || x === x1;
    for (let y = y0; y <= y1; y++) {
      if (isPier) put(g, res, overwrite, x, y, z, pier);
      else if (inDoor(x) && y <= y0 + 1) {
        const [id, st] = B.door("birch", facing, y === y0 ? "lower" : "upper", x === door[0] ? "left" : "right");
        put(g, res, overwrite, x, y, z, id, st);
      } else put(g, res, overwrite, x, y, z, "glass_pane", { north: "false", east: "true", south: "false", west: "true" });
    }
  }
  return res;
}

/** Parapet: andesite_wall posts every `every` cells along the line, iron_bars railing between them, and a lantern standing on
 *  each post, at y (lanterns at y+1). axis, pos, from, to as in paverBand. Arms point along the line to neighbouring cells. */
export function parapet(g, axis, pos, from, to, y, { every = 4, overwrite = false } = {}) {
  const res = result(), lo = Math.min(from, to), hi = Math.max(from, to);
  const [a, b] = axis === "x" ? ["north", "south"] : ["west", "east"];   // the two directions along the line
  for (let t = lo; t <= hi; t++) {
    const [x, z] = at(axis, pos, t), prev = t > lo, next = t < hi;
    if ((t - lo) % every === 0) {
      const st = { up: "true" };
      if (prev) st[a] = "low";
      if (next) st[b] = "low";
      put(g, res, overwrite, x, y, z, "andesite_wall", st);
      put(g, res, overwrite, x, y + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    } else {
      const st = { north: "false", east: "false", south: "false", west: "false" };
      if (prev) st[a] = "true";
      if (next) st[b] = "true";
      put(g, res, overwrite, x, y, z, "iron_bars", st);
    }
  }
  return res;
}

/** Zodiac ring: a circle of gold_block of radius r about centre [cy, cz] in the plane x (the wall face), with `marks`
 *  chiseled_polished_blackstone set evenly round it, the first at the top and going round. centre [5.5, 27.5], r 4.5 spans
 *  y 1..10, z 23..32 as plan.md has it. */
export function zodiacRing(g, x, centre, r, { block = "gold_block", mark = "chiseled_polished_blackstone", marks = 12, overwrite = false } = {}) {
  const res = result(), ring = circleRing(r, centre), taken = new Set();
  for (let k = 0; k < marks; k++) {
    const a = (2 * Math.PI * k) / marks, ty = centre[0] + r * Math.cos(a), tz = centre[1] + r * Math.sin(a);
    let best = null;
    for (const c of ring) {
      if (taken.has(c.join(","))) continue;
      const d = Math.hypot(c[0] - ty, c[1] - tz);
      if (!best || d < best.d) best = { c, d };
    }
    if (best) taken.add(best.c.join(","));
  }
  for (const [y, z] of ring) put(g, res, overwrite, x, y, z, taken.has(`${y},${z}`) ? mark : block);
  return res;
}

/** Gold ring: a plain circle of gold_block of radius r about centre [cy, cz] in the plane x, face-on from the gardens.
 *  centre [5.5, 27.5], r 3.5 spans y 2..9, z 24..31 as plan.md has it. */
export function goldRing(g, x, centre, r, { block = "gold_block", overwrite = false } = {}) {
  const res = result();
  for (const [y, z] of circleRing(r, centre)) put(g, res, overwrite, x, y, z, block);
  return res;
}

/** Cascade ledge: a bottom slab of `material` at (x, y, z0..z1), with a water source on it at y+1 pouring into the basin
 *  beside it. */
export function cascade(g, x, y, z0, z1, { material = "polished_blackstone", overwrite = false } = {}) {
  const res = result(), [id, st] = B.slab(material, "bottom");
  for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
    put(g, res, overwrite, x, y, z, id, st);
    put(g, res, overwrite, x, y + 1, z, "water");
  }
  return res;
}

/** Fountain jet: a bronze figure (waxed_exposed_copper) at (x, ground+1, z) with a water source on it at ground+2, pouring
 *  down the pool. The figure stands in the pool's water, so lay the jet after the pool with overwrite: true; otherwise it
 *  is refused where the water is. */
export function jet(g, x, z, ground, { overwrite = false } = {}) {
  const res = result();
  put(g, res, overwrite, x, ground + 1, z, "waxed_exposed_copper");
  put(g, res, false, x, ground + 2, z, "water");
  return res;
}
