// Landings shells (plots 2 and 3): the stucco blocks of Waterfront Landings North and South, each standing on its own
// footprint. Per block: a brick base from the ground up to the string course at y 6, stucco above, a cut_sandstone
// cornice at the roof slab, the roof deck laid on the footprint, and a modern parapet with its iron rail. Penthouses
// stand on their host roofs with a polished_deepslate cap. Exterior only: the walls are hollow, the facade part adds
// the openings, corner bays, loggias and shopfronts.
// stuccoBlock is not used: it writes the ring of its box whatever the footprint, and these masses are clipped to the
// footprint (plan.md: build only on # cells), so the ring is written here with the same course rules.
import { LANDINGS, groundAt, onFootprint, terraceRail } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const STRING_Y = 6;       // the first upper floor: the cut_sandstone_slab (top) string course
const PENTHOUSE_CAP = 30; // flat polished_deepslate cap over the penthouses (plan.md: y 27..29, cap 30)
const PENTHOUSE_TOP = 29;

// a cell takes a block when it is air, or when it is the bluff's ground stone at or under the column's ground value
// (the brick base runs down into the ground, so the wall replaces the stone there)
function take(g, x, y, z, gz) {
  if (!g.inBounds(x, y, z)) return false;
  if (y <= gz) return true;
  return g.isAir(x, y, z);
}
function put(g, x, y, z, gz, [block, state, nbt]) {
  if (!take(g, x, y, z, gz)) return;
  g.set(x, y, z, block, state, nbt);
}

const onRing = (x, z, [x0, z0, x1, z1]) => x === x0 || x === x1 || z === z0 || z === z1;
const inside = (x, z, [x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

// the stucco shell of one block: the footprint ring from its ground up to the roof slab
function shell(g, m) {
  const rect = [m.x0, m.z0, m.x1, m.z1];
  for (let x = m.x0; x <= m.x1; x++) for (let z = m.z0; z <= m.z1; z++) {
    if (!onRing(x, z, rect) || !onFootprint(x, z)) continue;
    const gz = groundAt(x, z);
    // quoins: the corner columns are worked stone, alternate courses
    const corner = (x === m.x0 || x === m.x1) && (z === m.z0 || z === m.z1);
    for (let y = gz; y <= m.roofY; y++) {
      if (y === m.roofY) put(g, x, y, z, gz, ["cut_sandstone"]);
      else if (y === STRING_Y) put(g, x, y, z, gz, B.slab("cut_sandstone", "top"));
      else if (y < STRING_Y) put(g, x, y, z, gz, ["bricks"]);
      else if (corner && y % 2 === 0) put(g, x, y, z, gz, ["cut_sandstone"]);
      else put(g, x, y, z, gz, ["smooth_sandstone"]);
    }
  }
}

// the flat roof deck: smooth_stone over the footprint inside the cornice, at the roof slab's own level
function roofDeck(g, m) {
  for (let x = m.x0 + 1; x < m.x1; x++) for (let z = m.z0 + 1; z < m.z1; z++) {
    if (!onFootprint(x, z)) continue;
    if (g.isAir(x, m.roofY, z)) g.set(x, m.roofY, z, "smooth_stone");
  }
}

// a penthouse: a smooth_sandstone ring from the roof deck up to PENTHOUSE_TOP (its cap is laid by terraceRail)
function penthouseWalls(g, p, roofY) {
  const rect = [p.x0, p.z0, p.x1, p.z1];
  for (let x = p.x0; x <= p.x1; x++) for (let z = p.z0; z <= p.z1; z++) {
    if (!onRing(x, z, rect) || !onFootprint(x, z)) continue;
    for (let y = roofY + 1; y <= PENTHOUSE_TOP; y++) if (g.isAir(x, y, z)) g.set(x, y, z, "smooth_sandstone");
  }
}

export function build(g) {
  const blocks = LANDINGS.filter((m) => m.roofY !== undefined);
  const penthouses = LANDINGS.filter((m) => m.penthouse);
  // each penthouse sits on the block whose roof it stands on: same plot, box inside its footprint rectangle
  const hostOf = (p) => blocks.find((m) => m.plot === p.plot && inside(p.x0, p.z0, [m.x0, m.z0, m.x1, m.z1]) && inside(p.x1, p.z1, [m.x0, m.z0, m.x1, m.z1]));

  for (const m of blocks) {
    shell(g, m);
    roofDeck(g, m);
    const p = penthouses.find((q) => hostOf(q) === m);
    terraceRail(g, [m.x0, m.z0, m.x1, m.z1], m.roofY, {
      clip: onFootprint,
      penthouse: p ? { box: [p.x0, p.z0, p.x1, p.z1], cap: PENTHOUSE_CAP } : undefined,
    });
  }
  for (const p of penthouses) {
    const host = hostOf(p);
    if (!host) throw new Error(`penthouse ${p.name} stands on no block`);
    penthouseWalls(g, p, host.roofY);
  }
}
