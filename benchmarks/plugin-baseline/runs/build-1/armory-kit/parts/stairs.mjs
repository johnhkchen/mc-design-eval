// Stair joiner: the Armory flights F1..F3 are laid by the shell; this adds pavilion D's upper floor and its stair.
import { flight } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // D upper floor (y7) inside the walls x138..205 z98..117, laid here so the stairwell can be cut through it
  g.fill([138, 7, 98], [139, 7, 117], "smooth_stone");
  g.fill([142, 7, 98], [205, 7, 117], "smooth_stone");
  g.fill([140, 7, 106], [141, 7, 117], "smooth_stone");
  // flight x140..141 (width 2), from z99 walking south, y0 -> floor y7
  flight(g, { from: [140, 1, 99], facing: "south", to: 7, material: "polished_andesite", width: 2 });
  // rail round the opening on the upper floor, leaving the top step (z105) open
  for (const z of [99, 100, 101, 102, 103, 104]) g.set(139, 8, z, "iron_bars");
  g.set(142, 8, 99, "iron_bars");
  for (let z = 99; z <= 104; z++) g.set(142, 8, z, "iron_bars");
  g.set(140, 8, 98, "iron_bars"); g.set(141, 8, 98, "iron_bars");
  g.set(140, 7, 98, "smooth_stone"); g.set(141, 7, 98, "smooth_stone");
}
