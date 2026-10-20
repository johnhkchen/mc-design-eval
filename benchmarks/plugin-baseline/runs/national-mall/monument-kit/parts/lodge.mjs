// Part 6, survey lodge (plan.md PARTS 6): the in-plot part of the Survey Lodge at x 83..85, z 98..99, floor y 2 (ground h 2),
// walls stone bricks y 3..4 with a glass slit on the south face at (83,4,99), a low stone-brick stair hip at y 5.
// vocab.mjs re-exports h1 and h2, which both name lodgeHip, so the name is ambiguous there; import the h2 helper directly.
// The helper faces its roof stairs outward, which sags the 2-deep footprint into a trough; the roof is re-laid inward so
// it rises from both eaves to the ridge between the north and south rows.
import { lodgeHip } from "../vocab/h2.mjs";
import { LODGE } from "../vocab/base.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const { x0, x1, z0, z1, floorY, slit, roofY } = { ...LODGE, roofY: LODGE.floorY + 3 };
  lodgeHip(g, x0, z0, x1, z1, floorY, { slit });
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) g.set(x, roofY, z, ...B.stairs("stone_brick", z === z0 ? "south" : "north", "bottom"));
}
