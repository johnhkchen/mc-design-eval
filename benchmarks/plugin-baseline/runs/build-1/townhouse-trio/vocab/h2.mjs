// Part-2 vocabulary from plan.md (VOCABULARY): partyPilaster, windowDress, stoop, bracketCornice, stairFlight,
// areaRailing, streetTree. Block ids are plan.md's PALETTE literals; nothing here imports vocab.mjs or the other vocab files.
//
// Contract every helper keeps:
// - takes its position (and facing) as arguments; nothing is hard-wired to a spot;
// - writes only inside the box it returns as `box`, and only into air, unless opts.over is true (trim laid onto a
//   finished wall). A cell it may not take is counted in `skipped`, never overwritten, so the caller can see it;
// - never writes ground or floor below its own box (y0 is the lowest cell it owns);
// - returns { cells: [[x,y,z]...], skipped, box }.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const DIR = { south: [0, 1], north: [0, -1] };   // a flight or stoop climbs along z; facing is the way it climbs
const SILL = { cut_sandstone: "smooth_sandstone", smooth_quartz: "quartz" };   // trim -> its slab (A/C vs B)

const result = (box) => ({ cells: [], skipped: 0, box });

// one write: into air only (or over the block when opts.over); records what it placed
function put(g, out, x, y, z, [block, state], over = false) {
  if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) { out.skipped++; return; }
  g.set(x, y, z, block, state);
  out.cells.push([x, y, z]);
}

/**
 * Party-wall trim: cut_sandstone down the front plane (x, z) from y0 to y1. Split the call where the A/C side stops
 * at y=17 (pass y0 18 for the B-only top). Call before the wall, or pass { over: true } on a finished wall.
 */
export function partyPilaster(g, x, z, y0, y1, opts = {}) {
  const out = result([x, y0, z, x, y1, z]);
  for (let y = y0; y <= y1; y++) put(g, out, x, y, z, B.block("cut_sandstone"), opts.over);
  return out;
}

/**
 * Window dressing on the front wall plane z for an opening x..x+w-1, y0..y1 (left as air by the shell):
 * a glass pane fill (connected east-west), a sill slab on the outside row z-1 at y0-1 (top half), and a head of
 * `block` (cut_sandstone or smooth_quartz) at y1+1, one wider each side. The sill slab defaults from the head block
 * (cut_sandstone -> smooth_sandstone_slab, smooth_quartz -> quartz_slab); opts.sill and opts.pane override them.
 * The head is wall: call it before the wall, or pass { over: true }.
 */
export function windowDress(g, x, y0, y1, z, w, block, opts = {}) {
  const sill = opts.sill ?? SILL[block];
  if (!sill) throw new RangeError(`windowDress: no sill for ${block}; pass opts.sill`);
  const out = result([x - 1, y0 - 1, z - 1, x + w, y1 + 1, z]);
  for (let i = 0; i < w; i++) put(g, out, x + i, y0 - 1, z - 1, B.slab(sill, "top"), opts.over);
  for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++)
    put(g, out, x + i, y, z, [opts.pane ?? "glass_pane", { north: "false", south: "false", east: "true", west: "true" }], opts.over);
  for (let i = -1; i <= w; i++) put(g, out, x + i, y1 + 1, z, B.block(block), opts.over);
  return out;
}

/**
 * A stoop: two steps climbing in `facing` (south = toward the house, +z) from z0 and a landing two cells on, all
 * `w` wide from x0 (the landing may be wider: opts.landingX0 / landingX1). Steps are stone_brick_stairs; the step
 * at z0+1 and the landing sit on stone_bricks inside the stoop, so nothing floats. Ground at y0 is never written:
 * the bottom step stands on it (plan: stoop steps at y1 and y2, y0 is the ground).
 */
