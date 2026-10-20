import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1340087851";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 28, H = 19, D = 3;
const g = new Voxels([W, H, D]);

const GLASS_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// One-storey Xinyi-era commercial shophouse: stone plinth, quartz pilasters,
// storefront glazing with white transoms, entrance bay with a canopy,
// white-concrete cornice and parapet, rooftop plant boxes.
// Per cell: floor at ground b, storey b+1..b+4, roof slab b+5, parapet b+6..b+7.
for (const [cx, cz, cg] of cells) {
  const x = cx, z = cz, b = Math.round(cg);

  // Foundation: solid from y0 up to the cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Floor slab per storey: granite plinth on the street face, smooth stone behind.
  put(x, b, z, z === 0 ? "polished_granite" : "smooth_stone");

  if (z === 0) {
    // Street facade (storefront).
    const entrance = x === 13 || x === 14;
    if (x % 4 === 0) {
      // Pilasters.
      for (let y = b + 1; y <= b + 4; y++) put(x, y, z, "smooth_quartz");
    } else if (entrance) {
      // Double glass-and-timber door, lower and upper halves.
      const hinge = x === 13 ? "left" : "right";
      put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
      put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
      put(x, b + 4, z, "white_concrete");
    } else {
      // Shopfront glazing with a white transom.
      put(x, b + 1, z, "glass_pane", GLASS_EW);
      put(x, b + 2, z, "glass_pane", GLASS_EW);
      put(x, b + 3, z, "white_concrete");
      put(x, b + 4, z, "glass_pane", GLASS_EW);
    }
    // Canopy over the entrance bay (x 13..15), bottom slab at b+3, tied to pilasters.
    if (x >= 13 && x <= 15) {
      put(x, b + 3, z, "stone_brick_slab", SLAB_BOTTOM);
    }
    // Storey line above the canopy band.
    put(x, b + 5, z, "white_concrete");
    // Parapet and cap.
    put(x, b + 6, z, "white_concrete");
    put(x, b + 7, z, "smooth_quartz_slab", SLAB_BOTTOM);
  } else if (z === 1) {
    // Interior air behind the glass (no interior), roof slab at b+5.
    if (x >= 13 && x <= 15) put(x, b + 3, z, "stone_brick_slab", SLAB_BOTTOM); // canopy
    // Warm lights behind the shopfront glass.
    if (x % 8 === 2 || x % 8 === 6) {
      if (!(x === 14)) put(x, b + 2, z, x % 8 === 2 ? "shroomlight" : "glowstone");
    }
    put(x, b + 5, z, "smooth_stone");
    // Rooftop plant boxes.
    if (x % 9 === 5) put(x, b + 6, z, "light_gray_concrete");
  } else {
    // Back wall with rear windows.
    for (let y = b + 1; y <= b + 4; y++) put(x, y, z, "white_concrete");
    if (x % 4 === 2) {
      put(x, b + 2, z, "glass_pane", GLASS_EW);
      put(x, b + 3, z, "glass_pane", GLASS_EW);
    }
    put(x, b + 5, z, "white_concrete");
    put(x, b + 6, z, "white_concrete");
    put(x, b + 7, z, "smooth_quartz_slab", SLAB_BOTTOM);
  }
}

g.save(`${DIR}/${ID}.nbt`);
