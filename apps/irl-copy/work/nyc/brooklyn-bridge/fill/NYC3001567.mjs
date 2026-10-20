import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 28 Middagh Street, Brooklyn Heights. Federal-era (1829) brick rowhouse:
// red brick walls, stone-brick basement and corners, white trim, flat roof
// behind a stone coping, a front door on the street face (z = 0), and
// warm light behind some front windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001567";
const W = 5, H = 20, D = 10;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cellMap = new Map();
for (const c of raw) {
  const [x, z, gr, rf] = c;
  cellMap.set(`${x},${z}`, { gr: Math.round(gr), rf: Math.round(rf) });
}

const g = new Voxels([W, H, D]);

function put(x, y, z, id, st) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
}

// Per-cell ground and roof, lidar-smoothed, roof at least 6 above ground
function info(x, z) {
  const c = cellMap.get(`${x},${z}`) || { gr: 0, rf: 8 };
  const gr = Math.max(0, Math.min(H - 8, c.gr));
  const rf = Math.max(gr + 6, Math.min(H, c.rf || gr + 8));
  return { gr, rf };
}

const perim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// ---- 1. Massing: foundation, brick shell, floor slabs, roof deck ----
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const { gr, rf } = info(x, z);
    // Stone-brick basement fills up to the lowest-ground level
    for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

    if (perim(x, z)) {
      for (let y = gr; y < rf - 1; y++) {
        put(x, y, z, corner(x, z) ? "stone_bricks" : "bricks");
      }
      // Cornice: a smooth stone band under a stone coping slab
      put(x, rf - 2, z, "smooth_stone");
      put(x, rf - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else {
      // Interior: roof deck; air between storeys
      put(x, rf - 1, z, "spruce_planks");
    }
    // Storey floor slabs run across all cells so the shell is braced
    for (let fy = gr + 3; fy < rf - 2; fy += 3) put(x, fy, z, "oak_planks");
  }
}

// ---- 2. Windows: light-blue stained glass in white trim ----
function windowOn(x, z, bottom) {
  const { rf } = info(x, z);
  if (bottom + 1 >= rf - 2) return;
  put(x, bottom, z, "light_blue_stained_glass_pane");
  put(x, bottom + 1, z, "light_blue_stained_glass_pane");
  put(x, bottom - 1, z, "white_concrete");   // sill
  put(x, bottom + 2, z, "white_concrete");   // lintel
}

// ---- 3. Front street face (z = 0): entrance and windows ----
for (let x = 1; x <= 3; x++) {
  const { gr } = info(x, 0);
  const s1 = gr + 1;   // ground storey window rows
  const s2 = gr + 4;   // upper storey window rows
  if (x === 2) {
    // Entrance: two-high door with a white transom above, wall kept intact
    put(x, gr, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, 0, "white_concrete");
  } else {
    windowOn(x, 0, s1);
  }
  windowOn(x, 0, s2);
}

// Warm light behind some front glass (interior air at z = 1)
{
  const { gr } = info(1, 1);
  put(1, gr + 1, 1, "shroomlight");
  put(1, gr + 4, 1, "shroomlight");
  put(3, gr + 4, 1, "shroomlight");
}

// ---- 4. Back face (z = 9) ----
for (let x = 1; x <= 3; x++) {
  const { gr } = info(x, D - 1);
  windowOn(x, D - 1, gr + 1);
  windowOn(x, D - 1, gr + 4);
}

// ---- 5. Side walls (x = 0 and x = 4) ----
for (const x of [0, W - 1]) {
  for (const z of [3, 6]) {
    const { gr } = info(x, z);
    windowOn(x, z, gr + 1);
    windowOn(x, z, gr + 4);
  }
}

// ---- 6. Roof: brick chimney stack on the back of the roof ----
{
  const { rf } = info(3, D - 2);
  put(3, rf, D - 2, "bricks");
  put(3, rf + 1, D - 2, "bricks");
  put(3, rf + 2, D - 2, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
