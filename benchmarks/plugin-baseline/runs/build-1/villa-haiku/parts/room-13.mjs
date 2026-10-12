// room: culina (kitchen), plan.md ROOMS and elements E16. Inner air box [27,2,9,34,5,13]; door (26, 2..3, 10) from the atrium.
// Layout: the hearth is the focal piece in the north-west half, the stores (barrels) run along the north wall beside it,
// the stone-brick counter runs down the east wall under the window, a worktable sits in the middle, lamps and a pot in the
// south-west and south-east corners. Every workstation is reached from the door by a 2-high clear path (z10 row, then z12).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { PILLAR, STONE_BRICKS, HEARTH, SMOKER, BARREL, TABLE_SLAB, lamp, pot } from "../vocab.mjs";

export function build(g) {
  // hearth: campfire (lit) in the corner of a stone-brick pad. The pad is at y2 because y1 is the shell's floor layer.
  g.set(31, 2, 10, HEARTH, { lit: "true", facing: "south", signal_fire: "false", waterlogged: "false" });
  for (const [x, z] of [[32, 10], [31, 11], [32, 11]]) g.set(x, 2, z, STONE_BRICKS);
  g.set(32, 2, 9, SMOKER, { facing: "south", lit: "false" });

  // stores: three barrels along the north wall, by the hearth
  for (const x of [27, 28, 29]) g.set(x, 2, 9, BARREL, { facing: "up", open: "false" });

  // counter along the east wall: stone bricks with a slab worktop
  for (let z = 9; z <= 13; z++) {
    g.set(34, 2, z, STONE_BRICKS);
    g.set(34, 3, z, ...B.slab("stone_brick", "bottom"));
  }

  // worktable in the middle: a dark oak slab on a quartz pillar stub
  g.set(29, 2, 12, PILLAR, { axis: "y" });
  g.set(29, 3, 12, TABLE_SLAB, { type: "bottom", waterlogged: "false" });

  // light: standing lanterns in the two south corners; one flower pot beside the south-west lamp
  lamp(g, 27, 13);
  lamp(g, 33, 13);
  pot(g, 27, 12, "fern");
  return g;
}
