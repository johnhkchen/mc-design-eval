import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 22 x 17 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey brick and white-trim Taipei commercial block (1960s-80s
// shophouse type): stone plinth, brick walls, white concrete bands, glass
// shopfronts at ground, glass panes above, a few warm lit windows, parapet and
// rooftop plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951314";
const W = 22, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const exposedX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const exposedZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const perimeter = (x, z) => exposedX(x, z) || exposedZ(x, z);

// Choose one entrance: on the north (-z) face, first cell in z,x order that is
// a single-face exposure with window index 1 (so it sits in the window rhythm).
let doorKey = null;
const sorted = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
for (const [x, z] of sorted) {
  if (!has(x, z - 1) && !exposedX(x, z) && x % 3 === 1) { doorKey = key(x, z); break; }
}

for (const [x, z, gr] of cells) {
  const k = key(x, z);
  const per = perimeter(x, z);

  // Foundation and ground floor slab
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  // Floor slab between storeys and roof slab
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, "light_gray_concrete");

  if (per) {
    // Brick walls for both storeys
    for (let y = gr + 1; y <= gr + 9; y++) put(x, y, z, "bricks");
    // White concrete bands: ground-storey lintel and second-storey sill
    put(x, gr + 4, z, "white_concrete");
    put(x, gr + 9, z, "white_concrete");
    // Parapet
    put(x, gr + 11, z, "white_concrete");

    // Window grid: pattern follows the exposed face
    const cornerCell = exposedX(x, z) && exposedZ(x, z);
    if (!cornerCell) {
      const idx = exposedX(x, z) ? z : x;
      if (idx % 3 === 1) {
        // Ground storey shopfront glass
        for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "glass_pane");
        // Second storey glass
        for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, "glass_pane");
        // Warm lit windows behind glass (glowing panels)
        if ((idx * 7 + x * 3 + z) % 5 === 0) put(x, gr + 7, z, "glowstone");
        if ((idx * 5 + x + z * 2) % 7 === 0) put(x, gr + 2, z, "glowstone");
      }
    }

    // Entrance on north face: door, replacing the window opening
    if (k === doorKey) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      // Small canopy over the entrance, carried on the roof-line of the shopfront
      put(x, gr + 4, z, "red_concrete");
    }
  } else {
    // Interior: rooftop plant boxes on a regular grid, air gap elsewhere
    if (x % 6 === 3 && z % 5 === 2) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "iron_bars");
    }
  }
}

// Roof terrace trim: white ring on the parapet already; add a red sign band
// on the ground-storey lintel at the north face corners to read as a shop sign.
for (const [x, z, gr] of cells) {
  if (perimeter(x, z) && !has(x, z - 1) && (x === 0 || x === W - 1 || !has(x - 1, z))) {
    if (x % 3 === 0) put(x, gr + 4, z, "red_terracotta");
  }
}

g.save(`${DIR}/${ID}.nbt`);
