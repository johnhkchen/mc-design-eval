import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1068807549.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1068807549.nbt";

const W = 27, H = 23, D = 14;
const ROOF = 10;     // roof slab level; parapet sits at ROOF + 1 = 11
const STOREY = 5;    // storey line (floor slab) at absolute y=5

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const fp = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  fp.set(x + "," + z, Math.max(0, Math.min(8, Math.round(gr ?? 0))));
}
const inFp = (x, z) => fp.has(x + "," + z);
const gAt = (x, z) => fp.get(x + "," + z);

const g = new Voxels([W, H, D]);

// Pass 1: foundations, floor slabs, storey lines, roof slab, interior air
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  const perim = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

  // foundation fill from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // ground floor slab (base course on the perimeter)
  g.set(x, gr, z, perim ? "polished_granite" : "smooth_stone");

  // storey line
  if (gr < STOREY) {
    g.set(x, STOREY, z, perim ? "light_gray_concrete" : "smooth_stone");
  }

  // roof slab, cornice on the perimeter
  if (ROOF > gr) {
    g.set(x, ROOF, z, perim ? "quartz_block" : "smooth_stone");
  }

  // parapet on the perimeter
  if (perim) g.set(x, ROOF + 1, z, "white_concrete");
}

// Pass 2: facade on the perimeter (glass grid with pillars, shopfront, entrance)
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  const perim = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
  if (!perim) continue;

  const zEdge = !inFp(x, z - 1) || !inFp(x, z + 1); // wall runs along x
  const idx = zEdge ? x : z;
  const pillar = idx % 3 === 0;
  const front = z === 0 && x >= 12 && x <= 14;

  const bands = [];
  for (let y = gr + 1; y <= 9; y++) {
    if (y === STOREY) continue; // storey string course already placed
    bands.push(y);
  }

  for (const y of bands) {
    if (y >= ROOF) continue;
    if (front && y <= gr + 2) {
      g.set(x, y, z, "air"); // open entrance
      continue;
    }
    if (front && y === gr + 3) {
      g.set(x, y, z, "light_gray_concrete"); // lintel over entrance
      continue;
    }
    if (pillar) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane");
    }
  }

  // sign band / lantern over the entrance
  if (front) g.set(x, Math.min(gr + 4, 4), z, "lantern");
}

// Pass 3: warm lights behind the glass, rooftop equipment
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  const perim = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
  if (perim) continue;

  // glowstone just inside the front glass, on a floor slab
  if (z === 1 && x % 6 === 4) {
    if (gr + 1 <= 4) g.set(x, gr + 1, z, "glowstone");
    if (gr + 1 < 5 && STOREY + 1 <= 9 && gr < STOREY) g.set(x, STOREY + 1, z, "glowstone");
  }

  // rooftop plant on the roof slab
  if (x % 6 === 3 && z >= 5 && z <= 8) {
    g.set(x, ROOF + 1, z, "iron_block");
  }
}

// central mast on the roof
const mastCell = fp.has("13,7") ? [13, 7] : null;
if (mastCell) {
  g.set(13, ROOF + 1, 7, "iron_block");
  g.set(13, ROOF + 2, 7, "lightning_rod");
}

g.save(OUT);
