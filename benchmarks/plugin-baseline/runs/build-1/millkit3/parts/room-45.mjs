// P7 east bedroom back: upper back bedroom, bed head on the east wall (x 94). Inner air x 92..93, z 14..15, y 8..11.
// Entered through the door at (93, 8..9, 13) onto (93, 8, 14), which stays clear. The bed runs east-west along z 15
// (foot (92, 8, 15), head (93, 8, 15) against the east wall). A barrel dresser stands in the back corner at (92, 8, 14)
// with a lantern on its top face, the room's one light.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // The bed: foot at x 92, head one step east against the solid east wall.
  bed(g, [92, 8, 15], "east", "orange");

  // Dresser and its lantern, drawn as text. Rows run along +x, successive rows along +z (z 14 then z 15).
  // y 8: barrel (open top, facing up) at (92, 8, 14); the bed cells and the door cell stay as they are.
  layers(g, [92, 8, 14], { B: ["barrel", { facing: "up" }] }, [
    ["B."],
  ]);
  // y 9: standing lantern on the barrel top (hanging false, so it stands on the barrel).
  layers(g, [92, 9, 14], { L: ["lantern", { hanging: "false" }] }, [
    ["L."],
  ]);
}
