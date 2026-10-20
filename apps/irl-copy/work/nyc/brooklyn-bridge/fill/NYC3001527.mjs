import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001527.cells.json", "utf8"));

const W = 11, H = 21, D = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));

// A cell is exterior if any of its four neighbours lies outside the footprint.
function isBoundary(x, z) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFp.has(key(x + dx, z + dz)));
}

// Smooth the lidar roof into one flat tier: the median roof height of the footprint.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const ROOF = Math.min(H - 1, roofs[Math.floor(roofs.length / 2)]);

const WIN_COLS = new Set([1, 2, 3, 7, 8, 9]);
const PIER_COLS = new Set([4, 6]);
const DOOR_COL = 5;

const GLASS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const G = Math.max(0, Math.round(gr));
  const R = Math.max(G + 6, ROOF);
  const bnd = isBoundary(x, z);
  const onFace = bnd && (z === 0 || z === D - 1);
  const isFront = z === 0;
  const isCorner = x === 0 || x === W - 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  // Shell: walls, floor slabs, cornice and parapet.
  for (let y = G; y <= R - 1; y++) {
    const rel = y - G;
    const top = y === R - 1;
    const cornice = y === R - 2;

    if (!bnd) {
      // Interior: floor slabs and roof deck only, air between.
      if (top) g.set(x, y, z, "stone_bricks");
      else if (rel % 2 === 0) g.set(x, y, z, "smooth_stone");
      // Warm light set back behind the street and rear glass.
      if ((z === 1 || z === D - 2) && x % 3 === 2 && rel % 4 === 1 && rel <= R - 3) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    let block;
    if (top) block = "smooth_stone";                        // parapet
    else if (cornice) block = "stone_bricks";               // projecting cornice band
    else if (rel === 0) block = "stone_bricks";             // base course
    else if (rel % 2 === 0) block = onFace ? "smooth_stone" : "brown_terracotta"; // storey line
    else block = "brown_terracotta";                        // brownstone wall
    if (onFace && isCorner && !top && !cornice) block = "stone_bricks"; // quoins
    g.set(x, y, z, block);
  }

  // Openings on the street and rear faces.
  if (onFace) {
    for (let y = G + 1; y <= R - 3; y++) {
      const rel = y - G;
      if (rel % 2 === 0) continue;                // storey lines stay solid
      if (rel === 1) {
        if (x === DOOR_COL && isFront) continue;  // door placed below
        if (PIER_COLS.has(x) && isFront) {
          g.set(x, y, z, "stone_bricks");         // pilasters flanking the entrance
          continue;
        }
        if (WIN_COLS.has(x) || (x === DOOR_COL && !isFront)) {
          g.set(x, y, z, "glass_pane", GLASS);
        }
      } else {
        if (WIN_COLS.has(x) || PIER_COLS.has(x) || x === DOOR_COL) {
          g.set(x, y, z, "glass_pane", GLASS);
        }
      }
    }

    // Front entrance: door set into the centre bay, with a hood over it.
    if (isFront && G + 3 <= R - 3) {
      g.set(DOOR_COL, G + 1, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(DOOR_COL, G + 2, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      // Canopy over the door, bearing on the wall band beside and above it.
      for (const cx of [4, 5, 6]) g.set(cx, G + 3, z, "dark_oak_planks");
      // Lanterns under the hood, either side of the door.
      g.set(4, G + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
      g.set(6, G + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // Roof equipment: two brick chimney stacks on interior roof cells.
  if (!bnd && (x === 2 || x === 8) && z === 2 && R + 1 < H) {
    g.set(x, R, z, "bricks");
    g.set(x, R + 1, z, "bricks");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001527.nbt");
