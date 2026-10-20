import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334808237";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 19, D = 13;
const DOOR_X = 3;
const ROOF_Y = 5;           // roof deck level; parapet sits one above, top of building at y 7

const g = new Voxels([W, H, D]);

const gm = new Map();
for (const [x, z, gr] of cells) gm.set(`${x},${z}`, gr);
const has = (x, z) => gm.has(`${x},${z}`);
const isEdge = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));

// Glass pane connections: along the x-axis face the panes run north/south, and vice versa.
const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Ground-floor storey wall block for an edge cell at relative row r.
function wallBlock(x, z, r, rowsH) {
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  if (r === 0) return ["polished_andesite"];                 // base course
  if (r === rowsH - 1) return ["light_gray_concrete"];        // storey band / cornice course

  if (front) {
    // Shopfront facing the street (north face, z = 0)
    if (x === 0 || x === 6) return ["white_concrete"];        // corner piers
    if (r === rowsH - 2 + 0 && rowsH >= 4 && r > 2) return ["red_concrete"];
    if (r >= 3) return ["red_concrete"];                      // canopy band
    if (x === DOOR_X && rowsH >= 4) {
      return r === 1
        ? ["oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }]
        : ["oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    }
    return ["glass_pane", paneX];                              // shop glazing
  }

  if (back) {
    if (x % 2 === 0) return ["white_concrete"];               // piers on even columns
    return ["glass_pane", paneX];
  }

  // West or east side faces: index along the face is z
  if (z % 2 === 0) return ["white_concrete"];                 // piers on even z
  return ["glass_pane", paneZ];
}

// Cells where a warm light sits just behind an interior-side window.
const lightCells = [[1, 1], [5, 1], [1, 5], [1, 9], [5, 9]];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const deck = Math.max(ROOF_Y, gr);
  const rowsH = deck - gr;
  const edge = isEdge(x, z);

  if (!edge) {
    // Interior cell: floor slab, air gap, roof deck
    g.set(x, gr, z, "smooth_stone");
    g.set(x, deck, z, "smooth_stone");
    for (const [lx, lz] of lightCells) {
      if (x === lx && z === lz && rowsH >= 4) {
        g.set(x, gr + 2, z, "glowstone");
      }
    }
    continue;
  }

  // Edge cell: walls with base course, storey windows, band
  for (let r = 0; r < rowsH; r++) {
    const [id, props] = wallBlock(x, z, r, rowsH);
    g.set(x, gr + r, z, id, props);
  }

  // Roof deck with cornice and parapet
  g.set(x, deck, z, "smooth_stone");
  g.set(x, deck + 1, z, "white_concrete");
}

// Roof equipment: an AC plant on an interior roof cell, if the footprint allows
if (has(3, 6) && !isEdge(3, 6)) {
  const gr = gm.get("3,6");
  const deck = Math.max(ROOF_Y, gr);
  g.set(3, deck + 1, 6, "iron_block");
} else if (has(2, 6) && !isEdge(2, 6)) {
  const gr = gm.get("2,6");
  const deck = Math.max(ROOF_Y, gr);
  g.set(2, deck + 1, 6, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
