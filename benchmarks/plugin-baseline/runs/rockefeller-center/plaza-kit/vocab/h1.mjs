// Landscape vocabulary, part 1: ground column, road crosswalk, well wall, stair-head planter, umbrella, Prometheus
// wall, basin, statue, pool, bench. Every helper takes the grid first, then its position; each returns
// { box, placed, refused } where box is the footprint it was given. Writes go into air only, except where a
// helper replaces its own floor or surface cell (named in its options); a write into anything else is refused.
import { B, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SOURCE = { level: "0" };
const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
const SLAB = { type: "bottom", waterlogged: "false" };
const isBlock = (id) => (b) => b === `minecraft:${id}`;

const newResult = (box) => ({ box, placed: 0, refused: [] });

// The one write path. Air is always writable; anything else only where overwrite (true, or a predicate on the
// block there) allows it; soft skips an occupied cell without counting it as refused.
function put(g, x, y, z, block, state, { overwrite, soft } = {}) {
  if (!g.inBounds(x, y, z)) throw new Error(`${block} at ${x},${y},${z} is outside the grid ${g.size}`);
  if (g.isAir(x, y, z)) { g.set(x, y, z, block, state); return "placed"; }
  if (soft) return "skipped";
  const have = g.blockAt(x, y, z);
  if (overwrite === true || (typeof overwrite === "function" && overwrite(have))) { g.set(x, y, z, block, state); return "placed"; }
  return "refused";
}

function place(g, res, x, y, z, block, state, opts) {
  const r = put(g, x, y, z, block, state, opts);
  if (r === "placed") res.placed++;
  else if (r === "refused") res.refused.push([x, y, z, block]);
}

// Highest non-air y in the column, or -1.
function topSolid(g, x, z) {
  for (let y = g.size[1] - 1; y >= 0; y--) if (!g.isAir(x, y, z)) return y;
  return -1;
}

/** Ground column at (x, z): stone from y 0 to h-1, the surface block at h. Writes that column only. */
export function groundColumn(g, x, z, h, { surface = "smooth_stone", overwrite } = {}) {
  const res = newResult([x, 0, z, x, h, z]);
  for (let y = 0; y < h; y++) place(g, res, x, y, z, "stone", null, { overwrite });
  place(g, res, x, h, z, surface, null, { overwrite });
  return res;
}

/**
 * Stripes across a road strip, z0..z1 (x0..x1): smooth_stone on every other x, on the road's top block. Only that
 * top block is replaced, and only where it is road; any other cell is left alone.
 */
export function crosswalk(g, z0, z1, { x0 = 4, x1 = 12, stripe = "smooth_stone", road = "gray_concrete" } = {}) {
  const res = newResult([x0, 0, z0, x1, 0, z1]);
  let lo = Infinity, hi = -Infinity;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const y = topSolid(g, x, z);
    if (y < 0) continue;
    lo = Math.min(lo, y); hi = Math.max(hi, y);
    if ((x - x0) % 2 === 0) place(g, res, x, y, z, stripe, null, { overwrite: isBlock(road) });
  }
  if (hi >= 0) { res.box[1] = lo; res.box[4] = hi; }
  return res;
}

/** Retaining wall on the perimeter of x0..x1 by z0..z1: polished_andesite from base to top-1, a smooth_stone cap at top. */
export function wellWall(g, x0, z0, x1, z1, { base = 0, top = 4, wall = "polished_andesite", cap = "smooth_stone" } = {}) {
  const res = newResult([x0, base, z0, x1, top, z1]);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x > x0 && x < x1 && z > z0 && z < z1) continue;
    for (let y = base; y < top; y++) place(g, res, x, y, z, wall);
    place(g, res, x, top, z, cap);
  }
  return res;
}

/**
 * Stair-head planter, 3x3 at (x0, z0): a polished_blackstone curb ring at y = base (default 5), a grass_block soil
 * cell in the middle, and a clipped shrub (azalea leaves) on it at base+1 and base+2.
 */
