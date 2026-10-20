import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337630";
const W = 25, H = 19, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (voxel y, clamped under the top of the world)
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.min(gr, H - 2));
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

const base = Math.min(...cells.map((c) => Math.min(c[2], H - 2)));
// Lidar: roof about 7 blocks above lowest ground; keep room for rooftop units
const roofY = Math.min(base + 7, H - 2);

// Edge cell = any 4-neighbour outside the footprint
const edge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, H - 2);
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone");
}

// 2. Walls, storey lines, roof slab
for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, H - 2);
  if (gr >= roofY) continue; // hill cell rising above the roof line: foundation only
  const ed = edge(x, z);

  for (let y = gr + 1; y < roofY; y++) {
    const rel = y - base;
    if (!ed) {
      // interior: air gap behind glass, one floor slab per storey
      if (rel === 4) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (rel === 1) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (rel === 4) {
      put(x, y, z, "smooth_stone"); // storey line / cornice band
    } else if (rel === 2 || rel === 3 || rel === 5 || rel === 6) {
      if ((x + z) % 3 === 0) put(x, y, z, "white_concrete"); // piers
      else put(x, y, z, "glass_pane", PANE);
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Roof slab at roofY
  if (ed) put(x, roofY, z, "smooth_stone");
  else put(x, roofY, z, "light_gray_concrete");
}

// 3. Lit windows: glowstone just inside the glass on upper storeys
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, H - 2);
  if (gr >= roofY || !edge(x, z)) continue;
  const y = base + 5;
  if (y <= gr || y >= roofY) continue;
  if ((x + z) % 3 === 0) continue; // pier
  if ((x * 5 + z * 3) % 4 !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !edge(nx, nz) && ground(nx, nz) < y) {
      put(nx, y, nz, "glowstone");
      break;
    }
  }
}

// 4. Entrance on the min-z face, middle of that run
const minZ = Math.min(...cells.map((c) => c[1]));
const faceXs = cells.filter((c) => c[1] === minZ).map((c) => c[0]).sort((a, b) => a - b);
const doorX = faceXs[Math.floor(faceXs.length / 2)];
const doorZ = minZ;
const doorG = ground(doorX, doorZ);
const doorY0 = Math.max(base + 2, doorG + 1);
if (doorY0 + 1 < roofY) {
  put(doorX, doorY0, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, doorY0 + 1, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // lit lobby glow just inside the door
  if (has(doorX, doorZ + 1) && !edge(doorX, doorZ + 1)) {
    put(doorX, doorY0, doorZ + 1, "glowstone");
  }
}

// 5. Rooftop plant: small units on some interior roof cells
for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, H - 2);
  if (gr >= roofY || edge(x, z)) continue;
  if ((x * 7 + z * 11) % 13 === 0 && roofY + 1 < H) {
    put(x, roofY + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
