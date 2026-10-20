// NASM fittings: the aircraft hung in the glass bays, the standing rocket in G3, the froglight glow in the bays, and the
// Ad Astra spire on its terrace. Every piece sits in the air the glass part leaves inside the bays (plan RESERVED), so
// nothing here replaces an earlier part's block. The roof of each bay is glass at y 9, so every hanger and fin stops
// at y 8.
import { aircraft, rocket, glow_floor, spire } from "../vocab.mjs";

// the glow sits one course above the plan's y 1 floor: the shell fills the bay floors at y 1 (smooth_stone) and a
// locked cell cannot be set, so the froglights stand on that floor at y 2 (plan.md Notes)
const GLOW_Y = 2;

// the hangers, one iron_block per course from each wing tip up to the roof frame at y 9 (course 9 is glass, so 8 is the
// top). They stand where the plan's chains would: the palette's iron_chain is the 26.x name, and on 1.21.1 the chain
// block is `chain`, which palette.json does not list, so the aircraft helper's chains are left off (hang false)
const HANGERS = [
  [17, 7, 12], [17, 8, 12], [22, 7, 12], [22, 8, 12],    // G1 plane, wing tips at z 12
  [40, 8, 15], [47, 8, 15],                               // G2 plane, wing tips at z 15
  [43, 7, 8], [43, 8, 8], [43, 7, 11], [43, 8, 11],      // G2 jet, wing tips at x 43 (z 8 and 11)
  [64, 8, 19], [71, 8, 19],                               // G3 plane, wing tips at z 19
];

export function build(g) {
  // G1: a light plane, fuselage x 19..20 z 10..15, wings x 17..22 at z 12, body y 6..7
  aircraft(g, { x: 19, y: 6, z: 10, span: 6, len: 6, facing: "south", fin: 1 });

  // G2: a Spirit-of-St-Louis-type plane, fuselage x 43..44 z 12..18, wings x 40..47 at z 15, body y 7..8
  aircraft(g, { x: 43, y: 7, z: 12, span: 8, len: 7, facing: "south", fin: 0 });
  // G2: a small jet lying east-west, fuselage x 41..46 z 9..10, wings z 8..11 at x 43, body y 6..7
  aircraft(g, { x: 41, y: 6, z: 9, span: 4, len: 6, facing: "east", fin: 1 });

  // G3: the standing rocket (x 67..68, z 14..15, floor y 2..8), and a hung plane at y 7, x 64..71, z 18..21
  rocket(g, 67, 14, 2);
  aircraft(g, { x: 67, y: 7, z: 18, span: 8, len: 4, facing: "south", fin: 0 });

  for (const [x, y, z] of HANGERS) {
    if (!g.isAir(x, y, z)) throw new Error(`hanger at ${x},${y},${z} is not air: ${g.blockAt(x, y, z)}`);
    g.set(x, y, z, "iron_block");
  }

  // froglight glow on the bay floors: the 4x4 grid, only where the cell is inside the bay (interior z per the shell)
  const cells = [];
  for (const x of [17, 21]) for (const z of [8, 12, 16, 20, 24]) cells.push([x, z]);     // G1, interior z 6..24
  for (const x of [40, 44, 48]) for (const z of [8, 12, 16, 20]) cells.push([x, z]);     // G2, interior z 7..23
  for (const x of [65, 69]) for (const z of [8, 12, 16, 20, 24]) cells.push([x, z]);     // G3, interior z 6..24
  glow_floor(g, cells, { y: GLOW_Y });

  // Ad Astra spire on the Ad Astra terrace at x 35, z 2: shaft y 2..13, lightning rod to 17, end_rod burst at 11 and 13
  spire(g, 35, 2, { y0: 2 });
}
