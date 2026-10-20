import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low Xinyi-style commercial frontage: one storey of white-tiled concrete with a
// glass shopfront on the street face, a glazed rear, a stone plinth, a lintel band,
// a parapet with cap, and a row of rooftop plant boxes. Warm glowstone sits behind
// some of the glass so the street reads at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339888555";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 176, H = 19, D = 6;
const g = new Voxels([W, H, D]);

// Footprint ground map: key "x,z" -> ground y (third number of each cell).
const ground = new Map();
let gmin = Infinity;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr);
  gmin = Math.min(gmin, gr);
}
if (!Number.isFinite(gmin)) gmin = 0;

const put = (x, y, z, id, props) => g.set(x, y, z, id, props);

const FRONT = 0, BACK = D - 1, END_W = 0, END_E = W - 1;
const ENTRANCE_X = [44, 132];

// Each cell column: foundation, floor, walls/interior, roof deck, parapet, plant.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const fl = gr;                              // floor slab level for this cell
  const deck = Math.max(gmin + 5, fl + 1);    // roof deck level (absolute top ~ gmin+7)
  const top = deck + 2;                       // parapet cap level
  const onFront = z === FRONT, onBack = z === BACK;
  const onStreetFace = onFront || onBack;
  const onEnd = x === END_W || x === END_E;

  // Foundation under the floor slab.
  for (let y = 0; y < fl; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / plinth course.
  if (onStreetFace) put(x, fl, z, "polished_andesite");
  else put(x, fl, z, "smooth_stone");

  // Storey walls and air interior.
  for (let y = fl + 1; y < deck; y++) {
    const rel = y - fl;
    if (onStreetFace) {
      if (rel === 4) {
        // Lintel / fascia band.
        put(x, y, z, "white_concrete");
      } else if (x % 8 === 0 || onEnd) {
        // Pilasters every 8 blocks.
        put(x, y, z, "white_concrete");
      } else if (onFront && ENTRANCE_X.includes(x) && rel <= 2) {
        // Door: lower and upper halves.
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
          waterlogged: "false",
        });
      } else if (onFront && ENTRANCE_X.includes(x) && rel === 3) {
        // Transom over the entrance.
        put(x, y, z, "white_concrete");
      } else {
        // Glazing; the rear glass is kept clean, the front gets a warm bay at intervals.
        put(x, y, z, "glass");
      }
    } else if (onEnd) {
      put(x, y, z, "white_concrete");
    } else {
      // Interior: air gap behind the glass. Glowstone in a few front and rear bays.
      if (z === 1 && onFront === false) { /* nothing */ }
      if (z === 1 && x % 16 === 4 && rel === 2 && !ENTRANCE_X.includes(x)) {
        put(x, y, z, "glowstone");
      }
      if (z === BACK - 1 && x % 16 === 12 && rel === 2) {
        put(x, y, z, "glowstone");
      }
    }
  }

  // Roof deck.
  put(x, deck, z, "smooth_stone");

  // Parapet with stone cap on the perimeter.
  if (onStreetFace || onEnd) {
    put(x, deck + 1, z, "white_concrete");
    put(x, deck + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Rooftop plant boxes: two-block-high pairs of cells, set back from the parapet.
  if ((x % 24 === 10 || x % 24 === 11) && (z === 2 || z === 3)) {
    put(x, deck + 1, z, "gray_concrete");
    put(x, deck + 2, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
