import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618840";
const W = 30, H = 23, D = 14;

// Record: 30 x 14 footprint, roof ~11 blocks above lowest ground.
// Read as a 1990s Taipei mid-rise commercial/office block: two storeys
// (4-block storey, floor band, 4-block storey, roof slab, parapet = 11 blocks),
// cream tiled facade (smooth quartz), white concrete piers, stone base,
// tinted blue glass windows, warm glowstone behind some panes, and a
// ground-floor entrance on the north street face.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);

const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const FACADE = "smooth_quartz";
const PIER = "white_concrete";
const GLASS = "light_blue_stained_glass_pane";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const WARM = "glowstone";

// Find the north-face entrance cell (z-1 missing) nearest the middle.
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (has(x, z - 1)) continue;
    const d = Math.abs(x - 15);
    if (d < best) { best = d; doorCell = [x, z]; }
  }
  if (!doorCell) {
    for (const [x, z] of cells) { doorCell = [x, z]; break; }
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Ground floor surface, upper floor slab, roof slab.
  put(x, gr, z, FLOOR);
  put(x, gr + 5, z, FACADE);
  put(x, gr + 10, z, FLOOR);

  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  const edge = n || s || w || e;

  if (!edge) {
    // Interior: rooftop plant on a sparse grid, air gap above the slabs.
    if (x % 7 === 3 && z % 5 === 2) {
      put(x, gr + 11, z, "iron_block");
    } else if (x % 9 === 6 && z % 4 === 1) {
      put(x, gr + 11, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = (n || s) && (w || e);
  // Position along the street face (for piers and window rhythm).
  const k = (n || s) ? x : z;
  const isPier = corner || (k % 3 === 0);
  const warm = ((k * 5 + gr) % 11) === 2;

  // Ground storey: base course, shopfront glazing, lintel band.
  put(x, gr + 1, z, BASE);
  put(x, gr + 2, z, isPier ? PIER : GLASS);
  put(x, gr + 3, z, isPier ? PIER : GLASS);
  put(x, gr + 4, z, FACADE);

  // Upper storey: spandrel, window band, cornice band.
  put(x, gr + 6, z, FACADE);
  put(x, gr + 7, z, isPier ? PIER : (warm ? WARM : GLASS));
  put(x, gr + 8, z, isPier ? PIER : GLASS);
  put(x, gr + 9, z, FACADE);

  // Parapet on the roof edge.
  put(x, gr + 11, z, corner ? PIER : FACADE);
}

// Entrance on the north face: double door with lintel above.
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = gnd(dx, dz);
  put(dx, gr + 1, dz, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 2, dz, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 3, dz, FACADE);
  put(dx, gr + 4, dz, FACADE);
}

g.save(`${DIR}/${ID}.nbt`);
