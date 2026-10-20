// Part 6 (P5): clock faces and lights. Four clock faces on the shaft (plan.md: centre y63, radius 4, N x23 z0, S x23 z16,
// W x15 z8, E x31 z8), the bell hung in belfry 1, the flagpole, and lanterns: one hung under each arcade arch crown, down
// the nave centre line from the roof, and one in belfry 2 and in the lantern stage. Writes only into air.
import { bell, flag, hangLamp } from "../vocab.mjs";

// Arcade arch centres (plan.md OPENINGS): plot 0 arches 1..6 and 41..46, plot 1 49..54 and 57..62, plot 2 65..70 and 73..78.
const ARCH_CENTRES = [3, 43, 51, 59, 67, 75];

// Nave centre line (plan.md: nave z 15..63, centre z 39) and the x columns of the trusses (x mod 8 == 4).
const NAVE_Z = 39;
const NAVE_XS = [4, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92];

// A lamp that finds nothing to hang from is reported, not thrown: the roof and tower may not be in place yet.
const lamp = (g, x, y, z, o) => {
  const r = hangLamp(g, x, y, z, o);
  if (r.refused.length) console.log(`  lamp at ${x},${y},${z} not hung: ${r.reason}`);
};

export function build(g) {
  // The clock faces are laid by the tower part (v2): their glowstone sits in the shaft wall, which is the tower's.

  // The bell in belfry 1 (bell column x23 z8, y76..80) and the flagpole on the tower's top (plan: y100..103).
  bell(g, 23, 77, 8, { facing: "south" });
  flag(g, 23, 100, 8);

  // Arcade walk lanterns: hung from the walk's ceiling (y12), one under each arch crown.
  for (const x of ARCH_CENTRES) lamp(g, x, 10, 6);

  // Nave: lanterns hung down the centre line every 8 x, from the roof (or the trusses' ties if they are there).
  for (const x of NAVE_XS) lamp(g, x, 25, NAVE_Z, { maxChain: 12 });

  // v2 lamplighter: the rooms check only covered plot 1; light the rest so no mob spawns inside.
  const isAir = (x, y, z) => /air$/.test(g.blockAt(x, y, z));
  const WALL = { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" };
  // a lamp post on a floor at y: stone_brick_wall y..y+1, standing lantern on top (only where all three cells are air)
  const post = (x, y, z) => {
    if (![0, 1, 2].every((d) => isAir(x, y + d, z))) return;
    g.set(x, y, z, "stone_brick_wall", WALL); g.set(x, y + 1, z, "stone_brick_wall", WALL);
    g.set(x, y + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  };
  const inPlot1 = (x) => x >= 48 && x <= 63;           // plot 1 is lit by its room part; its tile stays as it was
  // nave floor (plots 0 and 2): posts every 8 x on the truss lines, rows clear of the stall rows and the centre aisle
  for (let x = 4; x <= 99; x += 8) if (!inPlot1(x)) for (const z of [19, 28, 34, 44, 50, 59]) post(x, 1, z);
  // (plot 0's bay hall gets its posts from the shell, whose carve owns that air)
  // galleries (deck y12, stand y13): a standing lantern against the wall every 8 x, all plots (repeats every 8)
  for (let x = 4; x <= 99; x += 8) for (const z of [15, 63]) if (isAir(x, 13, z)) g.set(x, 13, z, "lantern", { hanging: "false", waterlogged: "false" });
  // arcade walks of plots 0 and 2 and the corner block's walk: lanterns hung low (y8) every 4 x from the walk ceiling
  for (const [a, b, z] of [[0, 8, 6], [38, 47, 6], [64, 80, 6], [82, 98, 6]]) for (let x = a; x <= b; x++) if (x % 4 === 0) lamp(g, x, 8, z);

  // the attic under plot 2's new bay-hall roof (deck y26, ridge y30 at z71): lanterns on the deck along the ridge
  for (const x of [68, 76, 84, 92, 98]) if (isAir(x, 27, 71)) g.set(x, 27, 71, "lantern", { hanging: "false", waterlogged: "false" });

  // Belfry 2 and the lantern stage, hung from their ceilings.
  lamp(g, 23, 84, 8);
  lamp(g, 23, 92, 8);
}
