// H1 helpers from plan.md VOCABULARY: fortWall, loophole, stairTower, lampPost, deckPier, deckSection, archRib, bent.
//
// Every helper takes its position (and facing, where it has one) as arguments. Writes go only into AIR: a cell that
// already holds a block, or lies outside the grid, is left alone and listed in `skipped` as [x, y, z, block], so the
// caller can report it. Pass { over: true } only where an earlier part's solid cell is meant to be replaced (a loophole
// carved through the fort wall, a tower built on the fort). Nothing writes the row under its footprint (ground, floor,
// water): fortWall's ground course is laid only with { ground: true }. Each helper returns { box, placed, skipped }:
// box is the footprint it was given as [x0, y0, z0, x1, y1, z1], placed the count written, skipped the refused cells.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const bare = (id) => id.replace(/^minecraft:/, "");

// One writer per helper call. A cell this call already wrote is left alone (so a helper can list a cell twice).
function writer(g, over) {
  const w = { placed: 0, skipped: [], done: new Set() };
  w.put = (x, y, z, block, state) => {
    const key = `${x},${y},${z}`;
    if (w.done.has(key)) return;
    if (!g.inBounds(x, y, z)) return void w.skipped.push([x, y, z, "outside the grid"]);
    if (!g.isAir(x, y, z) && !over) return void w.skipped.push([x, y, z, bare(g.blockAt(x, y, z))]);
    if (block === "air" && g.isAir(x, y, z)) return;
    g.set(x, y, z, block, state);
    w.done.add(key);
    w.placed++;
  };
  return w;
}
const finish = (w, box) => ({ box, placed: w.placed, skipped: w.skipped });

/**
 * Fort wall: the solid casemate ring. mask is rows of text; one char = 2x2 blocks (char c -> x0+2c..+1, row r ->
 * z0+2r..+1), '#' = fort. Each fort cell: polished_granite at y0+1 (base course), bricks at y0+2..y0+6. The ground
 * course (y0, smooth_stone) is laid only with ground: true, since the ground part owns that row. clip: [xMax, zMax]
 * trims cells past the plot edge. Footprint: the mask's rectangle, rows y0..y0+6.
 */
export function fortWall(g, x0, z0, mask, { y0 = 0, clip = null, ground = false, over = false } = {}) {
  const w = writer(g, over);
  mask.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== "#") return;
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
      const x = x0 + 2 * c + dx, z = z0 + 2 * r + dz;
      if (clip && (x > clip[0] || z > clip[1])) continue;
      if (ground) w.put(x, y0, z, "smooth_stone");
      w.put(x, y0 + 1, z, "polished_granite");
      for (let y = y0 + 2; y <= y0 + 6; y++) w.put(x, y, z, "bricks");
    }
  }));
  const maxCols = Math.max(...mask.map((row) => row.length));
  let x1 = x0 + 2 * maxCols - 1, z1 = z0 + 2 * mask.length - 1;
  if (clip) { x1 = Math.min(x1, clip[0]); z1 = Math.min(z1, clip[1]); }
  return finish(w, [x0, y0, z0, x1, y0 + 6, z1]);
}

// The way a wall faces (its outer normal) and the step from the outer cell into the wall.
const INWARD = { north: [0, 0, 1], south: [0, 0, -1], east: [-1, 0, 0], west: [1, 0, 0] };

/**
 * Loophole: a 1x1 black_concrete slit recessed 1 into a wall. face is the way the wall faces (north = the wall's outer
 * face looks to −z). (x, y, z) is the front cell, left air; the slit is one cell inward of it. Footprint: those two cells.
 */
export function loophole(g, x, y, z, face, { over = false } = {}) {
  const w = writer(g, over), [dx, , dz] = INWARD[face];
  w.put(x, y, z, "air");
  w.put(x + dx, y, z + dz, "black_concrete");
  return finish(w, [Math.min(x, x + dx), y, Math.min(z, z + dz), Math.max(x, x + dx), y, Math.max(z, z + dz)]);
}

/**
 * Stair tower: a solid 4x4 of bricks, stone_bricks quoins on the four corners on alternate courses, a
 * polished_granite_slab cap ring at the top, and a 2-wide, 2-high doorway in the wall facing doorSide
 * ('north' | 'south' | 'east' | 'west'). (x0, z0) is the north-west corner, y0 the bottom course (plan: 1).
 * Rows y0..y0+8 are the walls, y0+9 the cap ring, the doorway y0+6..y0+7. Footprint: x0..x0+3, y0..y0+9, z0..z0+3.
 */
