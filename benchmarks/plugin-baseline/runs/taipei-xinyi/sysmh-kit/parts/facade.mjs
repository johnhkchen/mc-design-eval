// P4 glazing and signs: lobby glass wall on the south front, lit door bays on the east, west and north faces, and the
// SUN YAT-SEN name board on the beam's south face. Earlier parts' blocks are locked; this part writes only into air.
import { glass_wall, door_bay, name_board } from "../vocab.mjs";
import { bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // South lobby glass wall: x 55..96, y 3..36 on z 130, four door pairs left open (air y 3..5).
  glass_wall(g, 55, 96, 130, 3, 36, [[60, 63], [66, 69], [82, 85], [88, 91]]);

  // Lit door bays: 6 wide, centred on the wall span 73..78 (centre 75.5). East and west walls at x 130 / 21, north at z 21.
  const span = [73, 78];
  door_bay(g, "east", 130, span);
  door_bay(g, "west", 21, span);
  door_bay(g, "north", 21, span);

  // Name board: black field and gold frame at z 133 (no text), then the words as yellow_wall_banner letters
  // (palette-only colours: black letters on yellow cloth, since a black base would be off-palette) hung on its face at z 134.
  name_board(g, "south", 64, 87, 32, 35, 133, "");
  bannerWord(g, "SUN YAT-SEN", { center: [75, 33, 134], face: "south", letter: "black", base: "yellow" });
}
