import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Footprint 31 x 40. Roof about 11 blocks above the lowest ground.
// Read as a two-storey, early-1990s Xinyi-area commercial block: white tiled
// concrete facade, tinted glass curtain bands, quartz cornice and coping,
// a shopfront ground floor, a grey roof with plant boxes.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343766.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343766.nbt";
const W = 31, H = 23, D = 40;
const ROOF_Y = 10;      // roof surface sits at height 11 above the lowest ground
const STOREY_LINE = 5;  // upper floor starts here

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const G = new Map();
let base = Infinity;
for (const [x, z, gr] of cells) {
  G.set(x + "," + z, gr);
  if (gr < base) base = gr;
}
const inFp = (x, z) => G.has(x + "," + z);
const edge = (x, z) => !inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1);
const groundY = (x, z) => Math.min(H - 1, G.get(x + "," + z) - base);

// Facing of the exposed side (direction the outside faces).
function outwardFacing(x, z) {
  if (!inFp(x, z - 1)) return "north";
  if (!inFp(x, z + 1)) return "south";
  if (!inFp(x - 1, z)) return "west";
  return "east";
}

const g = new Voxels([W, H, D]);
const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Entrance: the edge cell on the street side (smallest z), nearest the middle of the frontage.
let entrance = null;
let best = Infinity;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z) || !edge(x, z)) continue;
  const score = z + Math.abs(x - W / 2) * 0.5;
  if (score < best) { best = score; entrance = [x, z]; }
}

for (let z = 0; z < D; z++) {
  for (let x = 0; x < W; x++) {
    if (!inFp(x, z)) continue;
    const gy = groundY(x, z);

    // Foundation: solid from y 0 up to this cell's ground.
    for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

    if (gy > ROOF_Y) continue; // nothing above ground to build on this cell

    if (edge(x, z)) {
      // Facade column from ground to parapet.
      for (let y = gy; y <= ROOF_Y; y++) {
        let id;
        let props;
        if (y === ROOF_Y) {
          id = "smooth_quartz";                       // parapet coping
        } else if (y === ROOF_Y - 1) {
          id = "white_concrete";                      // cornice band
        } else if (y >= 6 && y <= 8) {                // upper storey windows
          if ((x + z) % 3 === 0) {
            id = "white_concrete";                    // mullion
          } else if ((x * 5 + z * 7 + y) % 17 === 0) {
            id = "glowstone";                         // lit room behind glass
          } else {
            id = "light_blue_stained_glass_pane";
            props = pane;
          }
        } else if (y === STOREY_LINE) {
          id = "smooth_quartz";                       // storey line
        } else {                                      // ground floor, y 0..4
          if (y === gy && gy <= 4) {
            id = "stone_bricks";                      // base course
          } else if (y === 4) {
            id = "smooth_stone";                      // shopfront header
          } else if ((x + z) % 3 === 0) {
            id = "white_concrete";                    // shopfront pillar
          } else {
            id = "light_blue_stained_glass_pane";
            props = pane;
          }
        }
        if (props) g.set(x, y, z, id, props);
        else g.set(x, y, z, id);
      }
    } else {
      // Interior: floor slabs and roof only, air between (no interiors).
      if (gy < H) g.set(x, gy, z, "smooth_stone");
      g.set(x, STOREY_LINE, z, "smooth_stone");
      g.set(x, ROOF_Y, z, "gray_concrete");
      // Roof plant boxes.
      if ((x * 3 + z * 5) % 17 === 0 && ROOF_Y + 2 < H) {
        g.set(x, ROOF_Y + 1, z, "light_gray_concrete");
        g.set(x, ROOF_Y + 2, z, "light_gray_concrete");
      }
    }
  }
}

// Entrance door and lantern on the street side.
if (entrance) {
  const [ex, ez] = entrance;
  const gy = groundY(ex, ez);
  const facing = outwardFacing(ex, ez);
  if (gy + 1 < 4) {
    g.set(ex, gy, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(ex, gy + 1, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(ex, gy + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(OUT);
