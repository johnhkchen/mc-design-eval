import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 16 x 16 footprint, roof ~11 blocks above lowest ground.
// Reading: a 1970s-80s Taipei low-rise shophouse-style block, two storeys of
// about 5 blocks, white tiled concrete walls, stone base, a glazed shopfront with
// a red sign band on the street front, glass bays with white mullions, a cornice
// and parapet, and a small rooftop water tank.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542610189.cells.json", "utf8")
);

const W = 16, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gc] of cells) ground.set(x + "," + z, gc);
const has = (x, z) => ground.has(x + "," + z);
const gOf = (x, z) => ground.get(x + "," + z);

const minG = Math.min(...cells.map(c => c[2]));
let R = minG + 11;                 // roof level (top of parapet is R-1)
if (R > H - 3) R = H - 3;          // keep the tank inside the box

const outward = {
  N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0]
};
const inward = {
  N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0]
};

function facesOf(x, z) {
  const f = [];
  for (const k of ["N", "S", "W", "E"]) {
    const [dx, dz] = outward[k];
    if (!has(x + dx, z + dz)) f.push(k);
  }
  return f;
}

// Pass 1: foundation, solid core, roof surface.
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gc; y <= R - 2; y++) g.set(x, y, z, "white_concrete");
  g.set(x, R - 1, z, "gray_concrete");
}

// Pass 2: facades on edge cells.
const windows = [];
for (const [x, z, gc] of cells) {
  const faces = facesOf(x, z);
  if (faces.length === 0) continue;

  const isCorner = faces.length > 1;
  const face = faces[0];
  const k = (face === "N" || face === "S") ? x : z;
  const isFront = face === "S";

  for (let y = gc; y <= R - 1; y++) {
    const rel = y - gc;

    if (isCorner) {
      // Corner piers: smooth columns, no glazing.
      g.set(x, y, z, y === R - 1 ? "stone_bricks" : "smooth_quartz");
      continue;
    }

    if (y === R - 1) {                       // parapet
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y === R - 2) {                       // cornice
      g.set(x, y, z, "polished_andesite");
      continue;
    }
    if (rel === 0) {                         // base course
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (rel === 5 || rel === 10) {           // storey line / spandrel
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    const inGroundBand = rel >= 1 && rel <= 4;
    const inUpperBand = rel >= 6 && rel <= 9;

    if (isFront && inGroundBand) {
      // Shopfront on the street front
      if (rel === 4) {
        g.set(x, y, z, "red_concrete");      // sign band
      } else if (k === 7 && rel === 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false"
        });
      } else if (k === 7 && rel === 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false"
        });
      } else {
        g.set(x, y, z, "glass");
        const [ix, iz] = inward[face];
        windows.push({ x, z, y, rel, k, ix: x + ix, iz: z + iz });
      }
      continue;
    }

    if (inGroundBand || inUpperBand) {
      if (k % 3 === 1) {
        g.set(x, y, z, "glass");
        const [ix, iz] = inward[face];
        windows.push({ x, z, y, rel, k, ix: x + ix, iz: z + iz });
      } else {
        g.set(x, y, z, "white_concrete");   // mullion
      }
      continue;
    }

    g.set(x, y, z, "white_concrete");
  }
}

// Pass 3: air gap behind glass, with warm light in some bays.
for (const w of windows) {
  if (!has(w.ix, w.iz)) continue;
  const innerGc = gOf(w.ix, w.iz);
  if (w.y < innerGc) continue;
  const lit = (w.rel === 2 && w.k % 6 === 1) || (w.rel === 7 && w.k % 6 === 4);
  g.set(w.ix, w.y, w.iz, lit ? "glowstone" : "air");
}

// Rooftop water tank on the four centre cells, if they are all footprint cells.
const tankCells = [[7, 7], [8, 7], [7, 8], [8, 8]];
if (R + 1 < H && tankCells.every(([x, z]) => has(x, z))) {
  for (const [x, z] of tankCells) {
    g.set(x, R, z, "smooth_stone");
    g.set(x, R + 1, z, "smooth_stone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542610189.nbt");
