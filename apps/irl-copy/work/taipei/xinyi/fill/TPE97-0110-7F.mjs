import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE97-0110-7F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 47, D = 10;
const g = new Voxels([W, H, D]);

// 2008 mid-rise office block, Xinyi style: white precast mullions and corners,
// blue-green glass, dark stone spandrel bands for depth, stone base, cornice and parapet,
// a readable street entrance with a dark lintel and hanging lanterns, and a mechanical penthouse.
const ROOF_Y = 35;
const TOP_CORNICE_Y = 34;

const key = (x, z) => `${x},${z}`;
const fp = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  fp.set(key(x, z), gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const inFp = (x, z) => fp.has(key(x, z));
const isEdge = (x, z) =>
  !inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1);
const isCorner = (x, z) =>
  (x === minX || x === maxX) && (z === minZ || z === maxZ);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: the front-face cell closest to the middle of the front face (not a corner).
let doorX = null, doorZ = null;
{
  const midX = (minX + maxX) / 2;
  let best = Infinity;
  for (const [x, z] of cells) {
    if (z !== minZ || !isEdge(x, z) || isCorner(x, z)) continue;
    const d = Math.abs(x - midX);
    if (d < best) { best = d; doorX = x; doorZ = z; }
  }
}
const doorFacing = doorZ === minZ ? "north" : "south";
const nearDoor = (x, z, span) =>
  doorX !== null && z === doorZ && Math.abs(x - doorX) <= span;

// Pass 1: foundations from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// Pass 2: interior cells, a floor slab per storey, air behind the glass.
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  for (let k = 0; k <= 6; k++) {
    const y = 5 * k;
    if (y >= gr) put(x, y, z, "light_gray_concrete");
  }
  if (gr > 0 && gr < ROOF_Y && gr % 5 !== 0) put(x, gr, z, "light_gray_concrete");
}

// Pass 3: facade ring: storey bands, mullions, window glass, shopfront, entrance, cornice.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const idx = (z === minZ || z === maxZ) ? x : z;
  const mull = isCorner(x, z) || idx % 3 === 0;
  const onNS = z === minZ || z === maxZ;

  for (let y = gr; y <= TOP_CORNICE_Y; y++) {
    const k = Math.floor(y / 5);
    const r = y % 5;

    if (k === 0) {
      // Ground storey: stone plinth, shopfront glass, entrance with dark lintel and lanterns.
      if (r === 0) {
        put(x, y, z, "polished_andesite");
      } else if (x === doorX && z === doorZ) {
        if (r === 1) put(x, y, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (r === 2) put(x, y, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (r === 3) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "black_concrete"); // entrance lintel
      } else if (nearDoor(x, z, 2) && r === 4) {
        put(x, y, z, "black_concrete"); // dark canopy line over the entrance bay
      } else if (nearDoor(x, z, 2) && Math.abs(x - doorX) === 2 && r === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (mull) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }

    // Upper storeys
    if (y === TOP_CORNICE_Y) {
      put(x, y, z, "white_concrete"); // cornice course
    } else if (r === 0) {
      put(x, y, z, "stone"); // dark spandrel band: breaks the glass into storeys
    } else {
      put(x, y, z, mull ? "white_concrete" : "light_blue_stained_glass");
      // Warm light behind some glass on the long faces (interior cell one step in).
      if (onNS && !mull && r === 2 && (k + x) % 3 === 0) {
        const dz = z === minZ ? 1 : -1;
        if (inFp(x, z + dz) && !isEdge(x, z + dz)) {
          put(x, y, z + dz, "glowstone");
        }
      }
    }
  }
}

// Pass 4: roof slab, parapet, mechanical penthouse with top.
for (const [x, z] of cells) {
  put(x, ROOF_Y, z, "light_gray_concrete");
  if (isEdge(x, z)) {
    put(x, 36, z, "white_concrete"); // parapet
    put(x, 37, z, "white_concrete");
  }
}

// Penthouse block in the middle of the roof.
for (const [x, z] of cells) {
  if (x < 4 || x > 9 || z < 3 || z > 6) continue;
  const ring = x === 4 || x === 9 || z === 3 || z === 6;
  for (let y = 36; y <= 39; y++) {
    if (ring && (y === 37 || y === 38) && (x + z) % 2 === 0) {
      put(x, y, z, "light_blue_stained_glass");
    } else {
      put(x, y, z, "gray_concrete");
    }
  }
  put(x, 40, z, "stone_bricks");
  if (ring && (x === 4 || x === 9) && (z === 3 || z === 6)) {
    put(x, 41, z, "sea_lantern"); // rooftop corner lights for dusk read
  }
}

g.save(`${DIR}/${ID}.nbt`);
