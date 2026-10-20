import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343743.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343743.nbt";

// Footprint 26 x 7; roof about 11 blocks above lowest ground: a two-storey
// 1970s-80s Taipei shophouse block in white concrete, with a shopfront on the
// street (z = 0) face, a stone base, storey lines, a cornice and a parapet.
const W = 26, H = 23, D = 7;

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), Math.round(gr));
}
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

const L0 = Math.min(...ground.values());     // lowest ground under the building
const TOP = L0 + 10;                          // last block of the parapet (roof about 11 above L0)
const F1_TOP = L0 + 4;                        // ground storey: L0 .. L0+4 (5 blocks)
const FLOOR2 = L0 + 5;                        // floor slab between storeys
const F2_LO = L0 + 6, F2_HI = L0 + 8;         // second storey window band
const CORNICE = L0 + 9;                       // cornice / roof deck
const PARAPET = L0 + 10;                      // parapet cap

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [, ] of ground) { /* placeholder to keep structure clear */ }

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Exterior faces: a side is exterior when no footprint cell lies beyond it.
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const ring = zFace || xFace;
  const street = zFace && z === 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab (interior and facade) and roof deck at the cornice level.
  put(x, FLOOR2, z, "smooth_stone");
  put(x, CORNICE, z, "smooth_stone");

  if (!ring) {
    // Interior: air gap behind the facade, nothing else above the floor.
    // Slightly raised AC units on the roof, away from the parapet.
    if (x >= 6 && x <= 8 && z >= 2 && z <= 3) {
      put(x, PARAPET, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade column. Bay index runs along the plane the cell is on.
  const i = zFace ? x : z;
  const isWindow = i % 3 === 1;

  // Ground storey.
  for (let y = gr; y <= F1_TOP; y++) {
    if (y >= FLOOR2) break;
    if (street) {
      if (x === 13) {
        // Entrance bay: door at the street, glazed transom above.
        if (y <= gr + 1) continue; // door blocks set below
        put(x, y, z, "gray_stained_glass");
      } else if (y === F1_TOP) {
        put(x, y, z, "black_concrete"); // fascia under the storey line
      } else if (isWindow && y < F1_TOP) {
        put(x, y, z, "gray_stained_glass");
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    } else {
      if (y === F1_TOP) {
        put(x, y, z, "smooth_stone");
      } else if (isWindow) {
        put(x, y, z, "gray_stained_glass");
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
  }

  // Entrance door on the street face.
  if (street && x === 13) {
    put(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Second storey.
  for (let y = F2_LO; y <= F2_HI; y++) {
    if (y < gr) continue;
    if (isWindow) {
      put(x, y, z, "light_blue_stained_glass");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Lit windows: warm glowstone just inside the glass on the street face.
  if (street && isWindow && i % 6 === 1 && has(x, 1)) {
    put(x, F2_LO + 1, 1, "glowstone");
  }

  // Cornice band and parapet.
  put(x, CORNICE, z, "smooth_stone");
  put(x, PARAPET, z, "white_concrete");
}

g.save(OUT);