export function stoop(g, x0, z0, y0, facing, opts = {}) {
  if (!DIR[facing]) throw new RangeError(`stoop: facing must be south or north, got ${facing}`);
  const [, dz] = DIR[facing];
  const w = opts.width ?? 3;
  const lx0 = opts.landingX0 ?? x0, lx1 = opts.landingX1 ?? x0 + w - 1;
  const zs = (i) => z0 + i * dz;
  const out = result([Math.min(x0, lx0), y0, Math.min(z0, zs(2)), Math.max(x0 + w - 1, lx1), y0 + 1, Math.max(z0, zs(2))]);
  const stair = B.stairs("stone_brick", facing, "bottom");
  for (let x = x0; x < x0 + w; x++) {
    put(g, out, x, y0, zs(1), B.block("stone_bricks"), opts.over);
    put(g, out, x, y0, zs(0), stair, opts.over);
    put(g, out, x, y0 + 1, zs(1), stair, opts.over);
  }
  for (let x = lx0; x <= lx1; x++) {
    put(g, out, x, y0, zs(2), B.block("stone_bricks"), opts.over);
    put(g, out, x, y0 + 1, zs(2), B.block("stone_bricks"), opts.over);
  }
  return out;
}

/**
 * Quartz cornice on a front line: upside-down stairs (half top) along x0..x1 at row y, lip toward the street. Brackets
 * are the same stairs one row lower at the columns in opts.brackets (each must lie in x0..x1). `facing` is the way
 * the lip points INTO the wall (south for a cornice on a north-facing front). Call before the wall, or pass { over: true }.
 */
export function bracketCornice(g, x0, x1, z, y, facing, opts = {}) {
  if (!DIR[facing]) throw new RangeError(`bracketCornice: facing must be south or north, got ${facing}`);
  const brackets = opts.brackets ?? [];
  for (const bx of brackets) if (bx < x0 || bx > x1) throw new RangeError(`bracketCornice: bracket x=${bx} outside ${x0}..${x1}`);
  const out = result([x0, y - 1, z, x1, y, z]);
  const top = B.stairs("quartz", facing, "top");
  for (let x = x0; x <= x1; x++) put(g, out, x, y, z, top, opts.over);
  for (const bx of brackets) put(g, out, bx, y - 1, z, top, opts.over);
  return out;
}

/**
 * One flight in a stair well, rising south (+z) from z0 over `steps` cells (default 4): stair i at (x, floorY-steps+i,
 * z0+i), spruce-style `wood` stairs facing south. The top step is the landing at the well's far end. opts.railX puts
 * a fence one column over (the open side) at each step's height +1; leave it out and the well's other column stays clear.
 * floorY is the upper floor's block y (7, 12, 17 in plan.md).
 */
export function stairFlight(g, x, z0, floorY, wood, opts = {}) {
  const n = opts.steps ?? 4, rail = opts.railX;
  const xs = rail == null ? [x] : [x, rail];
  const out = result([Math.min(...xs), floorY - n, z0, Math.max(...xs), floorY - 1 + (rail == null ? 0 : 1), z0 + n - 1]);
  for (let i = 0; i < n; i++) {
    const y = floorY - n + i, z = z0 + i;
    put(g, out, x, y, z, B.stairs(wood, "south", "bottom"), opts.over);
    if (rail != null) put(g, out, rail, y + 1, z, [`${wood}_fence`, { north: "true", south: "true", east: "false", west: "false" }], opts.over);
  }
  return out;
}

/**
 * Iron-bar area railing along x0..x1 at height y in row z (front-garden railings). Bars join their neighbours in the run;
 * a single bar stands as a post.
 */
export function areaRailing(g, x0, x1, y, z, opts = {}) {
  const out = result([x0, y, z, x1, y, z]);
  for (let x = x0; x <= x1; x++)
    put(g, out, x, y, z, ["iron_bars", { north: "false", south: "false", east: String(x < x1), west: String(x > x0) }], opts.over);
  return out;
}

/**
 * A street tree standing on the pavement at (x, z): a 4-high oak trunk from y1 and a crown 5 wide at y4..6 with the
 * top 3 wide at y7, persistent leaves. It writes nothing at y0: the podzol pit under it is the caller's ground step.
 */
export function streetTree(g, x, z) {
  const out = result([x - 2, 1, z - 2, x + 2, 7, z + 2]);
  for (let y = 1; y <= 4; y++) put(g, out, x, y, z, B.log("oak", "y"));
  // [y, radius, corners cut]: the crown; the trunk owns the centre cell at y4 (skipped, not overwritten)
  for (const [y, r, cut] of [[4, 2, true], [5, 2, false], [6, 2, true], [7, 1, true]])
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (cut && Math.abs(dx) === r && Math.abs(dz) === r) continue;
      if (dx === 0 && dz === 0 && y <= 4) continue;
      put(g, out, x + dx, y, z + dz, ["oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" }]);
    }
  return out;
}
