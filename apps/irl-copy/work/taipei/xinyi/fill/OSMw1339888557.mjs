import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Lidar roof about 7 blocks above lowest ground.
// Read as a low 1980s-90s concrete commercial block in Xinyi: a two-storey
// frame with a shopfront on the street side, a stone base course, a light
// concrete floor line, a white upper storey with ribbon-style windows, and a
// stone parapet. Roof sits 7 blocks above each cell's ground.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339888557.cells.json", "utf8")
);

const W = 5, H = 19, D = 42;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const WIN_SIDE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const WIN_END = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const DOOR_Z = 20;

for (const [x, z, ground] of cells) {
  const gr = ground;
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const streetSide = x === 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  // Interior and perimeter storey floor line.
  put(x, gr + 3, z, "light_gray_concrete");

  if (!perim) {
    // Interior: air gap, roof deck at top.
    put(x, gr + 6, z, "gray_concrete");
    continue;
  }

  // Base course.
  put(x, gr, z, "polished_andesite");

  // Ground storey (levels 1-2).
  for (const k of [1, 2]) {
    if (streetSide) {
      if (z === DOOR_Z) {
        if (k === 1) put(x, gr + k, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, gr + k, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (z % 4 === 0 || corner) {
        put(x, gr + k, z, "stone_bricks");
      } else {
        put(x, gr + k, z, "glass");
      }
    } else if (corner || z === 0 || z === D - 1) {
      put(x, gr + k, z, "white_concrete");
    } else if (z % 3 !== 0) {
      put(x, gr + k, z, "glass_pane", WIN_SIDE);
    } else {
      put(x, gr + k, z, "white_concrete");
    }
  }

  // Upper storey (levels 4-5).
  for (const k of [4, 5]) {
    if (corner) {
      put(x, gr + k, z, "white_concrete");
    } else if (x === 0 || x === W - 1) {
      if (z % 3 !== 0) put(x, gr + k, z, "glass_pane", WIN_SIDE);
      else put(x, gr + k, z, "white_concrete");
    } else {
      // End walls: one centred window column.
      if (x === 2) put(x, gr + k, z, "glass_pane", WIN_END);
      else put(x, gr + k, z, "white_concrete");
    }
  }

  // Cornice and parapet.
  put(x, gr + 6, z, "stone_bricks");
  put(x, gr + 7, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Warm lights in the air gap behind some shopfront and upper windows.
for (const [x, z, ground] of cells) {
  if (x !== 1 || (z === 0 || z === D - 1)) continue;
  if (z % 9 === 4) put(x, ground + 4, z, "shroomlight");
  if (z % 8 === 6) put(x, ground + 1, z, "glowstone");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339888557.nbt");
