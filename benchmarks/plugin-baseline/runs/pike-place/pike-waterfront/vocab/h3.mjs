// vocab/h3.mjs: nine helpers from plan.md VOCABULARY: diagBand, shedRoofSlice, doorPair, waveArch, poolRim, ribbon,
// stuccoBlock, shopBay, lanternRow. Coordinates are the KIT frame, absolute, as plan.md writes them (no offset).
//  - Each helper takes its position (and facing where it has one) as arguments and returns { box, placed, skipped }:
//    box = the footprint it may write (inclusive), placed = blocks written, skipped = [x, y, z] cells refused (outside
//    box, outside the grid, or not air unless { overwrite: true }). Nothing outside box is written, so ground, sand and
//    floors an earlier part owns are left alone.
//  - Stairs, slabs, doors and lanterns come from the build library's B helpers (they carry the states).
//  - Ordering: writes are air-only, so a helper that must sit inside a wall another part laid needs { overwrite: true }
//    (shopBay in the landings facade part, after stuccoBlock in the shell part).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Facing vectors, the opposite face, and the left hand of a viewer facing each way (left = up x forward).
const FACE3 = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const LEFT = { north: "west", west: "south", south: "east", east: "north" };

/** A writer for one helper's footprint. Air only unless overwrite; refusals are recorded, never thrown. */
function ctx(g, box, overwrite) { return { g, box, overwrite, placed: 0, skipped: [] }; }
function free(c, x, y, z) {
  const [x0, y0, z0, x1, y1, z1] = c.box;
  const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
  return inside && c.g.inBounds(x, y, z) && (c.overwrite || c.g.isAir(x, y, z));
}
function put(c, x, y, z, entry) {
  if (!free(c, x, y, z)) { c.skipped.push([x, y, z]); return false; }
  const [block, state, nbt] = entry;
  c.g.set(x, y, z, block, state, nbt);
  c.placed++;
  return true;
}
const done = (c) => ({ box: c.box, placed: c.placed, skipped: c.skipped });

/**
 * A gapless 45-degree band: every cell with d = x - z in [d0, d1] and s = x + z in [s0, s1], y0..y1, of block mat.
 * Two consecutive d values make a stair-stepped wall with no gaps.
 */
export function diagBand(g, d0, d1, s0, s1, y0, y1, mat, { overwrite = false } = {}) {
  const box = [Math.floor((d0 + s0) / 2), y0, Math.floor((s0 - d1) / 2), Math.ceil((d1 + s1) / 2), y1, Math.ceil((s1 - d0) / 2)];
  const c = ctx(g, box, overwrite);
  for (let x = box[0]; x <= box[3]; x++) for (let z = box[2]; z <= box[5]; z++) {
    const d = x - z, s = x + z;
    if (d < d0 || d > d1 || s < s0 || s > s1) continue;
    for (let y = y0; y <= y1; y++) put(c, x, y, z, [mat]);
  }
  return done(c);
}

/**
 * One slice of the Pier 59 shed roof at s, over every cell with d = x - z in [-41, -13] (ridge d = -27, e = |d + 27|).
 * Even e: a full deepslate_tiles block at y 25 - e/2. Odd e: the full block at y 25 - (e+1)/2 plus a deepslate_tile_slab
 * (bottom) on top of it. e = 0 also gets the polished_deepslate ridge cap at y 26; e = 14 gets the dark_oak_planks eave
 * fascia at y 17. The verge slices (s 99 and 244) are the barge course: dark_oak in place of the tiles.
 */
export function shedRoofSlice(g, s, { overwrite = false } = {}) {
  const verge = s === 99 || s === 244;
  const tile = verge ? "dark_oak_planks" : "deepslate_tiles";
  const tileSlab = verge ? "dark_oak" : "deepslate_tile";
  const box = [Math.floor((s - 41) / 2), 17, Math.floor((s + 13) / 2), Math.ceil((s - 13) / 2), 26, Math.ceil((s + 41) / 2)];
  const c = ctx(g, box, overwrite);
  for (let d = -41; d <= -13; d++) {
    if ((d - s) % 2 !== 0) continue;   // a cell exists only where d and s have the same parity
    const x = (d + s) / 2, z = (s - d) / 2, e = Math.abs(d + 27);
    if (e % 2 === 0) {
      put(c, x, 25 - e / 2, z, [tile]);
      if (e === 0) put(c, x, 26, z, ["polished_deepslate"]);
      if (e === 14) put(c, x, 17, z, ["dark_oak_planks"]);
    } else {
      put(c, x, 25 - (e + 1) / 2, z, [tile]);
      put(c, x, 25 - (e - 1) / 2, z, B.slab(tileSlab, "bottom"));
    }
  }
  return done(c);
}