export function planterBox(g, x0, z0, { base = 5 } = {}) {
  const x1 = x0 + 2, z1 = z0 + 2;
  const res = newResult([x0, base, z0, x1, base + 2, z1]);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x === x0 || x === x1 || z === z0 || z === z1) place(g, res, x, base, z, "polished_blackstone");
    else {
      place(g, res, x, base, z, "grass_block");
      place(g, res, x, base + 1, z, "azalea_leaves", LEAF);
      place(g, res, x, base + 2, z, "flowering_azalea_leaves", LEAF);
    }
  }
  return res;
}

/**
 * Umbrella centred on (x, z): birch_fence pole at base and base+1 (default 1), a 3x3 white_wool canopy at base+2,
 * and a hanging lantern under the canopy's corner at base+1. The 2-high lane past the pole stays air.
 */
export function umbrella(g, x, z, { base = 1 } = {}) {
  const res = newResult([x - 1, base, z - 1, x + 1, base + 2, z + 1]);
  for (let y = base; y <= base + 1; y++) place(g, res, x, y, z, "birch_fence");
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) place(g, res, x + dx, base + 2, z + dz, "white_wool");
  place(g, res, x - 1, base + 1, z - 1, "lantern", { hanging: "true", waterlogged: "false" });
  return res;
}

/**
 * Prometheus back wall: x0..x1 by z0..z1, base (y 0) polished_blackstone, top course polished_blackstone_bricks,
 * body polished_blackstone_bricks with deepslate_tiles panels. The east face (x1) keeps the zodiac ring cells
 * (radius 4.5 about the wall's centre) and the inscription cells at top-1 air for the ornament parts.
 */
export function darkWall(g, x0, z0, x1, z1, { base = 0, top = 10 } = {}) {
  const res = newResult([x0, base, z0, x1, top, z1]);
  const cy = (base + 1 + top) / 2, cz = (z0 + z1) / 2;
  const reserved = (x, y, z) => x === x1 && (
    Math.abs(Math.hypot(y - cy, z - cz) - 4.5) <= 0.5 ||
    (y === top - 1 && ((z >= z0 + 1 && z <= z0 + 4) || (z >= z1 - 4 && z <= z1 - 1))));
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = base; y <= top; y++) {
    if (reserved(x, y, z)) continue;
    if (y === base) place(g, res, x, y, z, "polished_blackstone");
    else if (y === top) place(g, res, x, y, z, "polished_blackstone_bricks");
    else if (y >= base + 2 && y <= top - 2 && ((z - z0) % 6 === 1 || (z - z0) % 6 === 2)) place(g, res, x, y, z, "deepslate_tiles");
    else place(g, res, x, y, z, "polished_blackstone_bricks");
  }
  return res;
}

/**
 * Fountain basin x0..x1 by z0..z1: polished_blackstone floor at y 0 (replacing only the well's surface block there),
 * water sources at y 1 except over the statue's mount (mount = [z0, z1] of it), a dark rim at x1+1 (blackstone y 1,
 * slab cap y 2), and cascade ledges on x0 (slab at y 5, water source on it at y 6) for each [za, zb] in cascades.
 */
export function basin(g, { x0 = 20, x1 = 22, z0 = 20, z1 = 35, mount = [26, 29], cascades = [[20, 23], [32, 35]] } = {}) {
  const res = newResult([x0, 0, z0, x1 + 1, 6, z1]);
  const onMount = (z) => z >= mount[0] && z <= mount[1];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    place(g, res, x, 0, z, "polished_blackstone", null, { overwrite: true });
    if (!onMount(z)) place(g, res, x, 1, z, "water", SOURCE);
  }
  for (let z = z0; z <= z1; z++) {
    place(g, res, x1 + 1, 1, z, "polished_blackstone");
    place(g, res, x1 + 1, 2, z, "polished_blackstone_slab", SLAB);
  }
  for (const [za, zb] of cascades) for (let z = za; z <= zb; z++) {
    place(g, res, x0, 5, z, "polished_blackstone_slab", SLAB);
    place(g, res, x0, 6, z, "water", SOURCE);
  }
  return res;
}

