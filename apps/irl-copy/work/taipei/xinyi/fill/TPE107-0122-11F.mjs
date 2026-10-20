import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE107-0122-11F: built 2018, 32 x 30 footprint, roof about 11 blocks above the lowest ground.
// Two-storey Xinyi commercial block: granite and stone shopfront, blue glass windows in a
// white-concrete grid, spandrel panels between floors, a cornice and parapet, a framed
// entrance, and a rooftop plant room with a planter.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE107-0122-11F";
const W = 32, H = 23, D = 30;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}

const has = (x, z) => ground.has(`${x},${z}`);
const TOP = 11;   // roof slab level (absolute y)
const BELT = 5;   // storey line / belt course (absolute y)
const CORN = 10;  // cornice course under the parapet

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function isEdge(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}

function isCorner(x, z) {
  return (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
}

// Mullion grid on a 4-block module, plus solid corners.
function isMullion(x, z) {
  return isCorner(x, z) || x % 4 === 0 || z % 4 === 0;
}

// Wide framed entrance on the z = 0 face, centred on the frontage.
function isEntranceBay(x, z, gg) {
  return z === 0 && x >= 13 && x <= 18 && gg <= 2 && has(x, z);
}
function isEntranceOpening(x, z, gg) {
  return isEntranceBay(x, z, gg) && x >= 14 && x <= 17;
}

// Deterministic sparse warm lights behind some upper windows.
function isWarm(x, y, z) {
  return ((x * 7 + z * 13 + y * 3) % 11) === 0;
}

// Pass 1: foundations, walls, storeys, cornice, parapet and roof for every footprint cell.
for (const [key, gg] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gg; y++) set(x, y, z, "stone_bricks");

  // Roof stands on whatever is below; if ground is already at roof level, just cap it.
  if (gg >= TOP) {
    set(x, gg, z, "gray_concrete");
    continue;
  }

  for (let y = gg; y < TOP; y++) {
    if (!edge) {
      // Interior: no fit-out, just floor slabs.
      if (y === gg) set(x, y, z, "light_gray_concrete");
      else if (y === BELT && BELT > gg) set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade cells.
    if (y === gg) {
      set(x, y, z, "polished_granite");        // base course
      continue;
    }
    if (y === BELT && BELT > gg) {
      set(x, y, z, "white_concrete");           // belt course / storey line
      continue;
    }
    if (y === CORN && CORN > gg) {
      set(x, y, z, "smooth_quartz");            // cornice course
      continue;
    }

    if (y < BELT) {
      // Ground storey: shopfront or entrance.
      if (isEntranceBay(x, z, gg)) {
        if (isEntranceOpening(x, z, gg)) {
          if (y <= 3) {
            if (y === 1 || y === 2 || y === 3) set(x, y, z, "glass"); // glass doors
            continue;
          }
          set(x, y, z, "white_concrete");       // lintel
          continue;
        }
        // Flanking jambs of the entrance surround.
        if (y <= 3) set(x, y, z, "polished_andesite");
        else set(x, y, z, "white_concrete");
        continue;
      }
      if (isMullion(x, z)) set(x, y, z, "polished_andesite");
      else set(x, y, z, "glass");
    } else {
      // Upper storey: blue glass in a white-concrete grid, spandrel panels at the sill and head.
      if (isMullion(x, z)) {
        set(x, y, z, "white_concrete");
      } else if (y === BELT + 1 || y === CORN - 1) {
        set(x, y, z, "light_gray_concrete");   // spandrel panels between floors
      } else if (y === 8 && isWarm(x, y, z)) {
        set(x, y, z, "glowstone");             // warm light behind the glass
      } else {
        set(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Roof level: white parapet on the perimeter, grey roof slab inside.
  if (edge) set(x, TOP, z, "white_concrete");
  else set(x, TOP, z, "gray_concrete");
}

// Pass 2: rooftop plant room and planter, on interior cells that have a roof.
for (const [key, gg] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gg >= TOP) continue;
  if (isEdge(x, z)) continue;
  if (x >= 10 && x <= 21 && z >= 10 && z <= 19) {
    set(x, TOP + 1, z, "light_gray_concrete");
    set(x, TOP + 2, z, "light_gray_concrete");
  }
  // Planter: moss on a few interior roof cells, a green roof terrace.
  if (x >= 2 && x <= 5 && z >= 2 && z <= 5) {
    set(x, TOP + 1, z, "moss_block");
  }
}

// Lightning rod on top of the plant room.
if (has(16, 15) && !isEdge(16, 15) && 16 >= 10 && 16 <= 21 && 15 >= 10 && 15 <= 19) {
  set(16, TOP + 3, 15, "lightning_rod");
}

// Hanging lanterns under the entrance lintel.
for (const lx of [14, 17]) {
  if (has(lx, 0) && isEdge(lx, 0) && (ground.get(`${lx},0`) ?? 99) <= 2) {
    set(lx, 3, 0, "lantern", { hanging: "true" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
