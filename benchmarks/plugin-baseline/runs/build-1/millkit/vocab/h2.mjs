// Mill village vocabulary, second set (plan.md VOCABULARY): lamp_post, pier_skirt, batten_wall, shutter, crop_bed,
// trough, bench, false_front, woodpile. Every helper takes its position as arguments and writes only into air inside
// its own footprint; it never lays ground, sand or floor (y0 and below belong to an earlier part). Exceptions are
// named in the option that allows them. Each returns { placed, skipped }: skipped lists the cells that were not air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One writer per call: put() writes a block only into an air cell inside the grid, else records the cell as skipped.
function writer(g) {
  const out = { placed: 0, skipped: [] };
  const put = (x, y, z, ...write) => {
    if (g.inBounds(x, y, z) && g.isAir(x, y, z)) { g.set(x, y, z, ...write); out.placed++; }
    else out.skipped.push([x, y, z]);
  };
  return { put, out };
}

// Fence connections: a fence joins each horizontal neighbour that is in `ring` (a Set of "x,z" keys).
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
function fenceState(x, z, ring) {
  const st = { waterlogged: "false" };
  for (const [d, [dx, dz]] of Object.entries(DIRS)) st[d] = String(ring.has(`${x + dx},${z + dz}`));
  return st;
}

// lamp_post(g, x, z): spruce fence post y1..3 with a standing lantern on top at y4. Footprint: column x,z, y1..4.
export function lamp_post(g, x, z) {
  const w = writer(g);
  for (let y = 1; y <= 3; y++) w.put(x, y, z, "spruce_fence", fenceState(x, z, new Set()));
  w.put(x, 4, z, ...B.lantern(false));
  return w.out;
}

// pier_skirt(g, box, pier, skirt): box = [x0, z0, x1, z1] (inclusive), the house footprint. At y1 round its perimeter:
// a pier block at each corner and every third cell from each corner along a side, and a fence skirt between them.
// Only the y1 ring is written; the ground under it is not.
export function pier_skirt(g, box, pier, skirt) {
  const [x0, z0, x1, z1] = box;
  const sides = [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]];
  const ring = [];                                     // [x, z, isPier] walking the perimeter once
  for (const [ax, az, bx, bz] of sides) {
    const n = Math.max(Math.abs(bx - ax), Math.abs(bz - az));
    const sx = Math.sign(bx - ax), sz = Math.sign(bz - az);
    for (let i = 0; i < n; i++) ring.push([ax + i * sx, az + i * sz, i % 3 === 0]);
  }
  const cells = new Set(ring.map(([x, z]) => `${x},${z}`));
  const w = writer(g);
  for (const [x, z, isPier] of ring) {
    if (isPier) w.put(x, 1, z, ...B.block(pier));
    else w.put(x, 1, z, skirt, fenceState(x, z, cells));
  }
  return w.out;
}

// batten_wall(g, a, b, { y0, y1, battens, plank, batten }): one straight wall line from a=[x,z] to b=[x,z] (same z,
// or same x), planks from y0 to y1 with stripped log battens at the listed positions along the line (x or z values).
export function batten_wall(g, a, b, { y0 = 3, y1 = 6, battens = [], plank = "spruce_planks", batten = "stripped_spruce_log" } = {}) {
  if (a[1] !== b[1] && a[0] !== b[0]) throw new Error("batten_wall: the wall must run straight along x or z");
  const along = a[1] === b[1] ? 0 : 1;                  // 0: runs along x (fixed z), 1: runs along z (fixed x)
  const fixed = along === 0 ? a[1] : a[0];
  const lo = Math.min(a[along], b[along]), hi = Math.max(a[along], b[along]);
  const w = writer(g);
  for (let p = lo; p <= hi; p++) {
    const isBatten = battens.includes(p);
    for (let y = y0; y <= y1; y++) {
      const [x, z] = along === 0 ? [p, fixed] : [fixed, p];
      if (isBatten) w.put(x, y, z, ...B.pillar(batten, "y"));
      else w.put(x, y, z, ...B.block(plank));
    }
  }
  return w.out;
}

