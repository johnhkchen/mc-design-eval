import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991758";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Era: 1980s-90s Taipei mid-rise commercial block. Cream tiled concrete, grey
// bands, blue-glass strip windows, stone-clad shopfront, flat parapet roof.
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const FRAME = "smooth_stone";
const PIER = "stone_bricks";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const LIGHT = "glowstone";

const TOP = 10;      // roof slab / top storey line
const PARAPET = 11;  // parapet course on the perimeter
const FLOOR1 = 5;    // storey line between the two storeys
const CX = 7, CZ = 8;

const key = (x, z) => `${x},${z}`;
const cellGround = new Map();
for (const [x, z, gr] of cells) cellGround.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => cellGround.has(key(x, z));

// Outward face for a perimeter cell: N = -z, S = +z, W = -x, E = +x.
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

function paneProps(face) {
  // Panes connect along the wall they sit in.
  if (face === "N" || face === "S") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const face = faceOf(x, z);
  const u = face === "N" || face === "S" ? x : z;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);

  if (face) {
    // ----- perimeter wall -----
    for (let y = ground; y <= TOP; y++) {
      if (y === ground) { g.set(x, y, z, FOUND); continue; }        // base course
      if (y === FLOOR1 || y === TOP) { g.set(x, y, z, BAND); continue }   // storey lines / roof edge

      if (y <= FLOOR1 - 1) {
        // Ground floor shopfront band.
        if (face === "N" && x === CX && y <= ground + 2) {
          // Entrance door, two blocks tall.
          const half = y === ground + 1 ? "lower" : "upper";
          if (y <= ground + 2) {
            g.set(x, y, z, "oak_door", {
              facing: "north", half, hinge: "left", open: "false", powered: "false",
            });
          }
          continue;
        }
        if (face === "N" && x === CX && y === 4) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          continue;
        }
        if (u % 3 === 0) { g.set(x, y, z, PIER); continue; }
        g.set(x, y, z, GLASS, paneProps(face));
        continue;
      }

      // Upper storey band.
      if (y === 6 || y === 9) { g.set(x, y, z, FRAME); continue; }
      if (u % 3 === 0) { g.set(x, y, z, WALL); continue; }
      // Warm light behind a few windows (shown as glowstone in the opening).
      if (y === 7 && u % 6 === 4) { g.set(x, y, z, LIGHT); continue; }
      g.set(x, y, z, GLASS, paneProps(face));
    }

    // Parapet course on the roof edge.
    g.set(x, PARAPET, z, BAND);
  } else {
    // ----- interior: solid so every storey rests on what is below -----
    for (let y = ground; y <= TOP; y++) {
      g.set(x, y, z, (y === FLOOR1 || y === TOP) ? BAND : WALL);
    }

    // Roof plant: a central mechanical box on the roof slab.
    if (Math.abs(x - CX) <= 2 && Math.abs(z - CZ) <= 2) {
      g.set(x, PARAPET, z, BAND);
      if (Math.abs(x - CX) <= 1 && Math.abs(z - CZ) <= 1) {
        g.set(x, PARAPET + 1, z, FRAME);
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
