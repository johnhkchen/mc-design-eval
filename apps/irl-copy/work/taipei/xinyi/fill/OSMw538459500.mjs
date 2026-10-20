import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459500";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Two-storey 1980s-style shophouse: stone plinth, shopfront ground floor,
// white-tile upper storey with glazed bays, red fascia, parapet roof with plant.
const FL1 = 5;    // storey line / upper floor slab
const DECK = 10;  // cornice and roof deck
const TOP = 11;   // parapet top

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const missing = (x, z) => !has(x, z);

const put = (x, y, z, b, p) => { if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b); };

const paneProps = (alongX) => alongX
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const wN = missing(x, z - 1);
  const wS = missing(x, z + 1);
  const wW = missing(x - 1, z);
  const wE = missing(x + 1, z);
  const edge = wN || wS || wW || wE;
  const corner = (wW || wE) && (wN || wS);

  if (!edge) {
    // Interior: floor slabs and roof deck only, air between.
    for (const y of [gr, FL1, DECK]) {
      if (y >= gr && y <= DECK) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior envelope cell.
  const alongX = wN || wS;          // wall runs along x
  const i = alongX ? x : z;         // index along the wall for bay rhythm
  const door = wN && !corner && x === 4; // entrance on the z=0 face

  for (let y = gr; y <= TOP; y++) {
    let b = null, p = null;

    if (y === gr) {
      b = "stone_bricks"; // base course
    } else if (y <= 4) {
      if (door && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        b = "oak_door";
        p = { facing: "north", half, hinge: "left", open: "false", powered: "false" };
      } else if (door && y === gr + 3) {
        b = "lantern";
        p = { hanging: "true", waterlogged: "false" };
      } else if (y === 4) {
        b = "red_terracotta"; // fascia band
      } else if (corner || i % 3 === 0) {
        b = "stone_bricks";   // storefront pillars
      } else {
        b = "glass_pane";
        p = paneProps(alongX);
      }
    } else if (y === FL1) {
      b = "smooth_stone";     // storey line
    } else if (y < DECK) {
      // Upper storey (rows 6..9)
      if (corner) {
        b = "white_concrete";
      } else if (i % 3 === 1) {
        if (y === 6 || y === 9) {
          b = "stone_bricks";  // sill and lintel
        } else {
          b = "glass_pane";
          p = paneProps(alongX);
        }
      } else {
        b = "white_concrete";
      }
    } else if (y === DECK) {
      b = "smooth_stone";     // cornice
    } else {
      b = "white_concrete";   // parapet
    }

    if (b) put(x, y, z, b, p);
  }

  // Warm light behind a subset of upper windows, one block inside the glass.
  if (!corner && !door && i % 6 === 1) {
    let tx = x, tz = z;
    if (wN) tz = z + 1;
    else if (wS) tz = z - 1;
    else if (wW) tx = x + 1;
    else if (wE) tx = x - 1;
    if (has(tx, tz)) put(tx, 7, tz, "glowstone");
  }
}

// Roof plant: two AC condensers and a lightning rod, on the interior roof deck.
for (let x = 2; x <= 3; x++) {
  for (let z = 5; z <= 6; z++) {
    if (!has(x, z)) continue;
    put(x, TOP, z, "iron_block");
    put(x, TOP + 1, z, "iron_block");
  }
}
if (has(7, 20)) {
  for (let y = TOP; y <= TOP + 3; y++) {
    put(7, y, 20, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
