import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458730";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Pane connection states so rows of windows join up
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Two-storey mid-century/1990s commercial block: white tiled walls, stone base,
// grey-glass shopfront below, upper-floor window grid, lit offices, parapet and rooftop plant.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  if (!edge) {
    // Interior: air gap behind glass, floor slabs per storey, roof deck
    g.set(x, gr, z, "smooth_stone");
    g.set(x, gr + 5, z, "smooth_stone");
    g.set(x, gr + 10, z, "light_gray_concrete");
    // Rooftop plant on a small block of cells
    if ((x === 5 || x === 6) && (z === 5 || z === 6)) {
      g.set(x, gr + 11, z, "light_gray_concrete");
      g.set(x, gr + 12, z, "iron_block");
    }
    continue;
  }

  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  let face, u;
  if (z === 0) { face = "N"; u = x; }
  else if (z === D - 1) { face = "S"; u = x; }
  else if (x === 0) { face = "W"; u = z; }
  else { face = "E"; u = z; }

  const pillar = corner || (u % 3 === 0);
  const paneProps = (face === "N" || face === "S") ? PANE_NS : PANE_EW;
  const doorCell = face === "S" && u === 7;
  const litCell = face !== undefined && (u === 2 || u === 8 || u === 11);

  for (let y = gr; y <= gr + 11; y++) {
    if (y === gr) {
      g.set(x, y, z, "stone_bricks");                 // base course
    } else if (y === gr + 11) {
      g.set(x, y, z, "white_concrete");               // parapet
    } else if (y === gr + 10) {
      g.set(x, y, z, "smooth_stone");                 // cornice / roof edge
    } else if (y === gr + 5) {
      g.set(x, y, z, "light_gray_concrete");          // storey line
    } else if (pillar) {
      g.set(x, y, z, "white_concrete");               // mullions and corners
    } else if (y === gr + 4) {
      g.set(x, y, z, "smooth_stone");                 // shopfront lintel
    } else if (y < gr + 4) {
      // Ground floor shopfront
      if (doorCell) {
        if (y === gr + 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 2) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, "white_concrete");           // door head
        }
      } else {
        g.set(x, y, z, "gray_stained_glass_pane", paneProps);
      }
    } else {
      // Upper storey window grid, some offices lit
      if (litCell && y === gr + 7) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "gray_stained_glass_pane", paneProps);
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
