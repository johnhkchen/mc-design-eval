// Part "dome": the IMAX dome. A white_concrete drum (y1..5) under a hollow hemisphere of radius 18 with 8 smooth_quartz
// meridians and a 3x3 cap at y23; the flat porch on its south side (x17..22, z54..56, sea_lantern soffit); the dome
// entrance cut through the drum and the porch's back wall (x18..21, y1..3, z53..54); "IMAX" in blue banner letters
// on the porch fascia, facing south (z57, y4..5).
import { DOME, DOME_PORCH, DOME_ENTRANCE } from "../vocab/base.mjs";
import { dome_ribbed, porch as porchSlab } from "../vocab.mjs";
import { carve, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const dome = dome_ribbed(g, [DOME.cx, 1, DOME.cz]);
  const porch = porchSlab(g, [DOME_PORCH[0], DOME_PORCH[2], DOME_PORCH[3], DOME_PORCH[5]]);
  const [x0, y0, z0, x1, y1, z1] = DOME_ENTRANCE;
  carve(g, [x0, y0, z0], [x1, y1, z1]);
  const imax = bannerWord(g, "IMAX", { center: [19.5, 4, 57], face: "south" });
  return { dome, porch, imax };
}
