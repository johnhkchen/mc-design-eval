import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690435";

const W = 21, D = 27, H = 23;
const ROOF = 11; // roof top sits 11 blocks above the lowest ground (lidar record)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup; ground values normalised so the lowest ground is y 0.
const cellMap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  cellMap.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}

const has = (x, z) => cellMap.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const ext = (x, z, d) => !has(x + DIRS[d][0], z + DIRS[d][1]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const isCorner = (x, z) => (ext(x, z, "north") || ext(x, z, "south")) &&
                           (ext(x, z, "west") || ext(x, z, "east"));

// Pick the main street face (longest exterior run, corners excluded) for the entrance.
const groups = { north: [], south: [], west: [], east: [] };
for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isCorner(x, z)) continue;
  for (const d of Object.keys(DIRS)) if (ext(x, z, d)) groups[d].push([x, z]);
}
let entrance = null;
{
  let bestFace = null, bestLen = 0;
  for (const d of Object.keys(groups)) if (groups[d].length > bestLen) { bestLen = groups[d].length; bestFace = d; }
  if (bestFace) {
    const along = (bestFace === "north" || bestFace === "south") ? 0 : 1;
    const list = groups[bestFace].sort((a, b) => a[along] - b[along]);
    const [ex, ez] = list[Math.floor(list.length / 2)];
    entrance = { x: ex, z: ez, facing: bestFace };
  }
}

for (const [k, raw] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const gr = raw - minG;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const N = ext(x, z, "north"), S = ext(x, z, "south");
  const Wf = ext(x, z, "west"), E = ext(x, z, "east");
  const exterior = N || S || Wf || E;

  if (!exterior) {
    // Solid core, flat roof surface at the top course.
    for (let y = gr; y <= ROOF - 1; y++) {
      put(x, y, z, y === ROOF - 1 ? "gray_concrete" : "white_concrete");
    }
    continue;
  }

  const corner = isCorner(x, z);
  const t = (N || S) ? x : z; // position along the wall
  const pier = corner || (t % 3 === 0);
  const isDoor = entrance && entrance.x === x && entrance.z === z;

  for (let y = gr; y <= ROOF - 1; y++) {
    if (isDoor && y >= gr + 1 && y <= gr + 2) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: entrance.facing, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoor && y === gr + 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    let b;
    if (y === gr) b = "stone_bricks";                         // base course
    else if (y === ROOF - 1) b = "white_concrete";            // parapet
    else if (y === ROOF - 2) b = "smooth_quartz";             // cornice
    else if (pier) b = "smooth_quartz";                       // piers / corners
    else if (y <= gr + 3) b = "light_blue_stained_glass";     // shopfront glazing
    else if (y === gr + 4 || y === 5) b = "smooth_stone";     // lintel / storey line
    else if (y >= 6 && y <= 8) {                              // upper window band
      b = "light_blue_stained_glass";
      if (y === 7 && ((x * 3 + z * 5) % 11 === 0)) b = "glowstone"; // warm lights
    } else b = "white_concrete";

    put(x, y, z, b);
  }
}

// Roof equipment: air-conditioning plant and a small stair/lift penthouse on the core.
for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (ext(x, z, "north") || ext(x, z, "south") || ext(x, z, "west") || ext(x, z, "east")) continue;
  if (x >= 5 && x <= 8 && z >= 4 && z <= 7) {
    put(x, ROOF, z, "light_gray_concrete");
    put(x, ROOF + 1, z, "iron_block");
  }
  if (x >= 11 && x <= 13 && z >= 16 && z <= 18) {
    for (let y = ROOF; y <= ROOF + 2; y++) put(x, y, z, "stone_bricks");
    put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
