import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw724637202";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 23 x 9 footprint; roof about 11 blocks above lowest ground.
// Reading: two-storey concrete shophouse-block of the 1980s-90s Xinyi/Taipei
// streetscape: white render walls, light-grey storey bands and fascia,
// shopfront glazing on the street (north) face, upper-floor window bays, flat roof
// with a few rooftop AC units and lanterns.
const W = 23, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, ground] of cells) {
  const gr = Math.round(ground);
  // Roof level is common (about 11 blocks above lowest ground), with a floor
  // of at least two storeys' worth of wall on higher ground.
  const top = Math.min(H - 3, Math.max(10, gr + 2)); // last wall row, inclusive

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  const north = !has(x, z - 1); // street face
  const south = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const edge = north || south || west || east;

  // Ground floor slab / plinth.
  put(x, gr, z, edge ? "stone_bricks" : "light_gray_concrete");

  if (edge) {
    // Wall body.
    for (let y = gr + 1; y < top; y++) put(x, y, z, "white_concrete");

    // Storey band at the upper floor line.
    if (gr + 5 < top) put(x, gr + 5, z, "light_gray_concrete");

    // Fascia above the shopfronts.
    if (north) put(x, gr + 4, z, "light_gray_concrete");
    else if (!edge || gr + 4 < top) put(x, gr + 4, z, "white_concrete");

    // Cornice / parapet cap.
    put(x, top, z, "smooth_stone");

    // Street (north) face: shopfront and door, then upper window bays.
    if (north) {
      for (let y = gr + 1; y <= gr + 3; y++) {
        if (x % 4 === 0) put(x, y, z, "white_concrete");
        else if (x === 11 && y <= gr + 2) {
          const half = y === gr + 1 ? "lower" : "upper";
          put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        } else put(x, y, z, "glass", null);
      }
      if (x % 3 !== 0) {
        for (let y = gr + 6; y <= gr + 8 && y < top; y++) put(x, y, z, "glass_pane", PANE_EW);
      }
    } else if (south) {
      for (let y = gr + 1; y <= gr + 3 && y < top; y++) {
        if (x % 3 !== 0) put(x, y, z, "glass_pane", PANE_EW);
      }
      for (let y = gr + 6; y <= gr + 8 && y < top; y++) {
        if (x % 3 !== 0) put(x, y, z, "glass_pane", PANE_EW);
      }
    } else if (west || east) {
      // Side walls: window bays on both floors.
      for (let y = gr + 6; y <= gr + 8 && y < top; y++) {
        if (z % 3 !== 0) put(x, y, z, "glass_pane", PANE_NS);
      }
      for (let y = gr + 1; y <= gr + 3 && y < top; y++) {
        if (z % 4 === 2) put(x, y, z, "glass_pane", PANE_NS);
      }
    }
  } else {
    // Interior: air gap, floor slab at each storey line, roof slab at top.
    if (gr + 5 < top) put(x, gr + 5, z, "light_gray_concrete");
    put(x, top, z, "light_gray_concrete");

    // Warm light behind the street-facing upper windows.
    if (z === 1 && x % 6 === 2) put(x, gr + 7, z, "glowstone");
    if (z === 1 && x % 6 === 5) put(x, gr + 2, z, "glowstone");
  }

  // Roof equipment on the flat roof.
  if (!edge) {
    if (top + 1 < H) {
      if (x % 7 === 4 && z === 3) put(x, top + 1, z, "iron_block");
      if (x % 7 === 5 && z === 3) put(x, top + 1, z, "iron_block");
      if (x === 16 && z === 6) put(x, top + 1, z, "lantern", { hanging: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
