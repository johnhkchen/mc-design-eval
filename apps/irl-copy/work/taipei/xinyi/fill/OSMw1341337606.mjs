import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337606";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 19, D = 8;
const g = new Voxels([W, H, D]);

// Ground per footprint cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// Roof is about 7 blocks above the lowest ground: a one-storey shophouse
// (4-block ground storey, 1-block roof deck, 2-block parapet).
const B = Math.min(...ground.values());
const R = B + 7;          // roof surface level (exclusive top)
const WALL_TOP = R - 4;   // top course of the storey walls (under the deck)
const DECK = R - 3;       // roof deck slab
const PARAPET_LO = R - 2; // parapet courses
const PARAPET_HI = R - 1;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const edge = north || south || west || east;

  if (edge) {
    // Determine facade and index along it (corners take the north/south face)
    let face, i;
    if (north) { face = "north"; i = x; }
    else if (south) { face = "south"; i = x; }
    else if (west) { face = "west"; i = z; }
    else { face = "east"; i = z; }

    const isPillar = i === 0 || i === 7;
    const isDoor = face === "south" && i === 3 && z === 7;

    for (let y = gr; y <= WALL_TOP; y++) {
      if (y === gr) {
        // Base course
        g.set(x, y, z, "stone_bricks");
      } else if (y === WALL_TOP) {
        // Lintel band under the roof deck
        g.set(x, y, z, "light_gray_concrete");
      } else if (isDoor && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (y >= gr + 1 && y < WALL_TOP) {
        if (isPillar) {
          g.set(x, y, z, "light_gray_concrete");
        } else if (i >= 1 && i <= 6) {
          const alongX = face === "north" || face === "south";
          g.set(x, y, z, "glass_pane", {
            north: alongX ? "false" : "true",
            south: alongX ? "false" : "true",
            east: alongX ? "true" : "false",
            west: alongX ? "true" : "false",
            waterlogged: "false",
          });
        } else {
          g.set(x, y, z, "white_concrete");
        }
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }

    // Parapet and cornice
    for (let y = PARAPET_LO; y <= PARAPET_HI; y++) {
      g.set(x, y, z, y === PARAPET_HI ? "light_gray_concrete" : "white_concrete");
    }
  } else {
    // Interior: floor slab, then air gap (no interiors)
    g.set(x, gr, z, "smooth_stone");
  }

  // Roof deck over the whole footprint
  g.set(x, DECK, z, "smooth_stone");
}

// Warm lights behind a few windows (inside the glass line)
const lights = [[2, 1], [5, 1], [5, 6], [1, 2], [6, 5]];
for (const [x, z] of lights) {
  if (!has(x, z)) continue;
  const gr = ground.get(`${x},${z}`);
  const y = gr + 1;
  if (y < WALL_TOP) g.set(x, y, z, "shroomlight");
}

// Roof equipment: two condenser units on the deck
for (const [x, z] of [[2, 3], [5, 4]]) {
  if (has(x, z)) g.set(x, R - 2, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
