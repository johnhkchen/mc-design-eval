import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617855";
const W = 8, H = 23, D = 18;

// Record: roof about 11 blocks above the lowest ground. Two storeys of 5 blocks
// with a parapet; a 1980s Taipei commercial block with a shopfront ground floor,
// white tiled concrete walls, light-grey frames and a stone base and cornice.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const minG = Math.min(...ground.values());
const T = Math.min(H, minG + 11); // roof surface sits at y = T

// Exterior faces: a cell is a wall cell if a neighbour is missing.
const faces = new Map();
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  for (const [nx, nz] of DIRS) {
    if (!ground.has(key(x + nx, z + nz)) && !faces.has(key(x, z))) {
      faces.set(key(x, z), [nx, nz]);
    }
  }
}

// Main massing: foundation, floors, storey bands, windows, parapet.
for (const [x, z, gr] of cells) {
  const face = faces.get(key(x, z));
  const top = T - 1 - gr; // highest k that is roof/parapet
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, "gray_concrete"); continue; }
    const k = y - gr;
    if (k === 0) { g.set(x, y, z, "stone_bricks"); continue; }          // base course / ground floor slab
    if (k === top) { g.set(x, y, z, face ? "stone_bricks" : "smooth_stone"); continue; } // parapet / roof
    if (k === 5 && top > 5) { g.set(x, y, z, "light_gray_concrete"); continue; }        // floor slab
    if (!face) continue;                                                // interior air gap

    // Exterior wall cell.
    const alongZ = face[0] !== 0;          // east/west face runs along z
    const along = alongZ ? z : x;
    const len = alongZ ? D : W;
    const front = face[0] === 0 && face[1] === -1; // north (z = 0) faces the street
    const pillar = along === 0 || along === len - 1 || along % 2 === 0;
    const doorCol = front && x === 3;
    const entryBand = front && x >= 2 && x <= 4;

    if (k === 1 || k === 2) {
      if (doorCol) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: k === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      g.set(x, y, z, pillar ? "light_gray_concrete" : "light_blue_stained_glass");
      continue;
    }
    if (k === 3) {
      g.set(x, y, z, pillar ? "light_gray_concrete" : "light_blue_stained_glass");
      continue;
    }
    if (k === 4) { g.set(x, y, z, entryBand ? "red_concrete" : "smooth_stone"); continue; } // lintel / canopy band
    if (k >= 6 && k <= 8) {
      g.set(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass");
      continue;
    }
    if (k === 9) { g.set(x, y, z, "smooth_stone"); continue; }          // sill band
    g.set(x, y, z, "white_concrete");
  }
}

// Warm lights behind some glass, in the air gap just inside the wall.
for (const [x, z, gr] of cells) {
  const face = faces.get(key(x, z));
  if (!face) continue;
  const alongZ = face[0] !== 0;
  const along = alongZ ? z : x;
  if (along % 4 !== 1) continue;
  const ix = x - face[0], iz = z - face[1];
  if (!ground.has(key(ix, iz)) || faces.has(key(ix, iz))) continue;
  if (ground.get(key(ix, iz)) !== gr) continue;
  for (const k of [2, 7]) {
    const y = gr + k;
    if (y < T - 1 - gr + gr) g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
