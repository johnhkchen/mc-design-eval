import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 12 x 23 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey Xinyi-district shophouse-style commercial block:
// cream terracotta walls, dark oak shopfront fascia with an entrance,
// stone-brick plinth, concrete roof deck and a parapet, with a rooftop tank and AC units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455324";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.round(gr));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const isBoundary = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const S = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const WALL = "white_terracotta";
const GLASS = "light_blue_stained_glass";
const FASCIA = "dark_oak_planks";
const BAND = "smooth_stone";
const PLINTH = "stone_bricks";
const DECK = "light_gray_concrete";
const LIGHT = "glowstone";

for (const [x, z, gr] of cells) {
  const gy = Math.round(gr);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) S(x, y, z, PLINTH);

  if (!isBoundary(x, z)) {
    // Interior: floor slabs only, air between them (no interiors).
    S(x, gy, z, BAND);
    S(x, gy + 5, z, BAND);
    S(x, gy + 10, z, DECK);
    continue;
  }

  // Boundary cell: plinth, two storeys of walls, roof deck and parapet.
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const left = !has(x - 1, z);
  const right = !has(x + 1, z);
  const corner = (front || back) && (left || right);

  S(x, gy, z, PLINTH);
  for (let y = gy + 1; y <= gy + 9; y++) S(x, y, z, WALL);
  S(x, gy + 4, z, FASCIA);     // ground-storey fascia
  S(x, gy + 5, z, BAND);       // storey line
  S(x, gy + 9, z, BAND);       // upper-storey header
  S(x, gy + 10, z, DECK);      // roof deck
  S(x, gy + 11, z, "stone_brick_wall"); // parapet

  if (corner) continue; // corner pilasters stay solid

  // Pick the exterior face this cell belongs to.
  let face, u, len, dx, dz;
  if (front) { face = "front"; u = x - minX; len = maxX - minX; dx = 0; dz = 1; }
  else if (back) { face = "back"; u = x - minX; len = maxX - minX; dx = 0; dz = -1; }
  else if (left) { face = "left"; u = z - minZ; len = maxZ - minZ; dx = 1; dz = 0; }
  else { face = "right"; u = z - minZ; len = maxZ - minZ; dx = -1; dz = 0; }

  const isEnd = u === 0 || u === len;
  const doorU = Math.floor(len / 2);
  const isDoor = face === "front" && u === doorU;

  // Ground storey: shopfront glass across the street face, door in the centre.
  if (face === "front") {
    if (!isEnd && !isDoor) {
      for (let y = gy + 1; y <= gy + 3; y++) S(x, y, z, GLASS);
    }
  } else if (!isEnd && u % 3 === 1) {
    for (let y = gy + 1; y <= gy + 3; y++) S(x, y, z, GLASS);
  }

  if (isDoor) {
    S(x, gy + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    S(x, gy + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    S(x, gy + 3, z, GLASS); // transom
  }

  // Upper storey windows on a 3-block rhythm.
  if (!isEnd && u % 3 === 1) {
    for (let y = gy + 6; y <= gy + 8; y++) S(x, y, z, GLASS);
  }

  // Warm light behind some windows, only where the inner cell is open interior.
  const xi = x + dx, zi = z + dz;
  if (has(xi, zi) && !isBoundary(xi, zi)) {
    if (!isEnd && u % 6 === 4 && !isDoor) S(xi, gy + 7, zi, LIGHT);
    if (!isEnd && u % 6 === 1 && face !== "front") S(xi, gy + 2, zi, LIGHT);
  }
}

// Rooftop water tank (3 x 3) toward the rear and AC units (2 x 2) on the roof.
for (let x = 3; x <= 5; x++) {
  for (let z = 16; z <= 18; z++) {
    if (!has(x, z)) continue;
    const gy = ground.get(`${x},${z}`);
    S(x, gy + 11, z, "white_concrete");
    S(x, gy + 12, z, "white_concrete");
    S(x, gy + 13, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}
for (let x = 8; x <= 9; x++) {
  for (let z = 4; z <= 5; z++) {
    if (!has(x, z)) continue;
    const gy = ground.get(`${x},${z}`);
    S(x, gy + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
