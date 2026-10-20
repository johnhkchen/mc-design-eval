import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1980s-90s: two storeys over a shopfront
// base, reinforced-concrete frame with white pilasters, light-blue glass bays,
// a light-grey cornice and parapet, and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458225";
const W = 7, H = 23, D = 26;

const FLOOR1 = 5;      // storey line between ground floor and upper floor
const DECK = 10;       // roof deck / cornice band
const PARAPET = 11;    // parapet course, roof reads ~11 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const g = new Voxels([W, H, D]);

const isExt = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;

// Facade block for an exterior cell at height y (null = nothing).
function facade(x, z, y, gr) {
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const longSide = x === 0 || x === W - 1;       // long walls run along z
  const s = longSide ? z : x;                    // position along that wall
  const L = longSide ? D : W;
  const pier = corner || s % 4 === 0 || s === L - 1;

  if (y === PARAPET) return "white_concrete";
  if (y === DECK) return "light_gray_concrete";  // cornice band
  if (y === FLOOR1) return "light_gray_concrete"; // storey line

  if (y < FLOOR1) {
    // Ground floor: base course, shopfront glass, lintel
    if (y === gr) return "stone_bricks";
    if (y === 4) return "light_gray_concrete";     // shopfront lintel
    // Entrance on the east street face
    if (longSide && x === W - 1 && (s === 13 || s === 14)) return "glass";
    if (pier) return "white_concrete";
    return "light_blue_stained_glass";
  }

  // Upper floor
  if (y === 6 || y === 9) return "light_gray_concrete"; // sill and head
  if (pier) return "white_concrete";
  return "light_blue_stained_glass";
}

// Pass 1: foundations, walls, floors, roof
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ext = isExt(x, z);
  for (let y = gr; y <= PARAPET; y++) {
    let id = null;
    if (ext) {
      id = facade(x, z, y, gr);
    } else {
      if (y === DECK) id = "gray_concrete";        // roof deck
      else if (y === FLOOR1) id = "white_concrete"; // floor slab
      // warm lights behind the glass on the inside of the long walls
      else if ((x === 1 || x === W - 2) && (y === 2 || y === 7) && y >= gr && z % 4 === 2) {
        id = "glowstone";
      }
    }
    if (id) g.set(x, y, z, id);
  }
}

// Pass 2: rooftop water tank (white drum on iron cap), only where roof cells exist
for (let x = 2; x <= 4; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!ground.has(`${x},${z}`)) continue;
    for (let y = PARAPET; y <= 13; y++) g.set(x, y, z, "white_concrete");
    g.set(x, 14, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
