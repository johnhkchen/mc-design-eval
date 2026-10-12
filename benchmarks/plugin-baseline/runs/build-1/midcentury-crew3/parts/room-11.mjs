// ROOM master bedroom (interior designer): air box [23,2,22,30,4,24], floor y=2 (spruce_planks at y=1).
// Layout (x 23..30 across, z 22..24 down; the doorway is north at x=23..24, the slider south at x=26..27):
//   - orange bed on the north wall (head z=22, foot z=23, headboard = the partition at z=21), birch/fence nightstands
//   - wardrobe wall on the west (x=23, z=23..24, fronts facing east), a 2x2 orange rug in front of the bed
//   - egg chair in the east corner facing the glass (seat (30,23)), the reading corner; its open side is west
//   - three hung lanterns down the room's centre line: entry, bed (focal), chair; a potted cactus by the chair
// Lane: the cell south of the bed's foot (27,24) stays clear so the slider and the bed are on one path.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hung_lantern, bed_double, egg_chair, wardrobe } from "../vocab.mjs";

export function build(g) {
  // the bedroom floor at y=1 (shell's spruce fill is a no-op: it passes a 6-cell array where its helper takes two corners).
  // Air only, so this is a no-op wherever the shell does lay it.
  for (let x = 23; x <= 30; x++) for (let z = 22; z <= 24; z++) if (g.isAir(x, 1, z)) g.set(x, 1, z, "spruce_planks");
  // rug and potted plant (x 23..30 across, rows z=22..24); '.' is not in the legend, so it is skipped
  layers(g, [23, 2, 22], { C: "orange_carpet", P: "potted_cactus" }, ["......P.", "..CC....", "..CC...."]);
  // orange bed: foot (27,23), head (27,22), nightstands (26,22) and (28,22); the headboard is the partition (skipped)
  bed_double(g, 27, 23, "north", "orange");
  // wardrobe wall on the west, two cells long along z, fronts facing east
  wardrobe(g, 23, 23, 2, "z", "east");
  // egg chair in the east corner, seat facing the glass; its open side is west, so the seat is reachable
  egg_chair(g, 30, 23, "east");
  // hung lanterns: entry, bed (focal, brightest), chair
  for (const x of [24, 27, 30]) hung_lantern(g, x, 23, 4);
}
