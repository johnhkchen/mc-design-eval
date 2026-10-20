// Part 5, walks, lamps, lawn lights and trees (plan.md PARTS 5). Walks sit on each cell's ground height h and replace its
// grass (walkCell: powder, with a slab half step where the ground drops). Lamps stand beside the walks every 9 cells, on
// the grass; lawn froglights every 12 cells on the grass; the 12 edge oaks root on the ground. Earlier parts' blocks
// (plaza, flags, obelisk) are never written: a cell they already laid is left as they laid it.
import { heightAt, radiusAt, TREES, MALL_WALK_Z, N_S_WALK_X, GREAT_RING, LAMP_EVERY, LAWN_LIGHT_EVERY } from "../vocab/base.mjs";
import { walkCell, oakTree, lampPost, floodlight } from "../vocab/h1.mjs";

const GRASS = "minecraft:grass_block";
const key = (x, z) => `${x},${z}`;

// The walk network as a set of "x,z" cells: Mall E and W, N and S, four diagonals, the great ring.
function walkNetwork() {
  const cells = new Set();
  const [mz0, mz1] = MALL_WALK_Z;
  for (let x = 0; x <= 99; x++) if (x <= 39 || x >= 61) for (let z = mz0; z <= mz1; z++) cells.add(key(x, z));
  const [nx0, nx1] = N_S_WALK_X;
  for (let z = 0; z <= 99; z++) if ((z >= 17 && z <= 39) || (z >= 61 && z <= 83)) for (let x = nx0; x <= nx1; x++) cells.add(key(x, z));
  // diagonals: 2 wide (e = 0 or 1 along the line), from r 17.5 out to 3 cells short of each corner
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    for (let x = 3; x <= 96; x++) for (let z = 3; z <= 96; z++) {
      if ((sx < 0 ? x > 47 : x < 53) || (sz < 0 ? z > 47 : z < 53)) continue;
      const e = sx * (x - 50) - sz * (z - 50);
      if (e !== 0 && e !== 1) continue;
      if (radiusAt(x, z) < 17.5) continue;
      cells.add(key(x, z));
    }
  }
  for (let x = 0; x <= 99; x++) for (let z = 0; z <= 99; z++) {
    const r = radiusAt(x, z);
    if (r >= GREAT_RING.r0 && r < GREAT_RING.r1) cells.add(key(x, z));
  }
  return cells;
}

// Lay the walk surface at every network cell. The edge rings take the surface only (no slab), so the outer two rows
// keep their mapped heights; a cell with anything of an earlier part on or above its surface is left alone.
function layWalks(g, walks) {
  let n = 0;
  for (const k of walks) {
    const [x, z] = k.split(",").map(Number);
    const h = heightAt(x, z);
    if (g.blockAt(x, h, z) !== GRASS || !g.isAir(x, h + 1, z)) continue;
    const edge = x < 2 || x > 97 || z < 2 || z > 97;
    if (edge) {
      g.set(x, h, z, "white_concrete_powder");
      n++;
    } else {
      n += walkCell(g, x, h, z, { over: true });
    }
  }
  return n;
}

// A lamp on the grass at (x, z): not on a walk, not on an earlier part's paving, not within 2 of an edge.
function lampAt(g, walks, x, z) {
  if (x < 2 || x > 97 || z < 2 || z > 97 || walks.has(key(x, z))) return 0;
  const h = heightAt(x, z);
  if (g.blockAt(x, h, z) !== GRASS) return 0;
  return lampPost(g, x, h, z);
}

// Lamps along a straight walk segment: the lamp positions run every LAMP_EVERY cells from the first to the last
// (inset 2 from each end, so the lamp sits at the walk's end), alternating between the two sides.
function lampsAlong(g, walks, a, b, sideA, sideB, axis) {
  const at = (p, side) => (axis === "x" ? lampAt(g, walks, p, side) : lampAt(g, walks, side, p));
  const ends = [];
  for (let p = a + 2; p <= b - 2; p += LAMP_EVERY) ends.push(p);
  if (ends.length && b - 2 - ends[ends.length - 1] >= 4) ends.push(b - 2);
  let n = 0;
  ends.forEach((p, k) => { n += at(p, k % 2 === 0 ? sideA : sideB); });
  return n;
}

// Lamps for the diagonals: one every LAMP_EVERY cells in x, on alternate sides of the 2-wide line.
function diagonalLamps(g, walks) {
  let n = 0;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    let k = 0;
    for (let x = 3; x <= 96; x++) {
      if (Math.abs(x - 50) < 12.5 || (sx < 0 ? x > 47 : x < 53)) continue;
      if (k++ % LAMP_EVERY !== 0) continue;
      const z0 = 50 + sx * sz * (x - 50);
      const E = k % 2 ? 2 : -1;                              // one cell outside the line on either side
      const z = 50 + (sx * (x - 50) - E) * sz;
      if (z0 < 3 || z0 > 96) continue;
      n += lampAt(g, walks, x, z);
    }
  }
  return n;
}

// Lamps round the great ring: every LAMP_EVERY cells of arc at radius 32, alternating just outside and inside.
function ringLamps(g, walks) {
  const rMid = (GREAT_RING.r0 + GREAT_RING.r1) / 2;
  const count = Math.round((2 * Math.PI * rMid) / LAMP_EVERY);
  let n = 0;
  for (let k = 0; k < count; k++) {
    const t = (2 * Math.PI * k) / count;
    const rr = k % 2 ? GREAT_RING.r1 + 1 : GREAT_RING.r0 - 1;
    n += lampAt(g, walks, Math.round(50 + rr * Math.cos(t)), Math.round(50 + rr * Math.sin(t)));
  }
  return n;
}

// Lawn froglights at x mod 12 = 6 and z mod 12 = 6, on grass only, not under a tree crown.
function lawnLights(g, walks) {
  let n = 0;
  for (let x = LAWN_LIGHT_EVERY / 2; x <= 99; x += LAWN_LIGHT_EVERY) for (let z = LAWN_LIGHT_EVERY / 2; z <= 99; z += LAWN_LIGHT_EVERY) {
    if (x < 2 || x > 97 || z < 2 || z > 97 || walks.has(key(x, z))) continue;
    if (TREES.some(([tx, tz]) => Math.abs(x - tx) <= 2 && Math.abs(z - tz) <= 2)) continue;
    const h = heightAt(x, z);
    if (g.blockAt(x, h, z) !== GRASS) continue;
    n += floodlight(g, x, h, z, { over: true });
  }
  return n;
}

export function build(g) {
  const walks = walkNetwork();
  const laid = layWalks(g, walks);

  let lamps = 0;
  lamps += lampsAlong(g, walks, 3, 38, 48, 52, "x");     // Mall, x 0..39: lamps beside z 48 / 52
  lamps += lampsAlong(g, walks, 62, 96, 48, 52, "x");    // Mall, x 61..99
  lamps += lampsAlong(g, walks, 17, 39, 48, 52, "z");    // N walk: lamps beside x 48 / 52
  lamps += lampsAlong(g, walks, 61, 83, 48, 52, "z");    // S walk
  lamps += diagonalLamps(g, walks);
  lamps += ringLamps(g, walks);

  const lights = lawnLights(g, walks);
  let trees = 0;
  for (const [x, z] of TREES) trees += oakTree(g, x, heightAt(x, z), z);

  console.log(`walks/trees: walk cells ${laid}, lamp blocks ${lamps}, lawn lights ${lights}, tree blocks ${trees}`);
}
