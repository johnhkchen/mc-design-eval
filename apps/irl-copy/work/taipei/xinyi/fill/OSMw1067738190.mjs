import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738190.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738190.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 23, H = 33, D = 24;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gy] of cells) map.set(key(x, z), Math.min(gy, H - 2));

// Lowest ground under the footprint; the roof sits ~21 blocks above it.
const base = Math.min(...cells.map(([, , gy]) => Math.min(gy, H - 2)));

// Storey plan (sl = height above base):
//   sl 0,5,10,15 : floor slabs (interior) / spandrel bands (facade)
//   sl 1..3      : glazed window or shopfront band
//   sl 4         : spandrel band
//   sl 20        : roof deck / cornice band
//   sl 21        : parapet on the edge, roof equipment above
const ROOF_DECK = 20;
const PARAPET = 21;
const TOP = 23;

// Facade directions: missing neighbour => that face is exposed.
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

function exposedFaces(x, z) {
  const faces = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!map.has(key(x + dx, z + dz))) faces.push(name);
  }
  return faces;
}

// 1. Foundation: solid stone from y 0 up to each cell's ground.
for (const [x, z] of [...map.keys()].map((k) => k.split(",").map(Number))) {
  const gy = map.get(key(x, z));
  for (let y = 0; y <= gy; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Shell, floors, facade, roof equipment.
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gy = map.get(k);
  const faces = exposedFaces(x, z);
  const edge = faces.length > 0;

  for (let y = gy + 1; y <= Math.min(base + TOP, H - 1); y++) {
    const sl = y - base;

    if (!edge) {
      // Interior: floor slab per storey, air otherwise (no interiors).
      if (sl === ROOF_DECK || sl % 5 === 0 || y === gy + 1) {
        if (sl <= ROOF_DECK) g.set(x, y, z, "smooth_stone");
      }
      // Roof plant room on the central roof.
      if (sl === PARAPET || sl === PARAPET + 1) {
        if (x >= 8 && x <= 14 && z >= 9 && z <= 14) {
          g.set(x, y, z, sl === PARAPET ? "light_gray_concrete" : "gray_concrete");
        }
      }
      continue;
    }

    // Edge cells (facade).
    if (sl > PARAPET) continue;
    if (sl === PARAPET) {
      g.set(x, y, z, "white_concrete"); // parapet
      continue;
    }
    if (sl === ROOF_DECK) {
      g.set(x, y, z, "light_gray_concrete"); // cornice band
      continue;
    }

    // Corner or pillar bay: alignment along each exposed face.
    let pillar = faces.length > 1;
    let entrance = false;
    let along = 0;
    for (const f of faces) {
      const a = f === "north" || f === "south" ? x : z;
      along = a;
      if (a % 3 === 0) pillar = true;
      if (f === "south" && sl >= 1 && sl <= 3 && x >= 10 && x <= 12) entrance = true;
    }

    if (pillar) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    if (entrance) {
      // Shopfront entrance opening, lintel above.
      if (sl === 3) g.set(x, y, z, "light_gray_concrete");
      continue; // air = doorway
    }
    const band = sl % 5;
    if (band === 0 || band === 4) {
      g.set(x, y, z, "light_gray_concrete"); // floor and sill spandrel
    } else {
      // Window band: warm light behind some glazing, otherwise glass panes.
      if (sl % 5 === 2 && (along + sl) % 11 === 0) {
        g.set(x, y, z, "shroomlight");
      } else {
        g.set(x, y, z, "glass_pane");
      }
    }
  }
}

g.save(OUT);
