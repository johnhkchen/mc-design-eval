// P7 gallery: a sleeping porch on the upper deck, two units divided by the brick pier x89..90.
// Inner air box [85,8,7, 94,10,8]. Each unit has its own gallery door (x88 and x91, z9, y8..9); the cells in front
// of them (x88 z8, x91 z8) stay clear. Per unit: one bed with its head against the house wall (z9, y8), a barrel
// nightstand with a flower pot, a chair on the front edge, and a hanging lantern. The bed heads sit against solid
// wall cells, never a window (the windows are at y9..10 on z9).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { chair, hanging_lantern, bed_set } from "../vocab.mjs";

export function build(g) {
  // Both outer ends of the porch are railed and the nightstands close them, so each unit's hall ends at its door. The
  // rail's top cells at the ends (y9) hold flower pots, a window box, so nobody walks the rail past the doors.
  g.set(85, 8, 7, "birch_fence");
  g.set(94, 8, 7, "birch_fence");
  for (const x of [85, 86, 87, 92, 93, 94]) g.set(x, 9, 7, "flower_pot");
  // Row z8 (the room's back row, against the house wall): barrel nightstands at x85 and x94.
  layers(g, [85, 8, 8], { B: ["barrel", { facing: "up" }] }, [
    ["B        B"],
  ]);
  // Flower pots on top of the nightstands (y9, a full block below them).
  layers(g, [85, 9, 8], { P: "flower_pot" }, [
    ["P        P"],
  ]);
  // Beds: west unit (red) and east unit (orange). Foot on z7, head on z8 against the house wall at z9.
  bed_set(g, [86, 8, 7], "south", "red");
  bed_set(g, [93, 8, 7], "south", "orange");
  // Chairs on the front edge, sitters look north over the lane.
  chair(g, 87, 8, 7, "north");
  chair(g, 92, 8, 7, "north");
  // Lanterns hang from the roof over each unit, clear of the doorways (x88, x91).
  hanging_lantern(g, 87, 10, 8);
  hanging_lantern(g, 92, 10, 8);
}
