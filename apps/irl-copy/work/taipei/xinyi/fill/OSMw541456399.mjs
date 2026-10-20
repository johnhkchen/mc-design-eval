import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 15 x 16 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey (about 5 blocks per storey) reinforced-concrete commercial block of the
// 1970s-80s Taipei type: cream tiled concrete walls, stone-brick plinth, glazed shopfront,
// grey storey bands, a flat parapet roof with plant boxes, and a small stair/lift housing.
const W = 15, H = 23, D = 16;
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456399";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Missing-neighbour count decides perimeter / corner
function missing(x, z) {
  let n = 0;
  if (!has(x + 1, z)) n++;
  if (!has(x - 1, z)) n++;
  if (!has(x, z + 1)) n++;
  if (!has(x, z - 1)) n++;
  return n;
}

// Centre cell for the stair/lift housing
let sx = 0, sz = 0;
for (const [x, z] of ground.keys().map ? [] : []) {}
{
  let cx = 0, cz = 0, n = 0;
  for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
    cx += x; cz += z; n++;
  }
  sx = Math.round(cx / n); sz = Math.round(cz / n);
}
const inTower = (x, z) =>
  Math.abs(x - sx) <= 1 && Math.abs(z - sz) <= 1 &&
  [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => has(sx + dx, sz + dz)));

// Front entrance: the perimeter cell with smallest z (north face), centred along it
let doorX = null, doorZ = null;
{
  const front = cells
    .filter(([x, z]) => missing(x, z) > 0 && !has(x, z - 1))
    .sort((a, b) => a[0] - b[0]);
  if (front.length) {
    const mid = front[Math.floor(front.length / 2)];
    doorX = mid[0]; doorZ = mid[1];
  }
}

for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(gr0, 0), 8); // keeps the whole building inside the 23-block box
  const perim = missing(x, z) > 0;
  const corner = missing(x, z) >= 2;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor base / slab
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // Upper floor slab at storey 2 and roof slab (all cells, sits on what is below)
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  if (perim) {
    const bay = (x + z) % 3;
    for (let y = gr + 1; y <= gr + 9; y++) {
      if (y === gr + 5) { put(x, y, z, "light_gray_concrete"); continue; } // storey line
      if (y === gr + 9) { put(x, y, z, "light_gray_concrete"); continue; } // upper band
      if (corner) { put(x, y, z, "white_concrete"); continue; }
      if (y <= gr + 4) {
        // shopfront: glazed bays, mullions, plinth band
        if (bay === 1) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "white_concrete");
      } else {
        // upper storey windows
        if (bay === 1) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "white_concrete");
      }
    }
    // Parapet with cornice cap
    put(x, gr + 11, z, corner ? "light_gray_concrete" : "white_concrete");
    if (!corner) put(x, gr + 10, z, "light_gray_concrete");

    // Entrance door on the front, with glazed lintel above
    if (x === doorX && z === doorZ) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "light_gray_concrete");
      put(x, gr + 4, z, "light_gray_concrete");
    }
  } else {
    // Interior: air between slabs; occasional warm light for the dusk read
    if ((x * 7 + z * 3) % 5 === 0) put(x, gr + 2, z, "glowstone");
    if ((x * 5 + z * 11) % 7 === 0) put(x, gr + 7, z, "glowstone");
  }

  // Roof plant: small AC boxes on interior roof cells, away from the housing
  if (!perim && !inTower(x, z) && (x * 3 + z) % 7 === 0) {
    put(x, gr + 11, z, "iron_block");
  }

  // Stair/lift housing and aerial on the central three-by-three
  if (inTower(x, z)) {
    for (let y = gr + 11; y <= gr + 13; y++) put(x, y, z, "stone_bricks");
    put(x, gr + 14, z, "light_gray_concrete");
    if (x === sx && z === sz) put(x, gr + 15, z, "end_rod");
  }
}

// Stair housing windows (small glazed slots on each face)
for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(gr0, 0), 8);
  if (inTower(x, z) && (x === sx || z === sz) && !(x === sx && z === sz)) {
    put(x, gr + 12, z, "light_blue_stained_glass");
  }
}

g.save(`${DIR}/${ID}.nbt`);
