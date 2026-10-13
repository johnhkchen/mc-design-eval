// Part-1 vocabulary from plan.md (VOCABULARY): wallCourse, quoinColumn, portico, doorHood, hearth, windowBox, gardenBed.
// Block ids are plan.md's PALETTE literals; nothing here imports vocab.mjs or the other vocab files.
//
// Contract every helper keeps (the same as h2.mjs):
// - takes its position (and facing) as arguments; nothing is hard-wired to a spot;
// - writes only inside the box it returns as `box`, and only into air, unless opts.over is true (trim laid onto a
//   finished wall: a built wall face may be replaced, ground, sand, floor and path never are). A cell it may not take
//   is counted in `skipped`, never overwritten, so the caller can see it;
// - never writes ground or floor below its own box (y=0 is never owned here);
// - returns { cells: [[x,y,z]...], skipped, box }.
import { B, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const GROUND_OR_FLOOR = /grass|dirt|podzol|sand|gravel|andesite|planks|rooted|mud|path/;

const lo = (a, b) => Math.min(a, b), hi = (a, b) => Math.max(a, b);
const result = (box) => ({ cells: [], skipped: 0, box });

// Write one block through `spec` ([block, state] from B.*, or a plain id). Returns nothing; records in `r`.
function place(g, r, x, y, z, spec, opts = {}) {
  const [block, state] = typeof spec === "string" ? [spec] : spec;
  const free = g.isAir(x, y, z) || (opts.over && !GROUND_OR_FLOOR.test(g.blockAt(x, y, z)));
  if (!g.inBounds(x, y, z) || y < 1 || !free) { r.skipped++; return; }
  g.set(x, y, z, block, state);
  r.cells.push([x, y, z]);
}

// A wall-plane slab x0..x1 by y0..y1 at z, one block thick. opts.skip(x, y, z) leaves an opening as air for a later part.
export function wallCourse(g, x0, x1, y0, y1, z, block, opts = {}) {
  const r = result([lo(x0, x1), lo(y0, y1), z, hi(x0, x1), hi(y0, y1), z]);
  for (let x = lo(x0, x1); x <= hi(x0, x1); x++)
    for (let y = lo(y0, y1); y <= hi(y0, y1); y++) {
      if (opts.skip?.(x, y, z)) continue;
      place(g, r, x, y, z, block, opts);
    }
  return r;
}

// A quoin column on a corner: the corner cell at x on the front plane z, y3..16 by default. Courses come in a run of
// three: two long (the corner plus the next cell along the front, away from the corner) and one short (the corner
// only). side: "west" for the x=3 corner (long face runs east), "east" for the x=27 corner (long face runs west).
export function quoinColumn(g, x, side, z, opts = {}) {
  if (side !== "west" && side !== "east") throw new Error(`quoinColumn: side must be west or east, got ${side}`);
  const y0 = opts.y0 ?? 3, y1 = opts.y1 ?? 16, step = side === "west" ? 1 : -1, block = opts.block ?? "smooth_sandstone";
  const r = result([lo(x, x + step), y0, z, hi(x, x + step), y1, z]);
  for (let y = y0; y <= y1; y++) {
    const long = (y - y0) % 3 < 2;
    place(g, r, x, y, z, block, opts);
    if (long) place(g, r, x + step, y, z, block, opts);
  }
  return r;
}

// The portico on a bay: two quartz pillars on pedestals at x0 and x0+4, cheeks, the entablature at y=7 and the balcony
// rail at y=8. The front row is z0; the portico is three deep (z0..z0+2). Nothing between the pillars at y1..2 (the stoop).
export function portico(g, x0, z0, opts = {}) {
  const x1 = x0 + 4, z1 = z0 + 2;
  const r = result([x0, 1, z0, x1, 8, z1]);
  const Q = "smooth_quartz";
  for (const x of [x0, x1]) {
    for (let y = 1; y <= 2; y++) place(g, r, x, y, z0, Q, opts);                        // pedestal
    for (let y = 3; y <= 6; y++) place(g, r, x, y, z0, B.pillar("quartz_pillar", "y"), opts);   // column
    for (let y = 1; y <= 2; y++) for (let z = z0 + 1; z <= z1; z++) place(g, r, x, y, z, Q, opts); // cheek
  }
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) place(g, r, x, 7, z, Q, opts); // entablature
  // balcony rail on the front and both sides, y=8; each bar joins its neighbours in the rail or any solid next to it
  const rail = new Set();
  for (let x = x0; x <= x1; x++) rail.add(`${x},${z0}`);
  for (let z = z0 + 1; z <= z1; z++) { rail.add(`${x0},${z}`); rail.add(`${x1},${z}`); }
  const bar = (x, z) => {
    const on = (dx, dz) => rail.has(`${x + dx},${z + dz}`) || (g.inBounds(x + dx, 8, z + dz) && !g.isAir(x + dx, 8, z + dz));
    const s = (v) => String(v);
    return { north: s(on(0, -1)), south: s(on(0, 1)), east: s(on(1, 0)), west: s(on(-1, 0)), waterlogged: "false" };
  };
  for (const key of rail) {
    const [x, z] = key.split(",").map(Number);
    place(g, r, x, 8, z, ["iron_bars", bar(x, z)], opts);
  }
  return r;
}

