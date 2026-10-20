import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 臺北市政府松德大樓: a 1990s municipal office block, two storeys above a plinth
// with a parapet at y 11. White concrete frame, stone bands, blue-tinted glazing in
// grey mullions, and a glazed entrance with a stone surround on the low-z face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw138259005";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 70, H = 23, D = 100;
const ROOF = 11;     // parapet cap row; roof surface sits at 11 for every cell
const FLOOR2 = 5;    // second-floor slab / storey band
const CORNICE = 10;  // top of the upper storey wall
const SILL = 6;      // upper window sill course

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
for (const [x, z, gr] of cells) groundMap.set(key(x, z), gr);
const has = (x, z) => groundMap.has(key(x, z));
const gnd = (x, z) => groundMap.get(key(x, z));

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => dirs.some(([dx, dz]) => !has(x + dx, z + dz));

// Facade descriptor: bay index along the face, and the inward direction.
function facade(x, z) {
  if (!has(x - 1, z)) return { bay: z, dx: 1, dz: 0 };
  if (!has(x + 1, z)) return { bay: z, dx: -1, dz: 0 };
  if (!has(x, z - 1)) return { bay: x, dx: 0, dz: 1 };
  return { bay: x, dx: 0, dz: -1 };
}

// Entrance: on the low-z face, centred on the median x of that face.
const frontXs = cells
  .filter(([x, z]) => !has(x, z - 1) && has(x - 1, z) && has(x + 1, z))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceMid = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -999;
const isEntrance = (x, z) =>
  frontXs.length > 0 && !has(x, z - 1) && has(x - 1, z) && has(x + 1, z) &&
  Math.abs(x - entranceMid) <= 2;
const isEntranceFlank = (x, z) =>
  frontXs.length > 0 && !has(x, z - 1) && has(x - 1, z) && has(x + 1, z) &&
  Math.abs(x - entranceMid) === 3;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slabs and air gaps, roof slab, roof plant with caps.
    g.set(x, gr, z, "gray_concrete");
    if (FLOOR2 > gr) g.set(x, FLOOR2, z, "gray_concrete");
    g.set(x, ROOF, z, "light_gray_concrete");
    if (x % 13 === 6 && z % 13 === 6) {
      g.set(x, 12, z, "light_gray_concrete");
      g.set(x, 13, z, "light_gray_concrete");
      g.set(x, 14, z, "smooth_stone_slab");
    }
    continue;
  }

  // Edge (facade) cell.
  const f = facade(x, z);
  const entr = isEntrance(x, z);
  const flank = isEntranceFlank(x, z);

  for (let y = gr; y <= ROOF; y++) {
    let id;
    if (y === gr || y === FLOOR2 || y === CORNICE || y === ROOF) {
      id = "smooth_stone";                       // base, storey band, cornice, parapet
    } else if (entr && y > gr && y <= gr + 3) {
      id = "light_blue_stained_glass";           // entrance glazing
    } else if (entr && y === gr + 4) {
      id = "stone_bricks";                       // entrance lintel
    } else if (flank && y > gr && y <= gr + 4) {
      id = "stone_bricks";                       // entrance surround
    } else if (y === SILL && f.bay % 4 !== 0) {
      id = "light_gray_concrete";                // upper sill course
    } else if (f.bay % 4 === 0) {
      id = "light_gray_concrete";                // mullion / pier
    } else {
      id = "light_blue_stained_glass_pane";      // window glazing
    }
    g.set(x, y, z, id);
  }

  // Warm light behind some windows, in the adjacent interior cell (air gap).
  if (!entr) {
    const ix = x + f.dx, iz = z + f.dz;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      for (const y of [2, 7]) {
        if (y > gr && gnd(ix, iz) < y && f.bay % 8 === 2) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Lanterns flanking the entrance, on the surround at door height.
  if (flank && Math.abs(x - entranceMid) === 3) {
    const lx = x, lz = z;
    if (gr + 1 < ROOF) g.set(lx, gr + 1, lz, "lantern");
  }
}

g.save(`${DIR}/${ID}.nbt`);
