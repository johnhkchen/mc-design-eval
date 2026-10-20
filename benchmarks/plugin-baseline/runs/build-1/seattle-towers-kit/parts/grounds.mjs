// P6 grounds and lighting: plazas and forecourts (planters, trees, a curved bench row, lamp posts) on the site plots,
// and a hanging lantern under the ceiling of every planned room so no interior cell is dark. The shells are locked
// before this part, so the ceilings stay as the shell laid them: the lanterns hang in the air just under each ceiling.
import { readFileSync } from "node:fs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { planter, tree, lampPost, benchRow } from "../vocab.mjs";

const SMOOTH_STONE = "smooth_stone";

// A planter whose soil sits flush with the kerb top: the helper puts moss at y0 and azaleas at y1, so the air between
// them is filled with moss here, and the azaleas stand on soil instead of floating over air.
function soilPlanter(g, [x0, y0, z0, x1, y1, z1]) {
  planter(g, [x0, y0, z0, x1, y1, z1], { over: [SMOOTH_STONE] });
  for (let x = x0 + 1; x <= x1 - 1; x++)
    for (let z = z0 + 1; z <= z1 - 1; z++)
      if (g.isAir(x, y1 - 1, z)) g.set(x, y1 - 1, z, "moss_block");
}

// Interior lanterns: one per 6 blocks over each room, hung from the ceiling (the room box's top air row). A cell
// with no block above it (no ceiling there) takes no lantern, so nothing hangs from air.
function roomLanterns(g) {
  const { rooms } = JSON.parse(readFileSync(new URL("../rooms.json", import.meta.url), "utf8"));
  let placed = 0;
  for (const { box: [x0, y0, z0, x1, y1, z1] } of rooms) {
    for (let x = x0 + 3; x <= x1 - 2; x += 6) {
      for (let z = z0 + 3; z <= z1 - 2; z += 6) {
        if (!g.isAir(x, y1, z) || g.isAir(x, y1 + 1, z)) continue;
        g.set(x, y1, z, ...B.lantern(true));
        placed++;
      }
    }
  }
  return placed;
}

export function build(g) {
  // Plot 0, KOMO Plaza East: the open south plaza (x 0..55, z 60..124) and the plaza strip beside the tail.
  soilPlanter(g, [4, 0, 64, 11, 2, 67]);
  soilPlanter(g, [4, 0, 116, 11, 2, 119]);
  soilPlanter(g, [40, 0, 64, 51, 2, 67]);
  soilPlanter(g, [60, 0, 118, 69, 2, 121]);
  tree(g, 6, 80);
  tree(g, 6, 104);
  tree(g, 24, 118);
  tree(g, 50, 96);
  benchRow(g, [28, 92], 14, [180, 270]);
  // Lamp posts: the plaza door (x 56, z 90..91) keeps its lane x 52..55, z 89..92 clear.
  lampPost(g, 53, 87);
  lampPost(g, 53, 94);
  lampPost(g, 2, 62);
  lampPost(g, 30, 62);
  lampPost(g, 20, 122);
  lampPost(g, 40, 122);

  // Plot 1, KOMO Plaza West: the two forecourts (x 105..113 and x 141..151, z 0..51).
  soilPlanter(g, [106, 0, 6, 111, 2, 10]);
  soilPlanter(g, [106, 0, 40, 111, 2, 46]);
  tree(g, 108, 24);
  tree(g, 147, 8);
  tree(g, 147, 44);
  lampPost(g, 112, 20);
  lampPost(g, 112, 34);
  // The east door (x 144, z 30..31) keeps its lane z 29..32 clear.
  lampPost(g, 147, 27);
  lampPost(g, 147, 34);

  // Plot 2, Hyatt House: the planted west court (x 152..167, z 0..55) beside the wedge.
  soilPlanter(g, [154, 0, 4, 160, 2, 11]);
  soilPlanter(g, [154, 0, 42, 160, 2, 50]);
  tree(g, 158, 24);
  tree(g, 164, 30);
  lampPost(g, 163, 16);
  lampPost(g, 163, 54);

  // Plot 3, Aperture on Fifth: the planter strip on the east edge (x 249..250).
  soilPlanter(g, [249, 0, 2, 250, 2, 50]);
  lampPost(g, 210, 0);
  lampPost(g, 240, 0);

  roomLanterns(g);
}