/**
 * Prometheus statue on the basin: x0..x0+2 by z0..z0+7, from base (y 1). Gilded mount (stepped gold_block cone at
 * base..base+3 on z0+2..z0+5), flying body along z (gold_block at base+4..base+5, z0+1..z0+6, raw_gold_block shadow
 * on the outer edges of the top course, yellow_terracotta on the head), raised arm at z0+6..z0+7 and a shroomlight
 * fire at base+8. The gold ring stands in the plane x0+1, centred at (base+4.5, z0+3.5), radius 3.5; it fills only air.
 */
export function prometheus(g, x0, z0, { base = 1 } = {}) {
  const res = newResult([x0, base, z0, x0 + 2, base + 8, z0 + 7]);
  const gold = "gold_block";
  // mount: stepped cone
  for (let x = x0; x <= x0 + 2; x++) for (let z = z0 + 2; z <= z0 + 5; z++) place(g, res, x, base, z, gold);
  for (let x = x0; x <= x0 + 2; x++) for (let z = z0 + 3; z <= z0 + 4; z++) place(g, res, x, base + 1, z, gold);
  for (let z = z0 + 3; z <= z0 + 4; z++) place(g, res, x0 + 1, base + 2, z, gold);
  place(g, res, x0 + 1, base + 3, z0 + 3, gold);
  // body along z
  for (let x = x0; x <= x0 + 2; x++) for (let z = z0 + 1; z <= z0 + 6; z++) {
    const head = x === x0 + 2 && z === z0 + 6;
    place(g, res, x, base + 4, z, head ? "yellow_terracotta" : gold);
    place(g, res, x, base + 5, z, x === x0 || x === x0 + 2 ? "raw_gold_block" : gold);
  }
  // raised arm and fire
  place(g, res, x0 + 1, base + 6, z0 + 6, gold);
  place(g, res, x0 + 1, base + 7, z0 + 6, gold);
  place(g, res, x0 + 1, base + 7, z0 + 7, gold);
  place(g, res, x0 + 1, base + 8, z0 + 7, "shroomlight");
  // gold ring, air only
  const cy = base + 4.5, cz = z0 + 3.5;
  for (let y = base + 1; y <= base + 8; y++) for (let z = z0; z <= z0 + 7; z++) {
    if (Math.abs(Math.hypot(y - cy, z - cz) - 3.5) <= 0.5) place(g, res, x0 + 1, y, z, gold, null, { soft: true });
  }
  return res;
}

/**
 * Pool 6 long by 4 wide, from (x0, z0), floor at gy (prismarine_bricks, replacing the surface there only).
 * Rim polished_andesite at gy+1 on the outer ring; still water source at gy+1 inside (4 x 2).
 */
export function pool(g, x0, z0, gy) {
  const x1 = x0 + 5, z1 = z0 + 3;
  const res = newResult([x0, gy, z0, x1, gy + 1, z1]);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    place(g, res, x, gy, z, "prismarine_bricks", null, { overwrite: true });
    const rim = x === x0 || x === x1 || z === z0 || z === z1;
    if (rim) place(g, res, x, gy + 1, z, "polished_andesite");
    else place(g, res, x, gy + 1, z, "water", SOURCE);
  }
  return res;
}

/**
 * One bench at (x, z): a polished_andesite stair on the walk, its full-height back toward the curb. `facing` is the
 * way the sitter faces, so the stair's facing is the opposite. y defaults to one above the top block of the column.
 */
export function bench(g, x, z, facing, { y, material = "polished_andesite" } = {}) {
  const base = y ?? topSolid(g, x, z) + 1;
  if (base < 1) throw new Error(`bench at ${x},${z}: no ground under it`);
  const res = newResult([x, base, z, x, base, z]);
  const [block, state] = B.stairs(material, OPPOSITE[facing], "bottom");
  place(g, res, x, base, z, block, state);
  return res;
}
