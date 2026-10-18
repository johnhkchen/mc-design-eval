// Sears Modern Homes row: vocabulary helpers, set 2 (plan.md VOCABULARY).
// Every helper takes absolute coordinates and returns { box, placed, refused }: box is the footprint it may write
// inside, and placed counts the cells it wrote. Writes go into air only, never at y0 (ground), and never outside the
// box. A cell another part already built is refused and counted, not overwritten. The one exception is a frame
// option (windowTriple) that lets trim replace the wall body; it is off unless the caller passes frame: true.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const inside = ([x0, y0, z0, x1, y1, z1], x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

/** Writer for one footprint: put(x, y, z, block, state, over) writes only inside box, never at y0, and only into air
 *  unless over is true. */
function writer(g, box) {
  const w = { placed: 0, refused: 0 };
  w.put = (x, y, z, block, state, over = false) => {
    const ok = inside(box, x, y, z) && y >= 1 && g.inBounds(x, y, z) && (over || g.isAir(x, y, z));
    if (!ok) { w.refused++; return false; }
    g.set(x, y, z, block, state);
    w.placed++;
    return true;
  };
  return w;
}
const done = (w, box) => ({ box, placed: w.placed, refused: w.refused });

/** Hedge along the back of a plot: persistent oak_leaves at y1, back row z (default 24), sides two deep (z-2..z-1). */
export function hedge(g, { x0, w = 16, z = 24 }) {
  const box = [x0, 1, z - 2, x0 + w - 1, 1, z];
  const p = writer(g, box);
  const leaf = { persistent: "true", distance: "1", waterlogged: "false" };
  for (let x = x0; x < x0 + w; x++) p.put(x, 1, z, "oak_leaves", leaf);
  for (const x of [x0, x0 + w - 1]) for (const zz of [z - 2, z - 1]) p.put(x, 1, zz, "oak_leaves", leaf);
  return done(p, box);
}

/** A 3-wide window (plain panes, 2 tall) with its first pane at x,y,z. face is the way the wall looks: north and south
 *  run the window along x, east and west along z. frame: true also sets the trim sill (top slab, y-1) and the lintel
 *  (trim block, y+2), one cell past each side; it may replace wall body, which is why it is opt-in. */
export function windowTriple(g, { x, y, z, face = "north", trim = "smooth_quartz", trimSlab = `${trim}_slab`, frame = false }) {
  const [ax, az] = face === "east" || face === "west" ? [0, 1] : [1, 0];
  const e = frame ? [-1, 3] : [0, 2];
  const box = [
    Math.min(x + ax * e[0], x + ax * e[1]), y - (frame ? 1 : 0), Math.min(z + az * e[0], z + az * e[1]),
    Math.max(x + ax * e[0], x + ax * e[1]), y + (frame ? 2 : 1), Math.max(z + az * e[0], z + az * e[1]),
  ];
  const p = writer(g, box);
  const pane = ax ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
  for (let i = 0; i < 3; i++) for (let dy = 0; dy < 2; dy++) p.put(x + ax * i, y + dy, z + az * i, "glass_pane", pane);
  if (frame) {
    for (let i = -1; i <= 3; i++) {
      p.put(x + ax * i, y - 1, z + az * i, trimSlab, { type: "top" }, true);
      p.put(x + ax * i, y + 2, z + az * i, trim, undefined, true);
    }
  }
  return done(p, box);
}

/** Magnolia-style full-height portico on the front plane z0: smooth_quartz deck at y1, quartz_pillar columns at x0, x0+2,
 *  x1-2, x1 (y2..8), entablature at y9, and the pediment at z0: tympanum at y10..11, rakes of rake stairs to a two-cell
 *  peak at x0+3..x1-3, y12. Depth z0..z1. */
export function portico(g, { x0, x1, z0, z1, deck = "smooth_quartz", column = "quartz_pillar", trim = "smooth_quartz", rake = "quartz" }) {
  const box = [x0, 1, z0, x1, 12, z1];
  const p = writer(g, box);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) p.put(x, 1, z, deck);
  for (const x of new Set([x0, x0 + 2, x1 - 2, x1])) for (let y = 2; y <= 8; y++) p.put(x, y, z0, column, { axis: "y" });
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) p.put(x, 9, z, trim);
  for (let x = x0 + 2; x <= x1 - 2; x++) p.put(x, 10, z0, trim);
  for (let x = x0 + 3; x <= x1 - 3; x++) p.put(x, 11, z0, trim);
  p.put(x0 + 1, 10, z0, ...B.stairs(rake, "east", "bottom"));
  p.put(x1 - 1, 10, z0, ...B.stairs(rake, "west", "bottom"));
  p.put(x0 + 2, 11, z0, ...B.stairs(rake, "east", "bottom"));
  p.put(x1 - 2, 11, z0, ...B.stairs(rake, "west", "bottom"));
  for (let x = x0 + 3; x <= x1 - 3; x++) p.put(x, 12, z0, trim);
  return done(p, box);
}

