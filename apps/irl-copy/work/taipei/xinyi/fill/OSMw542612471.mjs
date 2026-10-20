import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612471";
const W = 62, H = 23, D = 27;

// Record: no building data, so this is a 1990s-2000s Xinyi mid-rise commercial block:
// two storeys of shopfront and tinted glazing with white concrete piers, a stone base
// and cornice, and a plain roof with plant units. Roof top sits about 11 blocks above
// the lowest ground.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let maxG = -Infinity;
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  ground.set(`${x},${z}`, gg);
  if (gg > maxG) maxG = gg;
}

// Level platform: every storey stands on the highest footprint ground, with solid
// foundation below each cell's own ground.
const B = maxG;

const K = (x, y, z) => `${x},${y},${z}`;
const inside = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) =>
  inside(x, z) && (!inside(x + 1, z) || !inside(x - 1, z) || !inside(x, z + 1) || !inside(x, z - 1));
const isInner = (x, z) => inside(x, z) && !isEdge(x, z);

const placed = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  placed.set(K(x, y, z), id);
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = "light_blue_stained_glass_pane";
const paneList = [];
const pane = (x, y, z) => {
  placed.set(K(x, y, z), PANE);
  paneList.push([x, y, z]);
};

const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));
const edgeCells = cellList.filter(([x, z]) => isEdge(x, z));

// 1. Foundation and floor plates
for (const [x, z] of cellList) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone");
  put(x, B, z, "smooth_stone");          // ground floor slab
  if (B + 5 < H) put(x, B + 5, z, "smooth_stone"); // first floor slab
  if (B + 10 < H) put(x, B + 10, z, "light_gray_concrete"); // roof slab
}

// 2. Perimeter walls: storey 1 (B+1..B+4), storey 2 (B+6..B+9), parapet B+11
for (const [x, z] of edgeCells) {
  const pier = x % 4 === 0 || z % 4 === 0;

  // Storey 1
  put(x, B + 1, z, "polished_granite");               // base course
  for (const y of [B + 2, B + 3]) {
    if (pier) put(x, y, z, "light_gray_concrete");    // mullions
    else pane(x, y, z);                               // shopfront glazing
  }
  put(x, B + 4, z, "white_concrete");                 // spandrel / canopy band

  // Storey 2
  put(x, B + 6, z, "white_concrete");
  for (const y of [B + 7, B + 8]) {
    if (pier) put(x, y, z, "light_gray_concrete");
    else pane(x, y, z);
  }
  put(x, B + 9, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // cornice

  // Parapet
  put(x, B + 11, z, "white_concrete");
}

// 3. Entrances: one door in each long face, off the grid lines
const zMin = Math.min(...edgeCells.map(([, z]) => z));
const zMax = Math.max(...edgeCells.map(([, z]) => z));
const xMid = Math.floor(W / 2);
const pickDoor = (zVal) => {
  const row = edgeCells
    .filter(([x, z]) => z === zVal && x % 4 !== 0)
    .sort((a, b) => Math.abs(a[0] - xMid) - Math.abs(b[0] - xMid));
  return row[0] ?? null;
};
const doors = [
  [pickDoor(zMin), "north"],
  [pickDoor(zMax), "south"],
].filter(([c]) => c);

for (const [[x, z], facing] of doors) {
  put(x, B + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, B + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 4. Warm lights one block behind some shopfront and office windows
const inwardOf = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (isInner(x + dx, z + dz)) return [x + dx, z + dz];
  }
  return null;
};
for (const [x, z] of edgeCells) {
  if (x % 4 === 0 || z % 4 === 0) continue;
  if ((x + z) % 3 !== 0) continue;
  const inw = inwardOf(x, z);
  if (!inw) continue;
  for (const y of [B + 2, B + 7]) {
    const [ix, iz] = inw;
    if (!placed.has(K(ix, y, iz))) put(ix, y, iz, "glowstone");
  }
}

// 5. Roof plant units on the parapet level, inside the footprint
if (B + 12 < H) {
  for (const [x, z] of cellList) {
    if (!isInner(x, z)) continue;
    if ((x % 12 === 4 || x % 12 === 5) && (z % 8 === 3 || z % 8 === 4)) {
      put(x, B + 11, z, "iron_block");
    }
  }
}

// 6. Glass panes last, connected to neighbouring wall cells in the same plane
const paneNeighbour = (x, y, z, dx, dz) => {
  const nx = x + dx, nz = z + dz;
  return isEdge(nx, nz) && placed.has(K(nx, y, nz));
};
for (const [x, y, z] of paneList) {
  if (placed.get(K(x, y, z)) !== PANE) continue; // replaced by a door
  const props = {
    north: String(paneNeighbour(x, y, z, 0, -1)),
    south: String(paneNeighbour(x, y, z, 0, 1)),
    east: String(paneNeighbour(x, y, z, 1, 0)),
    west: String(paneNeighbour(x, y, z, -1, 0)),
    waterlogged: "false",
  };
  g.set(x, y, z, PANE, props);
}

g.save(`${DIR}/${ID}.nbt`);
