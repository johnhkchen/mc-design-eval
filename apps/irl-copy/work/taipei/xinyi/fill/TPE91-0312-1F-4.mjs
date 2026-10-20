import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE91-0312-1F-4: Xinyi commercial low-rise, built 2002.
// Lidar record: roof about 7 blocks above the lowest ground, so one 5-block
// storey plus a cornice and flat roof. Cream-white tiled facade, blue vision
// glass with sills, grey stone base, and a recessed glass entrance with a
// canopy and lanterns on the street side.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0312-1F-4";
const W = 57, H = 19, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  minG = Math.min(minG, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);

// Roof level: 7 blocks above the lowest ground, kept inside the volume.
const R = Math.min(minG + 7, H - 3);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const has = (x, z) => ground.has(key(x, z));

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const top = Math.min(Math.max(R, gr + 2), H - 2); // first air block above roof cap
  const roofCap = top - 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const westEdge = !has(x - 1, z);
  const eastEdge = !has(x + 1, z);
  const northEdge = !has(x, z - 1);
  const southEdge = !has(x, z + 1);
  const edge = westEdge || eastEdge || northEdge || southEdge;
  const corner = (westEdge || eastEdge) && (northEdge || southEdge);
  const onFront = northEdge && z === minZ;
  const entryBay = onFront && Math.abs(x - cx) <= 2;

  for (let y = gr; y < top; y++) {
    const k = y - gr;

    if (!edge) {
      // Interior: air gap, a floor slab per storey, a roof slab, and warm light
      // placed one block behind glazed bays (x % 3 === 1 is always glass).
      if (y === roofCap) {
        put(x, y, z, "light_gray_concrete");
      } else if (y === gr + 5 && y < roofCap) {
        put(x, y, z, "light_gray_concrete");
      } else if (k === 2 && z === minZ + 1 && x % 6 === 1) {
        put(x, y, z, "glowstone");
      } else if (k === 2 && z === maxZ - 1 && x % 6 === 4) {
        put(x, y, z, "glowstone");
      } else if (k === 2 && z === minZ + 1 && x === cx - 3) {
        put(x, y, z, "lantern");
      } else if (k === 2 && z === minZ + 1 && x === cx + 3) {
        put(x, y, z, "lantern");
      }
      continue;
    }

    // Edge (facade) cells.
    if (k === 0) {
      put(x, y, z, "polished_andesite"); // base course
      continue;
    }
    if (y === roofCap) {
      put(x, y, z, "smooth_stone"); // cornice
      continue;
    }
    if (corner) {
      put(x, y, z, "white_concrete"); // corner columns
      continue;
    }

    // Recessed street entrance: stone surround, glass doors, canopy.
    if (entryBay) {
      if (Math.abs(x - cx) === 2 && k <= 3) {
        put(x, y, z, "stone_bricks"); // door surround
        continue;
      }
      if (k === 1 || k === 2) {
        put(x, y, z, "glass"); // doors
        continue;
      }
      if (k === 3) {
        put(x, y, z, "smooth_stone"); // lintel / canopy edge
        continue;
      }
    }

    // Along-facade index selects mullions versus glazing.
    const t = (westEdge || eastEdge) ? z : x;

    if (k === 4) {
      put(x, y, z, "white_concrete"); // spandrel storey line
    } else if (t % 3 === 0) {
      put(x, y, z, "white_concrete"); // mullion
    } else if (k === 1) {
      put(x, y, z, "smooth_quartz"); // window sill
    } else {
      put(x, y, z, "light_blue_stained_glass"); // vision glass
    }
  }

  // Rooftop plant on a few interior cells.
  if (!edge && x % 11 === 5 && z % 8 === 4 && top + 1 < H) {
    put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
