import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833889";
const W = 37, H = 28, D = 15;

// Record: no record. Read as a three-storey, early-1990s Taipei mid-rise commercial block:
// stone-bricks plinth, white concrete piers, quartz storey bands, blue-glass curtain
// windows, a shopfront ground floor with doors and lintels, and a plain parapet with
// rooftop cooling units. Roof sits 16 blocks above the lowest ground (3 storeys x 5 + 1).

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const grounds = new Map();
for (const [x, z, gr] of cells) grounds.set(key(x, z), gr);
const minG = Math.min(...cells.map((c) => c[2]));
const ROOF = minG + 16;

const has = (x, z) => grounds.has(key(x, z));

// Outward facing of a footprint cell (null if interior).
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x + 1, z)) return "east";
  if (!has(x - 1, z)) return "west";
  return null;
}

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const out = outward(x, z);
  const start = Math.max(gr, minG);

  for (let y = start; y <= ROOF; y++) {
    const rel = y - minG;

    if (!out) {
      // Interior: floor slabs per storey and the roof slab; air elsewhere.
      if (rel === 0 || rel === 5 || rel === 10 || rel === 15) {
        put(x, y, z, "smooth_stone");
      } else if (rel === 16 && x % 6 === 2 && z % 5 === 2) {
        // Rooftop cooling units standing on the roof slab.
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    // Exterior shell.
    if (rel === 16) {
      // Parapet cap.
      if ((x + z) % 2 === 0) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (rel === 15) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (rel === 0 || rel === 4 || rel === 5 || rel === 9 || rel === 10 || rel === 14) {
      // Base course, storey sills and heads.
      put(x, y, z, "smooth_quartz");
      continue;
    }

    const storey = Math.floor(rel / 5);      // 0, 1, 2
    const within = rel - storey * 5;         // 1..3 inside a window band
    const pier = (x + z) % 3 === 0 || x === 0 || x === W - 1 || z === 0 || z === D - 1 && false;

    if (storey === 0) {
      // Shopfront ground floor.
      const doorHere = out && within === 1 && x % 8 === 4 && (out === "north" || out === "south");
      const doorHereEW = out && within === 1 && z % 6 === 3 && (out === "east" || out === "west");
      if (doorHere || doorHereEW) {
        const facing = out;
        put(x, y, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, y + 1, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (within === 2 && (doorDirectlyAbove(x, z, out))) {
        // Door is lower half at within 1; this cell is its upper half.
        continue;
      }
      if (within === 3 && doorBelow(x, z, out)) {
        // Canopy lintel over the entrance.
        put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      continue;
    }

    // Upper storeys: curtain-wall windows with white concrete piers.
    if (pier) {
      put(x, y, z, "white_concrete");
    } else if (((x * 7 + z * 3 + rel) % 11) === 0) {
      // A warm lit window.
      put(x, y, z, "glowstone");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
    }
  }
}

// Helpers used for the shopfront door tests (door sits at within 1 on the same cell
// rule as above; these mirror it so the upper half and lintel line up).
function doorCellRule(x, z, out) {
  if (!out) return false;
  if (out === "north" || out === "south") return x % 8 === 4;
  return z % 6 === 3;
}
function doorDirectlyAbove(x, z, out) { return doorCellRule(x, z, out); }
function doorBelow(x, z, out) { return doorCellRule(x, z, out); }

g.save(`${DIR}/${ID}.nbt`);
