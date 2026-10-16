// Part: room: Dogtrot west pen (kitchen-hall). Inner air x2..3, y3..6, z10..14; door x4 z12 from the breezeway.
// Furnished by the interior designer: stove (furnace on a stone hearth) against the chimney wall at z15, bed in the
// corner away from the door, a table by the north wall, one chair and a barrel. One hanging lantern, lit furnace.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { table_set, hearth_nook, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // Floor layer y3, rows along +x (x2, x3), successive rows along +z (z10..z14).
  // Table and furnace and bed are placed by their helpers below; '.' is left clear.
  layers(g, [2, 3, 10], {
    S: ["spruce_stairs", { facing: "east", half: "bottom" }],
    b: "barrel",
  }, [
    ".S",   // z10: table at x2 (helper), chair at x3 facing east (back to the east wall)
    ".b",   // z11: barrel at x3 (storage); x2 stays clear to reach the table
    "..",   // z12: door cell x3 and the lane to the stove
    "..",   // z13: bed foot x3
    "..",   // z14: bed head x3, stove x2
  ]);

  // Table: spruce fence leg at x2 z10 (y3) with a top slab (type top) at y4.
  table_set(g, 2, 3, 10, 1);

  // Stove: lit furnace on a stone hearth against the chimney wall (z15), facing into the room.
  hearth_nook(g, 2, 3, 14, "north");

  // Bed: foot x3 z13, head x3 z14 against the chimney wall, red (house 0).
  bed(g, [3, 3, 13], "south", "red");

  // Hanging lantern from the tie beam over the lane, x2 z12 (never over the doorway x3 z12).
  hanging_lantern(g, 2, 6, 12);
  // Standing lantern on the table's top slab (y4 top half, so its base is y5): lights the north end of the room.
  g.set(2, 5, 10, "lantern", { hanging: "false" });
}
