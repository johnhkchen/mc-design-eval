import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538464244";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);
const has = (x, z) => cellMap.has(key(x, z));

// Lowest ground under the footprint; storeys are measured from here.
const B = Math.min(...cells.map((c) => c[2]));
const ROOF = B + 11; // parapet top, ~11 blocks above lowest ground

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "polished_andesite";
const FASCIA = "black_concrete";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";

function doorBlocks(x, y, z) {
  const common = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(x, y, z, "dark_oak_door", { ...common, half: "lower" });
  g.set(x, y + 1, z, "dark_oak_door", { ...common, half: "upper" });
}

for (const [x, z, gr] of cells) {
  const n = !has(x, z - 1); // front (street-side) face
  const s = !has(x, z + 1); // back face
  const w = !has(x - 1, z);
  const e = !has(x + 1, z);
  const facade = n || s || w || e;
  const isCorner = (n || s) && (w || e);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y <= ROOF; y++) {
    if (!facade) {
      // Interior: floor slabs only, air gap otherwise.
      if (y === gr || y === B + 5 || y === B + 10) g.set(x, y, z, FLOOR);
      continue;
    }

    // Front ground-floor door on the street face.
    if (n && x === 2 && (y === B + 1 || y === B + 2) && gr <= B + 1) {
      if (y === B + 1) doorBlocks(x, y, z);
      continue;
    }

    let block;
    const lower = y >= B + 1 && y <= B + 3;
    const upper = y >= B + 6 && y <= B + 9;

    if (y === gr) block = BASE;
    else if (y === ROOF) block = PIER;            // parapet
    else if (y === B + 10) block = BAND;          // cornice band
    else if (y === B + 5) block = BAND;           // storey line
    else if (y === B + 4) block = n ? FASCIA : PIER; // canopy fascia / spandrel
    else if (isCorner) block = PIER;
    else if (n || s) {
      // Street and back faces: bays at x 1..3, piers at the ends.
      const bay = x >= 1 && x <= 3;
      block = bay && (lower || upper) ? GLASS : PIER;
    } else {
      // Side faces: windows along z, piers every third cell.
      const bay = z >= 1 && z <= 19 && z % 3 !== 0;
      block = bay && (lower || upper) ? GLASS : PIER;
    }
    g.set(x, y, z, block);
  }
}

// Warm lights set on interior floors behind side glazing.
for (const [x, z, gr] of cells) {
  const facade = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (facade || x !== 1 || z % 4 !== 2) continue;
  g.set(x, B + 1, z, "glowstone");
  g.set(x, B + 6, z, "glowstone");
}

// Roof plant: a small mechanical box and a lightning rod.
for (let x = 1; x <= 3; x++) {
  for (let z = 6; z <= 8; z++) {
    if (!has(x, z)) continue;
    g.set(x, ROOF, z, "gray_concrete");
    g.set(x, ROOF + 1, z, "gray_concrete");
  }
}
if (has(2, 19)) {
  g.set(2, ROOF, 19, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
