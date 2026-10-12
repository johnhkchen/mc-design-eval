// Part: room: Belfry (parts/room-11.mjs). Interior designer's build of the belfry box x19..21, y32..34, z11..13.
// The bell (x20 y34 z12, hung from the y35 beam) is the focal piece and belongs to the dressings part; the ladder
// comes up through x21 z13 and stays clear. The room is bare, so the furniture is one ringer's bench, one barrel for
// the bell ropes, and two lanterns for light. Drawn with layers(): rows run along +x from x19, successive rows along +z.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  s: ["dark_oak_stairs", { facing: "west", half: "bottom" }], // ringer's bench: full back on the west wall, seat faces east
  b: "barrel", // bell ropes, against the floor in the south-west corner
  L: ["lantern", { hanging: "false" }], // standing on the barrel
  H: ["lantern", { hanging: "true" }], // hung from the y35 ceiling
};

export function build(g) {
  // floor layer y32: bench on the west side, barrel in the south-west corner; x21 z13 is the ladder and stays blank
  layers(g, [19, 32, 11], LEGEND, [
    ["s..", "...", "b  "],
  ]);
  // y33: standing lantern on the barrel
  layers(g, [19, 33, 11], LEGEND, [
    ["   ", "   ", "L  "],
  ]);
  // y34: hanging lantern from the end of the y35 bell beam (x19 z12), beside the bell at x20 z12
  layers(g, [19, 34, 11], LEGEND, [
    ["   ", "H  ", "   "],
  ]);
}
