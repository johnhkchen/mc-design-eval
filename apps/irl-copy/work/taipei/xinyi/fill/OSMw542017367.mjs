import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw542017367.cells.json`, "utf8"));

const W = 16, D = 10, H = 23;
const g = new Voxels([W, H, D]);

// Ground heights per footprint cell
const G = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G[x][z] = Math.round(gr);
}
let L = Infinity;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (G[x][z] != null) L = Math.min(L, G[x][z]);
}
if (!Number.isFinite(L)) L = 0;
const gOf = (x, z) => (G[x][z] == null ? L : G[x][z]);

// Storey levels: two storeys of 5 blocks, roof slab, parapet (~11 above lowest ground)
const F1 = L + 5;   // second-floor slab / storey line
const R = L + 10;   // roof slab / cornice band
const TOP = L + 11; // parapet cap

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneProps = (onZ) =>
  onZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function wallPiece(x, z, y) {
  const onZ = z === 0 || z === D - 1;
  const front = z === 0;
  const idx = onZ ? x : z;
  const len = onZ ? W : D;
  const corner = idx === 0 || idx === len - 1;
  const rel = y - L;

  if (y === TOP) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }];
  if (y === F1 || y === R) return ["light_gray_concrete"];

  // Entrance door on the street (front) face, centred
  if (front && (x === 7 || x === 8) && (rel === 0 || rel === 1)) {
    const hinge = x === 7 ? "left" : "right";
    const half = rel === 0 ? "lower" : "upper";
    return ["dark_oak_door", { facing: "north", half, hinge, open: "false", powered: "false" }];
  }

  // Base course
  if (rel === 0) return ["stone_bricks"];

  const glassRow = (rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8);
  const mullion = corner || idx % 3 === 0;
  if (glassRow && !mullion) return ["glass_pane", paneProps(onZ)];

  // Lintels / spandrels
  return ["white_concrete"];
}

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const gr = gOf(x, z);
    const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;

    // Foundation fill from y 0 up to this cell's ground
    for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

    if (perim) {
      for (let y = gr; y <= TOP; y++) {
        const b = wallPiece(x, z, y);
        if (b) put(x, y, z, b[0], b[1]);
      }
    } else {
      // Interior: floor slabs only, air elsewhere (no interiors)
      if (F1 >= gr) put(x, F1, z, "light_gray_concrete");
      if (R >= gr) put(x, R, z, "light_gray_concrete");
    }
  }
}

// Warm lights: glowstone on the second-floor slab behind the street windows
for (const x of [2, 5, 11, 14]) {
  if (gOf(x, 1) <= F1) put(x, F1 + 1, 1, "glowstone");
}

// Roof plant: a small air-handling unit on the roof deck
for (let x = 4; x <= 5; x++) {
  for (let z = 3; z <= 4; z++) {
    if (gOf(x, z) <= R) put(x, TOP, z, "light_gray_concrete");
  }
}
if (gOf(4, 3) <= R) put(4, TOP + 1, 3, "iron_block");

g.save(`${DIR}/OSMw542017367.nbt`);
