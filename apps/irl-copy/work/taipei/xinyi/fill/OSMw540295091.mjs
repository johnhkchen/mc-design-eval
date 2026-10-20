import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295091.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295091.nbt";

const W = 19, H = 23, D = 20;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground level (third number)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const minG = Math.min(...[...ground.values()]);   // y 0 = lowest ground
const top = minG + 11;                             // roof surface sits 11 blocks above lowest ground
const roofSlabY = minG + 10;                       // structural roof slab; parapet/cornice on top of it
const cx = Math.floor(W / 2);
const cz = Math.floor(D / 2);

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E

function set(x, y, z, id) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  g.set(x, y, z, id);
}

function isEdge(x, z) {
  return DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
}

function exposedFaces(x, z) {
  return DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
}

// 1) Foundation, walls, floors, roof, cornice
for (const [x, z, rawG] of cells) {
  // Clamp so a cell never sits above the roof line
  const gr = Math.min(rawG, top - 1);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < Math.min(gr, top); y++) {
    set(x, y, z, "stone_bricks");
  }

  if (isEdge(x, z)) {
    // Facade (exterior wall column)
    const faces = exposedFaces(x, z);
    const [pdx, pdz] = faces[0];
    const t = pdx !== 0 ? z : x;              // position along the facade
    const bay = t % 4;
    const isWin = bay === 1 || bay === 2;     // piers at bay 0 and 3
    const isEntrance = pdz === 1 && x === cx; // south-facing entrance, centred

    for (let y = gr; y < top; y++) {
      const rel = y - minG;
      let id = "white_concrete";
      if (y === gr) {
        id = "stone_bricks";                  // base course
      } else if (rel === 5 || rel === 10) {
        id = "smooth_stone";                  // storey line and cornice/parapet cap
      } else if ((rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8)) {
        if (isWin) {
          id = "light_blue_stained_glass_pane";
          if (rel <= 2 && isEntrance) id = "glass"; // entrance opening
        }
      }
      set(x, y, z, id);
    }
  } else {
    // Interior cell: floor slabs per storey and the roof slab; air between
    for (const yy of [gr, minG + 5, roofSlabY]) {
      if (yy >= gr && yy < top) set(x, yy, z, "light_gray_concrete");
    }

    // Warm lights in the air gap behind window bays of the facade
    for (const [dx, dz] of DIRS) {
      const wx = x + dx, wz = z + dz;
      if (!has(wx, wz) || has(wx + dx, wz + dz)) continue; // need an exposed wall beside us
      const t = dx !== 0 ? wz : wx;
      const bay = t % 4;
      if (bay !== 1 && bay !== 2) continue;
      if (((t >> 2) & 1) === 0) {
        const y = minG + 2;                   // ground storey, behind glass
        if (y > gr && y < roofSlabY) set(x, y, z, "shroomlight");
      } else {
        const y = minG + 7;                   // upper storey, behind glass
        if (y > gr && y < roofSlabY) set(x, y, z, "glowstone");
      }
    }
  }
}

// 2) Roof equipment: small plant block near the centre, standing on the roof slab
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (has(x, z) && !isEdge(x, z) && top < H) {
      set(x, top, z, "gray_concrete");
    }
  }
}

g.save(OUT);
