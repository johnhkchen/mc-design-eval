// Room 1: Fauces (entrance passage), inner air [16,2,2,19,5,9]. Solemn and dim: a waiting bench on each side, a fern
// pot on each side, two hanging lamps over the centre. The centre x17..18 stays clear so the axis to the garden reads
// straight down the passage. Doors (z=4), the street opening (z=2) and the atrium opening (z=9) are other parts' cells;
// the side doorways (15,6) and (20,6) keep their walkway cells (16,2..3,6) and (19,2..3,6) clear.
// The street-end lampstands at (16,3) and (19,3) are P6 finish's cells (plan OUTDOOR ROOMS); room 1 leaves them alone.
import { DARK_OAK_STAIRS, POTTED_FERN, hangLamp } from "../vocab.mjs";

export function build(g) {
  // Potted ferns just inside the doors, on the wall side, so the centre stays walkable.
  g.set(16, 2, 5, POTTED_FERN);
  g.set(19, 2, 5, POTTED_FERN);

  // Waiting benches: two dark-oak stair seats per side, backs to the side walls, facing into the passage.
  // Minecraft stair facing is the direction the stair rises toward, so the back (high side) is at the wall.
  for (const z of [7, 8]) {
    g.set(16, 2, z, DARK_OAK_STAIRS, { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
    g.set(19, 2, z, DARK_OAK_STAIRS, { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
  }

  // Bronze lamps hung over the centre aisle, away from the side doorway cells and the doors.
  hangLamp(g, 17, 6);
  hangLamp(g, 18, 6);
}
