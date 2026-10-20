import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610207";
const W = 19, H = 23, D = 12;

// Record-driven massing: two storeys of about 5 blocks, flat roof with parapet,
// roof edge at y 11 above the lowest ground (y 0). Late-20th-century Xinyi
// commercial low-rise: white concrete piers, glass bays, stone cornice.
const FLOOR2 = 5;        // first floor slab (top of ground storey)
const ROOF_SLAB = 10;    // roof deck / cornice line
const PARAPET = 11;      // parapet top, sits on cornice

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFP = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !inFP(x + 1, z) || !inFP(x - 1, z) || !inFP(x, z + 1) || !inFP(x, z - 1);
const zEdge = (x, z) => !inFP(x, z + 1) || !inFP(x, z - 1);
const xEdge = (x, z) => !inFP(x + 1, z) || !inFP(x - 1, z);

const g = new Voxels([W, H, D]);

// Front faces the street on z = 0.
const FRONT_Z = 0;
const DOOR_X = 9;

for (const [x, z, grRaw] of cells) {
  // Each cell's own ground, kept under the body and clamped so storeys fit.
  const base = Math.max(0, Math.min(8, Math.round(grRaw)));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  // Base course / ground slab at the cell's ground.
  g.set(x, base, z, "smooth_stone");

  // First-floor slab across the footprint (air gap above ground storey).
  if (FLOOR2 > base) g.set(x, FLOOR2, z, "smooth_stone");

  // Roof deck across the footprint.
  g.set(x, ROOF_SLAB, z, edge(x, z) ? "smooth_stone" : "gray_concrete");

  // Perimeter: walls, bays, piers, cornice and parapet.
  if (edge(x, z)) {
    // Pier positions: corners always piers, otherwise every third cell on the face.
    const pierOnZFace = zEdge(x, z) ? (x % 3 === 0) : false;
    const pierOnXFace = xEdge(x, z) ? (z % 3 === 0) : false;
    const pier = (zEdge(x, z) && xEdge(x, z)) || pierOnZFace || pierOnXFace;

    // Ground storey: shopfront glass with concrete piers.
    for (let y = base + 1; y < FLOOR2; y++) {
      if (z === FRONT_Z && x >= DOOR_X - 1 && x <= DOOR_X + 1 && inFP(x, z)) {
        if (x === DOOR_X) {
          if (y === base + 1) {
            g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (y === base + 2) {
            g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            g.set(x, y, z, "glass");
          }
        } else {
          g.set(x, y, z, y === base + 1 ? "glass" : "glass");
        }
      } else {
        g.set(x, y, z, pier ? "light_gray_concrete" : "glass");
      }
    }

    // Upper storey: window bands between piers.
    for (let y = FLOOR2 + 1; y < ROOF_SLAB; y++) {
      g.set(x, y, z, pier ? "white_concrete" : "glass");
    }

    // Parapet on the cornice.
    g.set(x, PARAPET, z, "white_concrete");

    // Entrance canopy over the door, supported by the front wall.
    if (z === FRONT_Z && x >= DOOR_X - 1 && x <= DOOR_X + 1) {
      g.set(x, base + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Warm lights behind the glass: glowstone in the first floor, lanterns at the
// ground storey, placed on interior cells just behind the front bays.
for (const [x, z, grRaw] of cells) {
  const base = Math.max(0, Math.min(8, Math.round(grRaw)));
  if (z === FRONT_Z + 1 && x % 3 === 1 && inFP(x, z)) {
    if (FLOOR2 - 1 > base + 1 && !edge(x, z)) g.set(x, FLOOR2 - 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (z === ROOF_SLAB - 3 && x % 4 === 2 && inFP(x, z) && !edge(x, z)) {
    g.set(x, FLOOR2 + 2, z, "glowstone");
  }
}

// Roof equipment: a central plant block with a parapet-height housing.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (x >= 6 && x <= 11 && z >= 4 && z <= 7 && inFP(x, z) && !edge(x, z)) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    if (x >= 7 && x <= 10 && z >= 5 && z <= 6) {
      g.set(x, PARAPET + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
