import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, no use. Lidar gives a roof about 11 blocks above the lowest ground.
// Read as a two-storey mid-century commercial block: white concrete frame, a stone base,
// a shopfront ground floor, one upper storey of tinted glass, a cornice and parapet,
// with rooftop plant and a mast. Taipei's 1960s-80s low blocks fit that profile.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888789";
const W = 12, H = 23, D = 13;
const ROOF = 10;   // roof slab level
const BAND = 5;    // storey line between floors
const PARAPET = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gy)));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces of a cell: the side has no footprint neighbour.
const DIRS = {
  north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0],
};
const exteriorFaces = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);

// Pass 1: solid body, foundations, floors, base course, cornice, parapet.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = gAt(x, z);
  const faces = exteriorFaces(x, z);
  const perimeter = faces.length > 0;

  // Foundation from y 0 up to the ground under this cell.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (perimeter) {
    for (let y = gr; y <= ROOF; y++) put(x, y, z, "white_concrete");
    put(x, gr, z, "stone_bricks");                 // base course
    if (BAND >= gr) put(x, BAND, z, "smooth_stone"); // storey line
    put(x, ROOF, z, "smooth_stone");              // cornice
    put(x, PARAPET, z, "white_concrete");         // parapet
  } else {
    put(x, gr, z, "smooth_stone");                // interior floor slab
    if (BAND >= gr) put(x, BAND, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");             // roof deck
  }
}

// Pass 2: windows, shopfront, entrance.
// Window columns sit at along-face index % 3 === 1; corners and other columns are piers.
const alongOf = (face, x, z) => (face === "north" || face === "south" ? x : z);
const windowCells = [];
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  const faces = exteriorFaces(x, z);
  if (faces.length !== 1) continue; // corners stay as solid piers
  const face = faces[0];
  if (alongOf(face, x, z) % 3 !== 1) continue;
  windowCells.push({ x, z, gr, face });
  // Ground-floor glazing (shopfront).
  for (let y = gr + 1; y <= Math.min(gr + 3, BAND - 1); y++) {
    put(x, y, z, "light_blue_stained_glass");
  }
  // Upper-storey glazing.
  if (BAND + 1 >= gr) {
    for (let y = BAND + 1; y <= ROOF - 2; y++) put(x, y, z, "light_blue_stained_glass");
  }
}

// Entrance: a window column on the north face, nearest the middle of that face.
const northWin = windowCells.filter((c) => c.face === "north");
const pool = northWin.length ? northWin : windowCells;
let door = null;
if (pool.length) {
  const meanX = pool.reduce((s, c) => s + c.x, 0) / pool.length;
  door = pool.reduce((best, c) => (Math.abs(c.x - meanX) < Math.abs(best.x - meanX) ? c : best));
  const { x, z, gr } = door;
  put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "white_concrete"); // lintel over the door
  // Warm light in the shopfront beside the entrance.
  put(x - 1, gr + 2, z, "shroomlight");
}

// Pass 3: warm lights behind glass on interior cells.
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  if (exteriorFaces(x, z).length) continue;
  if ((x * 2 + z) % 5 === 0) {
    if (gr + 1 <= BAND - 1) put(x, gr + 1, z, "shroomlight");
    if (BAND + 1 < ROOF) put(x, BAND + 1, z, "glowstone");
  }
}

// Pass 4: roof plant and a mast on interior roof cells.
const interiorRoof = cells
  .filter(([x, z]) => exteriorFaces(x, z).length === 0 && gAt(x, z) <= ROOF)
  .map(([x, z]) => [x, z]);
const used = new Set();
const key = (x, z) => `${x},${z}`;

// Water tank: a 2x2 block of iron, 3 tall, if the four cells are interior.
const tankOrigin = interiorRoof.find(([x, z]) =>
  [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => interiorRoof.some(([a, b]) => a === x + dx && b === z + dz)));
if (tankOrigin) {
  const [tx, tz] = tankOrigin;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    used.add(key(tx + dx, tz + dz));
    for (let y = PARAPET; y <= PARAPET + 2; y++) put(tx + dx, y, tz + dz, "iron_block");
  }
}

// AC units on a pattern of other interior roof cells.
for (const [x, z] of interiorRoof) {
  if (used.has(key(x, z))) continue;
  if ((x * 3 + z * 5) % 7 === 0) {
    used.add(key(x, z));
    put(x, PARAPET, z, "iron_block");
  }
}

// Mast: one lightning rod on a free interior roof cell nearest the centre.
const free = interiorRoof.filter(([x, z]) => !used.has(key(x, z)));
if (free.length) {
  const [mx, mz] = free.reduce((best, c) =>
    (Math.hypot(c[0] - W / 2, c[1] - D / 2) < Math.hypot(best[0] - W / 2, best[1] - D / 2) ? c : best));
  for (let y = PARAPET; y <= PARAPET + 2; y++) {
    put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
