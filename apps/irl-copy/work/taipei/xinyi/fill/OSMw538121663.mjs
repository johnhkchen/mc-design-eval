import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538121663.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538121663.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 9, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground (absolute grid y of the cell's ground)
const ground = new Map();
let minG = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
if (!Number.isFinite(minG)) minG = 0;
const inside = (x, z) => ground.has(`${x},${z}`);

// Storey plan, relative to the lowest ground (minG):
//  rel 0      plinth course
//  rel 1..3   ground-floor shopfront glass (doors at street side)
//  rel 4      shopfront lintel band
//  rel 5      storey line / floor slab
//  rel 6..8   upper windows
//  rel 9      sill band
//  rel 10     roof slab / roof edge band
//  rel 11     parapet cap (top of building, ~11 blocks above lowest ground)
const TOP = minG + 11;
const yMax = Math.min(TOP, H - 1);

// Choose the door: street-facing (south, high z) exposed cell nearest the centre
const midX = (minX + maxX) / 2;
let doorKey = null, bestD = Infinity;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!inside(x, z + 1) && (inside(x - 1, z) || inside(x + 1, z) || true)) {
    const exposedCount = [!inside(x - 1, z), !inside(x + 1, z), !inside(x, z - 1), true].filter(Boolean).length;
    if (exposedCount === 1) {
      const d = Math.abs(x - midX);
      if (d < bestD) { bestD = d; doorKey = `${x},${z}`; }
    }
  }
}

// Foundation and walls
for (const [x, z, gr] of cells) {
  const gg = gr;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < Math.min(gg, H); y++) g.set(x, y, z, "stone_bricks");

  const exW = !inside(x - 1, z), exE = !inside(x + 1, z);
  const exN = !inside(x, z - 1), exS = !inside(x, z + 1);
  const exCount = [exW, exE, exN, exS].filter(Boolean).length;
  const perim = exCount > 0;
  const corner = exCount >= 2;
  const onXFace = exW || exE; // wall runs along z
  const idx = onXFace ? z - minZ : x - minX;
  const isDoorCell = doorKey === `${x},${z}`;

  for (let y = gg; y <= yMax; y++) {
    const rel = y - minG;

    if (!perim) {
      // Interior: air, with floor slabs at storey lines and roof slab
      if (y > gg && (rel === 5 || rel === 10)) g.set(x, y, z, "smooth_stone");
      if (rel === 11 && x >= 3 && x <= 5 && z >= minZ + 6 && z <= minZ + 12) {
        // roof plant box, one course on the roof slab
        g.set(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    // Perimeter facade (the footprint cell itself is the wall)
    if (rel === 11) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (rel === 10 || rel === 5 || rel === 9 || rel === 4) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    if (rel === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Door at the street entrance
    if (isDoorCell && (y === gg || y === gg + 1) && rel >= 1 && rel <= 3) {
      g.set(x, y, z, "oak_door", {
        facing: "south",
        half: y === gg ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    const isWindowSlot = !corner && (idx % 2 === 1);
    if (corner || !isWindowSlot) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Glass pane orientation follows the wall it sits in
    const paneProps = onXFace
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

    if (rel >= 1 && rel <= 3) {
      // Shopfront glass; a warm display light in every fourth bay
      if (rel === 2 && idx % 4 === 1) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, "glass_pane", paneProps);
    } else if (rel >= 6 && rel <= 8) {
      // Upper windows; shroomlight behind glass in some bays
      if (rel === 7 && idx % 4 === 3) g.set(x, y, z, "shroomlight");
      else g.set(x, y, z, "glass_pane", paneProps);
    }
  }

  // Roof slab over the whole footprint at storey-top level
  if (TOP - minG >= 10 && 10 + minG <= yMax && 10 + minG > gg) {
    g.set(x, minG + 10, z, perim ? "white_concrete" : "smooth_stone");
  }
}

g.save(OUT);
