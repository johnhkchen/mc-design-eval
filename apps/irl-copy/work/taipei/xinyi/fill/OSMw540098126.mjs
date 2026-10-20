import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098126";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 26;
const g = new Voxels([W, H, D]);

// Footprint lookup and per-cell ground (relative to the lowest ground under the footprint)
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`) - minG;

// Bounds-checked setter
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward face of a perimeter cell (first missing neighbour), or null if interior
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const faceOf = (x, z) => {
  for (const [n, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) return n;
  }
  return null;
};

// Front door: centre of the south (or fallback) facade
const southCells = [];
const anyPerim = [];
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const f = faceOf(x, z);
  if (!f) continue;
  anyPerim.push([x, z, f]);
  if (f === "south") southCells.push([x, z]);
}
const doorPool = southCells.length ? southCells : anyPerim.map(([x, z]) => [x, z]);
const doorFace = southCells.length ? "south" : (anyPerim[0] ? anyPerim[0][2] : "south");
let doorKey = null;
if (doorPool.length) {
  const meanX = doorPool.reduce((s, [x]) => s + x, 0) / doorPool.length;
  doorKey = doorPool
    .slice()
    .sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX))[0]
    .join(",");
}

// Foundation, floors, facades, roof
for (const [key, gr0] of ground) {
  const [x, z] = key.split(",").map(Number);
  const gr = gOf(x, z);
  const face_ = faceOf(x, z);
  const perim = face_ !== null;
  const hash = (x * 31 + z * 17) % 5;

  // Solid foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: ground floor slab, storey slabs, roof deck
    put(x, gr, z, "smooth_stone");
    put(x, 5, z, "smooth_stone");
    put(x, 10, z, "smooth_stone");
    // Rooftop plant: a few AC/mech boxes
    if (x >= 3 && x <= 17 && (x * 5 + z * 7) % 13 === 0) {
      put(x, 11, z, "light_gray_concrete");
      put(x, 12, z, "iron_block");
    }
    continue;
  }

  // Perimeter wall
  const along = face_ === "north" || face_ === "south" ? x : z;
  const isWindowCol = along % 3 !== 0;
  const [dx, dz] = DIRS[face_];
  const isDoor = key === doorKey;

  // Floor slab at the bottom of the ground storey
  put(x, gr, z, "stone_bricks"); // plinth / base course

  // Ground storey: windows gr+1..gr+3, band gr+4
  for (let y = gr + 1; y <= 4; y++) {
    if (y <= gr + 3) {
      put(x, y, z, isWindowCol ? "light_blue_stained_glass" : "white_concrete");
    } else {
      put(x, y, z, "light_gray_concrete"); // spandrel band
    }
  }

  // Storey line at y = 5
  put(x, 5, z, "light_gray_concrete");

  // Upper storey: windows 6..8, band 9
  for (let y = 6; y <= 9; y++) {
    if (y <= 8) {
      put(x, y, z, isWindowCol ? "light_blue_stained_glass" : "white_concrete");
    } else {
      put(x, y, z, "light_gray_concrete");
    }
  }

  // Cornice at y = 10, parapet at y = 11
  put(x, 10, z, "stone_brick_slab", { type: "top" });
  put(x, 11, z, "stone_bricks");

  // Entrance: door on the front cell, lintel canopy above it
  if (isDoor && face_ === doorFace) {
    const facing = doorFace;
    const hinge = "left";
    put(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
    put(x, gr + 3, z, "stone_brick_slab", { type: "bottom" }); // canopy / lintel
    put(x, gr + 4, z, "stone_bricks");
  }

  // Warm light behind some glass (interior cell just inside the facade)
  if (!isDoor && isWindowCol && hash === 0) {
    const ix = x - dx;
    const iz = z - dz;
    if (has(ix, iz) && faceOf(ix, iz) === null) {
      const ig = gOf(ix, iz);
      put(ix, Math.max(ig + 2, gr + 2), iz, "glowstone");
      put(ix, 7, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
