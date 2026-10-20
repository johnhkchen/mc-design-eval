import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE110-0341-11F: a 2021 Xinyi-style mixed-use block. Cyan shopfront with a
// glazed entrance and canopy, glass curtain wall with white-concrete piers,
// spandrel and sill bands for depth, stone corner columns, quartz storey
// bands, and a roof with a plant room and a small roof garden.
// Roof top (parapet) sits at y 11, about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE110-0341-11F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 41, H = 23, D = 60;
const SHOP_TOP = 4;   // lintel row of the ground-floor shopfront
const FLOOR_2 = 5;    // storey line between ground and upper floor
const ROOF = 10;      // roof slab / cornice course
const PARAPET = 11;   // parapet top

const vox = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const grounds = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  grounds.set(key(x, z), Math.round(gr));
}
const inFp = (x, z) => grounds.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));
const nearEdge = (x, z) => !isEdge(x, z) && DIRS.some(([dx, dz]) => isEdge(x + dx, z + dz));
// Corner: exposed on two perpendicular sides.
const isCorner = (x, z) =>
  (!inFp(x + 1, z) || !inFp(x - 1, z)) && (!inFp(x, z + 1) || !inFp(x, z - 1));

const isEntrance = (x, z) => z === 0 && x >= 18 && x <= 22;
const isPier = (x, z) => (x + z) % 4 === 0;
const isPostCell = (x, z) => z === 1 && (x === 18 || x === 22);
const isCanopyCell = (x, z) => z === 1 && x >= 18 && x <= 22;

// Roof garden: a moss patch on the south-east quadrant, away from the plant room.
const isRoofGarden = (x, z) => x >= 28 && x <= 36 && z >= 6 && z <= 16;

for (const [x, z, gr0] of cells) {
  const base = Math.round(gr0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base && y < H; y++) {
    vox.set(x, y, z, "stone_bricks");
  }

  // Cells whose ground is above the roof line carry foundation only.
  if (base > ROOF) continue;

  const edge = isEdge(x, z);
  const ring = nearEdge(x, z);
  const corner = edge && isCorner(x, z);

  for (let y = base; y <= ROOF; y++) {
    if (edge) {
      if (corner) {
        // Stone corner columns give the block its vertical edges.
        vox.set(x, y, z, y === ROOF ? "quartz_block" : "stone_bricks");
        continue;
      }
      if (y === ROOF) {
        vox.set(x, y, z, "quartz_block");                    // cornice
      } else if (y === FLOOR_2 || y === SHOP_TOP) {
        vox.set(x, y, z, "quartz_block");                    // storey bands
      } else if (y < SHOP_TOP) {
        // Ground-floor shopfront with a glazed entrance bay.
        if (isEntrance(x, z) && y <= 2) {
          vox.set(x, y, z, "glass");
        } else if (isPier(x, z) || (isEntrance(x, z) && y === 3)) {
          vox.set(x, y, z, "stone_bricks");
        } else {
          vox.set(x, y, z, "cyan_stained_glass");
        }
      } else {
        // Upper floor curtain wall: spandrel panels under and sill bands
        // at the window head and sill give the glass depth.
        if (isPier(x, z)) {
          vox.set(x, y, z, "white_concrete");
        } else if (y === 6 || y === 9) {
          vox.set(x, y, z, "light_gray_concrete");          // sill and head bands
        } else {
          vox.set(x, y, z, "light_blue_stained_glass");
        }
      }
    } else {
      // Interior: floor slabs only, air elsewhere.
      if (y === base || y === FLOOR_2 || y === ROOF) {
        vox.set(x, y, z, y === ROOF ? "light_gray_concrete" : "smooth_stone");
      } else if (ring && (x * 3 + z * 5) % 7 === 0) {
        // Warm light just behind the glass, in the air gap.
        if (y === FLOOR_2 + 1) vox.set(x, y, z, "glowstone");
        if (y === base + 1 && y <= SHOP_TOP - 1) vox.set(x, y, z, "glowstone");
      }
    }
  }

  // Entrance canopy: a slab over the bay, carried on two posts.
  if (base <= 3 && isCanopyCell(x, z)) {
    vox.set(x, SHOP_TOP, z, "light_gray_concrete");
    if (isPostCell(x, z)) {
      for (let y = base + 1; y <= 3; y++) {
        vox.set(x, y, z, "stone_bricks");
      }
    }
  }

  // Parapet on the roof edge.
  if (edge && PARAPET < H) {
    vox.set(x, PARAPET, z, "light_gray_concrete");
  }

  // Roof garden on part of the roof: moss ground cover with a low planter.
  if (!edge && isRoofGarden(x, z)) {
    vox.set(x, PARAPET, z, "moss_block");
  }

  // Plant room / roof equipment in the middle of the roof.
  if (!edge && x >= 16 && x <= 24 && z >= 25 && z <= 34) {
    vox.set(x, PARAPET, z, "light_gray_concrete");
    if (PARAPET + 1 < H) vox.set(x, PARAPET + 1, z, "light_gray_concrete");
  }
}

// Entrance lantern hanging from the canopy, on the centre of the bay.
if (inFp(20, 1) && Math.round(grounds.get(key(20, 1))) <= 3) {
  vox.set(20, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
