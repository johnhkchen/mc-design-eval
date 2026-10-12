// ROOM living (interior designer): the show room. Inner air x=11..21, y=2..4, z=19..24 (plan.md ROOMS).
// Layout: sunken conversation pit (x=13..17 z=20..23, floor y=0) with a coffee table; orange sofa on the west
// side facing the pit; egg chair on the north side facing the atrium glass; sideboard on the south wall; floor lamp
// in the south-east corner; spruce panelling on the inside of the x=22 partition; hung lanterns for light.
// The freestanding fireplace (x=20..21 z=21..22) is built by parts/roofs.mjs, so this part leaves those cells alone.
// Walkways kept clear: dining opening (x=11..15, z=19), atrium doors (x=19..20, z=19), corridor doorway (x=21, z=19..20),
// sliders (x=14..15 and x=20..21, z=24) and the row z=24 between them.
import {
  conversation_pit, sofa_low, egg_chair, sideboard, panel_wall, hung_lantern, coffee_table,
} from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // sunken pit with the coffee table at its centre (15,21); the shell already laid the pit floor at y=0, so skip that layer
  const noFloor = new Proxy(g, { get: (t, p) => (p === "set" ? (x, y, z, ...r) => (y === 0 ? t : t.set(x, y, z, ...r)) : Reflect.get(t, p)) });
  conversation_pit(noFloor, 13, 20, 17, 23);
  // low orange sofa on the west side of the pit, backrest at x=11, seating east toward the pit
  sofa_low(g, 12, 20, 4, "z", "east");
  // egg chair on the north side, seat facing the atrium glass at z=18
  egg_chair(g, 17, 19, "north");
  // sideboard along the south wall, under the sliders' side
  sideboard(g, 18, 24, 2, "x");
  // floor lamp in the south-east corner: spruce fence post with an end rod on top
  g.set(21, 2, 23, ...B.fence("spruce"));
  g.set(21, 3, 23, ...B.fence("spruce"));
  g.set(21, 4, 23, "end_rod");
  // spruce panelling on the inside of the x=22 partition (x=21, z=23..24; the fireplace and doorway cells stay clear)
  panel_wall(g, 21, 2, 4, 24, "west");
  // hung lanterns under the ceiling (y=5 spruce planks) for light; none over the doorways
  hung_lantern(g, 15, 21);
  hung_lantern(g, 12, 22);
  hung_lantern(g, 18, 22);
  hung_lantern(g, 14, 24);
}
