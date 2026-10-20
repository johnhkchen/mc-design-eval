import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE90-0067-7F: 2001 Xinyi office/commercial block, 7 storeys of 5 blocks.
// Flat roof at y=35 (lidar), light tile-and-glass curtain wall on a
// concrete frame, parapet with cap, and a central plant penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0067-7F";
const W = 22, H = 47, D = 11;
const ROOF = 35;      // roof deck level above lowest ground
const STOREY = 5;     // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: the footprint cell on the south (max z) edge nearest x=10.
let zmax = -1;
for (const [, z] of cells) zmax = Math.max(zmax, z);
let doorX = null;
for (const [x, z] of cells) {
  if (z !== zmax) continue;
  if (doorX === null || Math.abs(x - 10) < Math.abs(doorX - 10)) doorX = x;
}
const doorZ = zmax;

for (const [x, z, gy] of cells) {
  if (gy > ROOF) continue;

  const faceNS = !has(x, z - 1) || !has(x, z + 1);
  const faceEW = !has(x - 1, z) || !has(x + 1, z);
  const perim = faceNS || faceEW;
  const isDoor = x === doorX && z === doorZ;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) set(x, y, z, "stone_bricks");

  // Interior cells: solid floor up to the first storey slab so nothing hangs.
  if (!perim) {
    const s0 = Math.ceil(gy / STOREY) * STOREY;
    for (let y = gy; y < s0; y++) set(x, y, z, "stone_bricks");
  }

  // Storeys: slab rows at multiples of 5, windows in between.
  for (let y = gy; y < ROOF; y++) {
    const r = y % STOREY;
    const k = Math.floor(y / STOREY);

    if (!perim) {
      if (r === 0) set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (r === 0) { set(x, y, z, "white_concrete"); continue; }     // belt course
    if (r === 4) { set(x, y, z, "light_gray_concrete"); continue; } // spandrel

    // Window band r = 1..3: white mullions, pale cyan glass, sparse warm lights.
    const mull = (faceNS && x % 2 === 0) || (faceEW && z % 2 === 0);
    let id = mull ? "white_concrete" : "cyan_stained_glass";
    if (!mull && k >= 1 && (x * 7 + z * 3 + k) % 23 === 0) id = "glowstone";
    set(x, y, z, id);
  }

  // Roof edge, parapet and cap, and roof deck on interior cells.
  if (perim) {
    set(x, ROOF, z, "white_concrete");
    set(x, ROOF + 1, z, "white_concrete");
    set(x, ROOF + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    set(x, ROOF, z, "gray_concrete");
  }

  // Entrance door and hanging lantern on the south face.
  if (isDoor && perim) {
    const b = gy;
    set(x, b, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, b + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    set(x, b + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Central plant penthouse, x 7..14, z 3..7, y 36..39.
for (let x = 7; x <= 14; x++) {
  for (let z = 3; z <= 7; z++) {
    if (!has(x, z)) continue;
    const edge = x === 7 || x === 14 || z === 3 || z === 7;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (edge && y === ROOF + 2 && (x + z) % 2 === 0) set(x, y, z, "iron_bars");
      else set(x, y, z, "white_concrete");
    }
    set(x, ROOF + 4, z, "smooth_stone");
  }
}

// Short lightning rod mast on the penthouse roof.
if (has(10, 5)) {
  set(10, ROOF + 5, 5, "iron_bars");
  set(10, ROOF + 6, 5, "iron_bars");
  set(10, ROOF + 7, 5, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
