import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Read as a 1990s-2000s two-storey Xinyi commercial block:
// street-front shopfront with a red sign band, white-concrete and glass upper
// storey, smooth-stone cornice, light-grey roof with a plant box and parapet.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541994067.cells.json", "utf8"));

const W = 22, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const FLOOR_Y = 5;      // storey line between the two storeys
const CORNICE_Y = 9;    // top of the upper storey
const ROOF_Y = 10;      // roof deck
const DOOR_X = 10;      // entrance column on the street front (north side)

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade block for a perimeter cell at absolute height y.
// t = position along the facade (x on north/south faces, z on east/west faces).
function facade(y, gr, t, front) {
  if (y === gr) return ["polished_andesite"];           // base course
  if (y <= 4) {
    if (front) {
      if (y === 4) return ["red_concrete"];             // shop sign band
      return t % 4 === 0 ? ["white_concrete"] : ["glass"];
    }
    if (y === 4) return ["white_concrete"];
    return t % 3 === 0 ? ["white_concrete"] : ["glass"];
  }
  if (y === FLOOR_Y) return ["smooth_stone"];           // storey line
  if (y < CORNICE_Y) return t % 3 === 0 ? ["white_concrete"] : ["glass"];
  return ["smooth_stone"];                              // cornice
}

// 1. Foundations and floor slabs for every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  set(x, gr, z, "smooth_stone");                        // ground floor slab
  set(x, FLOOR_Y, z, "smooth_stone");                   // storey slab
  set(x, ROOF_Y, z, "light_gray_concrete");             // roof deck
}

// 2. Perimeter walls, shopfront, door and lights.
for (const [x, z, gr] of cells) {
  let face = null;
  for (const name of ["north", "south", "east", "west"]) {
    const [dx, dz] = DIRS[name];
    if (!inFp(x + dx, z + dz)) { face = name; break; }
  }
  if (!face) continue;

  const [nx, nz] = DIRS[face];
  const front = face === "north";
  const t = nx !== 0 ? z : x;

  for (let y = gr; y <= CORNICE_Y && y < H; y++) {
    if (y < 0) continue;
    // Entrance door on the street front.
    if (front && t === DOOR_X && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      set(x, y, z, "dark_oak_door", {
        facing: face, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    const [id, props] = facade(y, gr, t, front);
    set(x, y, z, id, props);
  }

  // Parapet and cap on the roofline.
  set(x, 11, z, "white_concrete");
  set(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Warm light behind selected windows (interior cell just inside the glass).
  const ix = x - nx, iz = z - nz;
  if (inFp(ix, iz)) {
    if (!front && t % 3 === 1 && (t * 5) % 4 === 0) {
      set(ix, 7, iz, "shroomlight");
    }
    if (front && t % 4 === 2 && t !== DOOR_X) {
      set(ix, 2, iz, "glowstone");
    }
  }
}

// 3. Rooftop plant box and lightning rod.
for (let x = 4; x <= 7; x++) {
  for (let z = 3; z <= 6; z++) {
    if (!inFp(x, z)) continue;
    set(x, 11, z, "gray_concrete");
    set(x, 12, z, "gray_concrete");
  }
}
if (inFp(14, 5)) {
  set(14, 11, 5, "light_gray_concrete");
  set(14, 12, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541994067.nbt");
