// Way 332241929: a two-storey red-brick commercial block with a single-storey wing on its east side, the
// early-20th-century Auckland shop-and-flat type (shopfront at street level, sash-style windows above, a stone
// string course and cornice, a parapet over a flat roof). Massing comes from the lidar roof: roof >= 9 is the main
// block (roof 10, parapet to 11); roof <= 7 is the lower wing (roof 6). Roof noise is smoothed into those two tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241929.cells.json", "utf8"));
const X = 18, Z = 16;
const MAIN_TOP = 11, WING_TOP = 6;   // main: roof at y10 + parapet course at y10; wing: roof slab at y5

// per-cell plan: tier and height (0 = not in the footprint or no roof)
const tier = Array.from({ length: X }, () => Array(Z).fill(null));
const top = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, , roof] of cells) {
  if (roof <= 0) continue;
  const main = roof >= 9;
  tier[x][z] = main ? "main" : "wing";
  top[x][z] = main ? MAIN_TOP : WING_TOP;
}
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && top[x][z] > 0;
const H = (x, z) => (inFp(x, z) ? top[x][z] : 0);
const isMain = (x, z) => tier[x][z] === "main";

// outward directions: normal, the facade name (for doors), and the axis a pane in that face runs along
const DIRS = [
  { dx: 1, dz: 0, name: "east" }, { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" }, { dx: 0, dz: -1, name: "north" },
];

const g = new Voxels([X, 23, Z]);
const panes = [];      // glass panes to connect once the whole facade is placed
const glowAt = [];     // interior cells behind a window that get a warm light

// the door: the north face of the main block, the middle of its shopfront
const DOOR = { x: 13, z: 0 };
const doorFacing = "north";

const fpCells = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inFp(x, z)) fpCells.push([x, z]);

for (const [x, z] of fpCells) {
  const h = H(x, z), main = isMain(x, z);
  // outward faces on the outline. The outline steps diagonally, so most cells open onto two faces: each takes the
  // first face as its facade (bays and windows), and no cell is a special corner, or the glass would be lost
  const face = DIRS.find(({ dx, dz }) => !inFp(x + dx, z + dz));
  const k = face ? (face.dx !== 0 ? z : x) : -1;   // position of the cell along its facade, for the bays
  const bayWindow = (cut) => face && k % 3 === cut;

  for (let y = 0; y < h; y++) {
    const exposed = DIRS.some(({ dx, dz }) => !inFp(x + dx, z + dz) || y >= H(x + dx, z + dz));
    // horizontal slabs: the foundation, the main block's floor (y4) and roof (y9), the wing's roof (y5)
    const slab = y === 0 || (main ? y === 4 || y === 9 : y === 5);
    if (slab) {
      g.set(x, y, z, y === 0 ? "stone_bricks" : exposed ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (!exposed) continue;   // interior air: the gap behind the glass, with no rooms built

    // the door on the north shopfront, with a dark oak canopy over it
    if (x === DOOR.x && z === DOOR.z && face && face.name === doorFacing) {
      if (y === 1 || y === 2) {
        g.set(x, y, z, "dark_oak_door", { facing: doorFacing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }
    }

    if (!face) { g.set(x, y, z, y === 1 || y === 4 ? "stone_bricks" : "bricks"); continue; }   // party walls and the wing's shared wall

    if (y === 1) { g.set(x, y, z, "stone_bricks"); continue; }           // plinth course
    if (y === 2 || y === 3) {                                            // shopfront: glass between brick piers
      if (k % 3 !== 0) {
        g.set(x, y, z, "glass_pane");
        panes.push({ x, y, z, axis: face.dx !== 0 ? "x" : "z" });
      } else g.set(x, y, z, "bricks");
      continue;
    }
    if (y === 4) { g.set(x, y, z, "stone_bricks"); continue; }           // string course over the shops

    if (main) {
      const win = bayWindow(1);                                          // upper storey: one window in three
      if (y === 5 || y === 8) { g.set(x, y, z, win ? "quartz_block" : y === 8 ? "stone_bricks" : "bricks"); continue; }  // sill, lintel, cornice
      if (y === 6 || y === 7) {
        if (win) {
          g.set(x, y, z, "glass_pane");
          panes.push({ x, y, z, axis: face.dx !== 0 ? "x" : "z" });
          if (y === 6 && k % 6 === 1) glowAt.push({ x: x - face.dx, y, z: z - face.dz });   // warm light behind every other window
        } else g.set(x, y, z, "bricks");
        continue;
      }
      g.set(x, y, z, "stone_bricks");                                    // parapet to y10
      continue;
    }

    g.set(x, y, z, "bricks");
  }
}

// warm light behind some upper windows (glowstone) — only in the air gap behind the glass
for (const { x, y, z } of glowAt) if (inFp(x, z) && !g.get(x, y, z)) g.set(x, y, z, "glowstone");

// roof plant: a low screen of light grey concrete on the main roof, standing on the roof slab
for (const [x, z] of [[6, 7], [7, 7], [8, 7]]) if (inFp(x, z) && isMain(x, z)) g.set(x, 10, z, "light_gray_concrete");

// connect glass panes to their neighbours (solid blocks, panes, doors) along the wall they sit in
const has = (x, y, z) => !!g.get(x, y, z);
for (const { x, y, z, axis } of panes) {
  const state = axis === "x"
    ? { north: String(has(x, y, z - 1)), south: String(has(x, y, z + 1)), east: "false", west: "false" }
    : { east: String(has(x + 1, y, z)), west: String(has(x - 1, y, z)), north: "false", south: "false" };
  g.set(x, y, z, "glass_pane", { ...state, waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241929.nbt");
