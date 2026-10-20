import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE102-0238-24F: 聯合大哲, built 2013. Reinforced-concrete residential tower
// in Xinyi: white tiled concrete walls, smooth quartz floor bands, cyan glass
// windows with white piers, a glazed lobby on the north (street) face, a flat
// roof with a parapet and a central mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE102-0238-24F";
const W = 23, H = 128, D = 45;
const ROOF = 116;      // parapet top, from lidar roof height
const STOREY = 5;      // blocks per storey; floor lines at every multiple of 5

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Exterior faces per footprint cell (a face is exterior when its neighbour is missing).
const ext = new Map();
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = [];
  for (const f of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[f];
    if (!has(x + dx, z + dz)) faces.push(f);
  }
  if (faces.length) ext.set(k, faces);
}

// Footprint bounds, used for the central penthouse.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const g = new Voxels([W, H, D]);
const GLASS = "cyan_stained_glass_pane";
const WALL = "white_concrete";
const BAND = "smooth_quartz";
const SLAB = "light_gray_concrete";
const FOUND = "stone_bricks";

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, FOUND);
}

// 2. Body: storeys from each cell's ground up to the parapet.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = ext.get(k) || [];
  const isExt = faces.length > 0;
  const corner = faces.length > 1;

  for (let y = gr; y <= ROOF && y < H; y++) {
    const rel = y % STOREY;

    // Parapet course on the roof.
    if (y === ROOF) {
      if (isExt) g.set(x, y, z, BAND);
      continue;
    }

    // Floor lines: full slab across the footprint (exterior as a quartz band).
    if (rel === 0) {
      g.set(x, y, z, isExt ? BAND : SLAB);
      continue;
    }

    if (!isExt) continue; // interior air gap

    const face = faces[0];
    const along = (face === "N" || face === "S") ? x : z;
    const ground0 = y < STOREY;

    // Ground storey on the street (north) face: glazed lobby with a door.
    if (ground0 && faces.includes("N")) {
      if (rel === 4) { g.set(x, y, z, BAND); continue; }
      if (along % 4 === 0 || corner) { g.set(x, y, z, WALL); continue; }
      if (along === 11 && (y === gr || y === gr + 1) && y < 4) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      g.set(x, y, z, "cyan_stained_glass");
      continue;
    }

    // Upper storeys: lintel course, window bands and white piers.
    if (rel === 4) { g.set(x, y, z, WALL); continue; }
    const pier = corner || along % 3 === 0;
    if (pier) { g.set(x, y, z, WALL); continue; }

    const alongX = face === "N" || face === "S";
    g.set(x, y, z, GLASS, alongX
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
}

// 3. Warm light behind some windows (glowstone in the air gap, inside the storey).
for (const [k, faces] of ext) {
  const [x, z] = k.split(",").map(Number);
  const face = faces[0];
  if (faces.length > 1) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || ext.has(`${ix},${iz}`)) continue;
  const along = (face === "N" || face === "S") ? x : z;
  const gr = ground.get(k);
  for (let y = gr; y < ROOF && y < H; y++) {
    const rel = y % STOREY;
    if (rel !== 2 || along % 3 === 0) continue;
    const storey = Math.floor(y / STOREY);
    if ((along + storey) % 4 === 0) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

// 4. Roof: central mechanical penthouse standing on the roof slab (y 115).
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (ext.has(k)) continue;
  const inset = Math.min(x - minX, maxX - x, z - minZ, maxZ - z);
  if (inset < 4) continue;
  for (let y = ROOF; y <= 118 && y < H; y++) {
    g.set(x, y, z, SLAB);
  }
  if (x - minX > 5 && maxX - x > 5 && z - minZ > 5 && maxZ - z > 5) {
    // Penthouse cap.
    g.set(x, 119, z, BAND);
  }
}

g.save(`${DIR}/${ID}.nbt`);
