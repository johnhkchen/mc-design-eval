// Part "Stairs and ladders": one straight flight per two-storey house (plan.md RESERVED), and the Magnolia attic ladder.
import { flight } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLIGHTS = [
  [6, 15, "south"], [22, 15, "south"], [44, 18, "north"], [55, 15, "south"],
  [68, 15, "south"], [92, 19, "north"], [115, 15, "south"],
];

export function build(g) {
  for (const [x, z, facing] of FLIGHTS) {
    const r = flight(g, { from: [x, 2, z], facing, to: 5, material: "oak" });
    g.set(x, 5, z, "air"); // clearance over the first step (jump onto step 2)
    if (r.notes?.length) console.log("flight", x, z, r.notes);
  }
  // Magnolia attic: ladder up the partition face at (11, z18), through the attic floor hole at (11, 9, 17)
  for (let y = 6; y <= 10; y++) g.set(11, y, 17, "ladder", { facing: "north" });
}
