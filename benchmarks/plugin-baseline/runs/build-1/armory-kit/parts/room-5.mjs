// Interior furnisher for "Food hall ground (aisles and stalls)" (room 5), inside its box x6..101, z36..131, y1..6.
// Table clusters (a fence post, a slab top, four stair seats) on a 6-cell grid leave 3-wide lanes from every way in
// (north doors x12..13 and x94..95, west door z85..86, east arch z122..127, the south opening). Stall counters run
// down the west and east walls with a lantern on each, lamp posts sit in the lane crossings every 6 cells (no dark
// floor cell), and a stained-glass flower column stands at the centre on the west door's axis.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const CL_X = [22, 28, 34, 40, 46, 52, 58, 64, 70, 76, 82]; // table cluster centres (x)
const CL_Z = [42, 48, 54, 60, 66, 72, 96, 102, 108, 114, 120, 126]; // cluster centres (z), the focal zone is free between
const LAMP_X = [19, 25, 31, 37, 43, 49, 55, 61, 67, 73, 79, 85];
const LAMP_Z = [45, 51, 57, 63, 69, 75, 93, 99, 105, 111, 117, 123];
const FOCAL = { x: 54, z: 84 };

function inRange(v, a, b) {
  return v >= a && v <= b;
}

// a stall run on a wall: counters on 8-cell cycles (4 on, 4 off), none across the lanes of the doors
function stallRun(g, x, skip) {
  for (let z = 37; z <= 130; z++) {
    if (inRange(z, skip[0] - 2, skip[1] + 2)) continue;
    if (Math.floor((z - 37) / 4) % 2 !== 0) continue;
    g.set(x, 1, z, ...B.block("polished_andesite"));
    if (((z - 37) % 4) === 0) g.set(x, 2, z, ...B.lantern(false));
  }
}

export function build(g) {
  // stall counters down both walls (the lanes to the west door z85..86 and the east arch z122..127 stay open)
  stallRun(g, 7, [83, 88]);
  stallRun(g, 100, [119, 129]);

  // table clusters: a fence post, a bottom slab top, and four stair seats whose back faces away from the table
  for (const cx of CL_X) {
    for (const cz of CL_Z) {
      if (cx <= 0) continue;
      if (inRange(cz, 74, 94) && inRange(cx, 46, 64)) continue; // the focal zone
      g.set(cx, 1, cz, ...B.fence("oak"));
      g.set(cx, 2, cz, ...B.slab("polished_andesite", "bottom"));
      g.set(cx - 1, 1, cz, ...B.stairs("smooth_sandstone", "west"));
      g.set(cx + 1, 1, cz, ...B.stairs("smooth_sandstone", "east"));
      g.set(cx, 1, cz - 1, ...B.stairs("smooth_sandstone", "north"));
      g.set(cx, 1, cz + 1, ...B.stairs("smooth_sandstone", "south"));
    }
  }

  // lamp posts in the lane crossings: three oak fences with a standing lantern on top
  for (const x of LAMP_X) {
    for (const z of LAMP_Z) {
      for (let y = 1; y <= 3; y++) g.set(x, y, z, ...B.fence("oak"));
      g.set(x, 4, z, ...B.lantern(false));
    }
  }

  // the focal flower: four stained-glass columns round a lantern on a polished base at the centre
  const cols = [
    [FOCAL.x - 2, FOCAL.z - 3, "red_stained_glass", "orange_stained_glass"],
    [FOCAL.x + 2, FOCAL.z - 3, "orange_stained_glass", "yellow_stained_glass"],
    [FOCAL.x - 2, FOCAL.z + 3, "yellow_stained_glass", "red_stained_glass"],
    [FOCAL.x + 2, FOCAL.z + 3, "red_stained_glass", "yellow_stained_glass"],
  ];
  for (const [x, z, c1, c2] of cols) {
    g.set(x, 1, z, ...B.block("polished_andesite"));
    for (let y = 2; y <= 5; y++) g.set(x, y, z, ...B.block(y % 2 === 0 ? c1 : c2));
    g.set(x, 6, z, ...B.block("end_rod"));
  }
  g.set(FOCAL.x, 1, FOCAL.z, ...B.block("polished_andesite"));
  g.set(FOCAL.x, 2, FOCAL.z, ...B.lantern(false));
}
