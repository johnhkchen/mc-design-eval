import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw839833567: no record, so this is a two-storey reinforced-concrete shophouse
// typical of mid-century Taipei: white rendered concrete frame, glazed ground-floor
// shopfront with a red sign band, a smooth-stone storey line, upper windows,
// a stone parapet and a flat roof with plant and a lightning rod.
// Roof sits about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833567";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const FLOOR_Y = 5;     // storey line between the two storeys
const ROOF_Y = 10;     // roof deck layer (top surface at 11)
const key = (x, z) => `${x},${z}`;

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z);
}
const doorX = Math.floor((minX + maxX) / 2);

// Walkthrough of each footprint cell
for (const [x, z, gr] of cells) {
  const missing = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const outFaces = Object.values(missing).filter(Boolean).length;
  const perimeter = outFaces > 0;
  const corner = outFaces >= 2;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storey floor slab (interior and perimeter), where it sits above ground
  if (gr <= FLOOR_Y) g.set(x, FLOOR_Y, z, "smooth_stone");

  // Roof deck over every footprint cell
  if (gr <= ROOF_Y) g.set(x, ROOF_Y, z, perimeter ? "stone_bricks" : "light_gray_concrete");

  if (!perimeter) continue;

  // Facade face: street side is the north (min z) face; others follow the same pattern
  const onFront = missing.n;
  const idx = (missing.n || missing.s) ? x : z;
  const pillar = corner || idx % 3 === 0;
  const isDoorCell = onFront && x === doorX;

  for (let y = gr; y <= ROOF_Y - 1; y++) {
    let b;
    if (y === gr) {
      b = "stone_bricks";                       // base course
    } else if (y < FLOOR_Y) {                   // ground storey
      if (y === 4) {
        b = onFront ? "red_concrete" : "smooth_stone"; // sign band / lintel
      } else if (pillar) {
        b = "white_concrete";
      } else if (isDoorCell && y <= gr + 2) {
        b = "glass";                            // door placed below
      } else {
        b = "glass";                            // shopfront glazing
      }
    } else if (y === FLOOR_Y) {
      b = "smooth_stone";                       // storey line
    } else {                                    // upper storey
      if (y === 6 || y === 9) b = "white_concrete";  // spandrel / cornice band
      else if (pillar) b = "white_concrete";
      else if (y === 7 && idx % 6 === 4) b = "glowstone"; // lit room behind glass
      else b = "glass";
    }
    if (y === ROOF_Y - 1 && !pillar) b = "smooth_stone"; // cornice band
    g.set(x, y, z, b);
  }

  // Door and sidelights on the street-facing ground storey
  if (isDoorCell && gr + 2 < FLOOR_Y) {
    g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Parapet on the roof edge
  if (gr <= ROOF_Y) g.set(x, ROOF_Y + 1, z, "stone_brick_wall");
}

// Roof plant: a few AC/mechanical boxes on interior roof cells
for (const [x, z, gr] of cells) {
  const perimeter = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (perimeter || ROOF_Y + 1 > 22 || gr > ROOF_Y) continue;
  if ((x * 3 + z * 5) % 11 === 0) g.set(x, ROOF_Y + 1, z, "iron_block");
}

// Lightning rod on the interior cell nearest the footprint centre
{
  const cx = (minX + maxX) / 2;
  const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  let best = null, bestD = Infinity;
  for (const [x, z, gr] of cells) {
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bestD && gr <= ROOF_Y) { bestD = d; best = [x, z]; }
  }
  if (best) g.set(best[0], ROOF_Y + 1, best[1], "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