/** A tapered pier at x,z: stone at y2..3, a fence post at y4 (the taper), a stripped log beam at y5 running along x from
 *  x to beamTo (default: just its own cell). The cell under the pier (y1) belongs to the porch deck and is not written. */
export function taperedPier(g, { x, z, beamTo = x, stone = "cobblestone", post = "spruce", beam = "stripped_spruce" }) {
  const lo = Math.min(x, beamTo), hi = Math.max(x, beamTo);
  const box = [lo, 2, z, hi, 5, z];
  const p = writer(g, box);
  p.put(x, 2, z, stone);
  p.put(x, 3, z, stone);
  p.put(x, 4, z, ...B.fence(post));
  for (let bx = lo; bx <= hi; bx++) p.put(bx, 5, z, ...B.log(beam, "x"));
  return done(p, box);
}

/** A 1-storey porch on the front row z0 (deck to z1): quartz columns at x0, x0+3, x1-3, x1 (y2..4) on bricks piers at y1,
 *  a full-width frieze at y5, and a deck at y1 under the rest. Piers go first so the deck skips their cells. */
export function squarePorch(g, { x0, x1, z0, z1, column = "smooth_quartz", pier = "bricks", frieze = "smooth_quartz", deck = "oak_planks" }) {
  const box = [x0, 1, z0, x1, 5, z1];
  const p = writer(g, box);
  for (const c of new Set([x0, x0 + 3, x1 - 3, x1])) {
    p.put(c, 1, z0, pier);
    for (let y = 2; y <= 4; y++) p.put(c, y, z0, column);
  }
  for (let x = x0; x <= x1; x++) p.put(x, 5, z0, frieze);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) p.put(x, 1, z, deck);
  return done(p, box);
}

/** Foundation planting on the lawn in row z, from x0 to x1, at y1 on grass only. skip: [[xa, xb], ...] ranges of walk and
 *  ramp cells that get no plant. Plants cycle through the list. */
export function foundationPlanting(g, { x0, x1, z, skip = [], plants = ["azalea", "poppy", "flowering_azalea", "allium"] }) {
  const box = [x0, 1, z, x1, 1, z];
  const p = writer(g, box);
  let n = 0;
  for (let x = x0; x <= x1; x++) {
    if (skip.some(([a, b]) => x >= a && x <= b)) continue;
    if (g.blockAt(x, 0, z) !== "minecraft:grass_block") continue;
    if (p.put(x, 1, z, plants[n % plants.length])) n++;
  }
  return done(p, box);
}

/** Parlour furniture in a 3 x 3 footprint from its north-west corner (x0, z0): bookshelf (at most one, shelf true) in the
 *  corner, a spruce fence table with a pressure plate top at the middle, and two stair chairs facing it. The south row and
 *  the east column past the table stay clear at y2..3. Fits the smallest parlour in ROOMS (P5, x84..86 z15..17). The
 *  floor layer is floorY (default 1); the furniture stands on it. */
export function parlourSet(g, { x0, z0, floorY = 1, wood = "spruce", shelf = true }) {
  const y = floorY + 1, box = [x0, y, z0, x0 + 2, y + 1, z0 + 2];
  const p = writer(g, box);
  if (shelf) p.put(x0, y, z0, "bookshelf");
  p.put(x0 + 1, y, z0 + 1, ...B.fence(wood));
  p.put(x0 + 1, y + 1, z0 + 1, `${wood}_pressure_plate`, { powered: "false" });
  p.put(x0 + 1, y, z0, ...B.stairs(wood, "south", "bottom"));
  p.put(x0 + 2, y, z0 + 1, ...B.stairs(wood, "west", "bottom"));
  return done(p, box);
}

/** The shed dormer front and cheeks: a front wall of body at zFront (trim on its top row, openings left as air), and
 *  cheeks of body at x0 and x1 one cell back, into the house (face north: depth +z). The dormer's roof is not built here;
 *  the roof tool's dormers option builds it. */
export function dormerShed(g, { x0, x1, zFront, y0, y1, face = "north", body = "birch_planks", trim = "smooth_quartz", openings = [] }) {
  const zBack = zFront + (face === "south" ? -1 : 1);
  const box = [x0, y0, Math.min(zFront, zBack), x1, y1, Math.max(zFront, zBack)];
  const p = writer(g, box);
  const open = (x, y) => openings.some((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) if (!open(x, y)) p.put(x, y, zFront, y === y1 ? trim : body);
    for (const x of [x0, x1]) p.put(x, y, zBack, body);
  }
  return done(p, box);
}
