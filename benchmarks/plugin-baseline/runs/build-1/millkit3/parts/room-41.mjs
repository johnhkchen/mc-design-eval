// P7 west bedroom back: a 2 x 2 upper room (x 86..87, z 14..15, y 8..11) with the bed's head on the west wall.
// The door (86, 8..9, 13) lands on (86, 14), which stays clear. The bed runs along z 15 (head 86, foot 87, facing west)
// and a barrel dresser with a flower pot sits at (87, 8, 14), the one free cell beside the door's first cell.
// The room is lit by a hanging lantern from the ceiling over the dresser.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed_set } from "../vocab/h1.mjs";
import { hanging_lantern } from "../vocab/h3.mjs";

export function build(g) {
  // Bed: foot (87, 8, 15), head one step west at (86, 8, 15) against the solid west wall x 85.
  bed_set(g, [87, 8, 15], "west", "red");

  // Dresser: barrel on the floor at (87, 8, 14) with a flower pot on its top face (87, 9, 14).
  layers(g, [87, 8, 14], {
    "b": ["barrel", { facing: "up" }],
    "p": "flower_pot",
  }, [
    ["b"],
    ["p"],
  ]);

  // Light: one lantern hanging from the ceiling above the dresser corner; reaches every floor cell at 8+.
  hanging_lantern(g, 87, 11, 14);
}
