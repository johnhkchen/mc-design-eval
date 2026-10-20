import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no building record. Read as a two-storey post-war reinforced-concrete
// shophouse (1970s Taipei): white render walls, a red-tile cornice, a stone plinth,
// a ground-floor shopfront with a central double door, and a rooftop water tank.
// Roof sits 11 blocks above the lowest ground (two storeys of about 5 blocks).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw542683419.cells.json`, "utf8"));

const W = 14, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const groundAt = new Map();
const k = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) groundAt.set(k(x, z), gr);
const has = (x, z) => groundAt.has(k(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const win = (x, y, z) => put(x, y, z, "light_blue_stained_glass_pane",
  { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });

for (const [x, z, gr] of cells) {
  // Which outside faces this cell has (north = z-1 side, the street front).
  const fN = !has(x, z - 1), fS = !has(x, z + 1);
  const fW = !has(x - 1, z), fE = !has(x + 1, z);
  const perim = fN || fS || fW || fE;
  const nFaces = [fN, fS, fW, fE].filter(Boolean).length;
  const corner = nFaces >= 2;
  const onFront = fN;                          // shopfront row
  const idx = (fN || fS) ? x : z;              // position along the exposed face

  // 1. Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // 2. Base course.
  put(x, gr, z, "smooth_stone");

  // 3. Storey one (gr+1 .. gr+4), interior is air.
  // 4. Storey line / floor slab at gr+5 (all cells).
  put(x, gr + 5, z, "smooth_stone");

  // 5. Storey two (gr+6 .. gr+9).
  // 6. Cornice at gr+10 and roof deck; parapet at gr+11.
  if (!perim) {
    put(x, gr + 10, z, "gray_concrete");          // roof deck
  }

  if (perim) {
    // Storey one walls
    for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");

    if (onFront && !corner) {
      // Shopfront
      put(x, gr + 1, z, "polished_andesite");
      if (x === 6 || x === 7) {
        // Central double door under a transom
        const hinge = x === 6 ? "left" : "right";
        const dp = { facing: "north", half: "lower", hinge, open: "false", powered: "false" };
        put(x, gr + 1, z, "dark_oak_door", dp);
        put(x, gr + 2, z, "dark_oak_door", { ...dp, half: "upper" });
        put(x, gr + 3, z, "white_concrete");
      } else {
        win(x, gr + 2, z);
        win(x, gr + 3, z);
      }
      // Canopy/lintel band across the entrance bay
      if (x >= 4 && x <= 9) put(x, gr + 4, z, "red_terracotta");
    } else if (!corner && idx % 3 !== 0) {
      win(x, gr + 2, z);
      win(x, gr + 3, z);
    }

    // Storey two walls
    for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
    if (!corner && idx % 3 !== 0) {
      win(x, gr + 7, z);
      win(x, gr + 8, z);
    }

    // Cornice and parapet
    put(x, gr + 10, z, "red_terracotta");
    put(x, gr + 11, z, "white_concrete");
  }

  // Warm lights: glowstone on the storey-two floor behind some windows,
  // lanterns on the ground floor behind the shopfront.
  if (!perim && (x + z) % 4 === 0) put(x, gr + 6, z, "glowstone");
  if (!perim && (2 * x + z) % 5 === 0) {
    put(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop water tank: a small stone drum on the roof deck, central, 2x2.
for (const [x, z, gr] of cells) {
  if (x >= 5 && x <= 6 && z >= 6 && z <= 7 && has(x, z) &&
      !(!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z))) {
    put(x, gr + 11, z, "stone_bricks");
    put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/OSMw542683419.nbt`);