export function stairTower(g, x0, y0, z0, doorSide, { over = false } = {}) {
  const w = writer(g, over);
  const door = { north: (i) => [x0 + 1 + i, z0], south: (i) => [x0 + 1 + i, z0 + 3], west: (i) => [x0, z0 + 1 + i], east: (i) => [x0 + 3, z0 + 1 + i] }[doorSide];
  const inDoor = (x, y, z) => y >= y0 + 6 && y <= y0 + 7 && [0, 1].some((i) => door(i).join() === `${x},${z}`);
  for (let y = y0; y <= y0 + 8; y++) for (let x = x0; x <= x0 + 3; x++) for (let z = z0; z <= z0 + 3; z++) {
    if (inDoor(x, y, z)) { w.put(x, y, z, "air"); continue; }
    const corner = (x === x0 || x === x0 + 3) && (z === z0 || z === z0 + 3);
    if (corner && (y - y0) % 2 === 0) w.put(x, y, z, "stone_bricks");
    else w.put(x, y, z, "bricks");
  }
  for (let x = x0; x <= x0 + 3; x++) for (let z = z0; z <= z0 + 3; z++) {
    const inner = (x === x0 + 1 || x === x0 + 2) && (z === z0 + 1 || z === z0 + 2);
    if (!inner) w.put(x, y0 + 9, z, ...B.slab("polished_granite", "bottom"));
  }
  return finish(w, [x0, y0, z0, x0 + 3, y0 + 9, z0 + 3]);
}

/**
 * Lamp post: a polished_blackstone_wall post at base and base+1, a standing lantern at base+2. base is the walk row
 * (plan: 1, on the ground course at 0, which is never written). Footprint: the column, rows base..base+2.
 */
export function lampPost(g, x, z, base, { over = false } = {}) {
  const w = writer(g, over);
  w.put(x, base, z, ...B.wall("polished_blackstone"));
  w.put(x, base + 1, z, ...B.wall("polished_blackstone"));
  w.put(x, base + 2, z, ...B.lantern(false));
  return finish(w, [x, base, z, x, base + 2, z]);
}

/**
 * Anchorage deck pier: a solid 3x3 of smooth_sandstone at (x, z) (its min corner), rows yLo..yHi. With cap: [xa, xb],
 * a cap beam runs along x at yHi+1 across the pier's three z rows, from xa to xb. Give the cap to one pier of a pair
 * only. Footprint: the pier with its cap span.
 */
export function deckPier(g, x, z, { yLo = 15, yHi = 28, cap = null, over = false } = {}) {
  const w = writer(g, over);
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) for (let y = yLo; y <= yHi; y++) w.put(x + dx, y, z + dz, "smooth_sandstone");
  if (cap) for (let cx = cap[0]; cx <= cap[1]; cx++) for (let dz = 0; dz < 3; dz++) w.put(cx, yHi + 1, z + dz, "smooth_sandstone");
  const xs = cap ? [Math.min(x, cap[0]), Math.max(x + 2, cap[1])] : [x, x + 2];
  return finish(w, [xs[0], yLo, z, xs[1], cap ? yHi + 1 : yHi, z + 2]);
}

/**
 * Deck section: the bridge deck for rows z0..z1 (inclusive) at walking level Y, in the plan's cross-section from x0
 * (the west curb; the east curb is x0+14). Full blocks: curb (orange_terracotta, Y), railing (orange_concrete, Y+1),
 * floor (gray_concrete, Y-1, under the walks and road). Walking rows at Y: sidewalks (smooth_stone) at x0+1..2 and
 * x0+12..13, road (polished_deepslate) at x0+3..11, dashed smooth_quartz lines at x0+4 and x0+10 (on where z % 4 is 0
 * or 1, road otherwise), a continuous yellow_concrete centre line at x0+7. slab: the walking rows are bottom slabs (the
 * S segments; the curb stays full). Footprint: x0..x0+14, Y-1..Y+1, z0..z1.
 */
