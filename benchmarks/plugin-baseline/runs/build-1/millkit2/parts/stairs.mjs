// Part: Stairs. Flights per plan RESERVED: plot 1 x19 z11..15; plot 2 x30 z10..14; plot 4 z15 x57..53.
import { stair_run } from "../vocab.mjs";
import { flight } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Plot 1: z13 at x18 is the hump wall, so only the z14 rail cell is free.
  flight(g, { from: [19, 3, 11], facing: "south", to: 7, material: "spruce" });
  g.set(18, 8, 14, "spruce_fence");
  stair_run(g, [30, 3, 10], "south", 7, "pale_oak", 1, { carve: true });
  // Plot 4: no rail. stair_run's rail sat on z14 at x54..55, the only lane from the landing to the east bunk door (x56 z13).
  flight(g, { from: [57, 3, 15], facing: "west", to: 7, material: "spruce", width: 1 });
}
