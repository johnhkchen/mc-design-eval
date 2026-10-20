import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456430";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey low-rise commercial block (1970s-80s Xinyi fabric):
// stone plinth, light concrete walls with pilasters, shopfront ground floor,
// glazed upper storey with white spandrels, smooth cornice, parapet, rooftop plant.
const W = 20, H = 23, D = 21;
const FLOOR_2 = 5;   // storey-line slab between storeys
const ROOF = 10;     // roof deck / cornice level
const PARAPET = 11;  // top of parapet

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const FACE_ORDER = ["north", "south", "west", "east"];

const exteriorFaces = (x, z) =>
  FACE_ORDER.filter((f) => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });

// Tangential index lists per face (sorted unique positions of exterior cells)
const faceList = {};
for (const f of FACE_ORDER) faceList[f] = new Set();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (const f of exteriorFaces(x, z)) {
    faceList[f].add(f === "north" || f === "south" ? x : z);
  }
}
for (const f of FACE_ORDER) faceList[f] = [...faceList[f]].sort((a, b) => a - b);

const tangential = (f, x, z) => (f === "north" || f === "south" ? x : z);
const primaryFace = (ext) => (ext.includes("south") ? "south" : ext[0]);

const doorFace = faceList.south.length ? "south" : FACE_ORDER.find((f) => faceList[f].length);
const doorList = faceList[doorFace];
const doorT = doorList[Math.floor(doorList.length / 2)];

function wallBlock(f, t, k, n, y, gr) {
  if (y === ROOF) return "smooth_stone";     // cornice course
  if (y === PARAPET) return "white_concrete"; // parapet
  if (y === gr) return "stone_bricks";        // base course
  if (y === FLOOR_2) return "smooth_stone";   // storey line
  const pil = k === 0 || k === n - 1;
  if (y > gr && y <= 4) {                     // shopfront storey
    if (y === 4) return "white_concrete";     // fascia
    if (pil) return "white_concrete";
    return "glass_pane";
  }
  if (y >= 6 && y <= 9) {                     // upper storey
    if (y === 9) return "white_concrete";     // spandrel
    if (pil || k % 3 === 0) return "white_concrete";
    return "glass_pane";
  }
  return "light_gray_concrete";
}

const isPerimeter = new Set();
for (const [x, z] of cells) {
  if (exteriorFaces(x, z).length) isPerimeter.add(`${x},${z}`);
}

// Pass 1: foundations, floors, interior slabs
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (!isPerimeter.has(`${x},${z}`)) {
    g.set(x, gr, z, "smooth_stone");                 // ground floor slab
    if (gr < FLOOR_2) g.set(x, FLOOR_2, z, "smooth_stone"); // storey-2 floor
    g.set(x, ROOF, z, "light_gray_concrete");        // roof deck
  }
}

// Pass 2: perimeter walls with articulated facades
for (const [x, z, gr] of cells) {
  const key = `${x},${z}`;
  if (!isPerimeter.has(key)) continue;
  const ext = exteriorFaces(x, z);
  const f = primaryFace(ext);
  const t = tangential(f, x, z);
  const list = faceList[f];
  const k = list.indexOf(t);
  const n = list.length;

  for (let y = gr; y <= PARAPET; y++) {
    // Entrance door on the primary (south) face, middle bay
    if (f === doorFace && t === doorT && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: doorFace,
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    // Ground-floor entrance bay glazing is kept above the door
    if (f === doorFace && t === doorT && y === 4) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    g.set(x, y, z, wallBlock(f, t, k, n, y, gr));
  }
}

// Pass 3: warm lights behind glass (interior cells only)
for (const [x, z, gr] of cells) {
  const key = `${x},${z}`;
  if (!isPerimeter.has(key)) continue;
  const ext = exteriorFaces(x, z);
  const f = primaryFace(ext);
  const t = tangential(f, x, z);
  const list = faceList[f];
  const k = list.indexOf(t);
  const n = list.length;
  const pil = k === 0 || k === n - 1;
  if (pil) continue;
  const [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isPerimeter.has(`${ix},${iz}`)) continue;
  const igr = G(ix, iz);
  if (k % 2 === 1) {
    // upper storey: glowstone on the storey-2 floor behind a window
    if (FLOOR_2 + 1 <= 9 && igr <= FLOOR_2) g.set(ix, FLOOR_2 + 1, iz, "glowstone");
  } else if (k % 4 === 0 && igr + 1 <= 3) {
    // shopfront: shroomlight behind the glass
    g.set(ix, igr + 1, iz, "shroomlight");
  }
}

// Pass 4: rooftop plant and vent on the roof
for (const [x, z] of cells) {
  if (isPerimeter.has(`${x},${z}`)) continue;
  if (x >= 8 && x <= 11 && z >= 8 && z <= 11) {
    g.set(x, PARAPET, z, "light_gray_concrete");
  }
}
if (has(9, 9) && !isPerimeter.has("9,9")) g.set(9, PARAPET + 1, 9, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
