import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173962";
const W = 13, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(key(x, z), gr);
const has = (x, z) => groundAt.has(key(x, z));

const minG = Math.min(...cells.map((c) => c[2]));
const ROOF = minG + 11;   // roof deck top (lidar: ~11 above lowest ground)
const PAR = ROOF + 1;     // parapet course
const TOP_WALL = ROOF - 1;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const dirName = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const outwardDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const paneProps = (alongX) => ({
  north: alongX ? "false" : "true",
  south: alongX ? "false" : "true",
  east: alongX ? "true" : "false",
  west: alongX ? "true" : "false",
  waterlogged: "false",
});

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Walls, storey lines, slabs
for (const [x, z, gr] of cells) {
  const out = outwardDirs(x, z);
  const perim = out.length > 0;

  // Interior floor slab at the second-floor line (interior and perimeter)
  const slabY = minG + 6;
  if (gr < slabY && !perim) put(x, slabY, z, "smooth_stone");

  if (!perim) continue;

  const alongX = out.some(([dx, dz]) => dz !== 0); // outward face is N/S, so the glass runs E-W
  const idx = alongX ? x : z;

  for (let y = gr + 1; y <= TOP_WALL; y++) {
    const rel = y - minG;
    let id = "white_concrete";
    let props;

    if (rel === 1) {
      id = "smooth_stone";                        // base course
    } else if ([2, 3, 4, 7, 8, 9].includes(rel)) {
      if (idx % 3 === 0) {
        id = "smooth_quartz";                     // pier between bays
      } else {
        id = "light_blue_stained_glass_pane";     // tinted glazing
        props = paneProps(alongX);
      }
    } else if (rel === 5 || rel === 10) {
      id = "light_gray_concrete";                 // spandrel
    } else if (rel === 6) {
      id = "smooth_stone";                        // storey line
    }

    put(x, y, z, id, props);
  }

  // Warm light behind some glass: glowstone one cell inside
  const [dx, dz] = out[0];
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && outwardDirs(ix, iz).length === 0 && idx % 6 === 1) {
    for (const rel of [3, 8]) {
      const y = minG + rel;
      const gi = groundAt.get(key(ix, iz));
      if (y > gi) put(ix, y, iz, "glowstone");
    }
  }
}

// 3. Roof deck and parapet
for (const [x, z, gr] of cells) {
  if (gr < ROOF) put(x, ROOF, z, "light_gray_concrete");
  if (outwardDirs(x, z).length > 0 && gr < PAR) {
    put(x, PAR, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof plant: a penthouse block and a few cooling units
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const interior = outwardDirs(x, z).length === 0;
  if (!interior) continue;
  if (x >= 4 && x <= 8 && z >= 8 && z <= 13) {
    put(x, ROOF + 1, z, "light_gray_concrete");
  } else if (x === 2 && z >= 4 && z <= 6) {
    put(x, ROOF + 1, z, "iron_block");
  }
}

// 4. Entrance: on the street-facing (max z) wall, nearest the middle
const zMax = Math.max(...cells.map((c) => c[1]));
const xs = cells.filter((c) => c[1] === zMax).map((c) => c[0]);
const xMid = (Math.min(...xs) + Math.max(...xs)) / 2;
const doorX = xs.reduce((best, x) => (Math.abs(x - xMid) < Math.abs(best - xMid) ? x : best), xs[0]);
const doorGround = groundAt.get(key(doorX, zMax));
const facing = dirName["0,1"];

put(doorX, doorGround + 1, zMax, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, doorGround + 2, zMax, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm entrance lantern inside the foyer
if (has(doorX, zMax - 1) && outwardDirs(doorX, zMax - 1).length === 0) {
  const gi = groundAt.get(key(doorX, zMax - 1));
  if (doorGround + 3 > gi) put(doorX, doorGround + 3, zMax - 1, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
