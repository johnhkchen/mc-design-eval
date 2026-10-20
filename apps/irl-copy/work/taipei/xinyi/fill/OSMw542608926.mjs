import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 22 x 20 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey mid-century Taipei commercial block: pale tiled
// concrete walls, polished andesite storey bands, blue-glass bays on a
// stone base, a shopfront with a central door on the street (north) face,
// and a plain roof deck with a water tank and an AC unit.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608926";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8")); // [x, z, ground]

const W = 22, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);

const has = (x, z) => G.has(key(x, z));
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Lowest ground under the footprint is storey 0 datum.
const L = Math.min(...cells.map((c) => c[2]));
const TOP = L + 10;          // last wall/roof-deck layer (cornice band)
const SILL0 = L + 1;         // ground floor sill row
const WIN0 = [L + 2, L + 4]; // ground floor glazing rows
const SILL1 = L + 6;         // second floor sill row
const WIN1 = [L + 7, L + 9]; // second floor glazing rows
const FLOOR = L + 5;         // storey line / floor slab

// Street face = minimum z edge. Choose the door cell nearest the mean x of that face.
const minZ = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === minZ && perim(c[0], c[1])).map((c) => c[0]);
const meanX = frontXs.length ? frontXs.reduce((a, b) => a + b, 0) / frontXs.length : W / 2;
let doorX = frontXs.length ? frontXs[0] : null;
for (const x of frontXs) if (Math.abs(x - meanX) < Math.abs(doorX - meanX)) doorX = x;
const doorKey = doorX === null ? null : key(doorX, minZ);

const inRange = (y, [a, b]) => y >= a && y <= b;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const isP = perim(x, z);
  // Index along the facade this cell sits on.
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const idx = zFace ? x : z;
  const isWindowBay = idx % 3 !== 0;

  for (let y = gr; y <= TOP; y++) {
    if (isP) {
      if (y === L) { g.set(x, y, z, "stone_bricks"); continue; }      // base course
      if (y === TOP) { g.set(x, y, z, "polished_andesite"); continue; } // cornice
      if (y === FLOOR) { g.set(x, y, z, "polished_andesite"); continue; } // storey line
      if (y === SILL0 || y === SILL1) { g.set(x, y, z, "polished_andesite"); continue; }
      if ((isWindowBay) && (inRange(y, WIN0) || inRange(y, WIN1))) {
        g.set(x, y, z, "light_blue_stained_glass");
        continue;
      }
      g.set(x, y, z, "smooth_quartz");
    } else {
      // Interior: air gap behind glass, floor slabs, roof deck.
      if (y === gr) g.set(x, y, z, "smooth_stone");
      else if (y === FLOOR) g.set(x, y, z, "smooth_stone");
      else if (y === TOP) g.set(x, y, z, "gray_concrete");
      // else leave as air
    }
  }
}

// Warm interior lights, visible through the glazing at dusk.
for (const [x, z, gr] of cells) {
  if (perim(x, z)) continue;
  if (gr <= L && (x * 5 + z) % 7 === 0 && L + 1 <= TOP) {
    g.set(x, L + 1, z, "glowstone");              // ground floor table lamp
  }
  if (gr <= L + 5 && (x + z * 2) % 6 === 0 && L + 6 <= TOP) {
    g.set(x, L + 6, z, "glowstone");             // second floor lamp
  }
}

// Shopfront entrance with a double-height-free door on the street face.
if (doorKey !== null) {
  const gd = G.get(doorKey);
  const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(doorX, gd, minZ, "oak_door", { ...doorProps, half: "lower" });
  g.set(doorX, gd + 1, minZ, "oak_door", { ...doorProps, half: "upper" });
}

// Roof plant on the deck: water tank in the middle, AC unit near a corner.
const ok = (x, z, gr) => has(x, z) && !perim(x, z) && gr <= TOP && G.get(key(x, z)) <= TOP;
let tankCells = [];
const cx = Math.round(W / 2), cz = Math.round(D / 2);
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  const x = cx + dx, z = cz + dz;
  if (has(x, z) && !perim(x, z)) tankCells.push([x, z, G.get(key(x, z))]);
}
for (const [x, z, gr] of tankCells) {
  if (gr <= TOP) {
    g.set(x, TOP + 1, z, "iron_block");
    g.set(x, TOP + 2, z, "iron_block");
  }
}
for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
  const x = 2 + dx, z = D - 4 + dz;
  if (ok(x, z, G.get(key(x, z)) ?? 99)) g.set(x, TOP + 1, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
