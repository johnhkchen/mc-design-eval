import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 26 x 10 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, cream-tiled Taipei commercial block of the 1990s:
// granite plinth, smooth quartz bands and piers, tinted glazing, a shopfront
// with a lintel canopy at the street front, a flat roof with parapet, and a
// small plant room on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401853";
const W = 26, D = 10, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), gr);
}

const L = Math.min(...ground.values());   // lowest ground under the footprint
const TOP = L + 11;                       // parapet top, ~11 blocks above lowest ground

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!ground.has(key(x, z))) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const perim = NEIGH.some(([dx, dz]) => !ground.has(key(x + dx, z + dz)));

  if (!perim) {
    // Interior: floor slabs only, air elsewhere (no interiors modelled).
    if (L + 5 >= gy) g.set(x, L + 5, z, "smooth_stone");
    if (L + 10 >= gy) g.set(x, L + 10, z, "smooth_stone");
    continue;
  }

  const front = z === 0;
  const back = z === D - 1;
  const along = (front || back) ? x : z;      // position along the face
  const win = along % 3 !== 0;                // bays: piers every third block
  const GLASS = "light_blue_stained_glass";
  const TRIM = "smooth_quartz";

  for (let y = gy; y <= TOP; y++) {
    let id = "white_concrete";

    if (y === TOP) {
      id = "white_concrete";                  // parapet
    } else if (y === L + 10) {
      id = TRIM;                              // cornice
    } else if (y === L + 9 || y === L + 6 || y === L + 5 || y === L + 4) {
      id = TRIM;                              // storey lines and lintel band
    } else if (y === L + 7 || y === L + 8) {
      id = win ? GLASS : TRIM;                // upper storey glazing
    } else if (y >= L + 1 && y <= L + 3) {
      id = win ? GLASS : TRIM;                // ground storey glazing / piers
    } else if (y === L) {
      id = "polished_granite";                // base course
    }

    // Street front entrance: recessed door under a lintel canopy.
    if (front && y <= L + 4 && x >= 10 && x <= 14) {
      if (y === L + 4) id = "polished_andesite";          // canopy lintel
      else if (x === 12 && y === L) {
        put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      } else if (x === 12 && y === L + 1) {
        put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      } else if (x === 12) {
        id = GLASS;                                       // transom above door
      } else if (y === L) {
        id = "polished_granite";
      } else {
        id = GLASS;
      }
    }

    // Hanging lanterns under the canopy edges.
    if (front && (x === 10 || x === 14) && y === L + 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    put(x, y, z, id);

    // Warm light behind some glazing (interior cell at z=1 behind the front).
    if (front && win && y === L + 2 && x % 6 === 2) {
      const gi = ground.get(key(x, 1));
      if (gi !== undefined && gi <= L + 2) put(x, L + 2, 1, "glowstone");
    }
    if (front && win && y === L + 7 && x % 9 === 1) {
      const gi = ground.get(key(x, 1));
      if (gi !== undefined && gi <= L + 7) put(x, L + 7, 1, "glowstone");
    }
  }

  // Interior floor slabs for perimeter cells (inside the shell).
  // Perimeter storey lines are already written above.
}

// Roof deck over the whole footprint (interior cells need it as the roof slab).
for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (L + 10 >= gy) g.set(x, L + 10, z, "smooth_stone");
}

// Roof plant room: a small ring of light grey concrete near the middle.
for (let x = 9; x <= 16; x++) {
  for (let z = 3; z <= 6; z++) {
    if (!(x === 9 || x === 16 || z === 3 || z === 6)) continue;
    put(x, L + 11, z, "light_gray_concrete");
    put(x, L + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
