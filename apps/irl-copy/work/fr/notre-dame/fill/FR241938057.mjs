// FR241938057: Hôtel Notre-Dame, an unrecorded-use hôtel on the Ile de la Cité's river side: a thin L of cream limestone
// (stone or render, unrecorded) round a 21-block footprint. The lidar tops run 5 to 7 blocks, so the massing is two
// clean tiers: a one-storey 5-block tier and a two-storey 7-block tier. Each cell takes the median top of itself and its
// footprint neighbours, so the 5/7 jitter along the east wing settles into one line. Each storey is a band course (a
// storey line at y 3), the base course is a stone-brick plinth, and the top is a sandstone cornice. The footprint's outer
// ring is walls; the interior cells are floor slabs and a roof cap with air between, so the glass has room behind it.
// The entrance is on the north street face at x 12, a dark oak door two blocks high; the ground floor and upper windows
// are glass panes in bays three cells apart. Chimneys stand on the roof cap; a few warm shroomlights sit in the
// interior air behind the windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938057.cells.json", "utf8"));

const BODY = "calcite";            // Paris limestone, cream
const BASE = "stone_bricks";       // plinth and base course
const BAND = "smooth_sandstone";   // storey line and cornice
const FLOOR = "smooth_stone";      // storey slabs
const ROOF = "deepslate_tiles";    // slate roof cap inside the cornice
const PANE = "glass_pane";         // windows
const CHIM = "bricks";             // chimney stacks
const LIGHT = "shroomlight";       // warm light behind a window
const DOOR_X = 12;                 // the entrance on the north street face

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => byXZ.has(`${x},${z}`);
const edgeOf = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// The tier of a cell: the median lidar top of its 3 x 3 footprint neighbourhood, snapped to 5 (one storey) or 7 (two)
const tierAt = (x, z) => {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = byXZ.get(`${x + dx},${z + dz}`); if (c) vals.push(c.r); }
  vals.sort((a, b) => a - b);
  return vals[vals.length >> 1] >= 6 ? 7 : 5;
};

const H = 23;
const g = new Voxels([21, H, 21]);
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // runs along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // runs along z

const tiers = new Map();
for (const [x, z, gr] of cells) {
  const T = tierAt(x, z);
  tiers.set(`${x},${z}`, T);
  const edge = edgeOf(x, z);
  const north = !inFp(x, z - 1), south = !inFp(x, z + 1), west = !inFp(x - 1, z), east = !inFp(x + 1, z);
  const alongX = north || south;                  // the face runs along x, so its windows are placed by x
  const along = alongX ? x : z;
  const face = north || south || west || east;
  const windowCol = face && along % 3 === 1;      // one window column every three cells, as a bay
  const door = north && x === DOOR_X && z === 0;

  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);           // foundation: nothing floats on the slope
  for (let y = gr; y < T; y++) {
    if (!edge) {                                                 // interior: floor slabs and the roof cap only
      if (y === gr || y === 3) g.set(x, y, z, FLOOR);
      else if (y === T - 1) g.set(x, y, z, ROOF);
      continue;
    }
    if (door && (y === gr + 1 || y === gr + 2)) {                 // entrance: a two-block dark oak door
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === gr) { g.set(x, y, z, BASE); continue; }            // base course
    if (y === T - 1 || y === 3) { g.set(x, y, z, BAND); continue; }   // cornice and storey line
    if (windowCol) { g.set(x, y, z, PANE, alongX ? PANE_NS : PANE_EW); continue; }   // glass, bays three apart
    g.set(x, y, z, BODY);
  }
}

// Chimney stacks on the roof cap, two blocks above the cornice line
for (const [x, z] of [[18, 6], [19, 15]]) {
  if (!inFp(x, z) || edgeOf(x, z)) continue;
  const T = tiers.get(`${x},${z}`);
  g.set(x, T, z, CHIM); g.set(x, T + 1, z, CHIM);
}

// Warm lights in the interior air behind some windows, so the upper floors glow at dusk
for (const [x, z, gr] of cells) {
  if (edgeOf(x, z)) continue;
  const y = gr + 1;
  const nearWindow = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return inFp(nx, nz) && edgeOf(nx, nz) && (nx % 3 === 1 || nz % 3 === 1) && !(nz === 0 && nx === DOOR_X);
  });
  if (nearWindow && (x * 7 + z * 3) % 4 === 0 && !g.get(x, y, z)) g.set(x, y, z, LIGHT);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938057.nbt");
