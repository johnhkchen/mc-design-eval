// Room 5: kitchen (plan.md ROOMS, E23). Inner air x14..24, y2..4, z19..24; open west to the family room (no wall at x13|x14).
// Ways in: foyer (15..18,2..3,18), dining (23,2..3,18), mudroom (25,2..3,21), deck doors (16..17,2..3,25). Front = north.
// Layout: white base cabinets with dark counter tops along the north and south walls; range (smoker) + hood on the north wall
// over the counters; the sink (water cauldron) under the back window; iron fridge and barrel pantry on the east wall; a 2x4
// island at x15..16 z20..23 with stools on its east side facing west toward the family room. Lanterns stand on the
// counters and the island for light. The x14 column and the z24 row at x16..17 stay clear so every way in reaches the room.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const CABINET = "quartz_block";
const COUNTER = "dark_oak";

export function build(g) {
  // base cabinet at y2, dark counter top (bottom slab) at y3
  const cabinet = (x, z) => {
    g.set(x, 2, z, ...B.block(CABINET));
    g.set(x, 3, z, ...B.slab(COUNTER, "bottom"));
  };
  // base cabinet with nothing on top (a lantern or the sink goes there)
  const base = (x, z) => g.set(x, 2, z, ...B.block(CABINET));

  // north run z19: cabinets, range at x20, lanterns on the counter, fridge in the NE corner
  cabinet(19, 19);
  base(19, 19); g.set(19, 3, 19, ...B.lantern(false));
  g.set(20, 2, 19, "smoker", { facing: "south", lit: "false" });
  cabinet(21, 19);
  base(22, 19); g.set(22, 3, 19, ...B.lantern(false));
  for (const hood of [19, 20, 21]) g.set(hood, 4, 19, ...B.trapdoor("iron", "south", "top", true));
  // iron fridge: 2 wide, 2 high, on the east wall at z19..20
  for (const z of [19, 20]) for (const y of [2, 3]) g.set(24, y, z, ...B.trapdoor("iron", "west", "bottom", true));

  // east wall: barrel pantry at z22..23 (z21 stays clear for the mudroom door)
  for (const z of [22, 23]) for (const y of [2, 3]) g.set(24, y, z, "barrel", { facing: "up", open: "false" });

  // south run z24 (deck doors at x16..17 stay clear): lantern, cabinets, sink under the back window at x21
  base(18, 24); g.set(18, 3, 24, ...B.lantern(false));
  cabinet(19, 24);
  cabinet(20, 24);
  g.set(21, 2, 24, "water_cauldron", { level: "3" });
  cabinet(22, 24);
  cabinet(23, 24);
  cabinet(24, 24);

  // island x15..16 z20..23: white base, dark top; two standing lanterns on the top
  for (let z = 20; z <= 23; z++) for (let x = 15; x <= 16; x++) {
    base(x, z);
    if (!((x === 15 && z === 21) || (x === 16 && z === 22))) g.set(x, 3, z, ...B.slab(COUNTER, "bottom"));
  }
  g.set(15, 3, 21, ...B.lantern(false));
  g.set(16, 3, 22, ...B.lantern(false));

  // stools on the island's east side (x17), seats facing west toward the family room: stair facing = the back, east
  for (let z = 20; z <= 23; z++) g.set(17, 2, z, ...B.stairs(COUNTER, "east", "bottom"));
}
