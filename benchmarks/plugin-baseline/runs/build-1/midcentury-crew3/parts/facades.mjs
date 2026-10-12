// PART 4 facades, glazing and entry (plan.md FACADES and OPENINGS; elements 4, 7-10, 12, 13, 15, 16).
// Every write goes into air only (the shell's openings are air; earlier parts' blocks are skipped), so the helpers never
// close a slider, a door or a window the shell left open.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { post, glass_bay, glass_bay_z, slider_gap, clerestory, orange_entry, ledgestone_wall } from "../vocab.mjs";

const NORTH_Z = 8; // street wall face
const FEATURE_Z = 7; // ledgestone leaf, one proud of the north wall
const DOOR_Z = 9; // entry door wall
const SOUTH_Z = 25; // garden glass wall
const WEST_X = 10;
const EAST_X = 31;
const BEAM_LINES = [10, 13, 16, 19, 22, 25, 28, 31];
const SLIDER_X0 = [14, 20, 26]; // sliding-door gaps (y=2..3 stay air, glass at y=4)

// Utility door, open, two halves at (x, y0..y0+1, z); facing = the way its front faces (west: out to the carport).
function utility_door(g, x, y0, z, facing) {
  let n = 0;
  for (const [half, y] of [["lower", y0], ["upper", y0 + 1]]) {
    if (!g.isAir(x, y, z)) continue;
    const [block, state] = B.door("dark_oak", facing, half, "left");
    g.set(x, y, z, block, { ...state, open: "true" });
    n++;
  }
  return n;
}

export function build(g) {
  // South garden wall (z=25): a dark post on every beam line, glass between the posts at y=2..4
  for (const x of BEAM_LINES) post(g, x, SOUTH_Z);
  for (const x0 of [11, 14, 17, 20, 23, 26, 29]) {
    if (SLIDER_X0.includes(x0)) slider_gap(g, x0, SOUTH_Z); // the sliders: only the glass above the gap
    else glass_bay(g, x0, x0 + 1, SOUTH_Z, 2, 4);
  }

  // Corner posts, north and south: the four house corners
  post(g, WEST_X, NORTH_Z);
  post(g, EAST_X, NORTH_Z);

  // Street face (z=8): clerestory strip, ledgestone feature wall, bold orange entry
  clerestory(g, 22, NORTH_Z, 4);
  ledgestone_wall(g, 11, 17, FEATURE_Z, 1, 4, 1);
  orange_entry(g, 19, DOOR_Z, "north");

  // West (x=10) and east (x=31): kitchen utility door, dining window, gable-end glass, bedroom and bath windows, master glass
  utility_door(g, WEST_X, 2, 10, "west");
  glass_bay_z(g, WEST_X, 14, 16, 3, 4);
  glass_bay_z(g, WEST_X, 14, 19, 6, 6); // gable clerestory, normally the roof's; only into air
  glass_bay_z(g, EAST_X, 10, 12, 3, 4);
  glass_bay_z(g, EAST_X, 15, 16, 4, 4);
  glass_bay_z(g, EAST_X, 21, 23, 2, 4);
  glass_bay_z(g, EAST_X, 14, 19, 6, 6);

  // Atrium ring (x=16, x=22, z=11, z=18): glass with dark posts at the corners and over the doors
  glass_bay_z(g, 16, 12, 17, 2, 4);
  glass_bay_z(g, 22, 12, 17, 2, 4);
  for (const z of [11, 18]) {
    post(g, 16, z);
    post(g, 22, z);
    glass_bay(g, 17, 18, z, 2, 4);
    glass_bay(g, 21, 21, z, 2, 4);
    glass_bay(g, 20, 20, z, 4, 4); // above the atrium door (x=19..20, y=2..3 stay open)
    post(g, 19, z, 4, 4); // lintel post over the door
  }
}
