import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record for this parcel, so the form is inferred from the lidar roof height
// (~11 blocks above lowest ground = two storeys of ~5 blocks plus a parapet).
// Reads as a 1990s Taipei low-rise commercial block: white tiled facade, granite
// plinth, light-grey bands at each floor line, blue-tinted glazing, a shopfront
// ground floor with recessed entrances, a parapet, and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871792";
const W = 53, H = 23, D = 45;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gy));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  g.set(x, y, z, id);
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);
  const s = x + z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Floor slabs for every storey and the roof deck.
  put(x, b, z, "smooth_stone");        // ground floor slab
  put(x, b + 5, z, "smooth_stone");    // upper floor slab
  // Roof deck is set below only for interior cells (perimeter gets parapet).

  // Outward faces: neighbours outside the footprint.
  const outs = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const perimeter = outs.length > 0;

  if (!perimeter) {
    // Interior: roof deck and rooftop plant only.
    put(x, b + 11, z, "gray_concrete");
    if (x % 10 >= 4 && x % 10 <= 5 && z % 10 >= 4 && z % 10 <= 5) {
      put(x, b + 12, z, "light_gray_concrete");
    }
    continue;
  }

  const [odx, odz] = outs[0];
  const inward = [x - odx, z - odz];
  const inwardInFootprint = has(inward[0], inward[1]);
  const inwardIsPerimeter = inwardInFootprint && DIRS.some(([dx, dz]) =>
    !has(inward[0] + dx, inward[1] + dz));

  // Entrance bays on the ground floor, every 16 blocks along the facade.
  const entrance = (s % 16) === 6;
  // Window bays: two of every four column positions; the rest are white pillars.
  const windowBay = (s % 4) === 1 || (s % 4) === 2;

  for (let y = b; y <= b + 11; y++) {
    if (y === b) {
      put(x, y, z, "polished_granite");                       // base course
    } else if (y <= b + 3) {                                  // ground storey
      if (entrance) continue;                                 // recessed entrance (open)
      put(x, y, z, windowBay ? "gray_stained_glass" : "white_concrete");
    } else if (y === b + 4) {
      put(x, y, z, "light_gray_concrete");                    // storey line
    } else if (y === b + 5) {
      put(x, y, z, "light_gray_concrete");                    // sill / floor line
    } else if (y <= b + 8) {                                  // upper storey
      put(x, y, z, windowBay ? "light_blue_stained_glass" : "white_concrete");
    } else if (y === b + 9) {
      put(x, y, z, "light_gray_concrete");                    // lintel band
    } else if (y === b + 10) {
      put(x, y, z, "light_gray_concrete");                    // cornice
    } else if (y === b + 11) {
      put(x, y, z, "white_concrete");                         // parapet top
    }
  }

  // Warm light behind some glazed bays: glowstone one cell inside the glass.
  if (windowBay && !entrance && inwardInFootprint && !inwardIsPerimeter) {
    if ((x * 7 + z * 13) % 7 === 0) {
      put(inward[0], b + 2, inward[1], "glowstone");
    }
    if ((x * 5 + z * 11) % 9 === 0) {
      put(inward[0], b + 7, inward[1], "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
