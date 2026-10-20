import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339540103";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 19, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const G = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => G.has(key(x, z));
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Low-rise commercial block: shopfront storey (0..4), one upper storey band (5..6), flat roof with parapet.
const maxG = Math.max(...cells.map(c => c[2]));
const TOP = Math.max(7, maxG + 2);   // roof slab level
const PAR = TOP + 2;                 // parapet cap level

const PIER_Z_WALL = new Set([0, 3, 6, 9, 11]); // piers on north/south faces (along x)
const PIER_X_WALL = new Set([0, 4, 8]);        // piers on east/west faces (along z)
const DOOR_X = 7;

function pane(x, y, z, zWall) {
  // glass pane connects along the wall it sits in
  if (zWall) {
    g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  } else {
    g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
}

for (const [x, z, gr] of cells) {
  // Foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const isPerim = perim(x, z);
  const zWall = (z === 0 || z === D - 1);
  const isPier = zWall ? PIER_Z_WALL.has(x) : PIER_X_WALL.has(z);
  const front = z === 0;

  if (isPerim) {
    for (let y = gr; y <= TOP - 1; y++) {
      if (y === gr) {
        g.set(x, y, z, "polished_andesite");                 // base course
      } else if (y === 4) {
        g.set(x, y, z, "light_gray_concrete");               // shopfront fascia band
      } else if (y === 5) {
        g.set(x, y, z, "smooth_quartz");                     // storey line
      } else if (y < 4) {
        // ground storey
        if (front) {
          const isDoor = x === DOOR_X && (y === gr + 1 || y === gr + 2);
          if (isDoor) {
            const half = y === gr + 1 ? "lower" : "upper";
            g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
          } else if (isPier) {
            g.set(x, y, z, "white_concrete");
          } else {
            g.set(x, y, z, "glass");
          }
        } else {
          g.set(x, y, z, "white_concrete");
        }
      } else {
        // upper storey windows
        if (isPier) g.set(x, y, z, "white_concrete");
        else pane(x, y, z, zWall);
      }
    }
    // roof edge cornice, parapet and cap
    g.set(x, TOP, z, "smooth_quartz");
    for (let y = TOP + 1; y <= PAR - 1; y++) g.set(x, y, z, "white_concrete");
    g.set(x, PAR, z, "smooth_quartz");
  } else {
    // interior: air behind glass, floor slabs, roof deck
    g.set(x, gr, z, "smooth_stone");
    if (gr < 5) g.set(x, 5, z, "smooth_stone");
    if ((x + z) % 4 === 1) g.set(x, 6, z, "shroomlight");   // warm light behind window
    g.set(x, TOP, z, "light_gray_concrete");
  }

  // Roof plant box on the central roof
  if (!isPerim && x >= 4 && x <= 7 && z >= 3 && z <= 5) {
    g.set(x, TOP + 1, z, "light_gray_concrete");
    g.set(x, TOP + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
