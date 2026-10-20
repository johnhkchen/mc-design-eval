import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538752108: no record. 14 x 10 footprint, roof about 11 blocks above the lowest ground.
// Read as a two-storey, early-1970s Taipei commercial block: white-tiled concrete frame,
// stone-clad plinth, a glazed shopfront on the street (north) face, a pale band at each
// storey line and a plain parapet. Warm lights sit behind some upper windows.

const W = 14, D = 10, H = 23;
const ROOF_TOP = 11;      // parapet block; roof slab at y = 10
const STOREY_LINE = 5;    // floor slab / band between the two storeys
const ROOF_SLAB = 10;

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538752108.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538752108.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundations, interior floor/roof slabs, roof slab over every cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (!isEdge(x, z)) {
    if (STOREY_LINE >= gr) put(x, STOREY_LINE, z, "smooth_stone");
  }
  if (ROOF_SLAB >= gr) put(x, ROOF_SLAB, z, "smooth_stone");
}

// Pass 2: facade on perimeter cells, from each cell's own ground up to the parapet.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;

  const N = !has(x, z - 1), S = !has(x, z + 1), Wm = !has(x - 1, z), E = !has(x + 1, z);
  const onNS = N || S;
  // Position along the face that this cell belongs to.
  const t = onNS ? x : z;
  const faceLen = onNS ? W - 1 : D - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const pillar = corner || t % 3 === 0 || t === faceLen;

  // Inward direction, used for the warm lights behind the glass.
  let ix = 0, iz = 0;
  if (N) iz = 1; else if (S) iz = -1; else if (Wm) ix = 1; else if (E) ix = -1;

  for (let y = gr; y <= ROOF_TOP; y++) {
    if (y === ROOF_TOP) { put(x, y, z, "smooth_stone"); continue; }

    // Street-front entrance: centred door on the north face, storey one.
    if (N && x === 6 && gr + 1 <= 4 && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }          // plinth course
    if (y === STOREY_LINE || y === ROOF_SLAB) { put(x, y, z, "light_gray_concrete"); continue; }

    const window = (y >= 1 && y <= 3) || (y >= 7 && y <= 8);
    if (window && !pillar) {
      put(x, y, z, "glass");
      // Warm light behind some upper and lower windows (interior cell, standing on a floor).
      const ii = x + ix, jj = z + iz;
      const inward = has(ii, jj) && !isEdge(ii, jj);
      if (inward) {
        if (y === 7 && t % 6 === 4) put(ii, 6, jj, "glowstone");
        if (y === 2 && t % 6 === 1 && gr <= 1) put(ii, 1, jj, "shroomlight");
      }
      continue;
    }

    put(x, y, z, "white_concrete");   // pillars, sills, lintels and solid spandrels
  }
}

// Pass 3: roof plant, a small concrete housing on the roof slab.
for (let x = 3; x <= 4; x++) {
  for (let z = 3; z <= 4; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    for (let y = ROOF_TOP; y <= ROOF_TOP + 1; y++) put(x, y, z, "light_gray_concrete");
  }
}

g.save(OUT);
