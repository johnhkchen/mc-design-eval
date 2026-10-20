import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541459077";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 9 x 23. Low-rise Xinyi-district shophouse-style commercial block,
// two storeys of ~5 blocks each plus a parapet (roof ~11 above lowest ground).
// Cream/white tiled facade with dark glazing, red sign band over a shopfront.
const W = 9, H = 23, D = 23;
const b = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const isRing = (x, z) =>
  has(x, z) && DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// Front (street) is the north-most edge of the footprint.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b2) => a - b2);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const put = (x, y, z, id, opts) => {
  if (y < 0 || y >= H) return;
  if (opts) b.set(x, y, z, id, opts);
  else b.set(x, y, z, id);
};

const paneOpts = (x, z) => {
  const o = { waterlogged: "false" };
  for (const [dx, dz, name] of DIRS) o[name] = isRing(x + dx, z + dz) ? "true" : "false";
  return o;
};

const inward = (x, z) => {
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isRing(nx, nz)) return [nx, nz];
  }
  return null;
};

for (const [x, z, gr] of cells) {
  if (gr + 12 >= H) continue;
  const ring = isRing(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course.
  put(x, gr, z, ring ? "stone_bricks" : "smooth_stone");

  if (ring) {
    const pilaster = (x + z) % 3 === 0;

    // Storey 1 (ground, commercial): plinth, shopfront glass, red sign band.
    put(x, gr + 1, z, "stone_bricks");
    if (x === doorX && z === minZ) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      for (const r of [2, 3]) {
        if (pilaster) put(x, gr + r, z, "white_concrete");
        else put(x, gr + r, z, "glass_pane", paneOpts(x, z));
      }
    }
    put(x, gr + 4, z, "red_terracotta");

    // Storey line.
    put(x, gr + 5, z, "light_gray_concrete");

    // Storey 2: spandrel, windows with piers, lintel.
    put(x, gr + 6, z, "light_gray_concrete");
    for (const r of [7, 8]) {
      if (pilaster) put(x, gr + r, z, "white_concrete");
      else put(x, gr + r, z, "glass_pane", paneOpts(x, z));
    }
    put(x, gr + 9, z, "light_gray_concrete");

    // Parapet.
    put(x, gr + 10, z, "white_concrete");
    put(x, gr + 11, z, "white_concrete");

    // Warm light behind some windows.
    if ((x + z) % 6 === 1) {
      const inn = inward(x, z);
      if (inn) {
        put(inn[0], gr + 2, inn[1], "glowstone");
        put(inn[0], gr + 7, inn[1], "glowstone");
      }
    }
  } else {
    // Interior: only floor slabs, air between them.
    put(x, gr + 5, z, "smooth_stone");
  }

  // Roof deck over every footprint cell.
  put(x, gr + 10, z, ring ? "stone_bricks" : "smooth_stone");
}

// Small rooftop plant enclosure near the centre, standing on the roof deck.
for (let x = 3; x <= 5; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z) || isRing(x, z)) continue;
    const gr = ground.get(key(x, z));
    if (!has(x - 1, z) || !has(x + 1, z)) continue;
    if (z >= 9 && z <= 12) put(x, gr + 11, z, "light_gray_concrete");
  }
}
// Rooftop cap slabs on the plant box.
for (let x = 3; x <= 5; x++) {
  for (let z = 9; z <= 12; z++) {
    if (!has(x, z)) continue;
    const gr = ground.get(key(x, z));
    put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

b.save(`${DIR}/${ID}.nbt`);
