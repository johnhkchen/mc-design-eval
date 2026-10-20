import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343781";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 14 x 22. Two-storey low-rise commercial block (shophouse-era concrete),
// storefront glazing at ground, storey bands, white concrete pilasters, parapet roof.
const W = 14, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// Front (street) face: the south edge (highest z). Door sits on the middle column of that edge.
const frontCells = cells.filter(([x, z]) => !has(x, z + 1));
const frontXs = frontCells.map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : null;
const doorZ = frontCells
  .filter(([x]) => x === doorX)
  .map(([, z]) => z)
  .sort((a, b) => b - a)[0];

const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const BAND = "smooth_stone";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const ROOF = "stone_bricks";

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) g.set(x, y, z, FOUND);
}

// Body
for (const [x, z, gr] of cells) {
  const b = gr + 1; // first storey floor level above this cell's ground
  const n = !has(x, z - 1);
  const s = !has(x, z + 1);
  const w = !has(x - 1, z);
  const e = !has(x + 1, z);
  const perim = n || s || w || e;

  if (!perim) {
    // Interior: floor lines and roof slab only, air elsewhere (no interiors).
    g.set(x, b + 5, z, BAND);
    g.set(x, b + 10, z, ROOF);
    // Warm light behind some glass, visible through the windows.
    if ((x * 3 + z) % 5 === 0) {
      g.set(x, b + 2, z, "shroomlight");
    }
    if ((x * 2 + z * 3) % 7 === 0) {
      g.set(x, b + 7, z, "shroomlight");
    }
    // Roof plant: two air-conditioning blocks standing on the roof slab.
    const plantA = x >= 4 && x <= 5 && z >= 8 && z <= 9;
    const plantB = x >= 9 && x <= 10 && z >= 13 && z <= 14;
    if (plantA || plantB) {
      g.set(x, b + 11, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = (n || s) && (w || e);
  const idx = (n || s) ? x : z;
  const pillar = corner || idx % 3 === 0;
  const isDoor = x === doorX && z === doorZ && s;

  for (let y = b; y <= b + 9; y++) {
    if (y === b) {
      g.set(x, y, z, BASE); // base course
    } else if (y === b + 4 || y === b + 5 || y === b + 9) {
      g.set(x, y, z, BAND); // storey lines and lintel band
    } else {
      // window zones: ground floor (b+1..b+3) and upper floor (b+6..b+8)
      g.set(x, y, z, pillar ? FRAME : GLASS);
    }
  }

  // Parapet / cornice at roof level
  g.set(x, b + 10, z, FRAME);

  // Entrance: recessed door at the centre of the street face
  if (isDoor) {
    g.set(x, b + 1, z, "dark_oak_door", {
      facing: "south",
      half: "lower",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    g.set(x, b + 2, z, "dark_oak_door", {
      facing: "south",
      half: "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    g.set(x, b + 3, z, BAND); // lintel over the door
  }
}

g.save(`${DIR}/${ID}.nbt`);
