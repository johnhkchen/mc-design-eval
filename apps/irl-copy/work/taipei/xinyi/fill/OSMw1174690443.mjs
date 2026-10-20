import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690443";
const W = 24, D = 37, H = 23;
const ROOF = 11;          // flat roof slab level (lidar: 11 above lowest ground)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const interior = (x, z) => has(x, z) && has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Street door: on the north (z-min) street face, nearest the middle of the 24-wide front.
let door = null;
for (const [x, z] of cells) {
  if (has(x, z - 1)) continue;
  if (!door || Math.abs(x - 12) < Math.abs(door.x - 12)) door = { x, z };
}

for (const [x, z, gy0] of cells) {
  const gy = Math.max(0, Math.round(gy0));
  const perim = !interior(x, z);
  const northSouth = !has(x, z - 1) || !has(x, z + 1); // face runs along x
  const s = northSouth ? x : z;                        // pattern index along that face
  const T = Math.max(ROOF, gy + 1);                    // roof slab level for this cell

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y <= gy; y++) set(x, y, z, "stone_bricks");

  // Roof slab over the whole footprint.
  set(x, T, z, "light_gray_concrete");

  if (perim) {
    set(x, T + 1, z, "white_concrete"); // parapet
    for (let y = gy + 1; y < T; y++) {
      let id = "white_concrete", props;
      if (y <= 1) {
        id = "stone_bricks";                          // base course
      } else if (y === 5) {
        id = "smooth_stone";                          // storey line
      } else if (y === 6) {
        id = "white_terracotta";                      // upper spandrel
      } else if (y === 10) {
        id = "stone_brick_slab"; props = { type: "bottom", waterlogged: "false" }; // cornice
      } else if ((y >= 2 && y <= 4) || (y >= 7 && y <= 9)) {
        if (door && door.x === x && door.z === z && (y === 2 || y === 3)) {
          id = "oak_door";
          props = { facing: "north", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        } else if (s % 3 === 0) {
          id = "white_concrete";                      // pier / frame
        } else {
          id = "glass_pane";
          props = northSouth
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        }
      }
      set(x, y, z, id, props);

      // Warm light behind some upper and lower glazing, on the interior cell inside.
      if ((y === 3 || y === 8) && (s + y) % 4 === 0 && !(door && door.x === x && door.z === z)) {
        for (const [nx, nz] of [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]]) {
          if (interior(nx, nz)) { set(nx, y, nz, "glowstone"); break; }
        }
      }
    }
  } else {
    // Interior: air, with a floor slab at the storey line.
    for (let y = gy + 1; y < T; y++) {
      if (y === 5) set(x, y, z, "smooth_stone");
    }
    // Roof plant: a water tank block and AC units, standing on the roof slab.
    if (T === ROOF) {
      if (x >= 5 && x <= 6 && z >= 7 && z <= 8) {
        for (let y = T + 1; y <= T + 3; y++) set(x, y, z, "white_concrete");
      } else if ((x * 5 + z) % 7 === 0) {
        for (let y = T + 1; y <= T + 2; y++) set(x, y, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
