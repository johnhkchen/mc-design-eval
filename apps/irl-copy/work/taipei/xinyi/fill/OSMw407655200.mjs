import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407655200";

// [x, z, ground] per footprint cell (x 0..14, z 0..22)
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"))
  .map(([x, z, gr]) => [x, z, Math.round(gr)]);

const W = 15, H = 20, D = 23;
const v = new Voxels([W, H, D]);

// Low-rise 1980s Taipei mid-block: two storeys, white tiled concrete frame,
// cyan tinted glazing, red awning band on the street front, flat roof with parapet.
const key = (x, z) => `${x},${z}`;
const G = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => G.has(key(x, z));
const maxG = Math.max(...cells.map(c => c[2]));
const L2 = Math.max(4, maxG + 4);   // second-floor slab level
const ROOF = L2 + 4;                // roof slab level (8 on level ground)
const PAR = ROOF + 1;               // parapet course

const FACES = [
  { n: "N", dx: 0, dz: -1, axis: "x", front: true },  // street frontage
  { n: "S", dx: 0, dz: 1, axis: "x", front: false },
  { n: "W", dx: -1, dz: 0, axis: "z", front: false },
  { n: "E", dx: 1, dz: 0, axis: "z", front: false },
];

const isEdge = (x, z) => FACES.some(f => !has(x + f.dx, z + f.dz));

// Entrance: middle cell of the front (north) face
const frontCells = cells.filter(([x, z]) => !has(x, z - 1));
const medX = frontCells.map(c => c[0]).sort((a, b) => a - b)[Math.floor(frontCells.length / 2)] ?? 0;
let doorCell = frontCells.reduce((best, c) =>
  (best === null || Math.abs(c[0] - medX) < Math.abs(best[0] - medX)) ? c : best, null);
const doorX = doorCell ? doorCell[0] : -1;
const doorZ = doorCell ? doorCell[1] : -1;

// 1. Foundations, floor slabs, roof slab across the whole footprint
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) v.set(x, y, z, "stone_bricks");
  v.set(x, gr, z, "smooth_stone");     // ground floor slab
  v.set(x, L2, z, "smooth_stone");     // second floor slab
  v.set(x, ROOF, z, "smooth_stone");   // roof slab
}

// 2. Facades on edge cells
for (const [x, z, gr] of cells) {
  const missing = FACES.filter(f => !has(x + f.dx, z + f.dz));
  if (!missing.length) continue;
  const corner = missing.length >= 2;

  for (const f of missing) {
    const pos = f.axis === "x" ? x : z;
    const pillar = corner || pos % 3 === 0;
    const paneProps = f.axis === "x"
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    const isDoor = f.front && x === doorX && z === doorZ;

    for (let y = gr + 1; y <= PAR; y++) {
      if (y === L2 || y === ROOF) continue;

      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        v.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      if (y === PAR) { v.set(x, y, z, "white_concrete"); continue; }

      if (y === gr + 1) { v.set(x, y, z, "polished_andesite"); continue; }      // base course

      if (y <= L2 - 2) {                                                      // shopfront storey
        if (pillar) v.set(x, y, z, "polished_andesite");
        else v.set(x, y, z, "cyan_stained_glass_pane", paneProps);
        continue;
      }

      if (y === L2 - 1) {                                                     // canopy / spandrel band
        v.set(x, y, z, f.front ? "red_terracotta" : "white_concrete");
        continue;
      }

      if (y <= ROOF - 2) {                                                    // upper storey windows
        if (pillar) v.set(x, y, z, "white_concrete");
        else v.set(x, y, z, "cyan_stained_glass_pane", paneProps);
        continue;
      }

      if (y === ROOF - 1) { v.set(x, y, z, "smooth_quartz"); continue; }     // upper spandrel
    }
  }
}

// 3. Interior warm lights behind glazing and small roof equipment
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  if (!edge) {
    const edgeNb = FACES.some(f => has(x + f.dx, z + f.dz) && isEdge(x + f.dx, z + f.dz));
    if (edgeNb && (x * 2 + z) % 5 === 0) v.set(x, L2 + 1, z, "glowstone");   // upper floor
    if (edgeNb && (x + z * 3) % 5 === 1) v.set(x, gr + 2, z, "shroomlight"); // shopfront

    // Rooftop plant boxes
    if ((x * 3 + z * 5) % 13 === 0) {
      v.set(x, ROOF + 1, z, "light_gray_concrete");
      v.set(x, ROOF + 2, z, "light_gray_concrete");
    }
  }
}

v.save(`${DIR}/${ID}.nbt`);
