import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE102-0115-31F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 78 x 63, roof ~11 blocks above lowest ground: a 2-storey commercial block
// of the 2013 Xinyi type (pale concrete frame, tinted glass, granite base, stone foundation).
const W = 78, H = 23, D = 63;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));

const minG = Math.min(...cells.map(c => Math.round(c[2])));
const ROOF = minG + 11;
const isIn = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) =>
  !isIn(x + 1, z) || !isIn(x - 1, z) || !isIn(x, z + 1) || !isIn(x, z - 1);
// Convex corner: missing neighbour on both an x-side and a z-side.
const isCorner = (x, z) =>
  (!isIn(x + 1, z) || !isIn(x - 1, z)) && (!isIn(x, z + 1) || !isIn(x, z - 1));

// Main entrance: centre of the lowest-z (north) face.
const minZ = Math.min(...cells.map(c => c[1]));
const northXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = northXs[Math.floor(northXs.length / 2)];

function perimBlock(x, z, r, h) {
  if (r === 0) return ["polished_granite"];
  if (r === 5 || r === h - 1 || r === h) return ["white_concrete"];

  // Corner pillars run the full wall height for a stronger massing.
  if (isCorner(x, z)) return ["white_concrete"];

  if (r >= 1 && r <= 4) {
    if (z === minZ) {
      // Entrance surround: pillars flanking the door, stone lintel above.
      if (Math.abs(x - doorX) <= 2 && r === 3) return ["stone_bricks"];
      if (x === doorX) {
        if (r === 1) return ["DOOR_LOWER"];
        if (r === 2) return ["DOOR_UPPER"];
      }
      if (Math.abs(x - doorX) === 1 && r <= 2) return ["stone_bricks"];
    }
    if ((x + z) % 4 === 0) return ["white_concrete"];
    return ["light_blue_stained_glass"];
  }

  // Upper storey windows: cyan tinted glass, frames every 3 blocks, some warm lit.
  if ((x + z) % 3 === 0) return ["white_concrete"];
  if ((x * 7 + z * 5 + r) % 13 === 0) return ["yellow_stained_glass"];
  return ["cyan_stained_glass"];
}

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const top = Math.min(Math.max(ROOF, gr + 5), H - 3);
  const h = top - gr;
  const perim = isPerim(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= top; y++) {
    const r = y - gr;
    if (perim) {
      const [b] = perimBlock(x, z, r, h);
      if (b === "DOOR_LOWER") {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (b === "DOOR_UPPER") {
        g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, b);
      }
    } else {
      // Interior: floor slabs at ground and storey line, air between.
      if (r === 0 || r === 5) g.set(x, y, z, "smooth_quartz");
    }
  }
  // Interior roof cap (perimeter already has its parapet at top).
  if (!perim) g.set(x, top, z, "smooth_stone");
}

// Roof plant: concrete plant blocks on interior roof cells.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const top = Math.min(Math.max(ROOF, gr + 5), H - 3);
  if (isPerim(x, z)) continue;
  if (x % 14 >= 3 && x % 14 <= 7 && z % 14 >= 3 && z % 14 <= 7 && top + 2 < H) {
    g.set(x, top + 1, z, "light_gray_concrete");
    g.set(x, top + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
