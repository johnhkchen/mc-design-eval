// Room "P7 kitchen" (interior designer's part): a 4 x 2 kitchen (x 121..124, z 19..20, feet y 2). The doorway from the
// dining room is (120, 2..3, 19), so its first cell (121, 19) stays clear. The focal piece is the lit stove run on the
// north wall (smoker, furnace, barrel), facing into the room, which the doorway looks straight at. The lane is z 20
// (x 121..123), so the stove front is reachable; a fence table with a pressure plate closes the south-east corner, and
// one hanging lantern from the bedroom floor (y 5) lights the room. Nothing is over the window at z 21 x 121..122.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  layers(g, [121, 2, 19], {
    S: ["smoker", { facing: "south", lit: "true" }],
    F: ["furnace", { facing: "south", lit: "true" }],
    B: ["barrel", { facing: "up", open: "false" }],
    f: "oak_fence",
    p: "oak_pressure_plate",
    P: "potted_poppy",
    L: ["lantern", { hanging: "true" }],
  }, [
    // y 2: the stove run and the table post (rows z 19, z 20; columns x 121..124)
    [" SFB", "   f"],
    // y 3: the flower pot on the barrel, the table top
    ["   P", "   p"],
    // y 4: the hanging lantern over the lane, under the bedroom floor
    ["    ", " L  "],
  ]);
}
