import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// FR241938049: commercial, built 1900, six storeys of pale Haussmann-style stone on a grey plinth, with a zinc
// roof. Footprint 10 x 28; the lidar roof (4th number) is smoothed by a 3x3 median and quantised to whole storeys.
// Outer shell only: an air gap behind the glass, a floor slab per storey, a roof cover over each tier.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938049.cells.json", "utf8"));
const W = 10, D = 28, H = 45, STOREY = 5;
const at = (x, z) => x * 100 + z;
const fp = new Map(cells.map(([x, z, gr, roof]) => [at(x, z), { gr, roof }]));
const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && fp.has(at(x, z));
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

const cols = new Map();
for (const [x, z] of cells) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) vals.push(fp.get(at(x + dx, z + dz)).roof);
  const storeys = Math.min(6, Math.max(3, Math.round(median(vals) / STOREY)));
  cols.set(at(x, z), { x, z, top: storeys * STOREY });
}
const colAt = (x, z) => cols.get(at(x, z));

const DIRS = [["w", -1, 0], ["e", 1, 0], ["n", 0, -1], ["s", 0, 1]];
// the faces a cell at height y shows to the street or the sky: off the footprint, or above a lower neighbour's roof
const exposed = (c, y) => DIRS.filter(([, dx, dz]) => !inFp(c.x + dx, c.z + dz) || colAt(c.x + dx, c.z + dz).top <= y).map(([d]) => d);

// a facade course: string courses and lintels (calcite), piers every third block, a shopfront below, glass in the
// window bays (two of every three blocks), smooth sandstone between
function facade(face, c, y) {
  const u = face === "w" || face === "e" ? c.z : c.x;
  const s = Math.floor(y / STOREY), r = y % STOREY;
  if (r === 0 || r === 4 || u % 3 === 0) return "calcite";
  if (s === 0 && r === 1) return "dark_oak_planks";
  if (r === 2 || r === 3) return "glass_pane";
  return "smooth_sandstone";
}

const g = new Voxels([W, H, D]);
for (const c of cols.values()) {
  for (let y = 0; y <= c.top && y < H; y++) {
    if (y === 0) { g.set(c.x, 0, c.z, "stone_bricks"); continue; }                     // plinth, solid from y 0
    const ex = exposed(c, y);
    if (y === c.top) { if (ex.length) g.set(c.x, y, c.z, "deepslate_tile_wall"); continue; }   // parapet on the shell
    if (y === c.top - 1) { g.set(c.x, y, c.z, ex.length ? "calcite" : "deepslate_tiles"); continue; }
    if (!ex.length) { if (y % STOREY === 0) g.set(c.x, y, c.z, "smooth_stone"); continue; }    // floor slab, air between
    const face = ex[0];
    if (face === "n" && c.x === 4 && (y === 1 || y === 2)) {                              // double-height entrance
      const half = y === 1 ? "lower" : "upper";
      g.set(c.x, y, c.z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (face === "n" && y === 3 && c.x >= 3 && c.x <= 5) { g.set(c.x, y, c.z, "black_concrete"); continue; }  // canopy band over the door
    g.set(c.x, y, c.z, facade(face, c, y));
  }
}

// warm light behind some panes: a glowstone in the room, on the second row of a window
const DIR = Object.fromEntries(DIRS.map(([d, dx, dz]) => [d, [dx, dz]]));
for (const c of cols.values()) for (let y = 1; y < c.top - 1; y++) {
  if (y % STOREY !== 2) continue;
  const ex = exposed(c, y); if (!ex.length) continue;
  const face = ex[0], u = face === "w" || face === "e" ? c.z : c.x, s = Math.floor(y / STOREY);
  if (u % 3 === 0 || (u + 2 * s) % 5 !== 0 || (s === 0)) continue;
  const [dx, dz] = DIR[face], ix = c.x - dx, iz = c.z - dz;
  if (!inFp(ix, iz) || colAt(ix, iz).top <= y || exposed(colAt(ix, iz), y).length) continue;
  g.set(ix, y, iz, "glowstone");
}

// roof equipment on the interior of the tall tiers: two brick chimney stacks
for (const [x, z] of [[3, 6], [6, 16], [4, 22]]) {
  const c = colAt(x, z);
  if (c && c.top >= 25 && !exposed(c, c.top - 1).length) { g.set(x, c.top, z, "bricks"); g.set(x, c.top + 1, z, "bricks"); }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938049.nbt");
