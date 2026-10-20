import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540883620";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 9, H = 23, D = 5;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFoot = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Record: roof about 11 blocks above lowest ground -> two storeys, parapet, flat roof.
// Era: 1980s low-rise commercial block, white concrete, stone cornice, shopfront at street level.
const TOP = minG + 10;          // highest block of parapet; roof surface at minG + 11
const BAND = minG + 5;          // floor slab / storey line between storeys
const DECK = minG + 9;          // roof slab under parapet

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!inFoot(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const fac = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;
  const back = z === D - 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Building body from this cell's ground up to the parapet top.
  for (let y = gr; y <= TOP && y < H; y++) {
    let b = null;
    if (y === TOP) {
      if (fac) b = "smooth_stone";                   // parapet cap
    } else if (y === DECK) {
      b = "smooth_stone";                            // roof slab
    } else if (y === BAND) {
      b = "light_gray_concrete";                     // storey line / floor slab
    } else if (y === gr) {
      b = fac ? "stone_bricks" : "light_gray_concrete"; // base course / ground floor slab
    } else if (fac) {
      if (y < BAND) {
        // Storey 1: shopfront
        if (y === minG + 4) {
          b = "smooth_stone";                        // lintel course
        } else if (front || back) {
          if (x === 0 || x === W - 1) b = "white_concrete";
          else if (x === 3 || x === 5) b = "light_gray_concrete";
          else b = "glass_pane";
        } else {
          b = z === 2 ? "glass_pane" : "white_concrete";
        }
      } else {
        // Storey 2: window grid
        if (y === minG + 8) {
          b = "white_concrete";                      // spandrel
        } else if (front || back) {
          b = x % 2 === 0 ? "white_concrete" : "glass_pane";
        } else {
          b = z === 2 ? "glass_pane" : "white_concrete";
        }
      }
    }
    if (b) put(x, y, z, b);
  }
}

// Entrance door on the street face (z = 0), centred on x = 4.
const dg = ground.get("4,0");
if (dg !== undefined) {
  put(4, dg, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(4, dg + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Entrance canopy over the door, on the front cells.
  const cy = dg + 2;
  for (const x of [3, 4, 5]) put(x, cy, 0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  put(4, cy, 1, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  // Interior lantern just inside the shopfront.
  put(4, dg + 1, 2, "lantern", { hanging: "false", waterlogged: "false" });
}

// Warm light behind upper-floor glass (glowstone inside the windows).
const lightY = minG + 6;
for (const x of [1, 3, 5, 7]) {
  put(x, lightY, 1, "glowstone");
  if (x === 3 || x === 5) put(x, lightY, 3, "glowstone");
}

// Rooftop plant: a small air-conditioning housing on the deck.
put(5, TOP, 2, "light_gray_concrete");
put(6, TOP, 2, "light_gray_concrete");

g.save(`${dir}/${id}.nbt`);
