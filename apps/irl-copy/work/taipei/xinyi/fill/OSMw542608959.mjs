// Taipei Xinyi, OSMw542608959: a 2-storey, late-20th-century commercial block.
// Reasoning from the lidar record (roof ~11 blocks above the lowest ground):
// two storeys of about 5 blocks, a 5-block shopfront ground floor with a granite
// base and a fascia, and an upper storey of white-tiled spandrels and glass bays
// in light-grey frames. A flat roof sits on a parapet with a coping, and a
// central plant enclosure stands on the roof. The front is the south face, with
// a centred door and warm glowstone and shroomlight behind the glass at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608959";
const W = 20, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inFP = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

function put(x, y, z, id, props) {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const NORMALS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACE_NAME = { N: "north", S: "south", W: "west", E: "east" };
const FACE_ORDER = ["S", "N", "E", "W"];

// Exposed faces of each cell (neighbour not in footprint).
function exposedFaces(x, z) {
  const out = [];
  for (const f of FACE_ORDER) {
    const [nx, nz] = NORMALS[f];
    if (!inFP(x + nx, z + nz)) out.push(f);
  }
  return out;
}

// Each perimeter cell is assigned one facade face (its first exposed face).
const facadeOf = new Map();
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const ex = exposedFaces(x, z);
  if (ex.length) facadeOf.set(`${x},${z}`, ex[0]);
}

// Along-face coordinate: x for north/south faces, z for east/west faces.
const alongOf = (x, z, face) => (face === "N" || face === "S" ? x : z);

// Pick the entrance face: south if available, otherwise the first available.
let front = "S";
if (![...facadeOf.values()].includes("S")) front = [...facadeOf.values()][0];

// Centre of the front face's along range, for the entrance.
const frontAlong = [];
for (const [k, f] of facadeOf) {
  if (f !== front) continue;
  const [x, z] = k.split(",").map(Number);
  frontAlong.push(alongOf(x, z, front));
}
const entranceAlong = frontAlong.length
  ? Math.round((Math.min(...frontAlong) + Math.max(...frontAlong)) / 2)
  : -1;

// 1. Foundation, floor slabs and roof deck.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Ground-floor slab at the cell's ground level.
  put(x, gr, z, "smooth_stone");
  // Second-floor slab at y=5, where the ground is below it.
  if (gr < 5) put(x, 5, z, "smooth_stone");
  // Roof deck at y=10.
  if (gr <= 10) put(x, 10, z, "smooth_stone");
}

// 2. Perimeter walls, facade articulation, shopfront and entrance.
for (const [k, face] of facadeOf) {
  const [x, z] = k.split(",").map(Number);
  const gr = gAt(x, z);
  if (gr >= 10) continue;
  const along = alongOf(x, z, face);

  for (let y = gr; y <= 9; y++) {
    let id;
    let props;
    if (y === gr) {
      id = "polished_granite"; // base course
    } else if (y <= 3) {
      // Shopfront: glass bays with light-grey piers.
      id = along % 4 === 0 ? "light_gray_concrete" : "glass";
    } else if (y === 4) {
      id = "smooth_stone"; // fascia
    } else if (y === 5 || y === 9) {
      id = "white_concrete"; // spandrels and storey line
    } else {
      // Upper windows: glass bays with light-grey mullions.
      id = along % 3 === 0 ? "light_gray_concrete" : "glass";
    }

    // Entrance: dark oak door on the centre bay of the front face.
    if (face === front && along === entranceAlong && y >= gr + 1 && y <= gr + 2 && gr + 2 <= 4) {
      const half = y === gr + 1 ? "lower" : "upper";
      id = "dark_oak_door";
      props = { facing: FACE_NAME[face], half, hinge: "left", open: "false", powered: "false" };
    }

    put(x, y, z, id, props);
  }

  // Parapet and coping at the roof edge.
  put(x, 11, z, "white_concrete");
  put(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 3. Warm light behind glass (interior air cells next to the glazing).
for (const [k, face] of facadeOf) {
  const [x, z] = k.split(",").map(Number);
  const gr = gAt(x, z);
  if (gr >= 10) continue;
  const along = alongOf(x, z, face);
  const [nx, nz] = NORMALS[face];
  const ix = x - nx, iz = z - nz; // inward neighbour
  if (!inFP(ix, iz)) continue;
  const isGlazedUpper = along % 3 !== 0 && gr <= 7;
  const isGlazedShop = along % 4 !== 0 && gr <= 1;
  if (isGlazedUpper && along % 6 === 1) {
    put(ix, 7, iz, "shroomlight");
  } else if (isGlazedShop && along % 8 === 2 && gr + 2 <= 3) {
    put(ix, gr + 2, iz, "glowstone");
  }
}

// 4. Roof plant enclosure on the centre of the roof, standing on the deck.
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (facadeOf.has(k)) continue; // interior cells only
  if (gAt(x, z) > 10) continue;
  if (x < 6 || x > 13 || z < 6 || z > 14) continue;
  put(x, 11, z, "light_gray_concrete");
  put(x, 12, z, "light_gray_concrete");
  put(x, 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
