import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377769";
const W = 152, H = 23, D = 26;

// Reads: [x, z, ground] per footprint cell.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const exterior = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Low two-storey commercial/office block, mid-late 20th century Taipei:
// reinforced concrete frame with white-tiled pillars, blue-tinted glass
// spandrels, a shopfront ground storey with a dark sign band, a quartz
// belt course between storeys, a cornice and crenellated parapet.
const ENTRANCE_X = [72, 73, 74, 75, 76, 77];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ext = exterior(x, z);
  const front = z === 0 || z === D - 1;
  const end = x === 0 || x === W - 1;
  const pillar = ext && (x % 6 === 0 || end);
  const entrance = front && ENTRANCE_X.includes(x);

  // Base course at ground level, floor slab at storey line, roof slab at top of storey 2.
  put(x, gr, z, ext ? "polished_andesite" : "smooth_stone");
  put(x, gr + 5, z, ext ? "quartz_block" : "smooth_stone");
  put(x, gr + 10, z, ext ? "white_concrete" : "gray_concrete");

  // Cornice and crenellated parapet over the pillars.
  if (ext && x % 6 === 0) put(x, gr + 11, z, "quartz_block");

  if (!ext) continue; // interior: air gap behind glass

  // Ground storey (shopfronts).
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (entrance) continue; // open doorway
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, front ? "glass" : "light_blue_stained_glass");
  }
  // Shop sign band / lintel.
  if (entrance) put(x, gr + 4, z, "smooth_stone");
  else put(x, gr + 4, z, pillar ? "white_concrete" : "black_concrete");

  // Upper storey: glass band with white spandrels.
  for (let y = gr + 6; y <= gr + 9; y++) {
    const spandrel = y === gr + 6 || y === gr + 9;
    if (pillar || spandrel) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass");
  }
}

// Warm lights behind the glass, on the first interior row.
for (const [x, z, gr] of cells) {
  if (exterior(x, z)) continue;
  if ((z === 1 || z === D - 2) && x % 12 === 3) put(x, gr + 2, z, "glowstone");
  if ((z === 1 || z === D - 2) && x % 12 === 9) put(x, gr + 7, z, "shroomlight");
}

// Entrance lanterns under each canopy lintel.
for (const [x, z, gr] of cells) {
  if (exterior(x, z) && (z === 0 || z === D - 1) && x === 74) {
    const inz = z === 0 ? 1 : D - 2;
    put(x, gr + 3, inz, "lantern", { hanging: "true" });
  }
}

// Roof plant: a few grouped rooftop equipment blocks.
const plant = [[24, 34, 8, 17], [112, 124, 8, 17], [64, 70, 9, 16]];
for (const [x0, x1, z0, z1] of plant) {
  for (const [x, z, gr] of cells) {
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    if (exterior(x, z)) continue;
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
