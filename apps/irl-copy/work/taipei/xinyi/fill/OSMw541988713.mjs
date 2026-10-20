import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988713";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 23 x 10, roof about 11 blocks above lowest ground: a two-storey
// mid-century concrete shophouse with a shopfront at ground, a parapet roof
// deck and a small rooftop plant box.
const W = 23, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const SLAB = { type: "bottom", waterlogged: "false" };
const DOOR_L = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_U = { ...DOOR_L, half: "upper" };
const GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete";

for (const [x, z, G] of cells) {
  const edge = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  const front = !has(x, z + 1);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  // Floor slab / plinth at ground.
  g.set(x, G, z, edge ? "stone_bricks" : "smooth_stone");

  // Ground floor (offsets 1..3 openings, 4 lintel line).
  for (let o = 1; o <= 3; o++) {
    if (!edge) continue;
    if (front) {
      if (x % 4 === 0) g.set(x, G + o, z, PIER);
      else g.set(x, G + o, z, GLASS);
    } else {
      g.set(x, G + o, z, (x + z) % 3 === 0 ? PIER : GLASS);
    }
  }
  if (edge) g.set(x, G + 4, z, "stone_brick_slab", SLAB);

  // Upper floor storey line at offset 5 (floor slab for interior).
  if (edge) g.set(x, G + 5, z, "stone_brick_slab", SLAB);
  else g.set(x, G + 5, z, "smooth_stone");

  // Upper floor windows (offsets 6..8).
  for (let o = 6; o <= 8; o++) {
    if (!edge) continue;
    g.set(x, G + o, z, (x + z) % 3 === 0 ? PIER : GLASS);
  }

  // Cornice line at 9, parapet at 10 and cap at 11.
  if (edge) {
    g.set(x, G + 9, z, "stone_brick_slab", SLAB);
    g.set(x, G + 10, z, "stone_bricks");
    g.set(x, G + 11, z, "stone_brick_slab", SLAB);
  } else {
    g.set(x, G + 10, z, "smooth_stone"); // roof deck
  }

  // Shopfront entrance on the street face.
  if (front && x >= 10 && x <= 12) {
    g.set(x, G + 1, z, x === 11 ? "dark_oak_door" : GLASS, x === 11 ? DOOR_L : undefined);
    if (x === 11) g.set(x, G + 2, z, "dark_oak_door", DOOR_U);
    else g.set(x, G + 2, z, GLASS);
    g.set(x, G + 3, z, GLASS);
  }

  // Warm lights behind the street-face glazing.
  if (!edge && z === 8 && x % 5 === 2) g.set(x, G + 2, z, "glowstone");
  if (!edge && z === 8 && x % 5 === 3) g.set(x, G + 7, z, "shroomlight");

  // Rooftop plant box on the deck.
  if (!edge && x >= 3 && x <= 5 && z >= 3 && z <= 5) {
    g.set(x, G + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
