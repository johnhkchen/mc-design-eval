import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833634";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Storey plan (relative to each cell's ground gr):
//  gr        base course / floor slab
//  gr+1..3   storey 1 (storefront glass, piers)
//  gr+4      signage band
//  gr+5      storey line slab
//  gr+6..9   storey 2 (windows)
//  gr+10     cornice / roof deck
//  gr+11     parapet and plant
for (const [x, z, gr] of cells) {
  const isEdge = edge(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course and ground floor slab.
  put(x, gr, z, isEdge ? "polished_andesite" : "smooth_stone");

  // Storey line slab, every cell so the floor stands on the one below.
  put(x, gr + 5, z, "smooth_stone");

  // Roof deck / cornice.
  put(x, gr + 10, z, isEdge ? "smooth_quartz" : "smooth_stone");

  if (isEdge) {
    // Facade rhythm: piers and openings alternate along the wall.
    const bay = (x + z) % 3 === 1; // opening bay
    const onFront = z === 0;
    const doorX = 9;

    // Storey 1 storefront.
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (bay) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "white_concrete");
    }
    // Entrance on the z=0 face: double-height door with a glass transom.
    if (onFront && x === doorX) {
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "glass_pane");
    }

    // Signage band.
    put(x, gr + 4, z, "light_gray_concrete");

    // Storey 2 windows with sills and lintels.
    put(x, gr + 6, z, "white_concrete");
    put(x, gr + 9, z, "white_concrete");
    for (let y = gr + 7; y <= gr + 8; y++) {
      if (bay) put(x, y, z, "glass_pane");
      else put(x, y, z, "white_concrete");
    }

    // Parapet.
    put(x, gr + 11, z, "white_concrete");
  }
}

// Canopy lanterns over the entrance.
if (has(9, 0)) {
  const gr0 = ground.get("9,0");
  put(9, gr0 + 4, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm lights behind second-floor glass on interior cells.
for (const [x, z, gr] of cells) {
  if (edge(x, z)) continue;
  if (z === 1 && x % 4 === 2) put(x, gr + 7, z, "shroomlight");
}

// Roof plant: a main air-handling unit and a smaller unit on the deck.
for (const [x, z, gr] of cells) {
  if (edge(x, z)) continue;
  if (x % 6 === 2 && z === 4) {
    put(x, gr + 11, z, "iron_block");
  }
  if (x % 6 === 4 && z === 2) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
