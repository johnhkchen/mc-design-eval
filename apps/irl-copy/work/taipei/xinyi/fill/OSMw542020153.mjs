import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020153";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 8;
const g = new Voxels([W, H, D]);

// Footprint lookup: ground height per cell.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inF = (x, z) => ground.has(`${x},${z}`);

// Absolute storey levels, anchored to the lowest ground under the footprint.
const L0 = Math.min(...cells.map((c) => c[2]));   // ground floor level
const LINE1 = L0 + 5;                              // first storey line
const ROOF = L0 + 10;                              // roof slab / cornice
const PARAPET = L0 + 11;                           // top of parapet (~11 above lowest ground)
const DOOR_X = 10;                                 // entrance on north (z=0) face

// Which exterior face a boundary cell sits on (null if interior).
function faceOf(x, z) {
  if (!inF(x, z - 1)) return "N";
  if (!inF(x, z + 1)) return "S";
  if (!inF(x - 1, z)) return "W";
  if (!inF(x + 1, z)) return "E";
  return null;
}

// Pane whose connections run along the wall it sits in.
function pane(face) {
  const ew = face === "N" || face === "S";
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
}

const inRange = (v, a, b) => v >= a && v <= b;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  if (face) {
    const alongN = face === "N" || face === "S";
    const pos = alongN ? x : z;
    const isPier = alongN ? pos % 3 === 0 : false;
    const isDoorCell = face === "N" && x === DOOR_X;

    for (let y = gr; y <= ROOF; y++) {
      // Door (two halves) on the north entrance.
      if (isDoorCell && (y === L0 + 1 || y === L0 + 2)) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: y === L0 + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      // Base course at the ground of this cell.
      if (y === gr) {
        g.set(x, y, z, "polished_granite");
        continue;
      }

      // Storey bands and cornice.
      if (y === LINE1 || y === ROOF) {
        g.set(x, y, z, "smooth_stone");
        continue;
      }

      // Ground-storey windows (shopfront glass) with stone lintel.
      if (alongN && !isPier) {
        if (inRange(y, L0 + 1, L0 + 3)) {
          g.set(x, y, z, "light_blue_stained_glass_pane", pane(face));
          continue;
        }
        if (y === L0 + 4) {
          g.set(x, y, z, "smooth_stone");
          continue;
        }
      }

      // Upper-storey windows.
      if (alongN && !isPier && inRange(y, L0 + 6, L0 + 9)) {
        g.set(x, y, z, "light_blue_stained_glass_pane", pane(face));
        continue;
      }

      // End walls: upper windows across the middle of the face only.
      if (!alongN && inRange(z, 2, 5) && inRange(y, L0 + 6, L0 + 9)) {
        g.set(x, y, z, "light_blue_stained_glass_pane", pane(face));
        continue;
      }

      // Plain wall, piers in a darker concrete.
      if (isPier || (!alongN && (z === 1 || z === D - 2))) {
        g.set(x, y, z, "light_gray_concrete");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }

    // Parapet on the roof edge.
    if (PARAPET <= H - 1 && PARAPET >= gr) {
      g.set(x, PARAPET, z, isPier ? "light_gray_concrete" : "white_concrete");
    }
  } else {
    // Interior: no rooms, just floor slabs at each storey and the roof slab.
    for (const y of [L0, LINE1, ROOF]) {
      if (y >= gr && y <= H - 1) g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// Warm lights behind upper-storey windows on the north face.
for (const [x, z, gr] of cells) {
  if (z !== 1) continue;
  if (!inF(x, 0)) continue;
  if (![1, 7, 13].includes(x)) continue;
  const y = L0 + 7;
  if (y >= gr && y <= H - 1) g.set(x, y, z, "glowstone");
}

// Roof equipment on interior cells: a small plant unit above the roof slab.
const EQ_BASE = PARAPET;
if (EQ_BASE + 1 <= H - 1) {
  for (const [x, z, gr] of cells) {
    if (faceOf(x, z)) continue;
    if (!inRange(x, 5, 7) || !inRange(z, 3, 4)) continue;
    if (gr > EQ_BASE) continue;
    g.set(x, EQ_BASE, z, "light_gray_concrete");
    if (x === 6 && z === 3) g.set(x, EQ_BASE + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
