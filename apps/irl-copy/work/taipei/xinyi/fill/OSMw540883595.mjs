import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw540883595.cells.json`, "utf8"));

const W = 9, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Low-rise 1960s-80s Taipei commercial block: two storeys, white tiled
// concrete facade, light grey bands, shopfront glazing at street level,
// a parapet roof with a few plant boxes.
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const perim = edgeX || edgeZ;
  const corner = edgeX && edgeZ;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs per storey and the roof slab, air between
    put(x, gr, z, "white_concrete");
    put(x, gr + 5, z, "white_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    // A few roof plant boxes
    if ((x * 2 + z * 3) % 11 === 0) {
      put(x, gr + 11, z, "smooth_stone");
      put(x, gr + 12, z, "smooth_stone_slab", { type: "bottom" });
    }
    continue;
  }

  // Perimeter wall
  put(x, gr, z, "stone_bricks"); // base course

  // Door on the north (z = 0) face
  const isDoor = x === 4 && z === 0;

  // Ground floor shopfronts (gr+1 .. gr+4)
  if (isDoor) {
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "glass_pane");
    put(x, gr + 4, z, "light_gray_concrete");
  } else if (corner) {
    for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");
  } else if ((x + z) % 3 === 0) {
    // Pier between shop bays
    for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");
  } else {
    // Shop glazing with a fascia band above
    put(x, gr + 1, z, "glass_pane");
    put(x, gr + 2, z, "glass_pane");
    put(x, gr + 3, z, "glass_pane");
    put(x, gr + 4, z, "light_gray_concrete");
  }

  // Floor line between storeys
  put(x, gr + 5, z, "light_gray_concrete");

  // Upper storey (gr+6 .. gr+9)
  if (corner || (x + z) % 2 === 0) {
    for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
  } else {
    put(x, gr + 6, z, "light_gray_concrete"); // sill
    const warm = (x * 5 + z * 3) % 4 === 0;
    put(x, gr + 7, z, warm ? "glowstone" : "glass_pane");
    put(x, gr + 8, z, "glass_pane");
    put(x, gr + 9, z, "light_gray_concrete"); // head
  }

  // Cornice and parapet
  put(x, gr + 10, z, "light_gray_concrete");
  put(x, gr + 11, z, "white_concrete");
}

g.save(`${dir}/OSMw540883595.nbt`);
