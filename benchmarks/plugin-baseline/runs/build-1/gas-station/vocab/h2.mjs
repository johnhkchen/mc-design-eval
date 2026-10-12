// Vocabulary helpers from plan.md VOCABULARY (second half): canopy_column, asphalt_strip, storefront_bay, mart_letters,
// slot_window, ev_charger, air_station, dumpster_enclosure. Palette ids are literals (no vocab/ imports).
// Every helper takes the grid first, then its position (and any facing), then an optional opts object, and returns
// { placed, skipped, box }: box is the footprint [x0, y0, z0, x1, y1, z1] it may write; skipped counts cells it left
// alone because they were not air (opts.replace: true overwrites them, still inside the footprint).
// Nothing is written outside the footprint, so nothing is ever placed under it (ground, sand, floors stay as they are).
// The grid is the build library's Grid (tools/src/build.mjs, or the guard/runParts view of it): writes go through g.set.

const WHITE_CONCRETE = "white_concrete";
const SMOOTH_QUARTZ = "smooth_quartz";
const GRAY_CONCRETE = "gray_concrete";
const GRAY_CONCRETE_POWDER = "gray_concrete_powder";
const BLACK_CONCRETE = "black_concrete";
const POLISHED_ANDESITE = "polished_andesite";
const LIGHT_BLUE_GLASS_PANE = "light_blue_stained_glass_pane";
const GRAY_GLASS_PANE = "gray_stained_glass_pane";
const IRON_BLOCK = "iron_block";
const LEVER = "lever";

// Blocks a pane does not join to (a pane joins panes, bars and full blocks).
const NOT_FULL = /(door|slab|stairs|trapdoor|lever|lantern|chain|button|pressure_plate|sign|flower_pot|leaves|log|grass|dandelion|azalea)/;

// Write fn(x, y, z) -> [block, state] | null over the box; only into air unless opts.replace.
function paint(g, box, fn, { replace = false } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  let placed = 0, skipped = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    const want = fn(x, y, z);
    if (!want) continue;
    if (!replace && !g.isAir(x, y, z)) { skipped++; continue; }
    g.set(x, y, z, want[0], want[1]);
    placed++;
  }
  return { placed, skipped, box };
}

// Whether the cell at x,y,z joins a pane on that side: another pane or bars, or a full block.
function joins(g, x, y, z) {
  const name = g.blockAt(x, y, z).replace("minecraft:", "");
  if (name === "air" || name === "cave_air" || name === "structure_void") return false;
  return /(_pane|_bars)$/.test(name) || !NOT_FULL.test(name);
}

// Set the connection states of every pane in the box from its neighbours (after the box is written).
function connectPanes(g, box) {
  const [x0, y0, z0, x1, y1, z1] = box;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (!/_pane$/.test(g.blockAt(x, y, z))) continue;
    const state = {
      north: joins(g, x, y, z - 1), south: joins(g, x, y, z + 1),
      east: joins(g, x + 1, y, z), west: joins(g, x - 1, y, z),
    };
    g.set(x, y, z, g.blockAt(x, y, z), state);
  }
}

/** A solid stub from y2 up: polished_andesite base cell, smooth_quartz shaft to y6. (x, z) is the west cell; 2 wide in x. */
export function canopy_column(g, x, z, opts = {}) {
  return paint(g, [x, 2, z, x + 1, 6, z], (_x, y) => (y === 2 ? [POLISHED_ANDESITE] : [SMOOTH_QUARTZ]), opts);
}

/** Matte asphalt strip on the ground layer y0 from (x0, z0) to (x1, z1). Pass { replace: true } to lay it over grass. */
export function asphalt_strip(g, x0, z0, x1, z1, opts = {}) {
  return paint(g, [x0, 0, z0, x1, 0, z1], () => [GRAY_CONCRETE_POWDER], opts);
}

/**
 * Storefront glass on the wall plane z, from x0 to x1, y1..4. mullions: x columns of black_concrete (default 13, 20,
 * kept only where they fall inside x0..x1). open: [[xa, xb], ...] ranges left air for doors and openings.
 */
