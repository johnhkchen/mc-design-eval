// Part 7: signs and stalls. The pavilion's name band ("FERRY BUILDING", frieze x11..35 y23..27 on the land front) and the
// nave's market stalls (rows at z 22..24 and z 54..56, one stall per 8-bay at x = 2 + 8k, clear of the aisle at z 37..41).
import { plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { stall, ROOM_BOXES } from "../vocab.mjs";

export function build(g) {
  // name band: block letters set into the calcite frieze (the wall is the board: no frame, no repaint)
  const name = plaque(g, "FERRY BUILDING", { at: [11, 23, 1], face: "north", width: 25, height: 5, style: "block", material: null, frame: null, letter: "black_concrete" });
  if (name.refused?.length) console.log(`signs-stalls: name band refused ${name.refused.length} cells`);

  // market stalls along the nave floor (y 1), one per 8-bay: x = 2 + 8k covers x..x+2 inside the 4-wide zone
  for (const z of [23, 55]) {
    for (let x = 2; x + 2 <= 97; x += 8) {
      const room = x >= ROOM_BOXES.navemarket[0] && x <= ROOM_BOXES.navemarket[3] ? ROOM_BOXES.navemarket : undefined;
      stall(g, x, z, { y: 1, room });
    }
  }
}
