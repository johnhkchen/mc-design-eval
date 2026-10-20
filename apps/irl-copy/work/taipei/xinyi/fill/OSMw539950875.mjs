import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Shophouse-style 2-storey commercial block, c. 1980s Taipei: white tiled walls,
// light-grey concrete bands, dark-wood shop lintel, parapet roof.
// x = 0 is the street (shopfront) face, x = 2 the rear face.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950875";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 3, H = 23, D = 13;
const TOP = 11;               // parapet top, about 11 blocks above lowest ground
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground, then ground-floor slab.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  const wW = !has(x - 1, z), wE = !has(x + 1, z);
  const wN = !has(x, z - 1), wS = !has(x, z + 1);
  const ext = wW || wE || wN || wS;
  const side = wW ? "w" : wE ? "e" : wN ? "n" : "s";
  const xFace = side === "w" || side === "e";
  const street = side === "w";
  const endCell = z === 0 || z === 12;
  // Windows on the long faces; piers every third bay and at the ends.
  const win = xFace && !endCell && z % 3 !== 0;
  const doorHere = street && z === 6;

  for (let y = gr + 1; y <= TOP && y < H; y++) {
    if (!ext) {
      // Interior: air, with floor slabs at storey lines and the roof deck.
      if (y === 5) g.set(x, y, z, "smooth_stone");
      else if (y === 10) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (y <= 3) {
      // Ground storey: shopfront glazing, door on the street face.
      if (doorHere && (y === gr + 1 || y === gr + 2)) {
        g.set(x, y, z, "oak_door", {
          facing: "west",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (win) {
        g.set(x, y, z, "light_blue_stained_glass_pane", GLASS_NS);
      } else {
        g.set(x, y, z, "white_concrete");
      }
    } else if (y === 4) {
      // Shop lintel: dark wood on the street, grey concrete elsewhere.
      g.set(x, y, z, street ? "dark_oak_planks" : "light_gray_concrete");
    } else if (y === 5) {
      g.set(x, y, z, "smooth_stone");                       // storey line
    } else if (y <= 8) {
      if (win) g.set(x, y, z, "light_blue_stained_glass_pane", GLASS_NS);
      else g.set(x, y, z, "white_concrete");
    } else if (y === 9) {
      g.set(x, y, z, "light_gray_concrete");                // head band
    } else if (y === 10) {
      g.set(x, y, z, "stone_bricks");                       // cornice
    } else if (y === 11) {
      g.set(x, y, z, "stone_bricks");                       // parapet cap
    }
  }
}

// Warm lights: upper-floor interior lamps behind the rear and street glazing.
for (const [x, z] of cells) {
  if (x !== 1 || has(x - 1, z) === false || has(x + 1, z) === false) {
    // only the centre bay is interior; fall through to checks below
  }
  const interior = x === 1 && has(0, z) && has(2, z) && z !== 0 && z !== 12;
  if (!interior) continue;
  if (z === 2 || z === 8) g.set(x, 6, z, "glowstone");
  if ((z === 4 || z === 10) && 1 + 0 <= 3) {
    const gr = cellMap.get(`${x},${z}`);
    if (gr + 1 <= 3) g.set(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof equipment: two condenser units on the deck.
for (const z of [3, 9]) {
  if (has(1, z) && has(0, z) && has(2, z)) g.set(1, TOP, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
