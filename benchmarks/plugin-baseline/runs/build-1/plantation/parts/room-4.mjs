// Part: room: west ground corridor. Plain passage, z51..52 between the hall (x44) and the garden door (x26).
// Console on the north wall (z51, x33..35) with a lit candle, lantern and pot; a barrel and pot by the west end;
// a red runner along z52, which is the walking lane. Hanging lanterns every 4 cells down the lane (x28, 32, 36, 40).
// Lane cells: z51 at x29,30,40,41 (north doorways) and z52 everywhere (south doorways and both ends) stay clear of furniture.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [27, 4, 51]; // x27..43, z51..52 (room box inner air)
const LEGEND = {
  b: "barrel",
  o: "flower_pot",
  f: "dark_oak_fence",
  p: "dark_oak_planks",
  c: ["candle", { candles: "2", lit: "true" }],
  l: ["lantern", { hanging: "false" }],
  L: ["lantern", { hanging: "true" }],
  C: ["iron_chain", { axis: "y" }],
  r: "red_carpet",
};

const EMPTY = ".".repeat(17);
const RUNNER = "r".repeat(17);

// rows along +x (x27..43), first row z51 (north), second row z52 (the lane)
const LAYERS = [
  // y4: barrel by the west end, console legs at x33 and x35, runner on the lane
  [".b....f.f........", RUNNER],
  // y5: flower pot on the barrel, console top (dark oak planks) x33..35
  [".o....ppp........", EMPTY],
  // y6: candle, standing lantern (the focal light) and a pot on the console
  ["......clo........", EMPTY],
  // y7: air
  [EMPTY, EMPTY],
  // y8: hanging lanterns down the lane every 4 cells
  ["...............L.", ".L...L...L...L..."],
  // y9: chains from the upper floor
  ["...............C.", ".C...C...C...C..."],
];

// Parked: the mansion shell carves all 204 corridor cells (x27..43, y4..9, z51..52) to air, and runParts locks air
// too, so every furnishing cell above was refused (37 writes). Nothing here is free to place. To bring the layout
// back, call layers(g, ORIGIN, LEGEND, LAYERS) once the shell leaves interior air unowned.
// Lamplighter: two standing lanterns on the north side of the corridor, at x31 and x38 (z51), clear of the north doorway
// cells (x29, 30, 40, 41) and of the lane (z52). A standing lantern is 15 at its own cell and falls off one per block, so
// these two put every floor cell in the room at 8 or more (one lantern leaves x27 at 7).
export function build(g) {
  for (const x of [31, 38]) g.set(x, 4, 51, ...B.lantern(false));
}