// A door hood over a front door: a quartz slab top across x0..x0+2 at y=6, carried on two upside-down quartz stair
// brackets at x0 and x0+2 (y=5). z is the hood's plane (in front of the wall); the brackets' lips point at the street.
export function doorHood(g, x0, z, opts = {}) {
  const r = result([x0, 5, z, x0 + 2, 6, z]);
  for (let x = x0; x <= x0 + 2; x++) place(g, r, x, 6, z, B.slab("quartz", "top"), opts);
  for (const x of [x0, x0 + 2]) place(g, r, x, 5, z, B.stairs("quartz", "south", "top"), opts);
  return r;
}

// A hearth in a fireplace opening: 1 deep, 2 wide along z (z0, z0+1), bottom at y=3, lintel at y=5. side is the way
// the room lies from the opening ("west" for the A kitchen, "east" for the B hall): the campfire faces the room, the
// lintel's lip points at the room. The cell at z0+1 is firebrick at the back; y=4 stays air.
export function hearth(g, x, z0, side, opts = {}) {
  const into = face.opposite(side);
  if (!into) throw new Error(`hearth: side must be a compass direction, got ${side}`);
  const r = result([x, 3, z0, x, 5, z0 + 1]);
  place(g, r, x, 3, z0, ["campfire", { facing: side, lit: "true" }], opts);
  place(g, r, x, 3, z0 + 1, "stone_bricks", opts);
  for (const z of [z0, z0 + 1]) place(g, r, x, 5, z, B.stairs("brick", into, "top"), opts);
  return r;
}

// A window box on the sill at (x, y, z): a closed spruce trapdoor lying flat, with a potted flower on top.
// Note: the pot stands on a flat trapdoor, which is not a full face; check it in-game.
export function windowBox(g, x, y, z, opts = {}) {
  const r = result([x, y, z, x, y + 1, z]);
  place(g, r, x, y, z, B.trapdoor("spruce", "north", "bottom", false), opts);
  place(g, r, x, y + 1, z, "potted_poppy", opts);
  return r;
}

// Planting for a rear garden bed: the two cells either side of the path column xPath, z0..z1, planted at y=1 on the
// ground layer (the ground part lays the soil; this helper never writes y=0).
export function gardenBed(g, xPath, z0, z1, opts = {}) {
  const beds = [xPath - 2, xPath - 1, xPath + 1, xPath + 2];
  const plants = ["poppy", "allium", "azalea"];
  const r = result([xPath - 2, 1, z0, xPath + 2, 1, z1]);
  for (let z = z0; z <= z1; z++)
    for (const x of beds) place(g, r, x, 1, z, plants[(((x + z) % 3) + 3) % 3], opts);
  return r;
}
