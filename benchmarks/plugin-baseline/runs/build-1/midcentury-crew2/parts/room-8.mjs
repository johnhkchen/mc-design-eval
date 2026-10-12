// ROOM bath 1 (interior designer): hall bath, white quartz, windowless. Air box [26,2,14,27,4,16]; door (25,2..3,15).
// The room is 2 wide x 3 deep, so it is one bath_fit-style layout: tub on the north row (back to the wall), a clear
// lane on the middle row (the door opens onto it), basin and WC on the south row. Every fixture touches the lane.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// floor plan at y=2, origin = the air box's north-west corner [26,2,14]; rows along +z, columns along +x
const FLOOR = [
  "TT",   // z=14: tub (two stairs, low side into the room, back on the north partition)
  "..",   // z=15: clear lane from the doorway (25,15)
  "BW",   // z=16: basin (cauldron) at x=26, WC (stairs) at x=27
];

const LEGEND = {
  T: B.stairs("smooth_quartz", "south", "bottom"),
  B: B.block("cauldron"),
  W: B.stairs("smooth_quartz", "north", "bottom"),
};

export function build(g) {
  // the floor layout at y=2
  layers(g, [26, 2, 14], LEGEND, [FLOOR]);
  // mirror over the basin (a freestanding pane in air; the walls around the room are locked partitions)
  g.set(26, 3, 16, ...B.block("glass_pane"));
  // the one light: a sea lantern on the tub's back cell against the north wall (y=3, standing on the tub stair so it
  // has support), clear of the lane and the doorway
  g.set(26, 3, 14, ...B.block("sea_lantern"));
}
