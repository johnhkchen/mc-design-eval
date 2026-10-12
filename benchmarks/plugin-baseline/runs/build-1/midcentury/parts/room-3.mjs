// ROOM dining (interior designer): dining box [11,2,14,15,4,18]. Floor y=1 is the shell's terrazzo; this module fills
// air at y=2..4 only. Layout (x 11..15, z 14..18): sideboard on the west wall under the window (x=11, z=15..16);
// table x=12..14, z=15..16 on spruce fence legs with a spruce slab top; three birch-stair chairs each side (north row
// z=14 facing south, south row z=17 facing north); pendant lantern hung from the x=13 beam over the table. The
// clear lane is x=15 (north entry to south entry) and the z=14 / z=18 rows the kitchen and living open onto.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hung_lantern, panel_wall } from "../vocab.mjs";

const put = (g, x, y, z, block, state) => g.set(x, y, z, block, state);

export function build(g) {
  // sideboard under the west window: planks body at y=2, slab top at y=3
  for (const z of [15, 16]) {
    put(g, 11, 2, z, ...B.block("spruce_planks"));
    put(g, 11, 3, z, ...B.slab("spruce", "bottom"));
  }

  // spruce panelling on the west wall, south of the sideboard (z=17 only: z=18 stays the living opening)
  panel_wall(g, 11, 2, 4, 17, "west");

  // table: fence legs under all six cells (y=2), spruce slab top (y=3)
  for (const x of [12, 13, 14]) for (const z of [15, 16]) {
    put(g, x, 2, z, ...B.fence("spruce"));
    put(g, x, 3, z, ...B.slab("spruce", "top"));
  }

  // chairs: north row (z=14) faces south, south row (z=17) faces north
  for (const x of [12, 13, 14]) {
    put(g, x, 2, 14, ...B.stairs("birch", "south", "bottom"));
    put(g, x, 2, 17, ...B.stairs("birch", "north", "bottom"));
  }

  // pendant lantern hung from the x=13 beam over the table centre
  hung_lantern(g, 13, 15, 4);
}
