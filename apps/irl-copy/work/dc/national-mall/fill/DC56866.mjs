import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC56866: four-storey red-brick commercial block, c.1900-1920 Washington.
// Stone base and storey bands, brick piers, glass bays, a central entrance on the
// south face, a stone cornice, one flat roof deck and a setback penthouse.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56866.cells.json", "utf8"));

const W = 7, H = 28, D = 8;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const c of cells) map.set(`${c[0]},${c[1]}`, c);
const has = (x, z) => map.has(`${x},${z}`);

// Smoothed roof: one flat tier at the recorded ~16 blocks above lowest ground.
const ROOF_Y = 16;
const PH_TOP = 20; // penthouse cap level

function paneProps(faceZ) {
  return faceZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

for (const [x, z, groundRaw] of cells) {
  const gr = Math.max(0, Math.round(groundRaw));
  const roofY = Math.max(gr + 4, ROOF_Y);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  const isEdge = missX || missZ;
  const isCorner = missX && missZ;
  const faceZ = !has(x, z - 1) || !has(x, z + 1); // wall runs along x
  const along = faceZ ? x : z;

  // Inward neighbour (warm light behind glass)
  let inX = x, inZ = z;
  if (faceZ) inZ = z + (!has(x, z - 1) ? 1 : -1);
  else inX = x + (!has(x - 1, z) ? 1 : -1);
  const inwardInterior = has(inX, inZ) && !(
    !has(inX - 1, inZ) || !has(inX + 1, inZ) || !has(inX, inZ - 1) || !has(inX, inZ + 1)
  );

  const doorCol = faceZ && !has(x, z + 1) && x === 3 && z === 7;

  for (let y = gr; y < roofY; y++) {
    const rel = y - gr;
    if (isEdge) {
      if (rel % 4 === 0) {
        g.set(x, y, z, "stone_bricks"); // storey band / base course
      } else if (isCorner) {
        g.set(x, y, z, "stone_bricks"); // stone quoins at corners
      } else if (doorCol && rel >= 1 && rel <= 2) {
        g.set(x, y, z, "oak_door", {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (doorCol && rel === 3) {
        g.set(x, y, z, "stone_bricks"); // lintel over entrance
      } else if ((rel === 1 || rel === 2) && along % 2 === 1) {
        const lit = (along + rel + roofY) % 3 === 0;
        g.set(x, y, z, "glass_pane", paneProps(faceZ));
        if (lit && inwardInterior) g.set(inX, y, inZ, "glowstone");
      } else {
        g.set(x, y, z, "bricks"); // piers and spandrels
      }
    } else {
      // Interior: air gap behind the glass, floor slab at each storey line
      if (rel % 4 === 0) g.set(x, y, z, "smooth_stone");
    }
  }

  // Roof deck over every footprint cell
  g.set(x, roofY, z, "stone_bricks");

  // Cornice on the perimeter, standing on the deck
  if (isEdge && roofY + 1 < H) {
    g.set(x, roofY + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Setback penthouse on the inner roof, set back from the facade
  const inPH = !isEdge && x >= 2 && x <= 4 && z >= 2 && z <= 5;
  if (inPH) {
    for (let y = roofY + 1; y < PH_TOP; y++) {
      const rel = y - (roofY + 1);
      const ring = x === 2 || x === 4 || z === 2 || z === 5;
      if (rel === 0 || rel === 2) g.set(x, y, z, "stone_bricks");
      else if (ring) g.set(x, y, z, "glass_pane", paneProps(x === 2 || x === 4));
      else g.set(x, y, z, "air");
    }
    g.set(x, PH_TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56866.nbt");
