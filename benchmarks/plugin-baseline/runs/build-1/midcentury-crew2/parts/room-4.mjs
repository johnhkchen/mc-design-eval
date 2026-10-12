// ROOM living (interior designer): the show room. Air box x=11..21, y=2..4, z=19..24. The conversation pit (x=13..17,
// z=20..23, floor y=0) is sunk one block; the fireplace (x=20..21, z=21..22) is built by the roof part and kept clear.
// Layout: sideboard on the west wall, orange sofas facing into the pit from the west and east, an egg chair by the
// atrium glass on the north row, a floor lamp in the corner, panelling on the x=22 partition, lanterns on the beams.
// Walkways kept clear: the dining opening (z=18/19), the atrium doors (19..20, z=19), the corridor doorway (21, z=19..20)
// and the south sliders (14..15 and 20..21, z=24).
import { conversation_pit, sofa_low, egg_chair, sideboard, panel_wall } from "../vocab.mjs";

// write one block into air only (earlier parts' blocks are never touched)
const put = (g, x, y, z, block, state) => {
  if (g.isAir(x, y, z)) g.set(x, y, z, block, state);
};

export function build(g) {
  // the sunken pit: rim benches at y=1 with orange cushions, the coffee table in the middle
  conversation_pit(g, 13, 20, 17, 23);

  // orange low sofas: west one faces east into the pit, east one faces west into the pit
  sofa_low(g, 11, 21, 3, "z", "east");
  sofa_low(g, 18, 21, 3, "z", "west");

  // egg chair on the north row, seat facing the atrium glass
  egg_chair(g, 18, 19, "north");

  // sideboard on the west wall, cabinet fronts facing into the room
  sideboard(g, 11, 19, 2, "z", "east");

  // floor lamp in the north-west corner: spruce fence post with a lantern on top
  put(g, 12, 2, 19, "spruce_fence");
  put(g, 12, 3, 19, "lantern", { hanging: "false" });

  // wood panelling on the x=22 partition, either side of the corridor doorway's south end
  panel_wall(g, 21, 2, 4, 23, "east");
  panel_wall(g, 21, 2, 4, 24, "east");

  // lanterns hung from the beams (y=5): the room is lit by these and the fireplace's campfires
  put(g, 13, 4, 23, "lantern", { hanging: "true" });
  put(g, 16, 4, 21, "lantern", { hanging: "true" });
  put(g, 19, 4, 22, "lantern", { hanging: "true" });
}
