import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low Taipei commercial block of the 1980s-90s: one shopfront storey of about
// 5 blocks, a cream-tiled upper course, a stone parapet and roof plant.
// Cream and grey masonry, glass shopfronts, red sign band.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw258816698";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 6, H = 19, D = 30;
const g = new Voxels([W, H, D]);

const gmap = new Map();
let L = Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, gr);
  if (gr < L) L = gr;
}
const has = (x, z) => gmap.has(`${x},${z}`);
const ROOF = L + 7;

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

function exterior(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}

// Entrances: north end (z=0) at x=2, south end (z=29) at x=3.
function isDoor(x, z) {
  return (z === 0 && x === 2) || (z === D - 1 && x === 3);
}

// Shopfront runs along both long sides (z 3..26, skipping the door bay)
// and across both end walls (x 1..4).
function isShop(x, z) {
  if (z === 0 || z === D - 1) return x >= 1 && x <= 4;
  return z >= 3 && z <= 26 && !(z >= 13 && z <= 15);
}

// Mullion column: every 4th bay along the long sides, the centre bay on the ends.
function isMullion(x, z) {
  if (z === 0 || z === D - 1) return x === 3;
  return z % 4 === 0;
}

// Pass 1: foundations, walls, floors, roof deck, parapet.
for (const [x, z, gr] of cells) {
  const top = Math.max(ROOF, gr + 6);
  const ext = exterior(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Storey line / floor slab at gr+5.
  put(x, gr + 5, z, "smooth_quartz");

  if (ext) {
    const shop = isShop(x, z);

    // Base course.
    put(x, gr + 1, z, shop ? "polished_granite" : "stone_bricks");

    // Ground storey, y = gr+2 .. gr+4.
    for (let y = gr + 2; y <= gr + 4; y++) {
      if (isDoor(x, z)) {
        // Door handled below; glass transom above it.
        if (y === gr + 4) put(x, y, z, "glass");
        continue;
      }
      if (shop) {
        if (isMullion(x, z)) {
          put(x, y, z, "white_concrete");
        } else if (((x + z) % 9 === 4) && y === gr + 3) {
          put(x, y, z, "glowstone");
        } else {
          put(x, y, z, "glass");
        }
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }

    // Sign band above shopfront.
    put(x, gr + 5, z, shop ? "red_concrete" : "smooth_quartz");

    // Entrances.
    if (z === 0 && x === 2) {
      put(x, gr + 1, z, "stone_bricks");
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    if (z === D - 1 && x === 3) {
      put(x, gr + 1, z, "stone_bricks");
      put(x, gr + 2, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }

    // Upper course, cream tile with pane windows, up to roof deck.
    for (let y = gr + 6; y < top; y++) {
      if (z % 3 !== 0) put(x, y, z, "glass_pane");
      else put(x, y, z, "white_concrete");
    }
    // Warm lantern-style light in the upper course.
    if (z % 6 === 2 && top - 1 >= gr + 6) {
      put(x, top - 1, z, "shroomlight");
    }

    // Stone parapet.
    put(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof deck on every footprint cell.
  put(x, top, z, "light_gray_concrete");
}

// Pass 2: roof plant (cooling box and stair housing) on the roof interior.
for (let z = 19; z <= 21; z++) {
  for (let x = 2; x <= 3; x++) {
    if (!has(x, z)) continue;
    const gr = gmap.get(`${x},${z}`);
    const top = Math.max(ROOF, gr + 6);
    put(x, top + 1, z, "smooth_stone");
    if (top + 2 < H) put(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${dir}/${id}.nbt`);
