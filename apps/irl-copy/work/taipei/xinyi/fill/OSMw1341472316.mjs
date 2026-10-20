import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341472316";
const W = 10, H = 19, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...ground.values());
const maxG = Math.max(...ground.values());

// One low commercial storey (1980s Taipei shophouse-style), roof deck and parapet.
const T = Math.max(minG + 6, maxG + 2);   // parapet top layer
const DECK = T - 1;                       // roof slab / cornice level

const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const edge = perim(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab / base course.
  g.set(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  // Roof deck across the whole footprint.
  if (!edge) {
    g.set(x, DECK, z, "light_gray_concrete");
  }

  if (edge) {
    for (let y = gr + 1; y <= DECK; y++) {
      const rel = y - gr;
      let b;
      if (z === 0) {
        // Street front: shopfront, sign band, cornice.
        if (rel <= 3) {
          if (x === 4) {
            if (rel === 1 || rel === 2) {
              // Entrance door (lower and upper halves).
              g.set(x, y, z, "oak_door", {
                facing: "north",
                half: rel === 1 ? "lower" : "upper",
                hinge: "left",
                open: "false",
                powered: "false",
              });
              continue;
            }
            b = "glass";
          } else if ([0, 3, 6, 9].includes(x)) {
            b = "polished_andesite"; // shopfront pillars
          } else {
            b = "glass";             // shop glazing
          }
        } else if (rel === 4) {
          b = "red_concrete";        // sign band
        } else if (y === DECK) {
          b = "stone_bricks";        // cornice
        } else {
          b = "white_concrete";
        }
      } else {
        // Side and back elevations: plinth, window bays, band, cornice.
        if (rel === 1) b = "polished_andesite";
        else if (rel === 2 || rel === 3) b = (x + z) % 2 === 1 ? "glass" : "white_concrete";
        else if (rel === 4) b = "light_gray_concrete";
        else if (y === DECK) b = "stone_bricks";
        else b = "white_concrete";
      }
      g.set(x, y, z, b);
    }

    // Parapet ring on top of the cornice.
    g.set(x, T, z, z === 0 ? "stone_brick_wall" : "white_concrete");
  }
}

// Interior warm lights: glowstone behind shopfront glass, hanging lanterns from the deck.
for (const [x, z, gr] of cells) {
  if (perim(x, z)) continue;
  if ((x === 1 || x === 8) && z === 1) {
    g.set(x, gr + 1, z, "glowstone");
  }
  if ((x === 2 || x === 7) && z === 2 && gr + 4 < DECK) {
    g.set(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Rooftop plant box sitting on the deck.
if (has(7, 2) && !perim(7, 2)) {
  g.set(7, T, 2, "iron_block");
} else if (has(7, 3)) {
  g.set(7, T, 3, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
