// Part 1, Shell and floors: pavements, end-bay walls, cart arches, slabs y12/y18, gallery partitions, hatches, stairs 1 and 2.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { INFILL, FRAME_LOG, TRIM_PLANKS, TRIM_FENCE } from "../vocab/base.mjs";
import { stairFlight, hatchLadder, cartArch, plinthCourse, pavingPatch, beam } from "../vocab.mjs";

const put = (g, x, y, z, b, s) => g.set(x, y, z, b, s);

// calcite wall in a plane with frame posts; skip(x,y) leaves a hole
function wallZ(g, x0, x1, y0, y1, z, posts, skip = () => false) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    if (skip(x, y)) continue;
    if (posts.includes(x)) put(g, x, y, z, FRAME_LOG, { axis: "y" });
    else put(g, x, y, z, INFILL);
  }
}
function wallX(g, x, z0, z1, y0, y1, posts) {
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    if (posts.includes(z)) put(g, x, y, z, FRAME_LOG, { axis: "y" });
    else put(g, x, y, z, INFILL);
  }
}

export function build(g) {
  // pavements, gutters, alleys (laid over the podium)
  pavingPatch(g, 0, 42, 0, 4, { replace: true });
  pavingPatch(g, 0, 42, 33, 37, { replace: true });
  pavingPatch(g, 0, 1, 5, 32, { replace: true });
  pavingPatch(g, 41, 42, 5, 32, { replace: true });

  // side walls (frame posts every 4, calcite infill)
  const zp = [5, 9, 13, 17, 21, 25, 29, 32];
  for (const x of [2, 8, 34, 40]) wallX(g, x, 5, 32, 5, 11, zp);

  // street walls of the end bays
  for (const [z, face] of [[5, "north"], [32, "south"]]) {
    // west bay: double door x5..6 y5..6 + transom y7, windows x3, x7 y6..8 stay air
    wallZ(g, 2, 8, 5, 11, z, [2, 8], (x, y) =>
      ((x === 5 || x === 6) && y <= 7) || ((x === 3 || x === 7) && y >= 6 && y <= 8));
    plinthCourse(g, 2, 4, z); plinthCourse(g, 7, 8, z);
    beam(g, 2, 8, 11, z, "x", { replace: true });
    // east bay: jambs only, the arch is cut between
    for (const x of [34, 40]) wallZ(g, x, x, 5, 11, z, [x]);
    plinthCourse(g, 34, 34, z); plinthCourse(g, 40, 40, z);
    cartArch(g, 37, z, face);
  }
  // passage ceiling y10..11 (below the slab; the arch lintel is already there at the ends)
  for (let y = 10; y <= 11; y++) g.fill([35, y, 6], [39, y, 31], TRIM_PLANKS);

  // stairs: 1 (lobby to store), 2 (store to loft)
  stairFlight(g, 3, 5, 13, "south", 7, { rail: "east" });
  stairFlight(g, 3, 13, 24, "south", 5, { rail: "east" });

  // hatches and ladders (A back wall z15 facing south, B back wall z22 facing north)
  for (const x of [11, 19, 27]) hatchLadder(g, x, 16, "south");
  for (const x of [15, 23, 31]) hatchLadder(g, x, 21, "north");
  for (const x of [11, 19, 27]) put(g, x, 11, 15, TRIM_PLANKS);
  for (const x of [15, 23, 31]) put(g, x, 11, 22, TRIM_PLANKS);
  const hatch = new Set(["11,16", "19,16", "27,16", "15,21", "23,21", "31,21"]);

  // floor slabs
  for (let x = 2; x <= 40; x++) {
    for (let z = 4; z <= 33; z++) {
      if (hatch.has(`${x},${z}`)) continue;
      if (x >= 3 && x <= 4 && z >= 12 && z <= 19) continue; // stair 1 well
      put(g, x, 12, z, TRIM_PLANKS);
    }
  }
  for (let x = 2; x <= 40; x++) {
    for (let z = 3; z <= 34; z++) {
      if (x >= 3 && x <= 4 && z >= 23 && z <= 28) continue; // stair 2 well
      put(g, x, 18, z, TRIM_PLANKS);
    }
  }

  // gallery partitions z14, z23: planks low, fence light bays, plank head; doorways x3..4 and x20..21
  for (const z of [14, 23]) {
    for (let x = 3; x <= 39; x++) {
      const door = x <= 4 || (x >= 20 && x <= 21);
      for (let y = 13; y <= 17; y++) {
        if (door && y <= 15) continue;
        if (y <= 14 || y === 17 || door) put(g, x, y, z, TRIM_PLANKS);
        else put(g, x, y, z, TRIM_FENCE);
      }
    }
  }
}
