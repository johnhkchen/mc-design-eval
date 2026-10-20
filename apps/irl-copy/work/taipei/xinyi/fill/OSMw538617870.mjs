import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538617870";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 9, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Two storeys of ~5 blocks, parapet and rooftop plant.
// Era: 1970s-80s Taipei mid-rise commercial block, cast-in-place concrete
// with cream concrete walls, pale floor bands and dark granite shopfront piers.
const ROOF = 11;   // roof slab top (cornice course)
const FL1 = 5;     // ground storey / first floor band
const FL2 = 10;    // first floor / second floor band
const PARA = 12;   // parapet course on the perimeter

const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => cellMap.has(key(x, z));

// Find the street-side entrance column: lowest z on the footprint, middle bay.
let minZ = Infinity;
for (const [, z] of cells) if (z < minZ) minZ = z;
const entranceX = 4;

function facade(x, z, y, gr, perX, perZ) {
  const corner = perX && perZ;
  // Bay index along the face the cell sits on.
  let along = null, span = 0;
  if (perZ && !perX) { along = x; span = W - 1; }
  else if (perX && !perZ) { along = z; span = D - 1; }
  const isPillar = corner || along === 0 || along === span || (along !== null && along % 3 === 0);

  if (y === ROOF) return "smooth_stone";            // cornice cap
  if (y === FL1 || y === FL2) return "light_gray_concrete"; // floor bands

  if (y < FL1) {
    // Shopfront storey
    const isEntrance = perZ && !perX && z === minZ && x === entranceX;
    if (isEntrance) return y <= gr + 2 ? "glass" : "light_gray_concrete";
    if (isPillar) return "polished_granite";
    return "glass_pane";
  }

  if (y > FL2) return "white_concrete"; // (only reached if ROOF > FL2 + 1)

  // Upper storey window zone (FL1 < y < FL2)
  if (isPillar) return "white_concrete";
  if (y === 7 && along !== null && along % 3 === 2) return "glowstone"; // lit window
  return "glass_pane";
}

// Build footprint
for (const [x, z, gr] of cells) {
  const perX = !has(x - 1, z) || !has(x + 1, z);
  const perZ = !has(x, z - 1) || !has(x, z + 1);
  const perim = perX || perZ;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Structure from ground to roof
  for (let y = gr; y <= ROOF; y++) {
    const b = perim ? facade(x, z, y, gr, perX, perZ) : "white_concrete";
    g.set(x, y, z, b);
  }

  if (perim) {
    // Parapet course around the roof edge
    g.set(x, PARA, z, "light_gray_concrete");
  }
}

// Interior: carve air for storey volumes (no interiors, just air gaps)
for (const [x, z, gr] of cells) {
  const perX = !has(x - 1, z) || !has(x + 1, z);
  const perZ = !has(x, z - 1) || !has(x, z + 1);
  if (perX || perZ) continue;
  for (let y = gr; y < FL1; y++) g.set(x, y, z, "air");
  for (let y = Math.max(gr, FL1 + 1); y < FL2; y++) g.set(x, y, z, "air");
}

// Rooftop plant: a plain concrete box on the roof, centred
for (let x = 2; x <= 6; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!has(x, z)) continue;
    g.set(x, ROOF + 1, z, "gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