/**
 * A double spruce door: a leaf at [x, y, z] and a second leaf one cell along the wall, each lower and upper half.
 * face = the way the doors face (out of the building). Hinges are mirrored so the pair opens outward. All four cells
 * or none: a blocked half leaves the whole pair out.
 */
export function doorPair(g, [x, y, z], face, { overwrite = false } = {}) {
  const across = face === "north" || face === "south";   // the wall runs along x
  const [sx, sz] = across ? [1, 0] : [0, 1];
  const [bx, bz] = [x + sx, z + sz];
  const outward = across ? "west" : "north";             // away from the second leaf
  const hingeA = LEFT[face] === outward ? "left" : "right";
  const hingeB = hingeA === "left" ? "right" : "left";
  const box = [Math.min(x, bx), y, Math.min(z, bz), Math.max(x, bx), y + 1, Math.max(z, bz)];
  const c = ctx(g, box, overwrite);
  const cells = [[x, y, z], [x, y + 1, z], [bx, y, bz], [bx, y + 1, bz]];
  const blocked = cells.filter(([a, b, e]) => !free(c, a, b, e));
  if (blocked.length) { c.skipped.push(...blocked); return done(c); }
  put(c, x, y, z, B.door("spruce", face, "lower", hingeA));
  put(c, x, y + 1, z, B.door("spruce", face, "upper", hingeA));
  put(c, bx, y, bz, B.door("spruce", face, "lower", hingeB));
  put(c, bx, y + 1, bz, B.door("spruce", face, "upper", hingeB));
  return done(c);
}

/**
 * The blue wave arch: a flush panel in the plane x, from z0 to z1 wide and y0 to y1 high. Field light_blue_terracotta;
 * the straight edges and the foot cyan_terracotta; the round top is prismarine_brick_stairs with each full back facing
 * the centre; the two crown cells are a prismarine_bricks keystone.
 */
export function waveArch(g, x, z0, z1, y0, y1, { overwrite = false } = {}) {
  const c = ctx(g, [x, y0, z0, x, y1, z1], overwrite);
  const zc = (z0 + z1 + 1) / 2, hw = (z1 - z0 + 1) / 2, ys = y1 + 1 - hw;   // centre, half-width, springline (continuous)
  const dzOf = (z) => z + 0.5 - zc, dyOf = (y) => y + 0.5 - ys;
  const inside = (z, y) => z >= z0 && z <= z1 && y >= y0 && y <= y1 &&
    Math.abs(dzOf(z)) <= hw && (dyOf(y) <= 0 || dzOf(z) ** 2 + dyOf(y) ** 2 <= hw * hw);
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    if (!inside(z, y)) continue;
    const edge = !inside(z - 1, y) || !inside(z + 1, y) || !inside(z, y - 1) || !inside(z, y + 1);
    if (y === y1 && Math.abs(dzOf(z)) < 1) put(c, x, y, z, ["prismarine_bricks"]);
    else if (edge && dyOf(y) > 0) put(c, x, y, z, B.stairs("prismarine_brick", dzOf(z) < 0 ? "south" : "north", "bottom"));
    else if (edge) put(c, x, y, z, ["cyan_terracotta"]);
    else put(c, x, y, z, ["light_blue_terracotta"]);
  }
  return done(c);
}

/**
 * A raised pool: a smooth_stone ring on the rectangle rect = [x0, z0, x1, z1] (inclusive), y0..y1, with water inside
 * it at the same levels (the water stops at y1, the rim's top).
 */
export function poolRim(g, [x0, z0, x1, z1], y0, y1, { overwrite = false } = {}) {
  const c = ctx(g, [x0, y0, z0, x1, y1, z1], overwrite);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const rim = x === x0 || x === x1 || z === z0 || z === z1;
    for (let y = y0; y <= y1; y++) put(c, x, y, z, rim ? ["smooth_stone"] : ["water"]);
  }
  return done(c);
}

/**
 * A band of light_blue_stained_glass_pane on a face: the plane is z = plane (north/south faces, running along x) or
 * x = plane (east/west faces, running along z), from..to along the face, y0..y1. A warm shroomlight sits one cell
 * inside, behind every 4th pane, on the middle row.
 */
