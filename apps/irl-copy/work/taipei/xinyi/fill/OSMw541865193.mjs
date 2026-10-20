import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865193";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 10, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const cellList = cells.map(([x, z]) => [x, z]);
const inFp = (x, z) => ground.has(key(x, z));

// Reference level: lowest ground under the footprint. Roof surface = L0 + 11.
const L0 = Math.min(...cells.map((c) => c[2]));
const TOP = L0 + 11; // wall blocks occupy y < TOP; top wall block is rel 10

// Bounds-checked setter
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Directions
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const exposedDirs = (x, z) =>
  Object.keys(DIRS).filter(
    (d) => !inFp(x + DIRS[d][0], z + DIRS[d][1])
  );

// Group perimeter cells by exposed face and index them along the face
const faceList = { north: [], south: [], west: [], east: [] };
for (const [x, z] of cellList) {
  for (const d of exposedDirs(x, z)) faceList[d].push([x, z]);
}
for (const d of Object.keys(faceList)) {
  const ns = d === "north" || d === "south";
  faceList[d].sort((a, b) => (ns ? a[0] - b[0] : a[1] - b[1]));
}
const faceIdx = new Map();
for (const d of Object.keys(faceList)) {
  faceList[d].forEach(([x, z], j) => faceIdx.set(`${x},${z},${d}`, j));
}

// Classify each perimeter cell: corner/pier or window bay
function kindOf(x, z) {
  const ds = exposedDirs(x, z);
  if (ds.length === 0) return "int";
  if (ds.length >= 2) return "pier";
  const d = ds[0];
  const j = faceIdx.get(`${x},${z},${d}`);
  const n = faceList[d].length;
  if (j === 0 || j === n - 1 || j % 4 === 0 || j % 4 === 3) return "pier";
  return "win";
}

// Entrance: middle of the longest exposed face
let doorDir = null;
for (const d of Object.keys(faceList)) {
  if (faceList[d].length > 0 && (!doorDir || faceList[d].length > faceList[doorDir].length)) {
    doorDir = d;
  }
}
let doorCell = null;
if (doorDir) {
  const n = faceList[doorDir].length;
  doorCell = faceList[doorDir][Math.floor(n / 2)];
}
const isDoorCell = (x, z) =>
  doorCell && doorCell[0] === x && doorCell[1] === z;
const doorFacing = doorDir;

// Window pane orientation so adjacent panes connect into a grid
function paneProps(d) {
  const ns = d === "north" || d === "south";
  return {
    north: ns ? "false" : "true",
    south: ns ? "false" : "true",
    east: ns ? "true" : "false",
    west: ns ? "true" : "false",
    waterlogged: "false",
  };
}

// 1) Foundations, walls, floors
for (const [x, z] of cellList) {
  const gr = ground.get(key(x, z));

  // Solid foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ds = exposedDirs(x, z);
  const k = kindOf(x, z);

  if (ds.length === 0) {
    // Interior: air with floor slabs only
    if (gr < H) put(x, gr, z, "smooth_stone");
    const s5 = L0 + 5, s10 = L0 + 10;
    if (s5 >= gr) put(x, s5, z, "smooth_stone");
    if (s10 >= gr) put(x, s10, z, "smooth_stone");
    continue;
  }

  const door = isDoorCell(x, z) && ds.includes(doorFacing);
  const d0 = ds[0];

  for (let rel = 0; rel <= 10; rel++) {
    const y = L0 + rel;
    if (y < gr || y >= TOP) continue;

    if (rel === 0) {
      put(x, y, z, "polished_andesite");
    } else if (rel <= 3) {
      if (door && rel === 1) {
        put(x, y, z, "dark_oak_door", {
          facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (door && rel === 2) {
        put(x, y, z, "dark_oak_door", {
          facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (door && rel === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (k === "win") {
        put(x, y, z, "glass");
      } else {
        put(x, y, z, "white_terracotta");
      }
    } else if (rel === 4) {
      put(x, y, z, "red_terracotta");
    } else if (rel === 5) {
      put(x, y, z, "smooth_stone");
    } else if (rel >= 6 && rel <= 8) {
      if (k === "win") put(x, y, z, "light_blue_stained_glass_pane", paneProps(d0));
      else put(x, y, z, "white_terracotta");
    } else if (rel === 9) {
      put(x, y, z, "white_terracotta");
    } else if (rel === 10) {
      put(x, y, z, "smooth_stone"); // parapet cap
    }
  }
}

// 2) Warm lights behind some glass (in the air gap, interior cells only)
for (const [x, z] of cellList) {
  const ds = exposedDirs(x, z);
  if (ds.length !== 1) continue;
  const d = ds[0];
  if (kindOf(x, z) !== "win") continue;
  const j = faceIdx.get(`${x},${z},${d}`);
  const [dx, dz] = DIRS[d];
  const bx = x - dx, bz = z - dz;
  if (!inFp(bx, bz) || exposedDirs(bx, bz).length !== 0) continue;
  const gb = ground.get(key(bx, bz));

  // Ground floor: shroomlight behind some shopfronts
  if (j % 4 === 1 && L0 + 2 >= gb) put(bx, L0 + 2, bz, "shroomlight");
  // Upper floor: glowstone behind some windows
  if (j % 3 === 1 && L0 + 7 >= gb) put(bx, L0 + 7, bz, "glowstone");
}

// 3) Roof equipment: a 2x2 water tank on interior roof near the centre
let best = null;
for (let x = 0; x < W - 1; x++) {
  for (let z = 0; z < D - 1; z++) {
    const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    const ok = quad.every(([qx, qz]) => inFp(qx, qz) && exposedDirs(qx, qz).length === 0);
    if (!ok) continue;
    const cx = x + 0.5 - W / 2, cz = z + 0.5 - D / 2;
    const dist = cx * cx + cz * cz;
    if (!best || dist < best.dist) best = { x, z, dist };
  }
}
if (best) {
  const roofY = TOP; // one block above the roof slab surface
  for (let dx = 0; dx < 2; dx++) {
    for (let dz = 0; dz < 2; dz++) {
      const tx = best.x + dx, tz = best.z + dz;
      const gt = ground.get(key(tx, tz));
      if (roofY >= gt) put(tx, roofY, tz, "light_gray_concrete");
    }
  }
  for (let dx = 0; dx < 2; dx++) {
    for (let dz = 0; dz < 2; dz++) {
      const tx = best.x + dx, tz = best.z + dz;
      put(tx, roofY + 1, tz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