export function storefront_bay(g, x0, x1, z, { mullions = [13, 20], open = [], ...opts } = {}) {
  const box = [x0, 1, z, x1, 4, z];
  const res = paint(g, box, (x) => {
    if (open.some(([a, b]) => x >= a && x <= b)) return null;
    if (mullions.includes(x)) return [BLACK_CONCRETE];
    return [LIGHT_BLUE_GLASS_PANE];
  }, opts);
  connectPanes(g, box);
  return res;
}

// Two-high letter tiles (2 wide). Top row first; "X" is white_concrete, "." is left as it is. A notch in the lower
// cell tells A and R apart; 2x2 tiles cannot spell MART legibly, so the sign band needs a taller design.
const MART = [["M", ["XX", "XX"]], ["A", ["XX", "X."]], ["R", ["XX", ".X"]], ["T", ["XX", ".."]]];
const MART_STARTS = [0, 3, 6, 8]; // gaps of 1, 1, 0: the four letters fit x..x+9 (x12..21 for x = 12)

/** The MART sign on the red fascia: letters start at (x, y, z), y and y+1 high, spanning x..x+9. */
export function mart_letters(g, x, y, z, opts = {}) {
  const box = [x, y, z, x + 9, y + 1, z];
  return paint(g, box, (xx, yy) => {
    const i = MART_STARTS.findLastIndex((s) => xx >= x + s);
    const col = xx - (x + MART_STARTS[i]);
    if (col > 1) return null;
    const row = yy === y + 1 ? MART[i][1][0] : MART[i][1][1];
    return row[col] === "X" ? [WHITE_CONCRETE] : null;
  }, opts);
}

/**
 * Recessed service slot window on the wall at z: recess cell (x, 2..6, z) is left as the shell's air; glass is set one
 * cell in (z + 1); black_concrete frames sit beside the recess in the wall (x - 1 and x + 1, at z). The frames replace
 * wall cells, so call with { replace: true } once the shell has built the service front.
 */
export function slot_window(g, x, z, opts = {}) {
  const box = [x - 1, 2, z, x + 1, 6, z + 1];
  const res = paint(g, box, (xx, y, zz) => {
    if (zz === z + 1 && xx === x) return [GRAY_GLASS_PANE];
    if (zz === z && xx !== x) return [BLACK_CONCRETE];
    return null;
  }, opts);
  connectPanes(g, box);
  return res;
}

/** EV charger post at (x, z): white_concrete base y1, black_concrete head y2, a floor lever on top at y3. */
export function ev_charger(g, x, z, opts = {}) {
  return paint(g, [x, 1, z, x, 3, z], (_x, y) => {
    if (y === 1) return [WHITE_CONCRETE];
    if (y === 2) return [BLACK_CONCRETE];
    return [LEVER, { face: "floor", facing: "north", powered: "false" }];
  }, opts);
}

/** Air/water station at (x, z), 2 wide in x: a polished_andesite plinth y1, an iron_block post at (x, 2, z), a wall lever on it. */
export function air_station(g, x, z, opts = {}) {
  return paint(g, [x, 1, z, x + 1, 2, z], (xx, y) => {
    if (y === 1) return [POLISHED_ANDESITE];
    if (xx === x) return [IRON_BLOCK];
    return [LEVER, { face: "wall", facing: "east", powered: "false" }];
  }, opts);
}

/**
 * Three-sided dumpster enclosure over x0..x1, z0..z1 (y1..2): gray_concrete walls on the north, south and east sides,
 * open on the west (x0). Inside, a 3-wide dumpster body (iron_block, black_concrete lid) sits against the back wall and
 * leaves the front row clear. Pass { replace: true } to build over existing walls.
 */
export function dumpster_enclosure(g, x0, z0, x1, z1, opts = {}) {
  const box = [x0, 1, z0, x1, 2, z1];
  return paint(g, box, (x, y, z) => {
    if (x === x0) return null;
    if (z === z0 || z === z1 || x === x1) return [GRAY_CONCRETE];
    if (z <= z1 - 2) return y === 1 ? [IRON_BLOCK] : [BLACK_CONCRETE];
    return null;
  }, opts);
}