export function ribbon(g, face, plane, from, to, y0, y1, { overwrite = false } = {}) {
  const across = face === "north" || face === "south";
  const inV = FACE3[OPP[face]];                           // from the face toward the inside
  const pl = (d) => plane + d * (across ? inV[2] : inV[0]);
  const at = (a, y, d) => (across ? [a, y, pl(d)] : [pl(d), y, a]);
  const lo = Math.min(from, to), hi = Math.max(from, to), ym = Math.floor((y0 + y1) / 2);
  const p0 = at(lo, y0, 0), p1 = at(hi, y1, 1);
  const c = ctx(g, [Math.min(p0[0], p1[0]), y0, Math.min(p0[2], p1[2]), Math.max(p0[0], p1[0]), y1, Math.max(p0[2], p1[2])], overwrite);
  const run = across ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
  for (let a = lo; a <= hi; a++) {
    for (let y = y0; y <= y1; y++) put(c, ...at(a, y, 0), ["light_blue_stained_glass_pane", run]);
    if ((a - lo) % 4 === 0) put(c, ...at(a, ym, 1), ["shroomlight"]);
  }
  return done(c);
}

/**
 * The stucco shell of a Waterfront Landings block: the outer ring of the rectangle rect = [x0, z0, x1, z1] (inclusive),
 * from its ground up to roofY. floors = [shop floor y, first upper floor y]; plan.md puts the string course at the
 * first upper floor alone, so only those two are read. Brick base from the ground to floors[1] - 1, where the ground
 * of a column is ground(x, z) (default floors[0]; pass the ground-0 strips' value); cut_sandstone_slab (top) string
 * course at floors[1]; smooth_sandstone above it; cut_sandstone cornice at roofY. The cornice is not pushed 1 cell
 * proud, since that cell would fall outside the footprint.
 */
export function stuccoBlock(g, [x0, z0, x1, z1], roofY, floors, { overwrite = false, ground = () => floors[0] } = {}) {
  const [, first] = floors;
  const ring = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) ring.push([x, z]);
  const low = Math.min(...ring.map(([x, z]) => ground(x, z)));
  const c = ctx(g, [x0, low, z0, x1, roofY, z1], overwrite);
  for (const [x, z] of ring) {
    for (let y = ground(x, z); y <= roofY; y++) {
      if (y === roofY) put(c, x, y, z, ["cut_sandstone"]);
      else if (y === first) put(c, x, y, z, B.slab("cut_sandstone", "top"));
      else if (y < first) put(c, x, y, z, ["bricks"]);
      else put(c, x, y, z, ["smooth_sandstone"]);
    }
  }
  return done(c);
}

/**
 * One shop bay on a street face, five cells along the face from pos. plane = the wall's coordinate (x for east/west
 * faces, z for north/south). smooth_quartz piers at both ends, glass y2..4 between them, a spruce_door (y2..3) in the
 * first cell after the left pier, and a shroomlight one cell inside, behind the glass, lighting the shop.
 */
export function shopBay(g, face, plane, pos, { overwrite = false } = {}) {
  const across = face === "north" || face === "south";
  const inV = FACE3[OPP[face]];
  const pl = (d) => plane + d * (across ? inV[2] : inV[0]);
  const at = (a, y, d = 0) => (across ? [pos + a, y, pl(d)] : [pl(d), y, pos + a]);
  const p0 = at(0, 2, 0), p1 = at(4, 4, 1);
  const c = ctx(g, [Math.min(p0[0], p1[0]), 2, Math.min(p0[2], p1[2]), Math.max(p0[0], p1[0]), 4, Math.max(p0[2], p1[2])], overwrite);
  for (let a = 0; a <= 4; a++) for (let y = 2; y <= 4; y++) {
    if (a === 0 || a === 4) put(c, ...at(a, y), ["smooth_quartz"]);
    else if (a === 1 && y <= 3) continue;                 // the door, below
    else put(c, ...at(a, y), ["glass"]);
  }
  const door = [at(1, 2), at(1, 3)];
  if (door.every(([x, y, z]) => free(c, x, y, z))) {
    put(c, ...door[0], B.door("spruce", face, "lower", "left"));
    put(c, ...door[1], B.door("spruce", face, "upper", "left"));
  } else c.skipped.push(...door);
  put(c, ...at(2, 3, 1), ["shroomlight"]);
  return done(c);
}

/**
 * Lanterns on the given [x, y, z] cells. Each hangs from the block above it when there is one; otherwise it stands on
 * the block below. A cell with neither is skipped.
 */
export function lanternRow(g, cells, { overwrite = false } = {}) {
  const xs = cells.map(([x]) => x), ys = cells.map(([, y]) => y), zs = cells.map(([, , z]) => z);
  const c = ctx(g, [Math.min(...xs), Math.min(...ys), Math.min(...zs), Math.max(...xs), Math.max(...ys), Math.max(...zs)], overwrite);
  for (const [x, y, z] of cells) {
    if (!g.isAir(x, y + 1, z)) put(c, x, y, z, B.lantern(true));
    else if (!g.isAir(x, y - 1, z)) put(c, x, y, z, B.lantern(false));
    else c.skipped.push([x, y, z]);
  }
  return done(c);
}
