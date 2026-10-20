import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-1990s Taipei office/retail block: white tiled concrete piers, blue-tinted
// ribbon glazing, stone base and shopfront, parapet with roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466779";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, D = 6, H = 33;
const TOP = 21;           // roof level from lidar (about 21 blocks above lowest ground)
const DECK = 20;          // roof deck / parapet base
const g = new Voxels([W, H, D]);

const cellSet = new Set();
const groundAt = new Map();
for (const [x, z, gr] of cells) {
  cellSet.add(`${x},${z}`);
  groundAt.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => cellSet.has(`${x},${z}`);
const gr_ = (x, z) => groundAt.get(`${x},${z}`) ?? 0;

const isEndX = (x) => x === 0 || x === W - 1;
const isEdgeZ = (z) => z === 0 || z === D - 1;
const isCorner = (x, z) => isEndX(x) && isEdgeZ(z);

// Entrance: two doors on the south face (z = D-1), centre of the frontage.
const isDoorCell = (x, z) => z === D - 1 && (x === 10 || x === 11);

// Window bays on long faces: piers every 3 blocks; end walls glazed between corners.
function isWindowCol(x, z) {
  if (isCorner(x, z)) return false;
  if (isEndX(x)) return true;
  return x % 3 !== 0;
}

function wallBlock(x, z, y, gr) {
  if (y === TOP) return ["smooth_stone"];
  if (y === DECK) return ["white_concrete"];

  const k = Math.floor(y / 5);
  const local = y % 5;
  const ground = k === 0;

  // Door cells: doors sit on the ground floor slab at the entrance.
  if (isDoorCell(x, z) && (y === gr + 1 || y === gr + 2) && ground) {
    return ["oak_door", {
      facing: "south",
      half: y === gr + 1 ? "lower" : "upper",
      hinge: x === 10 ? "left" : "right",
      open: "false",
      powered: "false",
    }];
  }

  if (local === 0) {
    // Storey line / base course
    return [y === 0 ? "stone_bricks" : "smooth_stone"];
  }
  if (local === 4) {
    // Spandrel / lintel band
    return [ground ? "stone_bricks" : "white_concrete"];
  }

  // local 1..3: window zone
  if (isWindowCol(x, z)) {
    if (ground) return ["glass"];
    return ["light_blue_stained_glass"];
  }
  return [ground ? "stone_bricks" : "white_concrete"];
}

// ---- Main massing: one column per footprint cell ----
for (const [cx, cz, cg] of cells) {
  const x = cx, z = cz;
  const gr = Math.round(cg);
  const ring = isEndX(x) || isEdgeZ(z);

  // Foundation: solid from y 0 up to the cell's own ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    if (ring) {
      const [block, props] = wallBlock(x, z, y, gr);
      if (props) g.set(x, y, z, block, props);
      else g.set(x, y, z, block);
    } else {
      // Interior: only floor slabs and roof deck, with air between (no interiors).
      if (y === gr || y === DECK || y % 5 === 0) {
        g.set(x, y, z, "light_gray_concrete");
      }
    }
  }
}

// ---- Warm lights behind the glass on the north face (z = 1 interior row) ----
for (let x = 1; x < W - 1; x++) {
  if (!has(x, 1)) continue;
  const gr = gr_(x, 1);
  if (x % 3 === 0) continue;
  // Ground floor shop light
  if ((x % 3) === 2) g.set(x, gr + 1, 1, "glowstone");
  // Upper storeys, staggered
  for (let k = 1; k <= 3; k++) {
    const y = 5 * k + 1;
    if (y <= gr) continue;
    if ((x + k) % 2 === 0) g.set(x, y, 1, "glowstone");
  }
}

// ---- Roof plant: mechanical box and lightning rod on the deck ----
for (let x = 3; x <= 5; x++) {
  for (let z = 1; z <= 3; z++) {
    if (!has(x, z)) continue;
    g.set(x, TOP, z, "light_gray_concrete");
    g.set(x, TOP + 1, z, "light_gray_concrete");
  }
}
if (has(15, 3)) {
  for (let y = TOP; y <= TOP + 3; y++) {
    g.set(15, y, 3, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
