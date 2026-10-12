// PART 4 facades, glazing and entry: the south glass wall with dark posts on every beam line, the atrium ring glass,
// the west/east windows and utility door, the north clerestory and orange entry, and the ledgestone feature wall.
// Every write goes into air (vocab's glass_bay checks air; posts and panes sit in cells the shell left open).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  BEAM_XS, GLASS_PANE, ENTRY, ATRIUM, HOUSE,
  post, glass_bay, clerestory, orange_entry, ledgestone_wall,
} from "../vocab.mjs";

const SOUTH_Z = HOUSE.z1;                      // z=25, the garden wall of glass
const SLIDER_XS = [14, 20, 26];                // sliding-door gaps: x=14..15, 20..21, 26..27 (y=2..3 stay AIR)
const inSlider = (x) => SLIDER_XS.some((x0) => x === x0 || x === x0 + 1);

// the south wall: posts on the beam lines, glass between them; slider gaps keep y=2..3 open, glass at y=4 above
function southWall(g) {
  for (const x of BEAM_XS) post(g, x, SOUTH_Z);
  for (let x = HOUSE.x0; x <= HOUSE.x1; x++) {
    if (BEAM_XS.includes(x)) continue;
    for (let y = 2; y <= 4; y++) {
      if (inSlider(x) && y < 4) continue;
      if (g.isAir(x, y, SOUTH_Z)) g.set(x, y, SOUTH_Z, GLASS_PANE);
    }
  }
}

// the atrium ring: glass on the x=16 and x=22 sides, corner posts, and the z=11 / z=18 walls with the two doors open
function atriumRing(g) {
  const ringX = [ATRIUM.x0 - 1, ATRIUM.x1 + 1];   // x=16 and x=22
  const ringZ = [ATRIUM.z0 - 1, ATRIUM.z1 + 1];   // z=11 and z=18
  for (const x of ringX) glass_bay(g, ATRIUM.z0, ATRIUM.z1, x, 2, 4, "z");
  for (const z of ringZ) {
    // the doors (x=19..20, y=2..3) stay air; x=19 gets the lintel post at y=4 and x=20 glass above the door
    glass_bay(g, ATRIUM.x0, 18, z, 2, 4);
    glass_bay(g, 21, ATRIUM.x1, z, 2, 4);
    glass_bay(g, 20, 20, z, 4, 4);
    post(g, 19, z, 4, 4);
  }
  for (const x of ringX) for (const z of ringZ) post(g, x, z);   // ring corners
}

// the utility door on the west wall (kitchen to carport): dark_oak_door, facing west, open
function utilityDoor(g) {
  for (const half of ["lower", "upper"]) {
    const [block, st] = B.door("dark_oak", "west", half, "left");
    const { powered, ...state } = st;
    g.set(10, half === "lower" ? 2 : 3, 10, block, { ...state, open: "true" });
  }
}

// west, east and north-east windows: glass in air only
function windows(g) {
  glass_bay(g, 14, 16, 10, 3, 4, "z");        // west dining window
  glass_bay(g, 10, 12, 31, 3, 4, "z");        // east bedroom 1 window
  glass_bay(g, 15, 16, 31, 4, 4, "z");        // east bath clerestory
  glass_bay(g, 21, 23, 31, 2, 4, "z");        // east master, full height
  glass_bay(g, 14, 19, 10, 6, 6, "z");        // west gable clerestory (part 3 may have set it; air check keeps it)
  glass_bay(g, 14, 19, 31, 6, 6, "z");        // east gable clerestory
}

export function build(g) {
  // north: the corner posts, the clerestory, the feature wall and the entry
  post(g, HOUSE.x0, HOUSE.z0);
  post(g, HOUSE.x1, HOUSE.z0);
  clerestory(g, HOUSE.z0, 4);
  ledgestone_wall(g, 11, 17);
  orange_entry(g);
  southWall(g);
  atriumRing(g);
  windows(g);
  utilityDoor(g);
}
