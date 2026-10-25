// Part P4 "Flamboyant choir": the choir's clerestory tracery (x 63..88, z 57..71), the balustrade y 73 with its
// pinnacles at each pier, the north and south flying buttresses (culées, arcs and pinnacle shafts), the apse window,
// the chapel lancets and the chapel caps (CH-N / CH-S / CH-E). Writes only into air (the earlier parts' walls stay).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { onFootprint } from "../vocab/base.mjs";
import { tracery_window, lancet, parapet, flyer, pinnacle, chapel_cap } from "../vocab.mjs";

// Clerestory bays (3 wide) and pier lines of the Flamboyant choir (plan.md FACADES).
const BAYS = [65, 71, 77, 83];
const PIERS = [63, 69, 75, 81, 87];
const CHOIR_N = 57, CHOIR_S = 71;
const FLYER_X = [69, 75, 81, 87];

// Chapel centres: CH-N (z 46..49), CH-S (z 79..81), CH-E (x 97..100) with each chapel's window line.
const CH_S = [[68, 80], [75, 80], [82, 80], [89, 80]];
const CH_N = [[79, 47], [86, 47]];
const CH_E = [[98, 57], [98, 64], [98, 71]];
const CHAPEL_BOXES = [[66, 79, 70, 81], [73, 79, 77, 81], [80, 79, 84, 81], [87, 79, 91, 81], [77, 46, 81, 49], [84, 46, 88, 49], [97, 55, 100, 59], [97, 62, 100, 66], [97, 69, 100, 73]];

export function build(g) {
  // Write one block only into air, inside the plot's footprint. Returns true when placed.
  const airPut = (x, y, z, block, state) => {
    if (y > 151 || !onFootprint(x, z) || !g.isAir(x, y, z)) return false;
    if (state === undefined) g.set(x, y, z, block); else g.set(x, y, z, block, state);
    return true;
  };
  const wallPut = (x, y, z, mat) => { const [b, s] = B.wall(mat); return airPut(x, y, z, b, s); };

  // Clerestory tracery: one window per bay per tier (y 62..66 and 67..71) on the north and south choir walls.
  for (const x of BAYS) for (const y of [62, 67]) {
    tracery_window(g, x, y, CHOIR_N, "north");
    tracery_window(g, x, y, CHOIR_S, "south");
  }
  // Apse: one window on the straight east face of the apse (x 96, z 63..65), two tiers.
  for (const y of [62, 67]) tracery_window(g, 96, y, 63, "east");

  // Choir walls (P4 owns the walls above the crypt floor course 43, up to the wall top 72): north and south
  // lines z 57 / 71 for x 63..88, the east end x 88, and the apse half-octagon (89,57)-(94,59)-(96,62..66)-(94,69)-(89,71).
  // Windows and tracery were placed above, so they stay; the rest is solid granite.
  const wallLine = (x0, z0, x1, z1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / (n || 1)), z = Math.round(z0 + ((z1 - z0) * i) / (n || 1));
      for (let y = 43; y <= 72; y++) airPut(x, y, z, "stone_bricks");
    }
  };
  wallLine(63, CHOIR_N, 88, CHOIR_N);
  wallLine(63, CHOIR_S, 88, CHOIR_S);
  wallLine(88, CHOIR_N, 88, CHOIR_S);
  wallLine(88, 57, 89, 57);
  wallLine(89, 57, 94, 59);
  wallLine(94, 59, 96, 62);
  wallLine(96, 62, 96, 66);
  wallLine(96, 66, 94, 69);
  wallLine(94, 69, 89, 71);

  // Pinnacles at each pier first (they stand in the balustrade line), then the balustrade y 73 round the choir.
  for (const x of PIERS) for (const z of [CHOIR_N, CHOIR_S]) pinnacle(g, x, 73, z, 3);
  parapet(g, [63, 73, CHOIR_N], [88, 73, CHOIR_N], { crenels: false });
  parapet(g, [63, 73, CHOIR_S], [88, 73, CHOIR_S], { crenels: false });
  parapet(g, [88, 73, CHOIR_N], [88, 73, CHOIR_S], { crenels: false });

  // Flying buttresses: north culée z 48..50 (arc runs +z), south culée z 78..80 (arc runs -z); springing at y 68.
  for (const x of FLYER_X) {
    for (let y = 30; y <= 70; y++) for (const z of [48, 49, 50]) for (const dx of [0, 1]) airPut(x + dx, y, z, "stone_bricks");
    for (let y = 71; y <= 78; y++) wallPut(x, y, 49, "stone_brick");
    { const [sb, ss] = B.slab("polished_andesite", "bottom"); airPut(x, 79, 49, sb, ss); }
    flyer(g, x, 68, 51, "north", 6);
    for (let y = 30; y <= 70; y++) for (const z of [78, 79, 80]) for (const dx of [0, 1]) airPut(x + dx, y, z, "stone_bricks");
    flyer(g, x, 68, 77, "south", 6);
  }

  // Chapels: lancets first (they cut air), then each chapel box solid granite from the floor course to its wall top 57
  // (the chapel is solid under its cap, so the cap is supported); the lancets and tracery cells are already there.
  for (const [cx] of CH_S) lancet(g, cx, 47, 81, "south", 9);
  for (const [cx] of CH_N) lancet(g, cx, 47, 46, "north", 9);
  for (const [, cz] of CH_E) lancet(g, 100, 47, cz, "east", 9);
  for (const [x0, z0, x1, z1] of CHAPEL_BOXES) for (let y = 43; y <= 57; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) airPut(x, y, z, "stone_bricks");

  // Chapel caps (stepped pyramid over each 3x3 ring at wall top 57, cap to y 61) and their lancets.
  for (const [cx, cz] of CH_S) chapel_cap(g, cx, 58, cz, 1, 3);
  for (const [cx, cz] of CH_N) chapel_cap(g, cx, 58, cz, 1, 3);
  for (const [cx, cz] of CH_E) chapel_cap(g, cx, 58, cz, 1, 3);
}
