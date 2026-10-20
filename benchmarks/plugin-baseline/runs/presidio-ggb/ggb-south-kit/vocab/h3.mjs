// SPDX-License-Identifier: AGPL-3.0-or-later
// Plan VOCABULARY helpers for the Golden Gate south kit: embrasure, gallery, rockCluster, crossBeam,
// anchoragePanel, deckLamp, cableDive, hangLantern. Each takes its position as arguments and writes only its own
// footprint. Writes go only into air unless opts.carve is set, which lets the helper cut into what an earlier part
// built (the fort wall, the anchorage body, the railing, the cable housing). Nothing is written at y 0 or below.
// Helpers return the number of cells written; a write the guard refuses is not counted.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// [x, z] of the cell at `along` on the plane `at` (x for east/west faces, z for north/south), `depth` cells in from
// the face. Depth 0 is the outer face cell; the inside is the opposite of the face's outward direction.
const cellAt = (face, at, along, depth) => {
  const [ox, , oz] = DIRS[face];
  return ox ? [at - depth * ox, along] : [along, at - depth * oz];
};

// Stair facings for a run: [toward +along, toward -along]. Along is x on north/south faces, z on east/west faces.
const runFacing = (face) => (DIRS[face][0] ? ["south", "north"] : ["east", "west"]);

// One write: into air only, unless opts.carve. Returns 1 if the cell was written.
function put(g, [x, y, z], block, state, opts = {}) {
  if (!opts.carve && !g.isAir(x, y, z)) return 0;
  const refused = g.refused?.length ?? 0;
  g.set(x, y, z, block, state);
  return (g.refused?.length ?? 0) > refused ? 0 : 1;
}

// Every cell of the box a..b (inclusive) gets the block.
function fillBox(g, [x0, y0, z0], [x1, y1, z1], block, state, opts) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) n += put(g, [x, y, z], block, state, opts);
  return n;
}

const lampState = { hanging: "false" };

/**
 * Gun port, `wide` cells across, one per tier (tiers default 1, 3, 5). (x, z) is the outer cell of the first opening;
 * face is the way the port opens (outward). Per tier: a brick_slab sill (bottom) and air above it in the outer cell;
 * black_concrete in the cell 1 deeper, both rows; upside-down brick_stairs in the upper row of the piers either side,
 * facing toward the opening. Piers stay wall in the lower row.
 */
export function embrasure(g, x, z, face, wide = 1, opts = {}) {
  const alongX = !DIRS[face][0];
  const at = alongX ? z : x;
  const along = alongX ? x : z;
  const [toPlus, toMinus] = runFacing(face);
  const cell = (a, d) => cellAt(face, at, along + a, d);
  let n = 0;
  for (const t of opts.tiers ?? [1, 3, 5]) {
    for (let a = 0; a < wide; a++) {
      const [fx, fz] = cell(a, 0);
      const [bx, bz] = cell(a, 1);
      n += put(g, [fx, t, fz], "brick_slab", { type: "bottom" }, opts);
      n += put(g, [fx, t + 1, fz], "air", undefined, opts);
      n += put(g, [bx, t, bz], "black_concrete", undefined, opts);
      n += put(g, [bx, t + 1, bz], "black_concrete", undefined, opts);
    }
    const [lx, lz] = cell(-1, 0);
    const [rx, rz] = cell(wide, 0);
    n += put(g, [lx, t + 1, lz], "brick_stairs", { facing: toPlus, half: "top", shape: "straight" }, opts);
    n += put(g, [rx, t + 1, rz], "brick_stairs", { facing: toMinus, half: "top", shape: "straight" }, opts);
  }
  return n;
}

/**
 * Parade arcade on one run. run = { at, from, to }: the fort row (z for north/south faces, x for east/west) and the
 * run's first and last cells along it. Openings every other cell from the 2nd, 2 deep, 3 tiers. Lower row brick_slab
 * (bottom) in both cells, air above. Upper-row arch heads on the piers, upside-down brick_stairs facing the opening.
 * A pier between two openings stays wall (no stair can face both). The footprint takes the pier one cell past the run.
 */
export function gallery(g, run, face, opts = {}) {
  const { at, from, to } = run;
  const n = to - from + 1;
  const [toPlus, toMinus] = runFacing(face);
  const cell = (a, d) => cellAt(face, at, from + a, d);
  const open = (a) => a >= 0 && a < n && a % 2 === 1;
  let count = 0;
  for (const t of opts.tiers ?? [1, 3, 5]) {
    for (let a = 1; a < n; a += 2) {
      for (let d = 0; d < 2; d++) {
        const [x, z] = cell(a, d);
        count += put(g, [x, t, z], "brick_slab", { type: "bottom" }, opts);
        count += put(g, [x, t + 1, z], "air", undefined, opts);
      }
    }
    for (let p = 0; p <= n; p++) {
      const left = open(p - 1);
      const right = open(p + 1);
      if (left === right) continue;
      const facing = left ? toMinus : toPlus;
      for (let d = 0; d < 2; d++) {
        const [x, z] = cell(p, d);
        count += put(g, [x, t + 1, z], "brick_stairs", { facing, half: "top", shape: "straight" }, opts);
      }
    }
  }
  return count;
}

