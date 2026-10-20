import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Shophouse-style two-storey commercial block (c. 1980s-90s Xinyi frontage):
// white tiled facade, stone base course, shopfront glass with a central door
// on the street face, punched upper-storey windows, parapet and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951330";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 3;
const g = new Voxels([W, H, D]);

const footprint = new Map();
let gmax = 0;
for (const [x, z, gr] of cells) {
  footprint.set(`${x},${z}`, gr);
  if (gr > gmax) gmax = gr;
}

// Common floor line: highest ground under the footprint, so every storey
// stands on solid fill. Roof (parapet top) sits 10 blocks above it, 11 tall in total.
const B = Math.min(gmax, 11);
const TOP = B + 10;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const has = (x, z) => footprint.has(`${x},${z}`);
const pane = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const slabBottom = { type: "bottom", waterlogged: "false" };

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;

    // Foundation: solid from y 0 up to the floor line (covers each cell's own ground).
    for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

    // Ground floor slab / base course.
    put(x, B, z, z === 1 ? "smooth_stone" : "polished_andesite");

    // Side walls at both ends, full height.
    if (x === 0 || x === 11) {
      for (let y = B + 1; y <= TOP; y++) put(x, y, z, "white_concrete");
      continue;
    }

    // Floor slab between storeys across the whole depth.
    put(x, B + 5, z, "smooth_stone");
    // Roof slab across the whole depth.
    put(x, TOP, z, "smooth_stone");

    if (z === 1) {
      // Interior depth: air behind the glass, nothing else.
      continue;
    }

    // Upper storey, both street and rear faces: white piers, glass bays, lintel.
    for (let y = B + 6; y <= B + 8; y++) {
      const glassBay = (x >= 2 && x <= 4) || (x >= 7 && x <= 9);
      if (glassBay) put(x, y, z, "glass_pane", pane);
      else put(x, y, z, "white_concrete");
    }
    put(x, B + 9, z, "white_concrete");
    put(x, B + 4, z, "smooth_stone_slab", slabBottom);

    // Parapet line sits on the roof slab (keeps the top edge crisp).
    put(x, TOP, z, "smooth_stone");

    if (z === 0) {
      // Street front: shopfront glass with mullions and central entrance.
      for (let y = B + 1; y <= B + 3; y++) {
        if (x === 3 || x === 8) put(x, y, z, "dark_oak_planks");
        else if (x === 5) {
          // Door handled below; transom glass above it.
          if (y === B + 3) put(x, y, z, "glass_pane", pane);
        } else if (x === 6) {
          put(x, y, z, "glass_pane", pane);
        } else {
          put(x, y, z, "glass_pane", pane);
        }
      }
      // Entrance door (x = 5) lower and upper halves on the street face.
      put(5, B + 1, 0, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(5, B + 2, 0, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    } else {
      // Rear face (z = 2): ground storey punched windows matching the upper pattern.
      for (let y = B + 1; y <= B + 3; y++) {
        const glassBay = (x >= 2 && x <= 4) || (x >= 7 && x <= 9);
        if (glassBay) put(x, y, z, "glass_pane", pane);
        else put(x, y, z, "white_concrete");
      }
    }
  }
}

// Storey line / awning band above the shopfront on the street face.
for (let x = 1; x <= 10; x++) {
  if (has(x, 0)) put(x, B + 4, 0, "smooth_stone_slab", slabBottom);
}

// Warm light behind the upper-storey glass (interior depth, z = 1).
put(3, B + 7, 1, "glowstone");
put(8, B + 7, 1, "glowstone");
put(3, B + 2, 1, "shroomlight");

// Rooftop mechanical plant on the parapet roof.
if (has(2, 1)) put(2, TOP + 1, 1, "light_gray_concrete");
if (has(3, 1)) put(3, TOP + 1, 1, "light_gray_concrete");
if (has(8, 1)) put(8, TOP + 1, 1, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
