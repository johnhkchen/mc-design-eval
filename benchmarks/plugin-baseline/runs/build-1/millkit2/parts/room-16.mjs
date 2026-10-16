// Part: room: Pyramid SW bedroom. Inner air x 38..40, y 3..6, z 14..16 (plan.md FLOORS / ROOMS).
// Doorways: north partition x39 z13 (first cell x39 z14), east to the back hall x41 z15 (first cell x40 z15); both stay clear.
// Layout: green bed against the south wall (foot x38 z15, head x38 z16 at the wall z17), a furnace stove on the hearth
// mass (x40 z14, facing west into the room), a barrel dresser in the NW corner with a standing lantern on it, a barrel
// trunk in the SE corner, and one hanging lantern over the centre of the room.
import { bed, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hanging_lantern, hearth_nook } from "../vocab.mjs";

export function build(g) {
  // y 3 (floor layer) and y 4 (furniture top layer). Rows run along z 14..16, columns along x 38..40.
  // "B" barrel, "L" standing lantern on the barrel; spaces are free floor (layers skips them).
  layers(
    g,
    [38, 3, 14],
    { B: "barrel", L: ["lantern", { hanging: "false" }] },
    [
      [
        "B  ",   // z 14: dresser barrel in the NW corner; x 39 z 14 is the north doorway's first cell
        "   ",   // z 15: bed foot at x 38 (placed by bed()), lane x 39..40
        "  B",   // z 16: trunk barrel in the SE corner
      ],
      [
        "L  ",   // y 4: standing lantern on the dresser barrel
        "   ",
        "   ",
      ],
    ],
  );

  // Bed: foot x38 z15, head x38 z16 against the south wall (z17). Facing south = the pillow end faces the wall.
  bed(g, [38, 3, 15], "south", "green");

  // Stove on the hearth mass (x41..42 z11..14), mantle above it at y 4.
  hearth_nook(g, 40, 3, 14, "west");

  // Hanging lantern from the ceiling at y 7, centre of the room, clear of both doorways and the bed's headroom.
  hanging_lantern(g, 39, 6, 15);
}
