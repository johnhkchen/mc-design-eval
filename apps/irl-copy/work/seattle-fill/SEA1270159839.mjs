// SEA1270159839: 1960s civic service/garage block, 14 x 18 footprint (full rectangle).
// Local coords: x 0..13 (east), z 0..17 (south), y 0 = ground.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 14, D = 18, HB = 6, HMAX = HB + 6;
const g = new Voxels([W, HMAX, D]);
const X1 = W - 1, Z1 = D - 1;

const onPerimeter = (x, z) => x === 0 || x === X1 || z === 0 || z === Z1;
const isCorner = (x, z) => (x === 0 || x === X1) && (z === 0 || z === Z1);
const PANE_NS = { north: "true", south: "true", east: "false", west: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true" };
const BARS = { north: "true", south: "true", east: "true", west: "true" };

// Per-face along-wall position u and fin / window / bay classification.
// East (x = X1) and west (x = 0) runs along z; north (z = 0) and south (z = Z1) run along x.
function faceInfo(x, z) {
  if (x === X1 || x === 0) return { face: x === X1 ? "E" : "W", u: z, len: D };
  return { face: z === 0 ? "N" : "S", u: x, len: W };
}
const EAST_BAYS = [[6, 7], [12, 13]];
const EAST_DOOR = 3;
const inRanges = (u, rs) => rs.some(([a, b]) => u >= a && u <= b);

// 1. Foundation and floor: stone plinth y0, smooth stone base course / floor y1.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  g.set(x, 0, z, "stone");
  g.set(x, 1, z, "smooth_stone");
}

// 2. Perimeter walls y2..4, parapet head y5 (dark), coping y6.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!onPerimeter(x, z)) {
    // Interior: air above the floor, roof deck at y5.
    g.set(x, 5, z, "light_gray_concrete");
    continue;
  }
  g.set(x, 5, z, "gray_concrete");          // parapet / head band
  g.set(x, 6, z, "stone_slab", { type: "bottom", waterlogged: "false" }); // coping

  if (isCorner(x, z)) {
    for (let y = 2; y <= 4; y++) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    continue;
  }
  const { face, u } = faceInfo(x, z);
  const isEW = face === "E" || face === "W";
  const fin = u % 3 === 2;                       // vertical fins every 3 blocks
  // Default: light gray lower storey.
  for (let y = 2; y <= 4; y++) g.set(x, y, z, "light_gray_concrete");

  if (fin) {
    for (let y = 2; y <= 4; y++) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    continue;
  }

  if (face === "E") {
    // Roll-up bays: dark recess behind an iron-bar grille, opening at y2..4.
    if (inRanges(u, EAST_BAYS)) {
      for (let y = 2; y <= 4; y++) {
        g.set(x, y, z, "iron_bars", BARS);            // grille front (x = X1)
        g.set(x - 1, y, z, "gray_concrete");       // dark recess back
      }
      continue;
    }
    // Pedestrian door on the long face, hooded by a slab canopy.
    if (u === EAST_DOOR) {
      g.set(x, 2, z, "iron_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 3, z, "iron_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      g.set(x - 1, 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
  }

  // Ribbon windows: recessed one block, glass set back behind the wall line.
  g.set(x, 2, z, "light_gray_concrete");          // sill course
  for (let y = 3; y <= 4; y++) {
    const inward = face === "E" ? [x - 1, y, z] : face === "W" ? [x + 1, y, z]
                 : face === "N" ? [x, y, z + 1] : [x, y, z - 1];
    g.set(x, y, z, "air");
    g.set(inward[0], inward[1], inward[2], "gray_stained_glass_pane", isEW ? PANE_NS : PANE_EW);
  }
}

// Canopy / hood cells that the door reveal needs: door hood already set; fix the
// corner-adjacent hood cell that the loop may have overwritten.
g.set(X1, 4, EAST_DOOR, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
g.set(X1 - 1, 4, EAST_DOOR, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// 3. Roof equipment on the deck (top surface y6).
// Stair bulkhead with iron hatch and a ladder on its face.
for (const [x, z] of [[5, 3], [6, 3], [5, 4], [6, 4]]) {
  g.set(x, 6, z, "light_gray_concrete");
  g.set(x, 7, z, "light_gray_concrete");
}
g.set(5, 8, 3, "iron_trapdoor", { facing: "north", half: "bottom", open: "false", powered: "false" });
g.set(4, 6, 3, "ladder", { facing: "west", waterlogged: "false" });
g.set(4, 7, 3, "ladder", { facing: "west", waterlogged: "false" });

// Mechanical vent box: dark concrete block with an iron-bar grille cap.
for (let x = 3; x <= 5; x++) for (let z = 10; z <= 12; z++) {
  g.set(x, 6, z, "gray_concrete");
  g.set(x, 7, z, "iron_bars", BARS);
}

// Two cauldron vent stacks.
g.set(9, 6, 8, "cauldron");
g.set(11, 6, 8, "cauldron");

// Skylight: glass set in the deck with a dark curb.
for (let x = 8; x <= 11; x++) for (let z = 1; z <= 4; z++) {
  const inner = x >= 9 && x <= 10 && z >= 2 && z <= 3;
  if (inner) g.set(x, 5, z, "glass");
  else g.set(x, 6, z, "gray_concrete");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/SEA1270159839.nbt");
console.log("saved SEA1270159839.nbt size", [W, HMAX, D]);
