// Part 5: Site. The lot outside the walls: gray-concrete driveway (flared at the street), polished-andesite walk to the
// portico steps (the steps themselves are P4's), foundation shrubs on the front lawn, a young oak, the spruce back deck,
// a lamp post and a mailbox at the street edge. Ticks elements 15..19, 21, 27. Lawn (16) is the grass the build lays down.
// Only adds into air (or replaces the lawn at y0 where a surface goes). Front = north (z0 is the street).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  POLISHED_ANDESITE, SPRUCE_FENCE, PATH,
  driveway, shrub, youngTree, deck, lamp,
} from "../vocab.mjs";

// Foundation shrubs on the front lawn (plan Notes / elements 17): in front of the main block and of the bay.
const SHRUBS = [[20, 6], [22, 6], [24, 6], [36, 6], [42, 6], [37, 3], [39, 3], [41, 3]];

// Mailbox at the street edge (elements 27): a spruce post with a closed iron trapdoor on top.
const MAILBOX = { x: 33, z: 0 };
const LAMP = { x: 29, z: 0 };

// Back-yard lamp posts (plan frame): the lawn behind the garage has no light source, so it reads dark (mobs spawn).
const BACK_LAMPS = [[3, 26], [9, 28], [23, 30]];

/** Polished-andesite walk from the street to the portico steps, x30..31 z0..2 on the lawn. */
function walk(g) {
  g.fill([PATH.x0, 0, PATH.z0], [PATH.x1, 0, PATH.z1], POLISHED_ANDESITE);
}

/** Closed mailbox: spruce post at y1 under a closed iron trapdoor at y2. */
function mailbox(g) {
  g.set(MAILBOX.x, 1, MAILBOX.z, SPRUCE_FENCE);
  g.set(MAILBOX.x, 2, MAILBOX.z, ...B.trapdoor("iron", "north", "bottom", false));
}

export function build(g) {
  driveway(g);
  walk(g);
  for (const [x, z] of SHRUBS) shrub(g, x, z);
  youngTree(g);
  deck(g);
  lamp(g, LAMP.x, LAMP.z);
  for (const [x, z] of BACK_LAMPS) lamp(g, x, z);
  mailbox(g);
}
