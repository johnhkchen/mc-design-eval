// Sears Modern Homes row: vocabulary helpers, set 1 (plan.md VOCABULARY): lawn, windowPair, windowBox, arcadeBay,
// dormerGable, gablePorch, porchLantern, diningSet. Same contract as set 2 (h2.mjs): every helper takes absolute
// coordinates and returns { box, placed, refused }: box is the footprint it may write inside, placed counts the cells it
// wrote. Writes go into air only, never outside the box, and never at y0 (ground) except lawn, which is the ground. A
// cell another part already built is refused and counted, not overwritten; the same block already there is left alone.
// Options that may replace solid cells are named (frame, over) and off unless the caller passes them.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const qid = (b) => (b.includes(":") ? b : `minecraft:${b}`);
const stateKey = (s = {}) => JSON.stringify(Object.entries(s).map(([k, v]) => [k, String(v)]).sort());
const inside = ([x0, y0, z0, x1, y1, z1], x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

/** Writer for one footprint. put(x, y, z, block, state, over) writes only inside box, at y >= minY, into air unless over is
 *  true; a cell already holding the same block and state is left alone; anything else is refused and counted. free(x, y,
 *  z) says whether put would write there, without counting a refusal. */
function writer(g, box, minY = 1) {
  const w = { placed: 0, refused: 0 };
  const ok = (x, y, z) => inside(box, x, y, z) && y >= minY && g.inBounds(x, y, z);
  w.free = (x, y, z) => ok(x, y, z) && g.isAir(x, y, z);
  w.put = (x, y, z, block, state, over = false) => {
    if (!ok(x, y, z)) { w.refused++; return false; }
    const cur = g.get(x, y, z);
    if (cur && cur.block === qid(block) && stateKey(cur.state) === stateKey(state)) return true;
    if (!over && !g.isAir(x, y, z)) { w.refused++; return false; }
    g.set(x, y, z, block, state);
    w.placed++;
    return true;
  };
  return w;
}
const done = (w, box) => ({ box, placed: w.placed, refused: w.refused });

const POTS = ["potted_poppy", "potted_dandelion"];

/** The lawn of plot `plot` (x 16·plot .. 16·plot+15): gravel at y0 z0..2 and smooth_stone at y0 z3..4 (the street), and
 *  grass_block at y0 z5..24, with coarse_dirt or podzol on about 1 cell in 12 of the back yard (z21..24, by the hedge).
 *  The one helper that writes at y0, since it is the ground itself. Lay the walk and ramp first: the lawn only writes
 *  into air, so it leaves their cells alone. */
export function lawn(g, plot) {
  const x0 = 16 * plot, x1 = x0 + 15, box = [x0, 0, 0, x1, 0, 24];
  const p = writer(g, box, 0);
  for (let x = x0; x <= x1; x++) for (let z = 0; z <= 24; z++) {
    const patch = z >= 21 && (7 * x + 5 * z) % 12 === 0;
    const block = z <= 2 ? "gravel" : z <= 4 ? "smooth_stone" : !patch ? "grass_block" : (x + z) % 2 ? "podzol" : "coarse_dirt";
    p.put(x, 0, z, block);
  }
  return done(p, box);
}

/** A two-pane window (glass_pane, 2 wide x 2 tall) in the wall plane, its lower-left pane at x,y,z. face is the way the wall
 *  looks: north and south run the window along x, east and west along z. frame: true also lays the sill (top slab, y-1) and
 *  the lintel (trim block, y+2), one cell past each side; they replace wall body, which is why it is opt-in. */
export function windowPair(g, { x, y, z, face = "north", trim = "smooth_quartz", trimSlab = `${trim}_slab`, frame = false }) {
  const [ax, az] = face === "east" || face === "west" ? [0, 1] : [1, 0];
  const e = frame ? [-1, 2] : [0, 1];
  const box = [
    Math.min(x + ax * e[0], x + ax * e[1]), y - (frame ? 1 : 0), Math.min(z + az * e[0], z + az * e[1]),
    Math.max(x + ax * e[0], x + ax * e[1]), y + (frame ? 2 : 1), Math.max(z + az * e[0], z + az * e[1]),
  ];
  const p = writer(g, box);
  const pane = ax ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
  for (let i = 0; i < 2; i++) for (let dy = 0; dy < 2; dy++) p.put(x + ax * i, y + dy, z + az * i, "glass_pane", pane);
  if (frame) {
    for (let i = -1; i <= 2; i++) {
      p.put(x + ax * i, y - 1, z + az * i, trimSlab, { type: "top" }, true);
      p.put(x + ax * i, y + 2, z + az * i, trim, undefined, true);
    }
  }
  return done(p, box);
}

/** A window box under a pane pair's sill, on the outside: w top slabs (spruce) one cell out from the wall at y-1, under the
 *  sill, with a potted flower on each at y. A pot needs a sturdy top face, so the ledge is a top slab and never a bottom
 *  one. The spec's closed spruce trapdoor cannot carry a pot and is not used. Runs along the wall from x,z; face is the
 *  way the wall looks (north: the box sits on the -z side). */
export function windowBox(g, { x, y, z, w = 2, face = "north" }) {
  const OUT = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  const [ox, oz] = OUT[face];
  const ew = face === "east" || face === "west";
  const box = ew ? [x + ox, y - 1, z, x + ox, y, z + w - 1] : [x, y - 1, z + oz, x + w - 1, y, z + oz];
  const p = writer(g, box);
  for (let i = 0; i < w; i++) {
    const [cx, cz] = ew ? [x + ox, z + i] : [x + i, z + oz];
    p.put(cx, y - 1, cz, "spruce_slab", { type: "top", waterlogged: "false" });
    p.put(cx, y, cz, POTS[i % POTS.length]);
  }
  return done(p, box);
}

/** One bay of an arcade on the front plane z: white_terracotta piers at x0 and x1 (y..y+2), a 2-wide opening between them
 *  clear at y..y+1, and upside-down brick_stairs over the two opening cells at y+2 (the brick span, each stair's back against
 *  its pier). Three bays share piers: call it for x0..x1 = 19..22, 22..25, 25..28; a shared pier is left alone. */
export function arcadeBay(g, { x0, x1, z, y = 2 }) {
  if (x1 - x0 !== 3) throw new Error(`arcadeBay: the opening must be 2 wide, x${x0}..${x1} is ${x1 - x0 - 1}`);
  const box = [x0, y, z, x1, y + 2, z];
  const p = writer(g, box);
  for (const px of [x0, x1]) for (let dy = 0; dy <= 2; dy++) p.put(px, y + dy, z, "white_terracotta");
  p.put(x0 + 1, y + 2, z, ...B.stairs("brick", "west", "top"));
  p.put(x1 - 1, y + 2, z, ...B.stairs("brick", "east", "top"));
  return done(p, box);
}

/** A front-gabled dormer with its front on zFront, depth +z (3 cells), x0..x1 wide (even width), rising from y0 to its peak
 *  y1 = y0 + 2 + half the width. The cheeks and the solid under the roof are body; the roof is two slopes of trim stairs (the
 *  outer course is the verge) and the gable front is body. The window opening (x0+1..x1-1, y0+1..y0+2 on zFront) is left
 *  air for the fittings to glaze. Air only, so the roof tool's cells stay as they are. */
export function dormerGable(g, { x0, x1, zFront, y0, y1, trim = "birch", body = "lime_terracotta" }) {
  const half = (x1 - x0) / 2, peak = y0 + 2 + half, cx = (x0 + x1) / 2;
  if (!Number.isInteger(half) || y1 !== peak) throw new Error(`dormerGable: x${x0}..${x1} needs y1 ${peak}, got ${y1}`);
  const box = [x0, y0, zFront, x1, y1, zFront + 2];
  const p = writer(g, box);
  const opening = (x, y, z) => z === zFront && x > x0 && x < x1 && y >= y0 + 1 && y <= y0 + 2;
  for (let x = x0; x <= x1; x++) {
    const n = Math.min(x - x0, x1 - x), slope = n < half;
    for (let z = zFront; z <= zFront + 2; z++) {
      if (slope) p.put(x, y0 + 2 + n, z, ...B.stairs(trim, x < cx ? "east" : "west", "bottom"));
      for (let y = y0; y <= (slope ? y0 + 1 + n : peak); y++) if (!opening(x, y, z) && p.free(x, y, z)) p.put(x, y, z, body);
    }
  }
  return done(p, box);
}

/** A small gabled entry porch in front of a door: front plane z0, depth to z1, x0..x1 wide (even). A deck at y1 (x0..x1,
 *  z0..z1), two posts (column, axis y) at x0 and x1 on z0 (y2..4), the eave at y5 and a gable of stairs rising to a ridge at
 *  y = 5 + half the width. The gable front (z0) is infill, the outer course of each slope is the verge, and the underside of
 *  the roof is solid. */
export function gablePorch(g, { x0, x1, z0, z1, deck = "oak_planks", column = "stripped_birch", roof = "spruce", verge = "birch", infill = "smooth_sandstone" }) {
  const half = (x1 - x0) / 2, cx = x0 + half, ridge = 5 + half;
  if (!Number.isInteger(half)) throw new Error(`gablePorch: x${x0}..${x1} must be an even width`);
  const box = [x0, 1, z0, x1, ridge, z1];
  const p = writer(g, box);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) p.put(x, 1, z, deck);
  for (const x of [x0, x1]) for (let y = 2; y <= 4; y++) p.put(x, y, z0, ...B.log(column, "y"));
  for (let n = 0; n < half; n++) for (let z = z0; z <= z1; z++) {
    const mat = n === 0 ? verge : roof;
    p.put(x0 + n, 5 + n, z, ...B.stairs(mat, "east", "bottom"));
    p.put(x1 - n, 5 + n, z, ...B.stairs(mat, "west", "bottom"));
  }
  for (let z = z0; z <= z1; z++) p.put(cx, ridge, z, `${roof}_planks`);
  for (let k = 0; k < half; k++) for (let x = cx - (half - 1 - k); x <= cx + (half - 1 - k); x++) p.put(x, 5 + k, z0, infill);
  for (let x = x0 + 1; x <= x1 - 1; x++) for (let z = z0; z <= z1; z++) {
    const n = Math.min(x - x0, x1 - x), top = n < half ? 5 + n : ridge;
    for (let y = 5; y < top; y++) if (p.free(x, y, z)) p.put(x, y, z, `${roof}_planks`);
  }
  return done(p, box);
}

