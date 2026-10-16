// P5 wagon lean-to (interior, box x69..70, y1..3, z9..15). The wagon (x69..70 z9..12) and the fence tongue (69,1,13)
// belong to the grounds part; this room furnishes the forge corner at the east end of the shed: smithing table with
// a standing lantern on it, the leather worker's cauldron, and hanging lanterns for the light.
// The lane x70 z13..15 stays clear at y1..2: it is the only walk to the table and the cauldron.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // Workstations (y1) and the standing lantern on the table (y2). '.' = left as it is.
  // Rows run along +z from z13; columns along +x from x69.
  layers(g, [69, 1, 13], { S: "smithing_table", C: "cauldron" }, [
    ["..", "S.", "C."], // y1: z13 (tongue, grounds), z14 table, z15 cauldron; x70 is the lane
  ]);
  layers(g, [69, 2, 13], { L: ["lantern", { hanging: "false" }] }, [
    ["..", "L."], // y2: lantern standing on the table
  ]);
  // Hanging lanterns: one over the wagon bed (its chain runs up to the roof), one over the cauldron.
  hanging_lantern(g, 70, 3, 10);
  hanging_lantern(g, 69, 3, 15);
}
