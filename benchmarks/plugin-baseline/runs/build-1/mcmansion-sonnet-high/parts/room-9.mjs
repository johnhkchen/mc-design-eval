// room: Garage (3 cars): cold, practical three-car garage. Inner air x1..11, y2..4, z7..18 (the z7 leaf plane stays clear).
// Car bays are block cars parked nose-to-the-doors (z8..12) with a lantern over each; the back zone (z13..18) holds the
// workbench (focal, under the brightest lantern, east wall), barrel + trapdoor shelves on the west wall and a barrel/chest row
// on the back wall. Walk lanes: side door (0,2..3,16) east along z16 to (11,2,16), north-to-back at x11 to the mudroom door.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LANTERN_HANG = B.lantern(true);

export function build(g) {
  // three car bays (x1..3, x5..7, x9..11), each a 3x5 low wool body with a 3x3 cabin on the middle column
  const cars = [[1, "white_wool"], [5, "light_gray_wool"], [9, "black_wool"]];
  for (const [bx, wool] of cars) {
    g.fill([bx, 2, 8], [bx + 2, 2, 12], wool);
    g.fill([bx + 1, 3, 9], [bx + 1, 3, 11], wool);
  }

  // west wall shelving: barrels on the floor with a closed oak trapdoor as the shelf top (x1, z13..15)
  for (const z of [13, 14, 15]) {
    g.set(1, 2, z, "barrel", { facing: "up", open: "false" });
    g.set(1, 3, z, ...B.trapdoor("oak", "north", "bottom", false));
  }

  // workbench, the focal piece: crafting table against the east wall, a stool at its west, a barrel beside it
  g.set(11, 2, 14, "crafting_table", {});
  g.set(10, 2, 14, ...B.stairs("spruce", "east"));
  g.set(10, 2, 15, "barrel", { facing: "up", open: "false" });

  // back wall storage row: barrel, chest, barrel, and an empty cauldron
  g.set(1, 2, 18, "barrel", { facing: "up", open: "false" });
  g.set(2, 2, 18, "chest", { facing: "north", type: "single", waterlogged: "false" });
  g.set(3, 2, 18, "barrel", { facing: "up", open: "false" });
  g.set(5, 2, 18, "cauldron", {});

  // a grey carpet mat in the middle of the floor breaks up the bare concrete (carpets are walkable)
  g.fill([4, 2, 13], [8, 2, 14], "gray_carpet");

  // hanging lanterns from the bonus-floor ceiling (y5): one over each car, one over the bench, two in the back zone
  for (const [x, y, z] of [[2, 4, 11], [6, 4, 11], [10, 4, 11], [11, 4, 14], [6, 4, 16], [2, 4, 17]]) {
    g.set(x, y, z, ...LANTERN_HANG);
  }
}
