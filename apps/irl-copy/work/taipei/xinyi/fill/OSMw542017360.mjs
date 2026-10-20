import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542017360";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 28;
const g = new Voxels([W, H, D]);

// Footprint ground heights keyed by "x,z".
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const has = (x, z) => ground.has(`${x},${z}`);
const B_of = (x, z) => ground.get(`${x},${z}`);

const isPerimeter = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Facade pattern along a face: mullion every third cell, glass otherwise.
const isMullion = (i) => i % 3 === 0;

const DOOR_X = 6;
const SHOP_X0 = 2, SHOP_X1 = 11;

// 1. Foundations, floors, walls, bands, cornice, parapet.
for (const [x, z, B] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < B; y++) put(x, y, z, "stone");

  const perim = isPerimeter(x, z);

  // Floor slabs on every cell (interior has no walls, so slabs carry the storeys).
  put(x, B, z, perim ? "polished_andesite" : "smooth_stone");
  put(x, B + 5, z, "smooth_stone");
  put(x, B + 10, z, "gray_concrete"); // roof membrane / slab, interior and perimeter

  if (!perim) continue;

  if (isCorner(x, z)) {
    // Corner piers run full height.
    for (let y = B + 1; y <= B + 9; y++) put(x, y, z, "smooth_quartz");
    put(x, B + 10, z, "light_gray_concrete");
    put(x, B + 11, z, "white_concrete");
    continue;
  }

  // Which face, and index along it.
  let face, i;
  if (z === 0) { face = "front"; i = x; }
  else if (z === D - 1) { face = "back"; i = x; }
  else if (x === 0) { face = "left"; i = z; }
  else { face = "right"; i = z; }

  // Base course (already polished_andesite) and ground-floor storey.
  for (let y = B + 1; y <= B + 3; y++) {
    if (face === "front" && y >= B + 1 && i >= SHOP_X0 && i <= SHOP_X1) {
      // Shopfront: glass with a centre door and pillars.
      if (i === DOOR_X) {
        if (y === B + 1 || y === B + 2) {
          put(x, y, z, "iron_door", {
            facing: "south",
            half: y === B + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else {
          put(x, y, z, "smooth_quartz");
        }
      } else if (i === 4 || i === 9) {
        put(x, y, z, "quartz_pillar");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    } else if (face === "front") {
      // Ends of the shopfront: pillar at 1 and 12, wall beyond.
      put(x, y, z, i === 1 || i === 12 ? "quartz_pillar" : "white_concrete");
    } else {
      // Other faces: same window rhythm as upper floors, lower sill.
      if (isMullion(i)) put(x, y, z, "quartz_pillar");
      else put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Band above ground floor (lintel / sign band on front).
  if (face === "front" && i >= SHOP_X0 && i <= SHOP_X1) {
    put(x, B + 4, z, "red_concrete");
  } else {
    put(x, B + 4, z, "smooth_quartz");
  }

  // Second storey: sill, windows, lintel.
  put(x, B + 5, z, "smooth_quartz");
  for (let y = B + 6; y <= B + 8; y++) {
    if (isMullion(i)) put(x, y, z, "quartz_pillar");
    else put(x, y, z, "light_blue_stained_glass");
  }
  put(x, B + 9, z, "smooth_quartz");

  // Cornice and parapet.
  put(x, B + 10, z, "light_gray_concrete");
  put(x, B + 11, z, "white_concrete");
}

// 2. Warm light behind some windows (interior cells just inside the glass).
for (const [x, z, B] of cells) {
  if (!isPerimeter(x, z) || isCorner(x, z)) continue;
  let inX, inZ, i, side;
  if (z === 0) { inX = x; inZ = 1; i = x; side = 0; }
  else if (z === D - 1) { inX = x; inZ = D - 2; i = x; side = 1; }
  else if (x === 0) { inX = 1; inZ = z; i = z; side = 2; }
  else { inX = W - 2; inZ = z; i = z; side = 3; }
  if (isMullion(i)) continue;
  if (!has(inX, inZ)) continue;
  if ((i + side) % 4 === 0) {
    const Bn = B_of(inX, inZ);
    put(inX, Bn + 7, inZ, "glowstone");
  }
}
// Shop interior light behind the doorway.
if (has(DOOR_X, 1)) put(DOOR_X, B_of(DOOR_X, 1) + 2, 1, "glowstone");

// 3. Roof equipment: a penthouse block with a terracotta cap, plus AC units.
for (let x = 4; x <= 9; x++) {
  for (let z = 9; z <= 18; z++) {
    if (!has(x, z)) continue;
    const B = B_of(x, z);
    const ring = x === 4 || x === 9 || z === 9 || z === 18;
    if (ring) {
      put(x, B + 11, z, "white_concrete");
      put(x, B + 12, z, "light_blue_stained_glass");
    }
    put(x, B + 13, z, "red_terracotta");
  }
}
for (const [x, z] of [[2, 3], [2, 4], [11, 3], [11, 4], [2, 22], [2, 23]]) {
  if (!has(x, z)) continue;
  put(x, B_of(x, z) + 11, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
