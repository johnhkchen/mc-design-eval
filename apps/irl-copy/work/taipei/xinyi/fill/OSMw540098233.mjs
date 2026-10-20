import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~11 blocks above lowest ground. Read as a two-storey
// 1960s-80s Taipei shophouse block: cream tiled/quartz-finished walls, stone base,
// shopfront glazing at ground, a door on the street face, and a flat roof with parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098233";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
function put(x, y, z, id, props) {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces of a footprint cell (cells with a missing neighbour).
function faces(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  return f;
}

// Street face: the north (z min) side of the footprint.
let zMin = Infinity;
for (const [, z] of cells) zMin = Math.min(zMin, z);

const DOOR_X = 3;
let doorCell = null;
if (has(DOOR_X, zMin) && faces(DOOR_X, zMin).includes("north")) doorCell = [DOOR_X, zMin];
else {
  for (const [x, z] of cells) {
    if (z === zMin && faces(x, z).includes("north")) { doorCell = [x, z]; break; }
  }
}

const WALL = "smooth_quartz";
const BAND = "quartz_bricks";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const ROOF = "gray_concrete";

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  const fs = faces(x, z);
  const isWallCell = fs.length > 0;
  const isCorner = fs.length >= 2;

  // Floors: base slab, storey-2 floor at gr+5, roof deck at gr+10.
  put(x, gr, z, FLOOR);
  put(x, gr + 5, z, FLOOR);
  if (!isWallCell) put(x, gr + 10, z, ROOF);

  if (!isWallCell) continue;

  // Wall body and parapet, y gr..gr+10.
  for (let y = gr; y <= gr + 10; y++) {
    let id = WALL;
    if (y === gr) id = BASE;
    else if (y === gr + 4 || y === gr + 9 || y === gr + 3) id = BAND;
    else if (y === gr + 10) id = WALL;
    put(x, y, z, id);
  }

  if (isCorner) continue; // corners stay solid piers

  const face = fs[0];
  const alongZ = face === "west" || face === "east";
  const idx = alongZ ? z : x;
  const isWindow = idx % 3 === 1;

  // Inward neighbour, for warm light placement.
  const inward = { west: [x + 1, z], east: [x - 1, z], north: [x, z + 1], south: [x, z - 1] }[face];
  const inwardInterior = has(inward[0], inward[1]) && !isWallCell_(inward[0], inward[1]);

  const paneProps = alongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // Ground storey: shopfront glazing with door on the street face.
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;
  if (isDoor) {
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else if (isWindow) {
    for (let y = gr + 1; y <= gr + 2; y++) put(x, y, z, "glass_pane", paneProps);
  }

  // Upper storey windows at gr+6..gr+8.
  if (isWindow) {
    for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, "glass_pane", paneProps);
  }

  // Warm light behind some windows (shroomlight on the interior floor).
  if (isWindow && inwardInterior && !isDoor) {
    const [ix, iz] = inward;
    if ((idx + gr) % 2 === 0) put(ix, gr + 1, iz, "shroomlight");
    else put(ix, gr + 6, iz, "shroomlight");
  }
}

// Rooftop plant: two light-grey units on interior roof cells, rising to gr+11.
let midZ = 0, count = 0, midX = 0;
for (const [x, z] of cells) { midZ += z; midX += x; count++; }
midZ = Math.round(midZ / count);
midX = Math.round(midX / count);
for (const [x, z, gr] of cells) {
  if (faces(x, z).length === 0 && Math.abs(x - midX) <= 1 && Math.abs(z - midZ) <= 1 && (x + z) % 2 === 0) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

// Helper used above (declared after use is fine: hoisted function).
function isWallCell_(x, z) { return faces(x, z).length > 0; }

g.save(`${DIR}/${ID}.nbt`);
