import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 22 x 22 footprint, roof ~11 blocks above lowest ground.
// Reading: a two-storey mid-century concrete commercial block (1960s-70s Taipei):
// stone-brick plinth, white concrete piers, glass-pane bays, flat roof with a
// parapet and a central plant room. Ground floor is a shopfront with a centred entrance.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098122";
const W = 22, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const inB = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D;
const put = (x, y, z, b, p) => {
  if (!inB(x, y, z)) return;
  if (p === undefined) g.set(x, y, z, b);
  else g.set(x, y, z, b, p);
};

// Footprint map and ground levels (lowest ground = y 0)
const foot = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) minG = Math.min(minG, Math.round(gr));
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, Math.round(gr) - minG);

const has = (x, z) => foot.has(`${x},${z}`);
const groundOf = (x, z) => foot.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Bounding box of footprint for entrance placement
let minX = Infinity, maxX = -Infinity, maxZ = -Infinity;
for (const [x, z] of foot.keys().map(k => k.split(",").map(Number))) {
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
  maxZ = Math.max(maxZ, z);
}
const doorA = Math.floor((minX + maxX) / 2);
const doorB = Math.ceil((minX + maxX) / 2);

const PANE = (east, west) => ({
  east: east ? "true" : "false",
  west: west ? "true" : "false",
  north: "false",
  south: "false",
  waterlogged: "false",
});

for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  const base = groundOf(x, z);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const o = outs(x, z);
  const perim = o.length > 0;

  if (!perim) {
    // Interior: floor slabs per storey, roof deck, central plant room
    put(x, base + 5, z, "smooth_stone");
    put(x, base + 10, z, "smooth_stone");
    if (x >= 7 && x <= 14 && z >= 7 && z <= 14) {
      put(x, base + 11, z, "light_gray_concrete");
    }
    if (x >= 9 && x <= 12 && z >= 9 && z <= 12) {
      put(x, base + 12, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter wall
  put(x, base, z, "stone_bricks"); // plinth / base course
  put(x, base + 10, z, "smooth_stone"); // roof edge slab
  put(x, base + 11, z, "white_concrete"); // parapet

  // Facade orientation and bay index
  const [odx, odz] = o[0];
  const cornerLike = o.length >= 2;
  const p = odz !== 0 ? x : z;

  for (let s = 0; s < 2; s++) {
    const f = base + 5 * s;
    // Storey band at floor level (base course / storey line)
    if (s === 1) put(x, f, z, "white_concrete");
    // Head band / storey line at top of storey
    put(x, f + 4, z, "white_concrete");

    const pier = cornerLike || p % 3 === 0;
    for (let y = f + 1; y <= f + 3; y++) {
      const isEntrance =
        s === 0 && odz === 1 && z === maxZ && (x === doorA || x === doorB);
      if (isEntrance) {
        if (y === f + 1) {
          put(x, y, z, "dark_oak_door", {
            facing: "south",
            half: "lower",
            hinge: x === doorA ? "left" : "right",
            open: "false",
            powered: "false",
          });
        } else if (y === f + 2) {
          put(x, y, z, "dark_oak_door", {
            facing: "south",
            half: "upper",
            hinge: x === doorA ? "left" : "right",
            open: "false",
            powered: "false",
          });
        } else {
          put(x, y, z, "glass_pane", PANE(true, true));
        }
        continue;
      }
      if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", PANE(odz !== 0, odz !== 0));
      }
    }

    // Warm light behind some window bays (interior glowstone)
    if (!pier && p % 6 === 1) {
      const ix = x - odx, iz = z - odz;
      if (has(ix, iz) && outs(ix, iz).length === 0) {
        put(ix, f + 2, iz, "glowstone");
      }
    }
  }

  // Warm light at entrance interior
  if (odz === 1 && z === maxZ && (x === doorA || x === doorB)) {
    const iz = z - 1;
    if (has(x, iz) && outs(x, iz).length === 0) {
      put(x, base + 2, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
