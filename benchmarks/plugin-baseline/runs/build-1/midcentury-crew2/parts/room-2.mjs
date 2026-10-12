// ROOM kitchen (interior designer): a galley along the north wall (fridge, white counter, hob, sink, oven, upper spruce
// cabinets), a breakfast bar on the south side with birch-slab stools, an orange backsplash, a potted cactus on the bar and
// two hung lanterns. Everything stays inside the room box [11,2,9,15,4,13]. The walkway along z=10 keeps the utility door
// (10,2..3,10) and the gallery opening (x=16, z=9..10) clear; the bar leaves x=11 and x=15 open at z=12 so the room runs
// from the north side through to the dining opening on z=14.
import { galley_kitchen, hung_lantern } from "../vocab.mjs";
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // galley: fridge at x=11, counter x=12..15 on z=9, hob/sink/oven on the counter at y=3, upper cabinets at y=4;
  // breakfast bar at z=12 with stools on z=11 (facing south, into the room)
  galley_kitchen(g, 11, 15, 9, 12, "south", 2);
  // the helper's stools are birch slabs; swap them for birch stairs so they read as seats (low side faces the bar)
  for (let x = 12; x <= 14; x++) g.set(x, 2, 11, "birch_stairs", { facing: "south", half: "bottom", shape: "straight" });

  // accents: an orange backsplash cell behind the counter, and a potted cactus on the bar
  layers(g, [11, 3, 9], { O: "orange_concrete", P: "potted_cactus" }, [
    [".O...", ".....", ".....", ".....", "....."],
    [".....", ".....", ".....", "..P..", "....."],
  ]);

  // light: lanterns hung over the walkway (from the beam at x=13 and the ceiling at x=11) and the bar end (x=11, z=12)
  hung_lantern(g, 13, 10);
  hung_lantern(g, 11, 10);
  hung_lantern(g, 11, 12);
}
