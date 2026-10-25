import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499739";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 27, D = 14;
const g = new Voxels([W, H, D]);

const set = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Cream render (1990 commercial), stone plinth, quartz storey bands.
const WALL = "smooth_quartz";
const BASE = "stone_bricks";
const BAND = "quartz_block";
const BOTTOM = () => ({ type: "bottom", waterlogged: "false" });

const M = new Map();
for (const [x, z, gr, rf] of cells) M.set(x + "," + z, { g: gr, r: rf });
const has = (x, z) => M.has(x + "," + z);

// One datum for the whole building: highest ground under the footprint.
const G = Math.max(...cells.map((c) => c[2]));
// One roof level: median lidar roof height, kept clear of the top of the grid.
const rfSorted = cells.map((c) => c[3]).sort((a, b) => a - b);
const R = Math.min(H - 2, Math.max(G + 11, rfSorted[Math.floor(rfSorted.length / 2)]));

// Entrance: middle of the south exterior cells.
const southX = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southX.length ? southX[Math.floor(southX.length / 2)] : -1;

// Two-wide window bays with single-block piers: pattern P W W P W W ...
const isWindowBay = (u) => u % 3 !== 0;

for (const [k] of M) {
  const [x, z] = k.split(",").map(Number);

  const ext = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const nExt = Object.values(ext).filter(Boolean).length;
  const perim = nExt > 0;
  const single = nExt === 1;
  const u = ext.n || ext.s ? x : z;
  const windowFace = single && isWindowBay(u);
  const doorCell = single && ext.s && x === doorX;

  // Solid podium from y0 to the common datum: no floating floors, one plinth line.
  for (let y = 0; y < G; y++) set(x, y, z, BASE);

  if (!perim) {
    // Interior: floor and roof slabs only, air between (no interiors modelled).
    for (const y of [G, G + 5, G + 10]) if (y < R) set(x, y, z, WALL);
    // Warm lights standing on the floor decks.
    if (x % 3 === 1 && z % 3 === 1) set(x, G + 1, z, "lantern", { hanging: "false" });
    if ((x + z) % 4 === 0 && G + 6 < R) set(x, G + 6, z, "glowstone");

    // Setback penthouse tier on the core, rising to the roof.
    const core = x >= 2 && x <= W - 3 && z >= 2 && z <= D - 3;
    if (core && R > G + 12) {
      for (let y = G + 11; y <= R - 2; y++) set(x, y, z, WALL);
      set(x, R - 1, z, "stone_brick_slab", BOTTOM());
      if (x === 7 && z === 6) {
        set(x, R, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
      }
    }
  } else {
    // Facade, storey by storey on the common datum.
    for (let y = G; y <= G + 10 && y < R; y++) {
      const o = y - G;
      let b = WALL, p;

      if (doorCell) {
        if (o === 0) { b = "oak_door"; p = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
        else if (o === 1) { b = "oak_door"; p = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
        else if (o === 2) b = BASE;
        else if (o === 3) { b = "stone_brick_slab"; p = BOTTOM(); }
        else if (o === 4) b = BASE;
        else if (o === 5) b = BAND;
        else if (o <= 8) b = windowFace ? "glass_pane" : WALL;
        else if (o === 9) b = WALL;
        else if (o === 10) { b = "smooth_quartz_slab"; p = BOTTOM(); }
      } else if (o === 0) b = BASE;
      else if (o <= 3) b = windowFace ? "glass" : WALL;
      else if (o === 4) b = BASE;
      else if (o === 5) b = BAND;
      else if (o <= 8) b = windowFace ? "glass_pane" : WALL;
      else if (o === 9) b = WALL;
      else if (o === 10) { b = "smooth_quartz_slab"; p = BOTTOM(); }

      set(x, y, z, b, p);
    }

    // Parapet capping the two-storey mass, uniform across the footprint.
    if (G + 11 < R) set(x, G + 11, z, "stone_brick_wall");
  }
}

g.save(`${DIR}/${ID}.nbt`);
