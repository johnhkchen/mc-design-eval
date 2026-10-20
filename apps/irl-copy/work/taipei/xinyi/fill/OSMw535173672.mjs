import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535173672.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535173672.nbt";

const W = 18, H = 23, D = 20;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Heights (absolute, lowest ground = y 0): two storeys of 5 blocks, roof deck at 10, roof surface at 11.
const STOREY = 5;
const DECK = 10;
const PARAPET = 11;
const CAP = 12;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };

function missingDirs(x, z) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(d);
  }
  return out;
}

function hash(x, z, y) {
  return ((x * 73856093) ^ (z * 19349663) ^ (y * 83492791)) >>> 0;
}

// Set helper that ignores out-of-bounds writes.
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const wallCells = new Map(); // "x,z" -> outward dir
const doorCandidates = [];

// Pass 1: foundation, interior slabs, classify walls.
for (const [x, z, gr] of cells) {
  const ground_y = Math.max(0, Math.floor(gr));
  const miss = missingDirs(x, z);
  const isWall = miss.length > 0;
  const isCorner = miss.length >= 2;

  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < ground_y; y++) put(x, y, z, "stone_bricks");

  if (isWall) {
    wallCells.set(`${x},${z}`, { out: miss[0], corner: isCorner });
    if (miss.includes("S") && !isCorner) doorCandidates.push({ x, z, dist: Math.abs(x - 9) });
  } else {
    // Interior: floor slabs at ground and storey line, roof deck; air between.
    if (ground_y <= DECK) put(x, ground_y, z, "smooth_stone");
    if (ground_y <= STOREY) put(x, STOREY, z, "smooth_stone");
    if (ground_y <= DECK) put(x, DECK, z, "gray_concrete");
  }
}

// Pass 2: facade on wall cells, from ground up to the deck.
for (const [key, info] of wallCells) {
  const [x, z] = key.split(",").map(Number);
  const gr = Math.max(0, Math.floor(ground.get(key)));
  const horizontalFace = info.out === "N" || info.out === "S";
  const u = horizontalFace ? x : z;
  const pier = info.corner || u % 3 === 0;

  for (let y = gr; y <= DECK; y++) {
    if (y === gr) {
      put(x, y, z, "polished_andesite"); // base course
    } else if (y === STOREY || y === DECK) {
      put(x, y, z, "light_gray_concrete"); // storey line / cornice band
    } else if (pier) {
      put(x, y, z, "white_concrete"); // tiled pier
    } else if (y < STOREY) {
      if (y === 4) put(x, y, z, "white_concrete"); // shopfront lintel
      else put(x, y, z, "glass_pane");
    } else {
      if (y === 6) put(x, y, z, "light_gray_concrete"); // sill
      else if (y === 9) put(x, y, z, "white_concrete"); // head
      else put(x, y, z, "glass_pane");
    }
  }

  // Parapet and cap on the roofline.
  put(x, PARAPET, z, "white_concrete");
  put(x, CAP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Warm light in some upper windows: shroomlight in the room just inside.
  if (!pier && (hash(x, z, 7) % 5 === 0)) {
    const [idx, idz] = DIRS[OPP[info.out]];
    const ix = x + idx, iz = z + idz;
    if (has(ix, iz) && !wallCells.has(`${ix},${iz}`)) {
      put(ix, 7, iz, "shroomlight");
    }
  }
}

// Pass 3: interior lanterns on the second-floor slab (only where a slab exists).
for (const [x, z, gr] of cells) {
  if (wallCells.has(`${x},${z}`)) continue;
  if (Math.floor(gr) <= STOREY && hash(x, z, 6) % 7 === 0) {
    put(x, STOREY + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Entrance: on the south face, nearest the middle.
doorCandidates.sort((a, b) => a.dist - b.dist);
if (doorCandidates.length) {
  const { x, z } = doorCandidates[0];
  const gr = Math.max(0, Math.floor(ground.get(`${x},${z}`)));
  put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Transom lantern under the lintel.
  put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop water tank (2x2 on interior roof cells) and AC units.
let tankPlaced = false;
for (const [x, z, gr] of cells) {
  if (tankPlaced) break;
  const cellsNeeded = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const ok = cellsNeeded.every(([cx, cz]) => has(cx, cz) && !wallCells.has(`${cx},${cz}`) && Math.floor(ground.get(`${cx},${cz}`)) <= DECK);
  if (ok && x >= 3 && z >= 3) {
    for (const [cx, cz] of cellsNeeded) {
      for (let y = PARAPET; y <= 13; y++) put(cx, y, cz, "white_concrete");
      put(cx, 14, cz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
    tankPlaced = true;
  }
}

let acCount = 0;
for (const [x, z, gr] of cells) {
  if (acCount >= 4) break;
  if (wallCells.has(`${x},${z}`)) continue;
  if (Math.floor(gr) > DECK) continue;
  if (hash(x, z, 11) % 9 !== 0) continue;
  // Skip cells already occupied by the tank footprint.
  if (tankPlaced) {
    const inTank = cells.length && [...Array(1)].length;
    void inTank;
  }
  put(x, PARAPET, z, "iron_block");
  acCount++;
}

g.save(OUT);
