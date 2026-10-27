// Mt Eden / Newton-edge commercial block, c.1930s: red brick on a stone plinth, cream plaster string courses and pilasters,
// a three-storey core stepping down to two-storey wings, glazed shopfronts with dark doors and a canopy line, flat parapet roof
// with plant. Massing: lidar roof heights smoothed into three flat tiers (13, 9, 8 blocks above y 0).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_442037504.cells.json", "utf8"));
const W = 32, D = 48, Y = 26;

// lidar roof -> clean tiers: the 3-storey core (13 = three storeys and a parapet), 2-storey wings (9), low tips (8)
const tier = (r) => (r >= 12 ? 13 : r >= 9 ? 9 : 8);
const col = new Map();
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { g: ground, H: tier(roof) });
const at = (x, z) => col.get(`${x},${z}`);
const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];

// the faces a cell shows at height y: a neighbour outside the footprint, or one whose tier stops below y
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || y >= n.H; });

const M = { plinth: "stone_bricks", brick: "bricks", plaster: "white_concrete", cap: "smooth_stone", canopy: "black_concrete", glass: "glass_pane", door: "dark_oak_door", lamp: "glowstone" };
const storeyGlass = (gr, y) => y === gr + 1 || y === gr + 2 || y === 5 || y === 6 || y === 9 || y === 10;

const g = new Voxels([W, Y, D]);
const doorAt = new Set();   // entrance cells, so the glow pass skips them

for (const [key, { g: gr, H }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, M.plinth);             // foundation under the slope
  for (let y = gr; y < H; y++) {
    if (y === H - 1) { g.set(x, y, z, M.cap); continue; }           // roof deck / parapet cap, every cell
    const ex = faces(x, z, y);
    if (!ex.length) {                                                 // interior: a floor slab per storey, air above
      if (y === gr || y === 4 || y === 8) g.set(x, y, z, M.cap);
      continue;
    }
    const [dx, dz, face] = ex[0];                                     // the bay runs along the face the cell shows
    const bay = dx !== 0 ? z : x, idx = bay % 4;
    const outside = !at(x + dx, z + dz);
    const entrance = outside && bay % 16 === 9;
    if (entrance && (y === gr || y === gr + 1)) {
      doorAt.add(`${x},${y},${z}`);
      g.set(x, y, z, M.door, { facing: face, half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (entrance && y === gr + 2) { g.set(x, y, z, M.canopy); continue; }
    if (y === gr) { g.set(x, y, z, M.plinth); continue; }
    if (y === 4 || y === 8 || (H >= 9 && y === H - 2)) { g.set(x, y, z, M.plaster); continue; }   // string courses, cornice
    if (storeyGlass(gr, y) && (idx === 1 || idx === 2)) {
      const along = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
      g.set(x, y, z, M.glass, { ...along, waterlogged: "false" }); continue;
    }
    g.set(x, y, z, idx === 3 ? M.plaster : M.brick);                 // pilasters and wall
  }
}

// warm light behind some shopfront and window glass: a glowstone on the floor slab just inside the glass
for (const [key, { g: gr, H }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (const [dx, dz, face] of DIRS) {
    if (at(x + dx, z + dz)) continue;                                 // outside faces only
    const bay = dx !== 0 ? z : x;
    if (bay % 8 !== 5) continue;
    const ix = x - dx, iz = z - dz, n = at(ix, iz);
    if (!n) continue;
    for (const y of [gr + 1, 5, 9]) {
      if (y >= H - 1 || y >= n.H || doorAt.has(`${x},${y},${z}`)) continue;
      if (!storeyGlass(gr, y) || faces(ix, iz, y).length) continue;
      if (y - 1 !== gr && y - 1 !== 4 && y - 1 !== 8) continue;      // must stand on a floor slab
      g.set(ix, y, iz, M.lamp);
      break;
    }
  }
}

// roof plant: a few 2 x 2 plant rooms on the top tier's deck, well inside the edges (not a field of stubs)
for (const [key, { H }] of col) {
  const [x, z] = key.split(",").map(Number);
  if (H !== 13 || x % 12 !== 6 || z % 12 !== 6) continue;
  if ([[0, 0], [1, 0], [0, 1], [1, 1]].some(([i, j]) => faces(x + i, z + j, H - 2).length)) continue;
  for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    g.set(x + i, H, z + j, M.brick);
    g.set(x + i, H + 1, z + j, M.plaster);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_442037504.nbt");
