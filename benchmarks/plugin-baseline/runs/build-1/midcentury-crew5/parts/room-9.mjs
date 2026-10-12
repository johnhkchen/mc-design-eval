// ROOM bath 2 (interior designer): en-suite for bedroom 2, white quartz. Inner air box [29,2,14,30,4,16]; the doorway is
// (29,2..3,17) from bedroom 2. The 2x3 floor is drawn with layers() from `mcd plan` (origin [29,2,14]):
//   north row z=14: cauldron basin (29) and a quartz stair WC (30), its back to the north wall, facing the room;
//   z=15: the clear walking row, the only way between the basin, the WC and the door;
//   z=16: a glass shower stall at (30,2..4,16), open toward the doorway at (29,16).
// Light: two lanterns hung at y=4 from a spruce ceiling patch at y=5 (the room is open to the vault above z=14..19, so the
// patch is what they hang from); no floor lamps (the floor is too tight: (29,15) and (30,15) are the only walking cells).
// The palette has no wall torch or shower fitting.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // ceiling patch over the bath, so the hung lanterns have a block above them
  for (let x = 29; x <= 30; x++) for (let z = 14; z <= 16; z++) g.set(x, 5, z, "spruce_planks");
  layers(g, [29, 2, 14], {
    B: "cauldron", // basin, the focal piece
    Q: ["quartz_stairs", { facing: "north" }], // WC: back to the wall, seat toward the room
    G: "glass_pane", // shower stall, glass on the corner cells
    L: ["lantern", { hanging: "true" }], // bath light, hung from the ceiling patch
  }, [
    // y=2 (standing height)
    ["BQ", "  ", " G"],
    // y=3
    ["  ", "  ", " G"],
    // y=4 (head height, clear of the walking path)
    [" L", "L ", " G"],
  ]);
}
