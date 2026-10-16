// Part: room: Dogtrot porch. Interior of the front porch, inner air x1..10, y3..5, z7..8 (plan.md ROOMS, FLOORS).
// Layout: the front rail (z7, y3) and posts belong to fittings; this room works the z8 row against the pen wall.
// Lane x5..6 from the front steps through z7..8 to the breezeway door stays clear. Two rocking chairs (spruce stairs
// facing south, seat toward the street) and a wash stand (barrel with a water cauldron on top) at the east end. The two
// hanging lanterns under the shed roof at z7 (x3, x8) are the fittings part's; this room does not place them again.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Floor layer y3: origin [x1, y3, z7]; rows run along +x, successive rows along +z.
  layers(
    g,
    [1, 3, 7],
    {
      R: ["spruce_stairs", { facing: "south", half: "bottom" }],
      B: ["barrel", { facing: "up" }],
    },
    [
      "..........", // z7: the rail row (fittings) stays as built
      ".R.....R.B", // z8: rocker x2, rocker x8, wash barrel x10
    ],
  );

  // Basin on the barrel: water cauldron at y4 over (x10, z8).
  layers(g, [1, 4, 7], { C: ["water_cauldron", { level: "3" }] }, [
    "..........",
    ".........C",
  ]);
}
