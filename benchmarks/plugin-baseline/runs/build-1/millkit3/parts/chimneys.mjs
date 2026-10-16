// Chimneys, hearths and ovens (plan.md RESERVED: stacks; ROOMS: stoves; FACADES: hearth mouths).
// Order: stoves first (they stand in the room cell in front of a mouth), then the mouth's hearth face (its brick step is
// refused where a stove already stands), then the stacks through the roofs, then the oven. chimney_stack writes its
// own mouth and lintel (cut: true lets them replace the house wall); everything else writes into air only.
import { chimney_stack, hearth_face, stove, bread_oven } from "../vocab.mjs";

// Back-wall and side-wall hearths: mouth cell, the room side it opens into, the stack's top course.
const HEARTHS = [
  // plot 0 double shotgun: twin back stack, one flue per unit
  { mouth: [4, 3, 16], into: "north", top: 10 },
  { mouth: [7, 3, 16], into: "north", top: 10 },
  // plot 1 Creole cottage: exterior gable-end chimney on the west wall (fire at x14)
  { mouth: [15, 3, 13], into: "east", top: 14 },
  // plot 2 American Foursquare: west side chimney (fire at x26)
  { mouth: [27, 3, 12], into: "east", top: 16 },
  // plot 3 Queen Anne: back chimney for the kitchen
  { mouth: [41, 3, 16], into: "north", top: 16 },
  // plot 4 gable-front-and-wing: back chimney on the wing
  { mouth: [51, 3, 16], into: "north", top: 12 },
  // plot 7 company duplex: two back stacks, one per unit
  { mouth: [87, 3, 16], into: "north", top: 15 },
  { mouth: [92, 3, 16], into: "north", top: 15 },
];

// Stoves by the hearths and in the kitchens (ROOMS), the front facing the room.
const STOVES = [
  [4, 3, 15, "north"],
  [7, 3, 15, "north"],
  [16, 3, 12, "east"],
  [31, 3, 15, "east"],
  [41, 3, 15, "north"],
  [52, 3, 15, "north"],
  [86, 3, 15, "north"],  // plot 7 west: in the corner, so the stair foot (88,3,15) is reached from (87,3,15)
  [93, 3, 15, "north"],  // plot 7 east: the mirror corner, reached from (92,3,15)
];

// Stack footprints (plan.md RESERVED): each gets a brick footing at y1..2 so the stack rests on the ground.
const FOOTINGS = [
  [3, 17, 8, 18], [13, 12, 14, 14], [25, 11, 26, 13], [40, 17, 42, 18],
  [50, 17, 52, 18], [86, 17, 88, 18], [91, 17, 93, 18], [74, 16, 76, 17],
];

export function build(g) {
  for (const [x0, z0, x1, z1] of FOOTINGS)
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (const y of [1, 2])
      if (g.isAir(x, y, z)) g.set(x, y, z, "bricks");
  for (const [x, y, z, facing] of STOVES) stove(g, x, y, z, facing);
  for (const h of HEARTHS) hearth_face(g, h.mouth[0], h.mouth[1], h.mouth[2], h.into);
  // no hearth step in front of the plot 7 mouths: the cell there is the way to each stair foot
  for (const [x, z] of [[87, 15], [92, 15]]) g.set(x, 3, z, "air");
  for (const h of HEARTHS) chimney_stack(g, { wall: h.mouth, into: h.into, top: h.top, material: "bricks", cut: true });
  // plot 6 bread oven: plinth x73..77 z14..17, mouth (75,2..3,14), fire (75,2,16); its stack rises from the back.
  bread_oven(g, 73, 14, 1);
  // the vault's crown must not wall the oven's flue: the flue cell stays air for the stack (plan.md OVEN rule)
  for (const y of [3, 4]) g.set(75, y, 16, "air");
  chimney_stack(g, { at: [75, 2, 16], open: "north", top: 8, material: "bricks" });
  // the flue is walled on all four sides from y3: its sides and the chamber's back course above the fire (at y4 the
  // vault's full bricks are shell B's)
  for (const [x, z] of [[74, 16], [76, 16], [75, 15]]) if (g.isAir(x, 3, z)) g.set(x, 3, z, "bricks");
}
