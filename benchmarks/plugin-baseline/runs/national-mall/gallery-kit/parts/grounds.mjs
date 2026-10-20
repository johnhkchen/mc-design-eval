// Part 6, Grounds and lighting (plan.md PARTS 6): the walks and plaza in smooth_sandstone, and lamp posts every
// LAMP_EVERY blocks along them and over the lawns. The lawn is the ground laid by build.mjs (grass_block), so it is
// not written here. Every write goes into air or onto a ground cell still showing grass with air above it: a cell an
// earlier part built (footing, step, body, wall) is skipped, so nothing of the shell is replaced.
import { groundAt, SMOOTH_SANDSTONE, LAMP_EVERY, PLOT0, PLOT1, lampPost } from "../vocab.mjs";

const GRASS = "minecraft:grass_block";

// Lamp posts placed so far, as [x, z]; the lawn pass measures spacing against them.
let posts = [];

// Lay a walk cell: replace the grass at the ground top with `block` when the cell is still open ground.
function paveCell(g, x, z, block = SMOOTH_SANDSTONE) {
  const top = groundAt(x, z);
  if (top === null) return 0;
  if (g.blockAt(x, top, z) !== GRASS || !untouched(g, x, top + 1, z)) return 0;
  g.set(x, top, z, block);
  return 1;
}

// Untouched: no earlier part has written this cell (carved air counts as written, and the lock refuses it).
const untouched = (g, x, y, z) => g.get(x, y, z) === undefined;

// A lamp post standing on the ground at (x, z), only where its four cells above the ground are untouched.
function lampAt(g, x, z) {
  const top = groundAt(x, z);
  if (top === null) return 0;
  for (let k = 1; k <= 4; k++) if (!untouched(g, x, top + k, z)) return 0;
  posts.push([x, z]);
  return lampPost(g, x, top, z) ? 1 : 0;
}

// Pave a plan rectangle [x0, z0, x1, z1] (inclusive) cell by cell.
function pave(g, [x0, z0, x1, z1]) {
  let n = 0;
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) n += paveCell(g, x, z);
  return n;
}

// Lamp posts at every LAMP_EVERY-th cell along a line, starting at `from`.
function lampsAlong(g, from, to, at) {
  let n = 0;
  for (let i = from; i <= to; i += LAMP_EVERY) n += at(i);
  return n;
}

// Lawn cover: walk every open ground cell of both plots and put a post wherever no post stands within LAMP_EVERY - 1
// (Manhattan). A lantern lights 15 and loses one per block, so every ground cell stays at 1 or more.
function coverLawn(g) {
  let n = 0;
  for (const p of [PLOT0, PLOT1]) {
    for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= p.x1; x++) {
      if (groundAt(x, z) === null) continue;
      if (posts.some(([px, pz]) => Math.abs(px - x) + Math.abs(pz - z) < LAMP_EVERY - 1)) continue;
      n += lampAt(g, x, z);
    }
  }
  return n;
}

export function build(g) {
  posts = [];
  let paved = 0, lamps = 0;

  // West Building: Constitution Avenue walk (north, z 0..2) and the Mall walk (south, z 37..39), x 0..100.
  paved += pave(g, [0, 0, 100, 2]);
  paved += pave(g, [0, 37, 100, 39]);
  // The plaza between the West Building's east end and the East Building (x 92..104, z 0..39).
  paved += pave(g, [92, 0, 104, 39]);

  // East Building: the open paving at its west face (the recess and the wedge slot are left to paveCell, which
  // skips the body) and the ground around its north-west corner, x 105..116, z 0..33.
  paved += pave(g, [105, 0, 116, 33]);

  // Lamp posts every LAMP_EVERY along the north walk and the south walk, and along the plaza edge.
  lamps += lampsAlong(g, 5, 95, (x) => lampAt(g, x, 0));
  lamps += lampsAlong(g, 5, 95, (x) => lampAt(g, x, 39));
  lamps += lampsAlong(g, 5, 35, (z) => lampAt(g, 96, z));
  lamps += lampsAlong(g, 5, 33, (z) => lampAt(g, 112, z));
  // The lawns, so no open ground is dark.
  lamps += coverLawn(g);

  console.log(`grounds: paved ${paved} cells, ${posts.length} lamp posts`);
}
