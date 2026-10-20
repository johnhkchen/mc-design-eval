import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339999085.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339999085.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 12, H = 19, D = 2;
const g = new Voxels([W, H, D]);

// Ground map and roof line: lidar gives roof ~7 above lowest ground, so top block sits at minG + 6.
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const top = minG + 6;

const FRONT = 1; // street face, z = 1, faces south (+z)
const BACK = 0;  // rear face, z = 0, faces north

function doorProps(x, half) {
  return {
    facing: "south",
    half,
    hinge: x === 5 ? "left" : "right",
    open: "false",
    powered: "false",
  };
}

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const front = z === FRONT;
  const isEnd = x === 0 || x === W - 1;

  // Foundation and floor surface.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  for (let y = gr + 1; y <= top; y++) {
    const r = y - gr;   // height above this cell's ground
    const d = top - y;  // distance below roof line

    // Roof coping, plinth, and storey line are solid on both rows.
    if (d === 0) { g.set(x, y, z, "smooth_stone"); continue; }
    if (r === 1) { g.set(x, y, z, "stone_bricks"); continue; }
    if (d === 2) { g.set(x, y, z, "smooth_stone"); continue; }

    if (front) {
      if (r === 2 || r === 3) {
        // Ground-floor shopfront.
        if (isEnd) {
          g.set(x, y, z, "white_concrete");
        } else if (x === 5 || x === 6) {
          g.set(x, y, z, "dark_oak_door", doorProps(x, r === 2 ? "lower" : "upper"));
        } else {
          g.set(x, y, z, "glass");
        }
      } else if (d === 1) {
        // Upper window band with concrete mullions.
        if (isEnd || x % 3 === 0) g.set(x, y, z, "white_concrete");
        else g.set(x, y, z, "glass_pane");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    } else {
      // Rear row: concrete piers and walls, air behind the front glazing.
      if (isEnd) {
        g.set(x, y, z, "white_concrete");
      } else if (x === 5 || x === 6) {
        if (r === 2 || r === 3) {
          // Doorway opening stays air at the back; lintel handled by floor slab above.
        } else {
          g.set(x, y, z, "white_concrete");
        }
      } else if (d === 1 && (x === 2 || x === 5 || x === 8 || x === 9)) {
        // Warm light behind the upper glazing.
        g.set(x, y, z, "glowstone");
      } else if (r === 2 && (x === 3 || x === 8)) {
        // Warm light behind the shopfront glass.
        g.set(x, y, z, "shroomlight");
      }
      // All other rear cells stay air: the gap behind the glass.
    }
  }
}

// Lanterns on the coping of the street front for dusk readability.
if (top + 1 < H) {
  for (const x of [2, 9]) {
    if (ground.has(`${x},${FRONT}`)) {
      g.set(x, top + 1, FRONT, "lantern", { hanging: "false" });
    }
  }
}

g.save(OUT);
