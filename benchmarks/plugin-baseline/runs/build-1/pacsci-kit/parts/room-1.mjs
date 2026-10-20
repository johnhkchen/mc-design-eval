// Part "room: main lobby and exhibit hall": interior designer's fit-out inside ROOM_BOX.lobby = [41,1,25,142,9,50].
// Focal piece: the ticket desk across the view from the main door (x 50, z 42..48), lit by two standing lanterns.
// Exhibit plinths (quartz pillar + standing lantern) on a 6-cell grid: every floor cell within 6 of a lantern, so the
// hall reads at 8+ light from the floor up. Benches (smooth_quartz stairs as seats) along the south wall; two blue
// wall banners on the north wall. The stair foot (x 41..44, z 25..34) and both doorways stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const PLINTH_X = [45, 51, 57, 63, 69, 75, 81, 87, 93, 99, 105, 111, 117, 123, 129, 135, 141];
const PLINTH_Z = [27, 33, 39, 45, 50];

export function build(g) {
  // Ticket desk (focal): one full quartz block high, seven long, facing the main door.
  for (let z = 42; z <= 48; z++) g.set(50, 1, z, "smooth_quartz");
  g.set(50, 2, 42, "lantern", { hanging: "false", waterlogged: "false" });
  g.set(50, 2, 48, "lantern", { hanging: "false", waterlogged: "false" });

  // Exhibit plinths with a standing lantern each (the room's light).
  for (const x of PLINTH_X) for (const z of PLINTH_Z) {
    // The desk's own cells and its neighbours stay as they are.
    if (x === 51 && z >= 42 && z <= 48) continue;
    g.set(x, 1, z, ...B.pillar("quartz_pillar"));
    g.set(x, 2, z, ...B.lantern(false));
  }

  // Bench row on the south wall: seats face north, backs to the wall.
  for (let x = 112; x <= 116; x++) g.set(x, 1, 49, ...B.stairs("smooth_quartz", "south", "bottom"));

  // Two blue wall banners on the north wall, facing into the room.
  g.set(58, 6, 25, ...B.banner("blue", [], { wall: true, facing: "south" }));
  g.set(66, 6, 25, ...B.banner("blue", [], { wall: true, facing: "south" }));
}
