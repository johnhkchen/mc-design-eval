// Interior designer for "Gallery three" (room 28): a dark exhibition room, the big glass blossom on a plinth at the
// centre of the view from the doorway (x274..277, z60), stone benches round it, and sea-lantern lamp plinths on
// the floor grid so every floor cell is lit. Inner air box [259,1,61,294,10,89]; nothing is built outside it.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { rng } from "../vocab/base.mjs";

const CX = 276; // the sculpture's axis (the doorway looks down it)
const CZ = 80;
const SEAT = "deepslate_tile"; // deepslate_tile_stairs

// the pedestal: polished deepslate, one block high, 5 x 5
function pedestal(g) {
  g.fill([CX - 2, 1, CZ - 2], [CX + 2, 1, CZ + 2], "polished_deepslate");
}

// the blossom: lumps of stained glass in a rounded mass over the pedestal, from y 2 to y 7, with end rod spikes
function blossom(g) {
  const rand = rng(28);
  const radius = { 2: 2.2, 3: 2.8, 4: 3, 5: 3, 6: 2.5, 7: 1.5 };
  for (const y of Object.keys(radius).map(Number)) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        if (dx * dx + dz * dz > radius[y] * radius[y]) continue;
        const r = rand();
        let block = "glass";
        if (r < 0.55) block = "orange_stained_glass";
        else if (r < 0.80) block = "red_stained_glass";
        else if (r < 0.92) block = "yellow_stained_glass";
        // a shroomlight in the middle of the mass lights the cloud from inside
        if (y === 4 && Math.abs(dx) <= 1 && Math.abs(dz) <= 1 && dx === 0 && dz === 0) block = "shroomlight";
        g.set(CX + dx, y, CZ + dz, block);
      }
    }
  }
  // end rods: the spikes that light the sculpture's top and edges
  for (const [dx, y, dz] of [[0, 8, 0], [-2, 7, 1], [2, 7, -1], [1, 6, 3], [-1, 6, -3]]) {
    g.set(CX + dx, y, CZ + dz, "end_rod");
  }
}

// benches: four stairs on each side of the pedestal, backs to the outside, seats toward the sculpture
function benches(g) {
  for (const z of [CZ - 1, CZ, CZ + 1]) {
    g.set(CX - 4, 1, z, ...B.stairs(SEAT, "west", "bottom")); // west bench, back to the wall side
    g.set(CX + 4, 1, z, ...B.stairs(SEAT, "east", "bottom")); // east bench
  }
  for (const x of [CX - 1, CX, CX + 1]) {
    g.set(x, 1, CZ + 4, ...B.stairs(SEAT, "south", "bottom")); // south bench, sitting toward the north
  }
}

// lamp plinths: a sea lantern block on the floor, placed on a grid kept off the doorway lane
function lamps(g) {
  for (const x of [262, 271, 281, 290]) {
    for (const z of [64, 72, 86]) g.set(x, 1, z, "sea_lantern");
  }
  // the gaps the grid leaves beside the benches and at the east wall
  for (const [x, z] of [[271, 79], [281, 79], [290, 73], [290, 79], [262, 73], [262, 85], [271, 65]]) g.set(x, 1, z, "sea_lantern");
}

export function build(g) {
  pedestal(g);
  blossom(g);
  benches(g);
  lamps(g);
}
