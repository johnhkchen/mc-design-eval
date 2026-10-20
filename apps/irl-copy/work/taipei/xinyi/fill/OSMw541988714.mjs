import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988714";

// Footprint: 16 x 15 cells, each [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, D = 15, H = 23;
// Record: roof about 11 blocks above the lowest ground. Two storeys of ~5 blocks
// plus a parapet. Clamp so the parapet still fits the 23-block height.
const MAX_GROUND = 11;

const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.min(MAX_GROUND, Math.round(gr))));
}
const has = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missingCount = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz)).length;
const perim = (x, z) => missingCount(x, z) > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: two bays on the south face (z = D-1)
const isDoor = (x, z) => z === D - 1 && (x === 7 || x === 8) && perim(x, z);

for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const isPerim = perim(x, z);

  // Foundation under each cell up to its ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab
  put(x, gr, z, "light_gray_concrete");

  // Storey floor (ground storey line) and roof slab for interior cells
  if (!isPerim) {
    put(x, gr + 5, z, "light_gray_concrete");
  }
  put(x, gr + 10, z, isPerim ? "quartz_block" : "light_gray_concrete");

  if (isPerim) {
    const corner = missingCount(x, z) >= 2;
    const along = (z === 0 || z === D - 1) ? x : z;
    const pillar = corner || along % 3 === 0;
    const door = isDoor(x, z);

    // Ground storey: plinth, shopfront glazing, fascia
    if (door) {
      put(x, gr + 1, z, "air");
      put(x, gr + 2, z, "air");
      put(x, gr + 3, z, "glass");       // transom glass over the door
      put(x, gr + 4, z, "smooth_quartz");
    } else if (pillar) {
      for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      put(x, gr + 1, z, "polished_andesite");
      put(x, gr + 2, z, "glass");
      put(x, gr + 3, z, "glass");
      put(x, gr + 4, z, "smooth_quartz");
    }

    // Storey line
    put(x, gr + 5, z, "quartz_block");

    // Upper storey: window grid with pillars
    if (pillar) {
      for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      put(x, gr + 6, z, "glass");
      put(x, gr + 7, z, "glass");
      put(x, gr + 8, z, "glass");
      put(x, gr + 9, z, "smooth_quartz");
    }

    // Parapet with cap
    put(x, gr + 10, z, "quartz_block");
    put(x, gr + 11, z, "quartz_slab", { type: "bottom" });

    // Warm lanterns hanging inside, behind selected windows
    if (!door && !pillar) {
      const first = DIRS.find(([dx, dz]) => !has(x + dx, z + dz));
      if (first) {
        const ix = x - first[0], iz = z - first[1];
        const inward = has(ix, iz) && !perim(ix, iz) && groundAt(ix, iz) === gr;
        if (inward) {
          if (along % 6 === 1) {
            // ground storey lantern hangs from the floor at gr+5
            put(ix, gr + 4, iz, "lantern", { hanging: "true" });
          }
          if (along % 6 === 4) {
            // upper storey lantern hangs from the roof slab at gr+10
            put(ix, gr + 9, iz, "lantern", { hanging: "true" });
          }
        }
      }
    }
  }
}

// Roof plant: a few condenser units on interior roof cells
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  if (!perim(x, z) && x % 5 === 2 && z % 5 === 2) {
    put(x, gr + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
