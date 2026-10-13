// Part: stairs and ladders (stair joiner). Grand stair in the central hall; ladder to the carriage loft.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const Q = "smooth_quartz";
  // Grand stair: x45..46, step i at z60-i, y4+i (i=0..6), facing north; top step y10 at z54, landing z53.
  for (let i = 0; i <= 6; i++) {
    const z = 60 - i, y = 4 + i;
    for (const x of [45, 46]) {
      for (let yy = 4; yy < y; yy++) g.set(x, yy, z, "bricks");
      g.set(x, y, z, ...B.stairs("smooth_quartz", "north", "bottom"));
    }
  }
  // upper hall floor closed round the stairwell (hole x45..46 z55..57 above the flight)
  g.fill([47, 10, 50], [50, 10, 59], Q);
  g.fill([45, 10, 50], [46, 10, 53], Q);
  g.fill([45, 10, 58], [46, 10, 59], Q);
  // rail round the opening on the upper floor, top step left open
  for (let z = 55; z <= 57; z++) {
    g.set(47, 11, z, "birch_fence", { north: z > 55 ? "true" : "false", south: "true" });
    g.set(47, 12, z, ...B.slab(Q, "bottom"));
  }
  g.set(47, 11, 58, "birch_fence", { north: "true", west: "true" });
  g.set(46, 11, 58, "birch_fence", { east: "true", west: "true" });
  g.set(45, 11, 58, "birch_fence", { east: "true" });
  // carriage house loft ladder against the south wall z53 (x90 z52), y1..7
  for (let y = 1; y <= 7; y++) g.set(90, y, 52, "ladder", { facing: "north" });
}
