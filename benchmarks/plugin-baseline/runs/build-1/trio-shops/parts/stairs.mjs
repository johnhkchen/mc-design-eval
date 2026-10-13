// Part: stairs and ladders. Per house: flight 1 (2 wide, rising south, z 12..17, y 2..7) to the y 8 landing; flight 2
// (1 wide, rising north, z 19..15, y 9..13) to the y 13 landing; ladder y 14..18 to the loft hatch. The shell has
// already opened the wells and the hatch; this lays the steps, rails and ladders.
import { stair_flight } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const HOUSES = [
  { f1: [35, 36], f2: 34, ladder: "east", rail1: 34 },   // H1
  { f1: [23, 24], f2: 22, ladder: "east", rail1: 22 },   // H2
  { f1: [2, 3], f2: 4, ladder: "west", rail1: 4 },       // H3 (mirrored)
];

export function build(g) {
  for (const h of HOUSES) {
    const [x0, x1] = h.f1;
    stair_flight(g, x0, x1, 12, 17, 2, "south");
    stair_flight(g, h.f2, h.f2, 19, 15, 9, "north");
    // rails on the floor above the wells, top step left open
    for (let z = 12; z <= 15; z++) g.set(h.rail1, 9, z, ...B.fence("dark_oak"));
    for (let x = x0; x <= x1; x++) g.set(x, 9, 11, ...B.fence("dark_oak"));
    const side = h.f2 === 34 || h.f2 === 22 ? h.f2 + 1 : h.f2 - 1;
    for (let z = 16; z <= 19; z++) g.set(side, 14, z, ...B.fence("dark_oak"));
    // loft ladder against the partition, up through the hatch
    for (let y = 14; y <= 18; y++) g.set(h.f2, y, 10, "ladder", { facing: h.ladder });
  }
}
