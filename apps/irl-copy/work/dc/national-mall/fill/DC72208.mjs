// 1221 11th St NW: a two-storey red-brick commercial block (c. 1900-1920 DC main-street store, calcite trim) with a
// shopfront on the street. The lidar gives a 6-block roof over most of the footprint and a 2-block one-storey corner
// (6,0); the 5-block cells on the front corner read as noise on the 6-block tier and are smoothed up to it. Every
// column is solid from y 0 to its top with a floor slab at y 3, so nothing floats. Walls are the perimeter cells,
// interior cells hold air behind the glass (the shopfront and upper bays), with lamps on the floors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC72208.cells.json`, "utf8"));

const W = 7, H = 18, D = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
// roof per cell: the lidar's 2 (the corner annex) stays, the 5s and 6s are one tier of 6
const top = new Map();
for (const [x, z, , roof] of cells) top.set(key(x, z), roof <= 2 ? roof : 6);
const inFp = (x, z) => top.has(key(x, z));
const T = (x, z) => top.get(key(x, z));

// a cell is interior when all four neighbours are footprint; the rest is perimeter wall
const interior = (x, z) => inFp(x - 1, z) && inFp(x + 1, z) && inFp(x, z - 1) && inFp(x, z + 1);

// the face a perimeter cell shows to the street or the open ground (front wins over rear, rear over sides)
const faceOf = (x, z) => {
  if (!inFp(x, z - 1)) return "front";
  if (!inFp(x, z + 1)) return "rear";
  if (!inFp(x - 1, z)) return "west";
  if (!inFp(x + 1, z)) return "east";
  return null;
};

const BRICK = "bricks", BASE = "stone_bricks", BELT = "calcite", FLOOR = "smooth_stone", ROOF = "stone";
// a glass pane lying along x (in a front or rear wall) or along z (in a side wall), with air behind it
const PANE_X = ["light_blue_stained_glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }];
const PANE_Z = ["light_blue_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
const DISPLAY = ["glass"];
const door = (y, facing) => ["oak_door", { facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];

// what a perimeter cell is at row y: [block] or [block, state]
function skin(face, x, y, z, t) {
  if (y === 0) return [BASE];                       // plinth
  if (y === t - 1 && t > 2) return [BELT];          // cornice course on the top row (the 2-block annex is brick to its roof)
  if (y <= 2) {                                     // shopfront / ground storey
    if (face === "front") {
      if (x === 1) return door(y, "south");         // entrance
      if (x >= 2 && x <= 4) return DISPLAY;         // display windows
      return [BRICK];
    }
    if (face === "rear") {
      if (x === 4) return door(y, "north");         // service door
      if (x === 2) return DISPLAY;
      return [BRICK];
    }
    if (face === "west") return z === 1 ? PANE_Z : [BRICK];
    return [BRICK];
  }
  if (y === 3) {                                    // string course over the shopfront
    if (face === "front") return x === 1 || x === 3 ? PANE_X : [BELT];
    if (face === "west") return z === 1 ? PANE_Z : [BELT];
    return [BELT];
  }
  // y = 4: upper storey window bays on the piers of brick
  if (face === "front") return x === 1 || x === 3 ? PANE_X : [BRICK];
  if (face === "west") return z === 1 ? PANE_Z : [BRICK];
  return [BRICK];
}

// ---- pass 1: the shell (perimeter walls from skin(); interior cells are base, floor slab and roof only) ----
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (interior(x, z)) {
      if (y === 0) g.set(x, y, z, BASE);
      else if (y === 3) g.set(x, y, z, FLOOR);
      else if (y === t - 1) g.set(x, y, z, ROOF);
      continue;
    }
    const face = faceOf(x, z);
    const [block, state] = skin(face, x, y, z, t);
    g.set(x, y, z, block, state);
  }
}

// ---- pass 2: the lamps behind the glass (the display, the upper bay), and the roof plant ----
g.set(3, 1, 1, "glowstone");                        // lamp on the shopfront floor
g.set(3, 2, 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, 4, 1, "lantern", { hanging: "false", waterlogged: "false" });  // upper bay lamp, on the floor slab
g.set(3, 4, 1, "shroomlight");
g.set(2, 6, 1, FLOOR);                              // roof plant: a plant box and a flue on the roof deck
g.set(3, 6, 1, FLOOR);
g.set(4, 6, 1, "bricks");
g.set(4, 7, 1, "bricks");
g.set(4, 8, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

g.save(`${DIR}/DC72208.nbt`);
console.log("DC72208 built:", g.count(), "blocks");
