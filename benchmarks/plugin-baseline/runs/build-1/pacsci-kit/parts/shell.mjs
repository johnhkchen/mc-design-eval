// Part "shell": every mass as a hollow white_concrete box from one union of cells, floors at y10 / y18 (tall), decks at y18 (low) / y26 (tall).
import { MASS, OPENINGS, WHITE_CONCRETE, SMOOTH_QUARTZ, QUARTZ_PILLAR, CALCITE } from "../vocab/base.mjs";

const TOP = { N1: 26, N1_STAIR_BAY: 18, B: 26, B_PRIME: 26, B2: 18, E: 18, S: 18, S_TAIL: 18, S_TAIL_END: 18, W_STUB: 18 };
const masses = Object.entries(MASS).map(([k, b]) => ({ k, b, top: TOP[k] }));
const inBox = (b, x, y, z) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5];
const inMass = (m, x, y, z) => inBox(m.b, x, y, z) && y <= m.top;
const inUnion = (x, y, z) => masses.some((m) => inMass(m, x, y, z));

// Loggias (open ground storey, left air for the facade's piers and screens) and the openings the plan reserves.
const air = [
  [60, 1, 76, 63, 9, 159], [4, 1, 160, 59, 9, 163], [40, 1, 72, 59, 9, 75],
  OPENINGS.main_entrance, OPENINGS.b_second_entrance, OPENINGS.n1_north_door, OPENINGS.n1_stair_bay_door,
  OPENINGS.e_service_door, ...OPENINGS.promenade_doors,
];
const inAir = (x, y, z) => air.some((b) => inBox(b, x, y, z));

// Walls on the plot edge (N1 north z 0, the west edge x 0, the tail end z 177) have no room for proud ribs, so the
// tracery is drawn in the wall plane: quartz_pillar ribs every 4 cells, a calcite lancet in each panel's centre that
// rises to smooth_quartz shoulders and a flat smooth_quartz band under the coping. Other walls stay white_concrete.
const topOf = (x, z) => Math.max(...masses.filter((m) => inBox(m.b, x, m.b[1], z)).map((m) => m.top));
function edgeSkin(x, y, z) {
  let t;
  if (z === 0 || z === 177) t = x;
  else if (x === 0) t = z;
  else return [WHITE_CONCRETE];
  const cop = topOf(x, z) + 1, k = ((t % 4) + 4) % 4;
  if (y >= cop - 3) return [SMOOTH_QUARTZ];
  if (k === 0) return [QUARTZ_PILLAR, { axis: "y" }];
  if (y === 1) return [SMOOTH_QUARTZ];
  if (k === 2) return y === cop - 4 ? [SMOOTH_QUARTZ] : [CALCITE];
  return y >= cop - 5 ? [SMOOTH_QUARTZ] : [WHITE_CONCRETE];
}

export function build(g) {
  const [x0, y0, z0, x1, y1, z1] = [0, 1, 0, 143, 26, 176];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1 + 1; z++) for (let y = y0; y <= y1; y++) {
    if (!inUnion(x, y, z) || inAir(x, y, z)) continue;
    const exposed = !inUnion(x - 1, y, z) || !inUnion(x + 1, y, z) || !inUnion(x, y, z - 1) || !inUnion(x, y, z + 1);
    const wstub = x <= 3 && z >= 140 && z <= 159;
    if (exposed) g.set(x, y, z, ...edgeSkin(x, y, z));
    else if (!inUnion(x, y + 1, z)) g.set(x, y, z, WHITE_CONCRETE);
    else if ((y === 10 && !wstub) || y === 18) g.set(x, y, z, SMOOTH_QUARTZ);
  }
}
