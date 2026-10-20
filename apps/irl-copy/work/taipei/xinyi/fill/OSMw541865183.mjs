import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: footprint 7 x 12, roof ~11 blocks above lowest ground.
// Read as a two-storey, flat-roofed Xinyi-era (c. 1970s-80s) shophouse block:
// white-tiled concrete walls, a ground-floor shopfront with a centred entrance,
// a light-grey storey line and lintel band, a smooth-stone cornice, and a roof
// plant box. Storeys are 5 blocks each; the parapet top is 11 blocks above ground.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865183.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865183.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 7, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const clampY = (y) => Math.max(0, Math.min(H - 1, y));

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const base = gr;
  const missN = !has(x, z - 1); // street (front) face
  const missS = !has(x, z + 1);
  const missW = !has(x - 1, z);
  const missE = !has(x + 1, z);
  const perim = missN || missS || missW || missE;

  // Floor of the ground storey.
  g.set(x, clampY(base), z, perim ? "stone_bricks" : "gray_concrete");

  if (!perim) {
    // Interior: storey slabs, roof deck, and warm light behind some windows.
    g.set(x, clampY(base + 5), z, "light_gray_concrete");
    g.set(x, clampY(base + 10), z, "light_gray_concrete");
    if (x % 2 === 1 && z % 4 === 1) g.set(x, clampY(base + 7), z, "glowstone");
    if (x === 3 && z === 6 && base + 12 <= H - 1) {
      g.set(x, base + 11, z, "iron_block"); // roof plant box
    }
    continue;
  }

  // Outward face: street face takes priority, then the others.
  let face, t, len;
  if (missN) { face = "north"; t = x; len = W; }
  else if (missS) { face = "south"; t = x; len = W; }
  else if (missW) { face = "west"; t = z; len = D; }
  else { face = "east"; t = z; len = D; }

  const isWindow = t > 0 && t < len - 1 && t % 2 === 1;
  const isFront = face === "north";

  for (let y = base + 1; y <= base + 10; y++) {
    const yy = clampY(y);
    let id;
    let props;

    if (y === base + 10) {
      id = "smooth_stone"; // cornice / parapet cap
    } else if (y === base + 9 || y === base + 5) {
      id = "light_gray_concrete"; // lintel band and storey line
    } else if (y === base + 4) {
      id = "light_gray_concrete"; // ground-floor fascia
    } else if (y >= base + 6 && y <= base + 8) {
      id = isWindow ? "glass" : "white_concrete";
    } else if (y === base + 1) {
      id = isFront ? null : "stone_bricks"; // plinth course
      if (isFront && isWindow) id = "glass";
      if (isFront && x === 3) {
        // Centred entrance: door at the bottom of the shopfront opening.
        g.set(x, yy, z, "oak_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isFront && x !== 3 && t > 0 && t < len - 1) id = "glass";
      if (isFront && (t === 0 || t === len - 1)) id = "white_concrete";
    } else if (y === base + 2 || y === base + 3) {
      // Ground-floor glazing on the street face; windows on the other faces.
      if (isFront) {
        if (x === 3) {
          if (y === base + 2) {
            g.set(x, yy, z, "oak_door", {
              facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
            });
            continue;
          }
          id = "glass";
        } else {
          id = (t === 0 || t === len - 1) ? "white_concrete" : "glass";
        }
      } else {
        id = isWindow ? "glass" : "white_concrete";
      }
    }

    if (id) g.set(x, yy, z, id, props);
  }
}

g.save(OUT);
