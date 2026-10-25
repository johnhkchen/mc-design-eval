import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499490";
const W = 30, H = 28, D = 59;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { gr, rf });
const has = (x, z) => map.has(`${x},${z}`);

// Palette: granite-grey stone, lighter pilasters, dark slate roof
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "stone";
const PILLAR = "stone_bricks";
const FLOOR = "smooth_stone";
const SPANDREL = "polished_andesite";
const GLASS = "glass_pane";
const SHOP = "glass";
const ROOF = "deepslate_tiles";
const CORNICE = "stone_brick_slab";
const PARAPET = "stone_brick_wall";
const EQUIP = "chiseled_stone_bricks";
const LIGHT = "glowstone";

// One roof line for the whole block: three 5-block storeys, roof at ~16 above lowest ground
const ROOF_Y = 15;
const topOf = (gr) => Math.max(gr + 5, ROOF_Y);
const nextFloor = (gr) => (Math.floor(gr / 5) + 1) * 5;

// Lowest-z (street) row, computed from the cell list
let minZ = Infinity;
for (const [, z] of cells) if (z < minZ) minZ = z;

// Main massing
for (const [x, z, gr] of cells) {
  const T = topOf(gr);
  const perim = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  const idx = x + z;

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Ground surface / plinth course
  g.set(x, gr, z, perim ? BASE : FLOOR);

  for (let y = gr + 1; y < T; y++) {
    if (!perim) {
      // Interior: floor slabs only, air elsewhere (no interiors)
      if (y % 5 === 0) g.set(x, y, z, FLOOR);
      continue;
    }

    if (y % 5 === 0) {
      // Storey line: projecting floor band
      g.set(x, y, z, SPANDREL);
    } else if (y < nextFloor(gr)) {
      // Commercial ground storey: shopfront glazing with stone piers
      g.set(x, y, z, idx % 3 === 0 ? PILLAR : SHOP);
    } else if (y % 5 === 1 || y % 5 === 4) {
      // Spandrel / lintel band
      g.set(x, y, z, SPANDREL);
    } else {
      // Window zone (rows 2 and 3 of each storey)
      if (idx % 3 === 0) {
        g.set(x, y, z, PILLAR);
      } else if (y % 5 === 2 && (idx + y) % 13 === 0) {
        g.set(x, y, z, LIGHT); // warm light behind the glass
      } else {
        g.set(x, y, z, GLASS);
      }
    }
  }

  // Cornice course on the perimeter, slate roof cap elsewhere
  if (perim) {
    g.set(x, T, z, PILLAR);
    g.set(x, T + 1, z, CORNICE, { type: "bottom", waterlogged: "false" });
    if (x % 2 === 0) g.set(x, T + 2, z, PARAPET);
  } else {
    g.set(x, T, z, ROOF);
    if (x % 7 === 3 && z % 9 === 4 && T + 1 <= 25) g.set(x, T + 1, z, EQUIP);
  }
}

// Entrance on the street face, centred on that row
{
  const row = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
  const xd = row[Math.floor(row.length / 2)];
  const { gr } = map.get(`${xd},${minZ}`);
  // Stone surround for the door
  for (const dx of [-1, 1]) {
    if (has(xd + dx, minZ)) g.set(xd + dx, gr + 1, minZ, PILLAR), g.set(xd + dx, gr + 2, minZ, PILLAR), g.set(xd + dx, gr + 3, minZ, PILLAR);
  }
  // Door
  g.set(xd, gr + 1, minZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(xd, gr + 2, minZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy lintel over the entrance
  g.set(xd, gr + 3, minZ, CORNICE, { type: "top", waterlogged: "false" });
  for (const dx of [-1, 1]) {
    if (has(xd + dx, minZ)) g.set(xd + dx, gr + 3, minZ, CORNICE, { type: "top", waterlogged: "false" });
  }
  // Lanterns flanking the door
  for (const dx of [-2, 2]) {
    if (has(xd + dx, minZ)) g.set(xd + dx, gr + 2, minZ, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
console.log(`built ${ID}: ${cells.length} footprint cells, ${W}x${H}x${D}`);
