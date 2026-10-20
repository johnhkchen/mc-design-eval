// Interior designer for "East aisle 3F" (room 12): third-level gallery east, meeting tables and display cases.
// Inner air box x88..101, y15..20, z36..131; floor surface y15 (the 4F floor layer at y21 is the ceiling).
// Doorway north at x94..95 z35; open to the South glass hall along z132. Lanes: the centre x92..96 is kept clear
// from the north door to the south opening (the focal island sits in it at z58..61, leaving x92 as a 1-wide lane).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// meeting table: oak_fence spine at x90, polished_andesite_slab top, quartz stair chairs both sides, z0..z1 inclusive
function meetingTable(g, z0, z1) {
  for (let z = z0; z <= z1; z++) {
    g.set(90, 15, z, "oak_fence");
    g.set(90, 16, z, ...B.slab("polished_andesite", "top"));
    g.set(89, 15, z, ...B.stairs("smooth_quartz", "west", "bottom"));
    g.set(91, 15, z, ...B.stairs("smooth_quartz", "east", "bottom"));
  }
}

// display case: a smooth_quartz plinth at y15 with a glass case at y16 (stained glass for the exhibit pieces)
function vitrine(g, z, block = "glass") {
  g.set(99, 15, z, "smooth_quartz");
  g.set(99, 16, z, block);
}

export function build(g) {
  // meeting tables, west side
  meetingTable(g, 45, 48);
  meetingTable(g, 77, 80);
  meetingTable(g, 103, 106);
  meetingTable(g, 118, 121);

  // display cases, east side, against the window wall's lane
  for (const z of [38, 40, 42, 44]) vitrine(g, z);
  for (const z of [66, 68, 70]) vitrine(g, z);
  for (const z of [84, 86, 88, 90, 92]) vitrine(g, z);
  for (const z of [110, 112, 114]) vitrine(g, z);
  for (const z of [126, 128, 130]) vitrine(g, z);
  // a few exhibit pieces in colour
  vitrine(g, 86, "red_stained_glass");
  vitrine(g, 112, "yellow_stained_glass");

  // focal piece: a glass-cased flower in the centre, x93..96 z58..61, the lane x92 kept clear beside it
  g.fill([93, 15, 58], [96, 15, 61], "smooth_quartz");
  for (let z = 58; z <= 61; z++)
    for (let x = 93; x <= 96; x++) {
      const edge = x === 93 || x === 96 || z === 58 || z === 61;
      if (edge) {
        g.set(x, 16, z, "glass");
        g.set(x, 17, z, "glass");
        g.set(x, 18, z, "glass");
      }
    }
  // the flower inside the 2x2 core
  g.set(94, 16, 59, "shroomlight");
  g.set(95, 16, 59, "red_stained_glass");
  g.set(94, 16, 60, "orange_stained_glass");
  g.set(95, 16, 60, "yellow_stained_glass");
  g.set(94, 17, 59, "orange_stained_glass");
  g.set(95, 17, 59, "red_stained_glass");
  g.set(94, 17, 60, "end_rod");
  g.set(95, 17, 60, "yellow_stained_glass");
  g.fill([93, 18, 58], [96, 18, 61], "glass");
  g.set(95, 20, 60, ...B.lantern(true));

  // hanging lanterns down the centre line, every 8 along the aisle (x92: the lane's edge, clear of the walk)
  for (let z = 38; z <= 130; z += 8) g.set(92, 20, z, ...B.lantern(true));
}