export function deckSection(g, z0, z1, Y, { slab = false, x0 = 8, over = false } = {}) {
  const w = writer(g, over), x1 = x0 + 14;
  const walk = (full, slabPair) => (slab ? slabPair : [full, undefined]);
  for (let z = z0; z <= z1; z++) {
    w.put(x0, Y, z, "orange_terracotta");
    w.put(x1, Y, z, "orange_terracotta");
    w.put(x0, Y + 1, z, "orange_concrete");
    w.put(x1, Y + 1, z, "orange_concrete");
    for (let x = x0 + 1; x <= x1 - 1; x++) {
      const d = x - x0;
      let pair;
      if (d === 1 || d === 2 || d === 12 || d === 13) pair = walk("smooth_stone", B.slab("smooth_stone"));
      else if (d === 7) pair = slab ? ["smooth_sandstone_slab", { type: "bottom", waterlogged: "false" }] : ["yellow_concrete"];
      else if ((d === 4 || d === 10) && z % 4 < 2) pair = walk("smooth_quartz", B.slab("smooth_quartz"));
      else pair = walk("polished_deepslate", B.slab("polished_deepslate"));
      w.put(x, Y, z, ...pair);
      w.put(x, Y - 1, z, "gray_concrete");
    }
  }
  return finish(w, [x0, Y - 1, z0, x1, Y + 1, z1]);
}

/**
 * Arch rib: a steel band 2 wide (in each pair of ribs) and 3 deep. table maps z -> intrados y (the rib's lowest row);
 * each z holds intrados..intrados+2, orange_terracotta with the intrados row red_concrete. Where a z's intrados jumps
 * more than 2 from a neighbour, that column is filled vertically up to (or down to) the neighbour so the rib stays
 * continuous. ribs: the x pairs (plan: x 8..9 and 21..22). Footprint: the ribs' x span, the table's z rows, and the
 * y range actually used.
 */
export function archRib(g, table, { ribs = [[8, 9], [21, 22]], over = false } = {}) {
  const w = writer(g, over), zs = Object.keys(table).map(Number).sort((a, b) => a - b);
  let yLo = Infinity, yHi = -Infinity;
  for (const z of zs) {
    const I = table[z];
    let bottom = I, top = I + 2;
    for (const n of [table[z - 1], table[z + 1]]) {
      if (n === undefined) continue;
      if (n > I + 2) top = Math.max(top, n);
      if (n < I - 2) bottom = Math.min(bottom, n + 2);
    }
    yLo = Math.min(yLo, bottom); yHi = Math.max(yHi, top);
    for (let y = bottom; y <= top; y++) for (const [xa, xb] of ribs) for (let x = xa; x <= xb; x++) w.put(x, y, z, y === I ? "red_concrete" : "orange_terracotta");
  }
  const xs = ribs.flat();
  return finish(w, [Math.min(...xs), yLo, zs[0], Math.max(...xs), yHi, zs[zs.length - 1]]);
}

/**
 * Approach bent at row c (its legs and cap run z c-1..c). row: { pedTop, legs: [lo, hi] } from the bent table; the cap
 * is the row above the legs. span: the bridge's west and east leg lines (plan: [8, 22]). Smooth_sandstone pedestals
 * from y 1 to pedTop (x span0-1..span0+2 and span1-2..span1+1, z c-2..c+1), orange_terracotta legs (x span0..+1 and
 * span1-1..span1), a red_concrete cap across the span. Where the legs are taller than one block, a red_terracotta X
 * fills the bay between them (stepped, leg top to leg foot) with a horizontal strut at mid-height. Footprint:
 * span0-1..span1+1, y 1..cap, z c-2..c+1.
 */
export function bent(g, c, row, { span = [8, 22], over = false } = {}) {
  const w = writer(g, over), [a, b] = span, [lo, hi] = row.legs, cap = hi + 1;
  for (const [px0, px1] of [[a - 1, a + 2], [b - 2, b + 1]]) for (let x = px0; x <= px1; x++) for (let z = c - 2; z <= c + 1; z++) for (let y = 1; y <= row.pedTop; y++) w.put(x, y, z, "smooth_sandstone");
  for (const [lx0, lx1] of [[a, a + 1], [b - 1, b]]) for (let x = lx0; x <= lx1; x++) for (let z = c - 1; z <= c; z++) for (let y = lo; y <= hi; y++) w.put(x, y, z, "orange_terracotta");
  for (let x = a; x <= b; x++) for (let z = c - 1; z <= c; z++) w.put(x, cap, z, "red_concrete");
  const H = hi - lo, bayLo = a + 2, bayHi = b - 2;
  if (H > 0) {
    for (let x = bayLo; x <= bayHi; x++) {
      const step = Math.round(((x - bayLo) * H) / (bayHi - bayLo));
      for (let z = c - 1; z <= c; z++) {
        w.put(x, hi - step, z, "red_terracotta");
        w.put(x, lo + step, z, "red_terracotta");
        w.put(x, lo + Math.round(H / 2), z, "red_terracotta");
      }
    }
  }
  return finish(w, [a - 1, 1, c - 2, b + 1, cap, c + 1]);
}
