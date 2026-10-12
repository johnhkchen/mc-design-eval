// ROOM dining (interior designer): table for six under the raised vault, birch chairs, a birch sideboard under the west
// window, a pendant lantern hung from the beam on x=13. Box [11,2,14,15,4,18]: floor y=2, air y=2..4.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { sideboard, dining_set } from "../vocab.mjs";

export function build(g) {
  // sideboard against the west wall, under the dining window (x=10, z=14..16): cabinet fronts face the room (east)
  sideboard(g, 11, 14, 3, "z", "east");
  // table for six: spruce top at x=13..14, z=15..17; birch stairs as chairs (two north, two south, one west, one east)
  dining_set(g, 13, 15);
  // pendant lantern hung from the beam on x=13 (part 3 lays the beam at y=5). dining_set places this only when the beam
  // is already there, so place it here too: over the table's centre, lit from above the focal piece
  if (g.isAir(13, 4, 16)) g.set(13, 4, 16, ...B.lantern(true));
}
