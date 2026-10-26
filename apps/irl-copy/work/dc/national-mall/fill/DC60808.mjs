import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60808.cells.json`, "utf8"));

// 13th St NW, Downtown DC: a vacant, abutting early-20th-century commercial block.
// Six storeys of light brick over a stone base, Classical Revival: calcite belt courses,
// terracotta pilasters, a calcite cornice, shopfronts at street level, a portico
// lintel over the entrance, and a mechanical penthouse on some bays.
const W = 44, H = 32, D = 7;
const g = new Voxels([W, H, D]);

const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, b, p) => {
  if (!inb(x, y, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const FRONT_DOOR_X = 22;

// Ground elevation at the entrance, used to place the portico lintel and lamps.
let entranceGround = null;
for (const [x, z, gg0] of cells) {
  if (z === 0 && x === FRONT_DOOR_X) entranceGround = Math.max(0, Math.min(H - 8, gg0));
}

for (const [x, z, gg0, rr] of cells) {
  if (z < 0 || z >= D || x < 0 || x >= W) continue;

  // Ground elevation, clamped so the whole stack fits the 32-block build height.
  const gg = Math.max(0, Math.min(H - 8, gg0));
  // Roof surface follows lidar, minimum six blocks above this cell's ground.
  const top = Math.min(H - 2, Math.max(rr, gg + 6));

  // 1. Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) put(x, y, z, "smooth_stone");

  // 2. Solid brick body from ground up to just under the cornice.
  for (let y = gg; y <= top - 3; y++) put(x, y, z, "bricks");

  // 3. Cornice course and roof surface.
  put(x, top - 2, z, "calcite");
  put(x, top - 1, z, "smooth_stone");
  // Crisp stone-slab edge on the street and alley parapets.
  if (z === 0 || z === D - 1) {
    put(x, top - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // 4. Floor slabs (interior) and calcite belt courses (facade) at each storey line above the ground floor.
  for (let y = gg + 3; y <= top - 3; y += 3) {
    for (let zz = 1; zz <= D - 2; zz++) put(x, y, zz, "stone_bricks");
    put(x, y, 0, "calcite");
    put(x, y, D - 1, "calcite");
  }

  // 5. Facades: front (z=0, faces north) and back (z=D-1, faces south).
  const faces = [
    { fz: 0, inner: 1, facing: "north", front: true },
    { fz: D - 1, inner: D - 2, facing: "south", front: false },
  ];

  for (const { fz, inner, facing, front } of faces) {
    for (let y = gg; y <= top - 3; y++) {
      const rel = (y - gg) % 3;
      const k = Math.floor((y - gg) / 3);
      if (rel === 0 && k > 0) continue; // belt course already placed

      // Door on the street front, two blocks tall at street level.
      if (front && k === 0 && x === FRONT_DOOR_X && y <= gg + 1) {
        const half = y === gg ? "lower" : "upper";
        put(x, y, fz, "dark_oak_door", {
          facing, half, hinge: "left", open: "false", powered: "false",
        });
        put(x, y, inner, "air");
        continue;
      }

      // Window or shopfront glass with an air gap behind it.
      put(x, y, fz, "glass_pane");
      put(x, y, inner, "air");

      // Warm light behind some upper-floor windows.
      if (k >= 1 && rel === 1 && ((x + 2 * k + (front ? 0 : 3)) % 5 === 0)) {
        put(x, y, inner, "glowstone");
      }
    }

    // Terracotta pilasters on every fourth column, full height, between windows.
    if (x % 4 === 0) {
      for (let y = gg; y <= top - 3; y++) {
        if (front && x === FRONT_DOOR_X && y <= gg + 1) continue;
        put(x, y, fz, "white_terracotta");
        put(x, y, inner, "bricks");
      }
    }
  }

  // 6. Portico: a solid calcite lintel over the entrance, carried by the pilasters
  //    either side, with two warm lamps behind the shopfront glass.
  if (z === 0 && x >= FRONT_DOOR_X - 1 && x <= FRONT_DOOR_X + 1 && entranceGround !== null) {
    const ly = entranceGround + 2;
    if (ly <= top - 3) {
      put(x, ly, 0, "calcite");
      put(x, ly, 1, "calcite");
      put(x, ly, 2, "stone_bricks");
    }
  }
  if (z === 0 && entranceGround !== null && (x === FRONT_DOOR_X - 1 || x === FRONT_DOOR_X + 1)) {
    put(x, entranceGround, 1, "glowstone");
  }

  // 7. Mechanical penthouse on some bays, set back from the street front.
  if (x % 11 === 5 && top + 2 <= H - 1) {
    for (let zz = 2; zz <= D - 3; zz++) {
      put(x, top, zz, "light_gray_concrete");
      put(x, top + 1, zz, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/DC60808.nbt`);
