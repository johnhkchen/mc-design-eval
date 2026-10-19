// 534 Madison Avenue, an 1870 mixed residential and commercial building: a five-storey brick Italianate loft on a
// stone plinth, with a dark-oak shopfront on the Madison end (x 14, the 7-block frontage), stone string courses at
// each floor line, a stone cornice and parapet, and a flat roof with a spruce water tank and a brick chimney.
// Footprint 15 x 7 (x across, low z = north). The walls are two blocks thick: each window is a hole in the outer layer
// with the glass one block back, and the interior is air with a floor slab per storey (no interiors). Each cell's
// foundation fills from y 0 up to its ground; the body starts at that ground and stops at one flat cornice (17) rather
// than following the lidar's 16-18 cell by cell. Glowstone and shroomlight sit behind some panes; lanterns in the shop.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035764.cells.json`, "utf8"));
const X = 15, Y = 30, Z = 7;
const TOP = 17;                                                    // the cornice course; the parapet sits on it at 18

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => ground.has(`${x},${z}`);
const ring = (x, z) => x <= 1 || x >= 13 || z <= 1 || z >= 5;      // the two-block wall
const outerRing = (x, z) => inFoot(x, z) && (z === 0 || z === 6 || x === 0 || x === 14);

// Storey lines: solid bands at these rows (the floor slab inside), windows in the rows between them.
const BAND = { 4: "dark_oak_planks", 5: "smooth_stone", 8: "smooth_stone", 11: "smooth_stone", 14: "smooth_stone" };
const WIN_ROW = (y) => (y >= 1 && y <= 3) || (y >= 6 && y <= 7) || (y >= 9 && y <= 10) || (y >= 12 && y <= 13) || (y >= 15 && y <= 16);
const WIN_X = [3, 5, 7, 9, 11];        // north and south fronts: 1-wide windows between 1-wide piers
const WIN_Z = [2, 4];                  // east (Madison) and west ends: windows either side of the pier at z 3

// What a wall cell in a window row is: "hole" (air in the outer layer), "glass", "door", "dark" (solid dark oak), or null.
function opening(x, y, z) {
  if (!WIN_ROW(y)) return null;
  if (x >= 13 && z === 3 && y <= 3) {                              // the Madison entrance and transom
    if (x === 14) return y <= 2 ? "hole" : "dark";
    return y <= 2 ? "door" : "glass";
  }
  if (x >= 13 && WIN_Z.includes(z)) return x === 14 ? "hole" : "glass";
  if (x <= 1 && WIN_Z.includes(z)) return x === 0 ? "hole" : "glass";
  if (WIN_X.includes(x) && (z === 0 || z === 6)) return "hole";
  if (WIN_X.includes(x) && (z === 1 || z === 5)) return "glass";
  return null;
}

const paneState = (x) => (WIN_X.includes(x)
  ? { east: "true", north: "false", south: "false", west: "true", waterlogged: "false" }
  : { east: "false", north: "true", south: "true", west: "false", waterlogged: "false" });

const doorState = (y) => ({ facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });

function parapetState(x, z) {
  const c = (dx, dz) => (outerRing(x + dx, z + dz) ? "low" : "none");
  return { east: c(1, 0), north: c(0, -1), south: c(0, 1), west: c(-1, 0), up: "true", waterlogged: "false" };
}

// The block a footprint cell holds at height y (null = air), once y is at or above that cell's ground.
function body(x, y, z) {
  if (y === 0) return { block: "stone_bricks" };                     // plinth; the ground-floor slab inside
  if (y === TOP) return { block: ring(x, z) ? "stone_bricks" : "stone" };   // cornice ring; flat roof inside
  if (y === 18) return outerRing(x, z) ? { block: "stone_brick_wall", state: parapetState(x, z) } : null;
  if (!ring(x, z)) return BAND[y] ? { block: "oak_planks" } : null; // interior: floor slabs only
  if (BAND[y]) return { block: BAND[y] };
  const op = opening(x, y, z);
  if (op === "hole") return null;
  if (op === "glass") return { block: "glass_pane", state: paneState(x) };
  if (op === "door") return { block: "dark_oak_door", state: doorState(y) };
  if (op === "dark") return { block: "dark_oak_planks" };
  const corner = (x === 0 || x === 14) && (z === 0 || z === 6);
  if (corner) return y % 2 === 0 ? { block: "smooth_stone" } : { block: "bricks" };   // quoins
  return { block: "bricks" };
}

const g = new Voxels([X, Y, Z]);
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= 18; y++) {
    const b = y < gr ? { block: "stone_bricks" } : body(x, y, z);
    if (b) g.set(x, y, z, b.block, b.state);
  }
}

// Roof kit: a water tank on the flat roof, and a brick chimney with a cap.
for (let x = 5; x <= 7; x++) for (let z = 2; z <= 4; z++) {
  g.set(x, 18, z, "spruce_planks");
  g.set(x, 19, z, "spruce_planks");
  g.set(x, 20, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}
for (let y = 18; y <= 20; y++) g.set(11, y, 2, "bricks");
g.set(11, 21, 2, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// Warm light: glowstone and shroomlight just inside some panes, and two lanterns in the shop.
g.set(5, 6, 2, "glowstone");
g.set(9, 12, 2, "glowstone");
g.set(7, 9, 4, "glowstone");
g.set(2, 15, 2, "shroomlight");
g.set(12, 9, 4, "shroomlight");
g.set(12, 1, 2, "lantern", { hanging: "false", waterlogged: "false" });
g.set(12, 1, 4, "lantern", { hanging: "false", waterlogged: "false" });

const out = g.save(`${DIR}/NYC1035764.nbt`);
console.log(`NYC1035764.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