/**
 * Shore boulders. cells = [[x, z, h?]], h 1 or 2 (default 1), standing from floor level `base`. The material is picked
 * from the cell position, so a rebuild gives the same rocks. A column with a lantern above it, or listed in
 * opts.lamps as [x, z], gets no rock (never under a lamp).
 */
const ROCKS = ["andesite", "andesite", "cobblestone", "mossy_cobblestone"];
export function rockCluster(g, cells, base, opts = {}) {
  const lamps = new Set((opts.lamps ?? []).map(([x, z]) => `${x},${z}`));
  let n = 0;
  for (const [x, z, h = 1] of cells) {
    if (lamps.has(`${x},${z}`)) continue;
    let lamp = false;
    for (let k = 0; k <= 5; k++) if (g.blockAt(x, base + k, z) === "minecraft:lantern") lamp = true;
    if (lamp) continue;
    const block = ROCKS[(x * 7 + z * 3) % ROCKS.length];
    for (let y = base; y < base + Math.min(h, 2); y++) n += put(g, [x, y, z], block, undefined, opts);
  }
  return n;
}

/** Solid smooth_sandstone cross beam over z z0..z1 and the box box = { x0, x1, y0, y1 }. */
export function crossBeam(g, z0, z1, box, opts = {}) {
  return fillBox(g, [box.x0, box.y0, z0], [box.x1, box.y1, z1], "smooth_sandstone", undefined, opts);
}

/**
 * Art Deco recessed panels on an anchorage face. face is the outward direction, `at` the plane of the face (x for
 * west/east, z for south/north). spans: [[a0, a1]] along the face, panels between y[0]..y[1]. Recess 1 clears the
 * face cell of each panel. inner: [[a0, a1]] within the spans, a second recess 2 deep at innerY[0]..innerY[1]: it
 * clears the next cell too. Floors and backs are smooth_sandstone.
 */
export function anchoragePanel(g, face, at, { spans, inner = [], y, innerY }, opts = {}) {
  const deep = (a, yy) => yy >= innerY[0] && yy <= innerY[1] && inner.some(([a0, a1]) => a >= a0 && a <= a1);
  let n = 0;
  const pos = (a, d, yy) => {
    const [x, z] = cellAt(face, at, a, d);
    return [x, yy, z];
  };
  for (const [a0, a1] of spans) for (let a = a0; a <= a1; a++) for (let yy = y[0]; yy <= y[1]; yy++) {
    n += put(g, pos(a, 0, yy), "air", undefined, opts);
    if (deep(a, yy)) {
      n += put(g, pos(a, 1, yy), "air", undefined, opts);
      n += put(g, pos(a, 2, yy), "smooth_sandstone", undefined, opts);
    } else {
      n += put(g, pos(a, 1, yy), "smooth_sandstone", undefined, opts);
    }
  }
  return n;
}

/**
 * Art Deco lamp post at (x, Y+1..Y+3, z): orange_concrete, red_concrete, standing lantern. outer: the post stands on the
 * outer sidewalk cell; then lane (±1, the walk's direction off the post) is required and the two cells beside the post
 * on that side must be air (a 2-high clear lane), or nothing is placed.
 */
export function deckLamp(g, x, z, Y, outer = false, opts = {}) {
  const { lane } = opts;
  if (outer && !lane) throw new Error("deckLamp: an outer post needs opts.lane (+1 or -1) for its clear lane");
  if (lane && !(g.isAir(x + lane, Y + 1, z) && g.isAir(x + lane, Y + 2, z))) return 0;
  let n = 0;
  n += put(g, [x, Y + 1, z], "orange_concrete", undefined, opts);
  n += put(g, [x, Y + 2, z], "red_concrete", undefined, opts);
  n += put(g, [x, Y + 3, z], "lantern", lampState, opts);
  return n;
}

/**
 * Main cable: red_concrete at every x in xs, following table = [[z, y], ...], the cable's height at each z. Between two
 * rows the cable fills vertically at the later z, so it stays continuous. It is buried in the housing, so pass carve.
 */
export function cableDive(g, table, xs, opts = {}) {
  let n = 0;
  table.forEach(([z, y], i) => {
    const prev = i ? table[i - 1][1] : y;
    for (let yy = Math.min(prev, y); yy <= Math.max(prev, y); yy++) {
      for (const x of xs) n += put(g, [x, yy, z], "red_concrete", undefined, opts);
    }
  });
  return n;
}

/** Hanging lantern at (x, y, z), hung from the block above it. Writes nothing if the cell above is air. */
export function hangLantern(g, x, y, z, opts = {}) {
  if (g.isAir(x, y + 1, z)) return 0;
  return put(g, [x, y, z], "lantern", { hanging: "true" }, opts);
}