// shutter(g, [x, y, z], face, wood, { height }): open trapdoors standing on the air cell in front of a window wall,
// lying flat against it. face = the way the wall looks (north for a north front). height cells up from y.
export function shutter(g, [x, y, z], face, wood = "spruce", { height = 2 } = {}) {
  const w = writer(g);
  for (let i = 0; i < height; i++) w.put(x, y + i, z, ...B.trapdoor(wood, face, "bottom", true));
  return w.out;
}

// Crop age at which each crop is fully grown (beetroots stop at 3).
const FULL_AGE = { wheat: 7, carrots: 7, potatoes: 7, beetroots: 3 };

// crop_bed(g, x0, x1, z0, z1, crop, { soil }): crop plants y1 in the box, grown. The farmland at y0 is ground, so it is
// NOT written unless { soil: true } is passed, which then sets farmland (moisture 7) at y0 over the grass.
// Water within 4 cells is the channel's job (channel is its own part).
export function crop_bed(g, x0, x1, z0, z1, crop, { soil = false } = {}) {
  if (!(crop in FULL_AGE)) throw new Error(`crop_bed: unknown crop ${crop}`);
  const w = writer(g);
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
      if (soil) { g.set(x, 0, z, "farmland", { moisture: "7" }); w.out.placed++; }
      w.put(x, 1, z, crop, { age: String(FULL_AGE[crop]) });
    }
  return w.out;
}

// trough(g, x0, x1, z, { water }): a row along x at z. Default: oak_planks base at y1 with a bottom oak_slab top course
// at y2. water: water_cauldron level 3 at y1 in each cell instead.
export function trough(g, x0, x1, z, { water = false } = {}) {
  const w = writer(g);
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    if (water) w.put(x, 1, z, "water_cauldron", { level: "3" });
    else {
      w.put(x, 1, z, ...B.block("oak_planks"));
      w.put(x, 2, z, ...B.slab("oak", "bottom"));
    }
  }
  return w.out;
}

// bench(g, x, z): two oak stairs at x and x+1 on row z, facing south (back to the north), with an oak trapdoor armrest at
// each end (x-1 and x+2). Writes only y1: y2 and y3 stay clear for the walk past it.
export function bench(g, x, z) {
  const w = writer(g);
  w.put(x, 1, z, ...B.stairs("oak", "south", "bottom"));
  w.put(x + 1, 1, z, ...B.stairs("oak", "south", "bottom"));
  w.put(x - 1, 1, z, ...B.trapdoor("oak", "south", "bottom", true));
  w.put(x + 2, 1, z, ...B.trapdoor("oak", "south", "bottom", true));
  return w.out;
}

// false_front(g, x0, x1, z): the store's front wall on plane z, facing north. Birch face y3..10 across x0..x1 with
// stripped dark oak pilasters at both ends; a raised centre (x0+2..x1-2) at y11..12. A cornice of upside-down dark oak
// stairs sits proud at z-1: y11 across the full width, y12 over the raised centre. Footprint: x0..x1, y3..12, z-1..z.
export function false_front(g, x0, x1, z) {
  const w = writer(g);
  for (let x = x0; x <= x1; x++) {
    for (let y = 3; y <= 10; y++) {
      if (x === x0 || x === x1) w.put(x, y, z, ...B.pillar("stripped_dark_oak_log", "y"));
      else w.put(x, y, z, ...B.block("birch_planks"));
    }
    w.put(x, 11, z - 1, ...B.stairs("dark_oak", "south", "top"));
  }
  for (let x = x0 + 2; x <= x1 - 2; x++) {
    w.put(x, 11, z, ...B.block("birch_planks"));
    w.put(x, 12, z, ...B.block("birch_planks"));
    w.put(x, 12, z - 1, ...B.stairs("dark_oak", "south", "top"));
  }
  return w.out;
}

// woodpile(g, x, z, { wood }): stripped logs laid along x, two long (x and x+1) and two high (y1..2), stacked.
// Footprint: x..x+1, y1..2, z.
export function woodpile(g, x, z, { wood = "stripped_birch_log" } = {}) {
  const w = writer(g);
  for (let y = 1; y <= 2; y++)
    for (let dx = 0; dx <= 1; dx++) w.put(x + dx, y, z, ...B.pillar(wood, "x"));
  return w.out;
}
