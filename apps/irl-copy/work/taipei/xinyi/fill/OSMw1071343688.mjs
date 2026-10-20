import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building record: no name, lidar roof about 11 blocks above lowest ground.
// Read as a 1980s-90s Taipei commercial block: two storeys of 5 blocks each,
// a stone plinth, a white tiled facade with a glazed shopfront, a cornice,
// a parapet, and a small rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343688";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 39, H = 23, D = 30;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = {
  N: [0, -1],
  S: [0, 1],
  W: [-1, 0],
  E: [1, 0],
};

// Outward faces: a footprint cell is on a face when its neighbour in that
// direction is not part of the footprint.
const faceCells = { N: [], S: [], W: [], E: [] };
const isEdge = (x, z) =>
  Object.values(DIRS).some(([dx, dz]) => !has(x + dx, z + dz));

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) faceCells[name].push([x, z]);
  }
}

// Principal (street) frontage: the face with the most exposed cells.
let front = "S";
for (const name of Object.keys(faceCells)) {
  if (faceCells[name].length > faceCells[front].length) front = name;
}
const uOf = (dir, x, z) => (dir === "N" || dir === "S" ? x : z);
const frontU = faceCells[front].map(([x, z]) => uOf(front, x, z)).sort((a, b) => a - b);
const doorU = frontU[Math.floor(frontU.length / 2)];

// Foundation, floor slabs and roof slab, one column per footprint cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Ground floor slab / plinth
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");
  // Storey-line slab at rel 5
  put(x, gr + 5, z, edge ? "smooth_stone" : "smooth_stone");
  // Roof slab at rel 10
  put(x, gr + 10, z, edge ? "stone_bricks" : "smooth_stone");
}

// Facade on each exposed face.
function facade(x, z, dir, gr) {
  const u = uOf(dir, x, z);
  const isFront = dir === front;
  const isDoor = isFront && u === doorU;
  const pierGround = u % 4 === 0;
  const pierUpper = u % 3 === 0;

  // Ground storey, rel 1..4
  for (let rel = 1; rel <= 4; rel++) {
    const y = gr + rel;
    if (rel === 4) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (isDoor) {
      put(x, y, z, "glass");
    } else if (pierGround) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Storey band at rel 5
  put(x, gr + 5, z, "smooth_stone");

  // Upper storey, rel 6..9
  for (let rel = 6; rel <= 9; rel++) {
    const y = gr + rel;
    if (rel === 6 || rel === 9) {
      put(x, y, z, "white_concrete");
    } else if (pierUpper) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "gray_stained_glass");
    }
  }

  // Cornice and parapet
  put(x, gr + 10, z, "stone_bricks");
  put(x, gr + 11, z, pierUpper ? "stone_bricks" : "white_concrete");
}

for (const dir of Object.keys(faceCells)) {
  for (const [x, z] of faceCells[dir]) {
    const gr = ground.get(`${x},${z}`);
    facade(x, z, dir, gr);
  }
}

// Warm light behind some upper-storey windows: glowstone one cell inside.
for (const dir of Object.keys(faceCells)) {
  const [dx, dz] = DIRS[dir];
  for (const [x, z] of faceCells[dir]) {
    const gr = ground.get(`${x},${z}`);
    const u = uOf(dir, x, z);
    if (u % 3 === 0) continue;
    if ((u + z + x) % 4 !== 1) continue;
    const ix = x - dx;
    const iz = z - dz;
    if (!has(ix, iz) || isEdge(ix, iz)) continue;
    put(ix, gr + 7, iz, "glowstone");
  }
}

// Ground-floor door: glass opening with a stone lintel above (rel 4 already stone).
for (const [x, z] of faceCells[front]) {
  if (uOf(front, x, z) !== doorU) continue;
  const gr = ground.get(`${x},${z}`);
  put(x, gr + 4, z, "stone_bricks");
}

// Rooftop plant: small enclosures on interior roof cells.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x % 8 === 4 && z % 6 === 3 && gr + 12 < H) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "smooth_stone_slab", { type: "bottom" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
