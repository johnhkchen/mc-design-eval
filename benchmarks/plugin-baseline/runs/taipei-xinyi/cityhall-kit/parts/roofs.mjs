// Part 2: roofs and terraces. Every mass gets a flat deck at its top minus 2 (wings 62, towers and M7 67, podia 15,
// spurs 10). A smooth_sandstone parapet stands one above the deck on every exposed edge (a neighbour that is open or
// lower; an edge that abuts a taller wall has none), capped with a smooth_quartz_slab. Lanterns every 8 on the inner
// ring. Then the three penthouses, the nine tower plant boxes, the podium planters and the crown (M7c). Spur skylights
// are left open for spurPavilion's glass. Writes only into air (g.set is locked by runParts).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SIZE, plantBox, penthouse, planter } from "../vocab.mjs";

// [id, x0, x1, z0, z1, top]: the same masses the shell builds (plan.md Masses table); taller masses own shared cells
const M = [
  ["M2", 81, 125, 27, 35, 17], ["M3", 45, 105, 36, 54, 64], ["T1", 27, 44, 36, 62, 69], ["T2", 106, 125, 36, 54, 69],
  ["M4", 36, 55, 63, 116, 64], ["M4a", 36, 44, 55, 62, 69], ["M5", 106, 125, 55, 116, 64], ["M6", 45, 179, 117, 134, 64],
  ["T3", 27, 44, 117, 152, 69], ["T3a", 18, 26, 126, 134, 64], ["T4", 180, 197, 117, 152, 69], ["M7", 63, 134, 135, 242, 69],
  ["M8", 18, 62, 162, 215, 64], ["M9", 135, 179, 162, 215, 64], ["T5", 180, 197, 162, 215, 69], ["M10", 45, 179, 233, 251, 64],
  ["T6", 27, 44, 225, 251, 69], ["T6a", 18, 26, 243, 251, 64], ["T7", 180, 197, 225, 251, 69], ["T7a", 198, 202, 243, 251, 64],
  ["M11", 36, 55, 252, 314, 64], ["M12", 106, 125, 252, 314, 64], ["M13", 45, 105, 315, 332, 64], ["T8", 27, 44, 315, 332, 69],
  ["T9", 106, 125, 315, 332, 69], ["M14a", 72, 125, 333, 341, 17], ["M14b", 81, 125, 342, 350, 17],
  ["M1", 81, 89, 0, 26, 12], ["M15", 81, 89, 351, 374, 12],
];

// crown penthouse M7c: walls y 68..73 smooth_quartz, slab roof y 74 (plan ROOFS)
const CROWN = { x0: 81, x1: 116, z0: 170, z1: 206, wall: 68, top: 73, roof: 74 };

// hand-built mechanical penthouses (plan ROOFS), [x0, y0, z0, x1, y1, z1]
const PENTHOUSES = [[66, 63, 40, 94, 69, 50], [66, 63, 319, 94, 69, 329], [145, 63, 175, 170, 69, 202]];

// tower plant boxes: centre of each tower T1..T9 (plan ROOFS: 5x5 at the centre, y 68..70)
const PLANT_BOXES = [[35, 49], [115, 45], [35, 134], [188, 134], [188, 188], [35, 238], [188, 238], [35, 323], [115, 323]];

// podium planters on the M2 and M14 terraces, [x0, y0, z0, x1, y1, z1] (y0 moss soil, y1 azalea leaves)
const PLANTERS = [
  [88, 16, 29, 92, 17, 31], [112, 16, 29, 116, 17, 31],
  [84, 16, 336, 88, 17, 338], [108, 16, 336, 112, 17, 338],
];

// the spur skylight strip: x 84..86 on the spine (spurPavilion glazes it at y 10)
const SKYLIGHT_X = [84, 86];

export function build(g) {
  const W = SIZE[0], D = SIZE[2];
  const H = Array.from({ length: W }, () => new Int16Array(D));
  for (const [, x0, x1, z0, z1, top] of M)
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (top > H[x][z]) H[x][z] = top;

  const at = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? H[x][z] : 0);
  const NEIGH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  // an edge is exposed when a neighbour is open or lower; a taller neighbour's wall takes the edge
  const exposed = (x, z) => NEIGH.some(([dx, dz]) => at(x + dx, z + dz) < H[x][z]);

  // top slabs: the parapet and planters stand on the deck at deck+1, so the deck's top face must sit at that level
  const [slab, slabState] = B.slab("smooth_stone", "top");
  const [coping, copingState] = B.slab("smooth_quartz");
  const inner = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const top = H[x][z];
    if (!top) continue;
    const deck = top - 2;
    const spur = top === 12;
    const sky = spur && x >= SKYLIGHT_X[0] && x <= SKYLIGHT_X[1];
    if (!sky) g.set(x, deck, z, slab, slabState);
    // the spur floor (y 1, plan FLOORS) carries the pavilion's pillars; the two entry doors keep their cells clear
    if (spur && !(sky && (z === 0 || z === D - 1))) g.set(x, 1, z, "smooth_stone");
    if (exposed(x, z)) {
      g.set(x, deck + 1, z, "smooth_sandstone");
      g.set(x, deck + 2, z, coping, copingState);
    } else if (!sky && NEIGH.some(([dx, dz]) => at(x + dx, z + dz) === top && exposed(x + dx, z + dz))) {
      inner.push([x, deck + 1, z]);
    }
  }
  // lanterns on the inner ring, every 8th
  inner.forEach(([x, y, z], i) => { if (i % 8 === 0) g.set(x, y, z, ...B.lantern(false)); });

  for (const [x0, y0, z0, x1, y1, z1] of PLANTERS) planter(g, [x0, y0, z0, x1, y1, z1]);
  for (const b of PENTHOUSES) penthouse(g, b);
  for (const [cx, cz] of PLANT_BOXES) plantBox(g, cx, cz);

  // crown penthouse M7c: smooth_quartz walls on its perimeter and a slab roof (the lights are the lights part's)
  const { x0, x1, z0, z1, wall, top, roof } = CROWN;
  const [crownSlab, crownSlabState] = B.slab("smooth_quartz", "top");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    g.set(x, roof, z, crownSlab, crownSlabState);
    if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
    for (let y = wall; y <= top; y++) g.set(x, y, z, "smooth_quartz");
  }
}
