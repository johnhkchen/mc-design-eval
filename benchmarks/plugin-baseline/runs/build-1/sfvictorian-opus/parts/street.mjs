// Street front (P4): sidewalk + uphill step (E17), drive (E2 ground), neighbour front hints, front stair (E3: stairFlight,
// stringers, stairRail, newelLamp), iron fence and front garden bed (E16). Ground cells (y0) are ours to set; everything
// above ground is added into air only (vocab put()).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as V from "../vocab.mjs";

// Iron bars along x or z with connection states set so the run reads continuous; the ends are the caller's posts.
const bars = (g, cells, axis) => {
  const state = axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  for (const [x, y, z] of cells) g.set(x, y, z, V.IRON_BARS, state);
};

export function build(g) {
  // E17 sidewalk: polished_andesite curb on z0, smooth_stone walk on z1, the walk climbing east.
  V.slab(g, 0, 0, 0, 15, 0, V.POLISHED_ANDESITE);
  V.slab(g, 0, 0, 1, 15, 1, V.SMOOTH_STONE);
  // Uphill step: a bottom smooth_stone slab at x14 and a full block at x15, both on z0..1 at y1.
  for (const z of [0, 1]) {
    g.set(14, 1, z, ...B.slab("smooth_stone", "bottom"));
    g.set(15, 1, z, V.SMOOTH_STONE);
  }

  // Drive x1..5 z2..6 (polished_andesite).
  V.slab(g, 0, 1, 2, 5, 6, V.POLISHED_ANDESITE);

  // Neighbour hints: x0 is their drive, x15 their stair base (cyan, y0..1).
  V.slab(g, 0, 0, 2, 0, 6, V.POLISHED_ANDESITE);
  V.slab(g, 0, 15, 2, 15, 6, V.CYAN_TERRACOTTA);
  V.slab(g, 1, 15, 2, 15, 6, V.CYAN_TERRACOTTA);
  // Plan NOTES: the cornice stairs (0,14,6) and (15,16,6) hang off the neighbour walls' front edge; one support block each,
  // in the neighbour's own wall material, touching the wall at z7.
  g.set(0, 13, 6, V.YELLOW_TERRACOTTA);
  g.set(15, 15, 6, V.LIGHT_BLUE_TERRACOTTA);

  // E3 front stair: a cyan base under the whole stair footprint, then the solid fill under each step and the landing.
  V.slab(g, 0, 10, 2, 14, 6, V.CYAN_TERRACOTTA);
  for (let x = 11; x <= 13; x++) {
    for (let z = 3; z <= 6; z++) {
      const top = z <= 5 ? z - 2 : 3; // step at z has its tread at y z-1; the landing (z6) is supported to y3
      for (let y = 1; y <= top; y++) g.set(x, y, z, V.CYAN_TERRACOTTA);
    }
  }
  for (const x of [11, 12, 13]) V.stairFlight(g, x, 2, 1, 4, "south", V.QUARTZ_STAIRS);
  V.slab(g, 4, 11, 6, 13, 6, V.POLISHED_DIORITE);
  V.stairRail(g, 10, 3, 6);
  V.stairRail(g, 14, 3, 6);
  V.newelLamp(g, 10, 2);
  V.newelLamp(g, 14, 2);

  // E16 iron fence: bars along z2 x7..9 and x6 z3..6, polished blackstone wall posts at (6,1..2,2).
  bars(g, [[7, 1, 2], [8, 1, 2], [9, 1, 2]], "x");
  bars(g, [[6, 1, 3], [6, 1, 4], [6, 1, 5], [6, 1, 6]], "z");
  for (const y of [1, 2]) g.set(6, y, 2, V.POLISHED_BLACKSTONE_WALL, {});

  // E16 front garden: podzol bed x7..9 z3..6 with the planting.
  V.gardenBed(g, V.FRONT_GARDEN, [
    [7, 3, V.ROSE_BUSH],
    [9, 3, V.PEONY],
    [8, 5, V.AZALEA],
    [7, 6, V.FLOWERING_AZALEA],
    [9, 5, V.FERN],
    [9, 6, V.LILAC],
  ]);
}
