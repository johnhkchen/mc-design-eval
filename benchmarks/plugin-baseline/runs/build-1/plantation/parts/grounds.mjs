// Part 7: grounds (plan.md SITE rows, FOUNDATIONS of the estate). Ground is grass at y0 from build.mjs; this part
// lays the drive, allee, forecourt, formal garden, river and dock on top of it, then the buildings in the grounds.
import { GROUND_BLOCKS, driveStrip, liveOak, forecourtOval, gatePier, lampPost, parterreBed, fountain,
  greenhouse, gazebo, cherryTree, magnolia, frontSteps, dock } from "../vocab.mjs";

export function build(g) {
  // ---- boundary and gate ------------------------------------------------------------------------------------
  // birch picket line on the county road edge, gap for the drive (gate piers at x43..44 and x51..52)
  g.fill([0, 1, 0], [42, 1, 0], "birch_fence");
  g.fill([53, 1, 0], [95, 1, 0], "birch_fence");
  gatePier(g, 43, 0);
  gatePier(g, 51, 0);

  // ---- drive, kerbs and the allee ---------------------------------------------------------------------------
  driveStrip(g, 45, 0, 50, 23, { y: 0, over: GROUND_BLOCKS });
  // root patches: coarse dirt round each trunk with podzol at the foot
  for (const tx of [41, 53]) {
    for (const tz of [2, 8, 14, 20]) {
      g.fill([tx - 1, 0, tz - 1], [tx + 2, 0, tz + 2], "coarse_dirt");
      g.fill([tx, 0, tz], [tx + 1, 0, tz + 1], "podzol");
    }
  }
  for (const tx of [41, 53]) for (const tz of [2, 8, 14, 20]) liveOak(g, tx, tz);
  for (const z of [6, 12, 18]) {
    lampPost(g, 44, z);
    lampPost(g, 51, z);
  }

  // ---- forecourt and front steps ----------------------------------------------------------------------------
  forecourtOval(g, 37, 24, 58, 31, { replace: true });
  lampPost(g, 37, 24);
  lampPost(g, 58, 24);
  frontSteps(g, 45, 32, "south", 6, 1);

  // ---- service lane and cottage walk ------------------------------------------------------------------------
  g.fill([59, 0, 28], [85, 0, 30], "gravel");
  g.fill([83, 0, 31], [85, 0, 39], "gravel");
  g.fill([81, 0, 54], [82, 0, 59], "dirt_path");
  // path lights: the service lane (gravel z28..30, x59..85, and x83..85 south), the cottage walk, and the formal garden's
  // paths (the x4 column, the x12..14 and z47..49 cross paths). Posts stand on the grass beside the paths.
  for (const [x, z] of [[64, 27], [78, 27], [86, 35], [80, 56]]) lampPost(g, x, z);

  // ---- formal garden: paths, then beds, fountain -------------------------------------------------------------
  g.fill([4, 0, 36], [22, 0, 36], "gravel");
  g.fill([4, 0, 60], [22, 0, 60], "gravel");
  g.fill([4, 0, 36], [4, 0, 60], "gravel");
  g.fill([22, 0, 36], [22, 0, 60], "gravel");
  g.fill([12, 0, 36], [14, 0, 60], "gravel");
  g.fill([4, 0, 47], [22, 0, 49], "gravel");
  // fountain basin ground (smooth_stone under the water)
  g.fill([10, 0, 45], [16, 0, 51], "smooth_stone");
  parterreBed(g, 5, 37, 11, 44, { corner: "se", replace: true });
  parterreBed(g, 15, 37, 21, 44, { corner: "sw", replace: true });
  parterreBed(g, 5, 52, 11, 59, { corner: "ne", replace: true });
  parterreBed(g, 15, 52, 21, 59, { corner: "nw", replace: true });
  fountain(g, 10, 45, 1);
  // the garden's path lamps, on the grass just outside the hedges (west, north, south and east of the paths)
  for (const [x, z] of [[3, 41], [3, 48], [3, 55], [13, 35], [13, 61], [23, 48]]) lampPost(g, x, z);

  // ---- glasshouse, gazebo ------------------------------------------------------------------------------------
  greenhouse(g, 4, 64, 21, 75, { y: 0, over: GROUND_BLOCKS });
  gazebo(g, 13, 81, { y: 1, face: "north" });

  // ---- flowering trees --------------------------------------------------------------------------------------
  for (const [x, z] of [[10, 8], [22, 16], [10, 24], [85, 8], [73, 16], [88, 22]]) cherryTree(g, x, z, 1);
  magnolia(g, 24, 64, { y: 1, height: 5 });
  magnolia(g, 71, 64, { y: 1, height: 5 });

  // ---- river frontage and dock ------------------------------------------------------------------------------
  // The grid cannot store y -4..-1 (see Notes): the river lies at lawn level, water on y0 from z87.
  g.fill([0, 0, 85], [95, 0, 85], "sand");
  g.fill([0, 0, 86], [95, 0, 86], "sand");
  g.fill([0, 0, 87], [95, 0, 95], "water");
  g.fill([46, 0, 83], [49, 0, 83], "gravel");
  dock(g, 44, 84, 51, 92, { y: 0, over: GROUND_BLOCKS });
}
