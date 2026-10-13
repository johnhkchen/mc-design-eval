// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Bathroom. Quartz-floored washroom, inner air x 5..8, y 19..22, z 18..21 (rooms.json). Entered from the north
// door at x7 z17; the lane x7 z18..20 stays clear to the bath. Focal piece: the bath (two water cauldrons, x7..8 z21),
// facing the door. Basin at the west wall, storage barrel and a flower pot by the window, a spruce slab shelf on
// the east wall, a red rug between. Light: lanterns hung from the loft floor (y 23) over the rug and the bath.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLantern } from "../vocab/h3.mjs";

export function build(g) {
  // floor row y 19: origin x 5, z 18 (rows run along +z, columns along +x)
  layers(g, [5, 19, 18], {
    "b": "barrel",
    "f": "flower_pot",
    "c": ["water_cauldron", { level: "1" }],
    "t": ["water_cauldron", { level: "3" }],
    "r": "red_carpet",
    "s": B.slab("spruce", "bottom"),
  }, [
    "b..f",   // z 18: barrel by the window, pot in the corner, lane at x 6..7
    "cr.s",   // z 19: basin on the west wall, rug, shelf on the east wall
    ".r.s",   // z 20: rug, lane at x 7, shelf
    "..tt",   // z 21: the bath, focal piece facing the door
  ]);

  // lanterns hang from the loft floor (y 23): over the rug and over the bath
  hangLantern(g, 6, 22, 19);
  hangLantern(g, 7, 22, 20);
  return {};
}
