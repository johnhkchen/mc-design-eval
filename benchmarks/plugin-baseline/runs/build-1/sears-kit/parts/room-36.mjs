// Room "P4 north-west bedroom" (interior designer's part): a bedroom, interior box x69..71 z14..17, floor layer y5
// (feet y6). The bed's head is on the north wall (z13, solid at x70..71) so no window or door is behind it; the
// doorway is on the east (x72, z15), so the x71 column stays clear as the lane from the door to the bed. The
// west side (x68, z15..17) is the stair hole of the stair joiner, outside this box, so nothing here leans on it.
// Light: a lantern standing on the barrel nightstand by the bed (the focal light), and a lit candle on the desk.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // feet level y6: chest dresser (69,14), bed foot (70,15) with head (70,14) against the north wall, barrel nightstand
  // (69,15), red rug (69..70,16), desk fence (70,17) with a stair chair (69,17) facing it. x71 is the lane: left clear.
  layers(g, [69, 6, 14], {
    c: ["chest", { facing: "south", type: "single" }],
    b: ["barrel", { facing: "up", open: "false" }],
    r: "red_carpet",
    f: "oak_fence",
    s: ["oak_stairs", { facing: "west", half: "bottom", shape: "straight" }],
  }, [
    ["c..",   // z14
     "b..",   // z15
     "rr.",   // z16
     "sf."],  // z17
  ]);

  // the bed: foot at (70,6,15), head one step north at (70,6,14), against the solid north wall
  bed(g, [70, 6, 15], "north", "red");

  // feet+1 (y7) on the furniture tops: lantern on the barrel nightstand, lit candle on the desk fence
  layers(g, [69, 7, 14], {
    L: ["lantern", { hanging: "false" }],
    c: ["candle", { candles: "1", lit: "true" }],
  }, [
    ["...",   // z14
     "L..",   // z15
     "...",   // z16
     ".c."],  // z17
  ]);
}
