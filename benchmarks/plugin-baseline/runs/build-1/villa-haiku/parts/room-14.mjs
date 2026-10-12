// villa-haiku: room 14, the triclinium (plan.md ROOMS; inner air x12..23, y2..5, z42..46).
// Dining room: couches on three sides (W x13, E x22, S z45) of dark_oak_stairs facing the table, red_carpet cushions in front;
// a low table at the centre on quartz pillar stubs (dark_oak_slab tops); four standing lanterns in the corners; two potted plants.
// The doorway (x16..19, z41) and the z42 row stay clear; nothing sits over the windows (x14..15 and x20..21, z47).
import { couch, lamp, pot, PILLAR } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

/** table: a low table over the box: quartz_pillar stubs at y2, dark_oak_slab bottom tops at y3. */
function table(g, [x0, z0, x1, z1]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    g.set(x, 2, z, ...B.pillar(PILLAR, "y"));
    g.set(x, 3, z, ...B.slab("dark_oak", "bottom"));
  }
  return g;
}

export function build(g) {
  // couches: W and E first, then S, so the S couch's end seats (x14 and x21 at z45) win over the side cushions
  couch(g, [13, 43, 13, 45], "east");        // W couch: seats face the table
  couch(g, [22, 43, 22, 45], "west");        // E couch
  couch(g, [14, 45, 21, 45], "north");       // S couch, cushions at z44
  table(g, [17, 43, 18, 44]);                // the focal piece, centred on the axis
  // light: a lantern on each corner of the room, clear of the doorway and the walking lines
  lamp(g, 12, 42);
  lamp(g, 23, 42);
  lamp(g, 12, 46);
  lamp(g, 23, 46);
  pot(g, 13, 46, "fern");
  pot(g, 22, 46, "azalea");
  return g;
}