/** A lantern hanging from the block above it, at x,y,z. It needs a solid block at y+1 (the porch beam or eave, laid first);
 *  with nothing above, it is refused rather than placed floating. */
export function porchLantern(g, { x, y, z }) {
  const box = [x, y, z, x, y, z];
  const p = writer(g, box);
  if (!g.inBounds(x, y + 1, z) || g.isAir(x, y + 1, z)) { p.refused++; return done(p, box); }
  p.put(x, y, z, ...B.lantern(true));
  return done(p, box);
}

/** A dining table and two stair chairs in a 2 x 3 footprint from its north-west cell (x, z), on floor layer y (the furniture
 *  stands at y+1). The table is an oak fence post at (x, y+1, z+1) with a top slab on it at y+2. The chairs are stairs at
 *  the north and south ends of the same column, facing away from the table. The east column stays clear at y+1..y+2 for the
 *  whole depth, so a walker can pass the set. Fits the smallest dining room in ROOMS (P5 dining nook, x90..91 z15..17). */
export function diningSet(g, { x, y, z, wood = "oak" }) {
  const box = [x, y + 1, z, x + 1, y + 2, z + 2];
  const p = writer(g, box);
  p.put(x, y + 1, z + 1, ...B.fence(wood));
  p.put(x, y + 2, z + 1, `${wood}_slab`, { type: "top", waterlogged: "false" });
  p.put(x, y + 1, z, ...B.stairs(wood, "north", "bottom"));
  p.put(x, y + 1, z + 2, ...B.stairs(wood, "south", "bottom"));
  return done(p, box);
}
