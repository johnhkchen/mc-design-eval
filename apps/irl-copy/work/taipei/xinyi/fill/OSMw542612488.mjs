import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612488";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 6, H = 23, D = 4;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const occ = new Map();
for (const [x, z, gy] of cells) occ.set(`${x},${z}`, gy);
const has = (x, z) => occ.has(`${x},${z}`);

// Lowest ground under the footprint; storeys are banded from here.
const base = Math.min(...cells.map((c) => c[2]));

// Exterior cell = any side without a neighbour in the footprint.
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Front = high z (south face). Entrance sits on the middle-left bay.
const DOOR_X = 2, DOOR_Z = D - 1;

// Warm lights in some upper-floor bays only.
const isWarm = (x, z) => (x * 2 + z) % 3 === 0;

// Wall material for an exterior cell at absolute y.
function wallBlock(x, z, y) {
  const rel = y - base;
  if (isCorner(x, z)) return "smooth_quartz";          // full-height corner piers
  if (rel === 0) return "smooth_stone";                // base course
  if (rel <= 4) {                                      // ground floor shopfront
    if (rel === 4) return "light_gray_concrete";       // transom
    return "glass";
  }
  if (rel === 5) return "smooth_quartz";               // storey line
  if (rel >= 6 && rel <= 9) {                          // upper floor windows
    if ((x + z) % 2 === 0) {                           // window bay
      if (rel === 6 || rel === 9) return "light_gray_concrete"; // sill / head
      if (isWarm(x, z)) return "glowstone";            // lit window
      return "light_blue_stained_glass";
    }
    return "white_concrete";                           // mullion / wall
  }
  if (rel === 10) return "smooth_quartz";              // cornice / parapet
  return "white_concrete";
}

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // Foundation from y 0 up to this cell's ground, so nothing floats.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Walls from ground up to the parapet course.
  for (let y = gr; y <= base + 10; y++) {
    if (!edge) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, wallBlock(x, z, y));
    }
  }

  // Roof slab cap, 11 blocks above the lowest ground, covering every cell.
  g.set(x, base + 11, z, "light_gray_concrete");
}

// Entrance door on the street front, set into the shopfront.
if (has(DOOR_X, DOOR_Z) && isEdge(DOOR_X, DOOR_Z)) {
  g.set(DOOR_X, base + 1, DOOR_Z, "dark_oak_door",
    { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(DOOR_X, base + 2, DOOR_Z, "dark_oak_door",
    { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy lintel over the door, reads as a small entrance canopy.
  g.set(DOOR_X, base + 4, DOOR_Z, "light_gray_concrete");
  g.set(DOOR_X - 1, base + 4, DOOR_Z, "light_gray_concrete");
  g.set(DOOR_X + 1, base + 4, DOOR_Z, "light_gray_concrete");
}

// Rooftop cooling unit on interior roof cells, standing on the roof slab.
for (let x = 2; x <= 3; x++) {
  for (let z = 1; z <= 2; z++) {
    if (has(x, z) && !isEdge(x, z)) {
      g.set(x, base + 12, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
