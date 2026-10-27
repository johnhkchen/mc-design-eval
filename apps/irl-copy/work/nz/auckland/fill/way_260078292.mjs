// Hobson Heights (way 260078292): a 1980s concrete-frame office block on a basalt plinth, nine storeys over a
// six-block base, on the slope above the Viaduct side of Hobson Street. The lidar roof is median-smoothed over each cell's
// 3x3 neighbourhood and snapped to the 4-block storey grid from a common datum (6, the highest ground under the footprint),
// so the core stands at 42, the wings step down to 10-38 and every tier sits on the one below. The skin is a storey rhythm:
// light-grey spandrels at each floor line, tinted glazing with white piers between, a cornice on each roof edge. The
// downhill side shows its basalt plinth down to y 0. A cyan shopfront runs along the ground floor, with a dark-oak door on
// the north face under a stone-brick header. Glowstone and shroomlight sit behind some panes. A two-storey plant room with
// tinted glass stands on the core's roof. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260078292.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260078292.nbt";
const SIZE = [39, 55, 37];
const DATUM = 6;      // the storey grid's zero: the highest ground under the footprint (the north entrance stands on it)
const STOREY = 4;     // blocks per storey (3.3 m at 1.2 blocks a metre)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DOOR = [12, 0];  // the north face, at the high ground

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const lidar = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));
const median = (v) => v.sort((a, b) => a - b)[v.length >> 1];

// each cell's top: the 3x3 median of the lidar roof, snapped to the storey grid
const top = new Map();
for (const [x, z] of cells) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = lidar.get(key(x + dx, z + dz)); if (r !== undefined) near.push(r);
  }
  const storeys = Math.max(1, Math.round((median(near) - DATUM) / STOREY));
  top.set(key(x, z), DATUM + STOREY * storeys);
}
const topOf = (x, z) => top.get(key(x, z));   // undefined outside the footprint

// the outward sides of the block at x, y, z: a side with nothing beside it, or a lower tier beside it
const exposure = (x, y, z, nb) => DIRS.filter(([dx, dz]) => { const t = nb(x + dx, z + dz); return t === undefined || t <= y; });

// one storey's skin: r = row in the storey (0 and 3 are spandrels, 1 and 2 glazing), the top row is the cornice
function skin({ x, z, y, base, topY, glass, shop, glassBlock = glass }) {
  const r = (y - base) % STOREY;
  if (y === topY - 1) return "smooth_stone";
  if (r === 0 || r === 3) return "light_gray_concrete";
  const pier = (x + z) % 3 === 0;
  if (shop) return pier ? "black_concrete" : "cyan_stained_glass";
  return pier ? "white_concrete" : glassBlock;
}

const g = new Voxels(SIZE);
const glowing = [];   // [x, y, z, inward x, inward z] for the lamps behind the panes

// the tower: solid from y 0, the basalt plinth to the datum, then storeys to each cell's top
for (const [x, z] of cells) {
  const tp = topOf(x, z);
  for (let y = 0; y < tp; y++) {
    const ext = exposure(x, y, z, topOf);
    if (y < DATUM) {
      g.set(x, y, z, !ext.length ? "cobbled_deepslate" : y === DATUM - 1 ? "polished_deepslate" : "deepslate_bricks");
      continue;
    }
    const r = (y - DATUM) % STOREY, s = Math.floor((y - DATUM) / STOREY);
    if (!ext.length) { if (r === 0 || r === 3) g.set(x, y, z, "stone"); continue; }   // interior: slabs, air between
    if (x === DOOR[0] && z === DOOR[1] && y <= DATUM + 1) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === DATUM ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === DOOR[0] && z === DOOR[1] && y === DATUM + 2) { g.set(x, y, z, "stone_bricks"); continue; }
    if (x === DOOR[0] + 1 && z === DOOR[1] && s === 0 && r >= 1) { g.set(x, y, z, "black_concrete"); continue; }
    g.set(x, y, z, skin({ x, z, y, base: DATUM, topY: tp, glass: "light_blue_stained_glass", shop: s === 0 }));
    if ((r === 1 || r === 2) && ext.length) {
      const [dx, dz] = ext[0];
      const ix = x - dx, iz = z - dz;                      // the room behind this pane, inward
      if (topOf(x + dx, z + dz) === undefined && topOf(ix, iz) !== undefined && (x * 7 + z * 11 + s * 5 + r) % 12 === 0) glowing.push([ix, y, iz, s]);
    }
  }
}
for (const [ix, y, iz, s] of glowing) {
  if (exposure(ix, y, iz, topOf).length) continue;      // the cell behind must be room, not wall
  g.set(ix, y, iz, (ix + iz + s) % 2 ? "glowstone" : "shroomlight");
}

// the plant room: the largest 7 x 6 box on the core's roof (top 42) nearest the middle of the footprint
const PH_BASE = 42, PH_TOP = 50, PH_W = 7, PH_D = 6;
let best = null;
for (let x0 = 0; x0 + PH_W <= SIZE[0]; x0++) for (let z0 = 0; z0 + PH_D <= SIZE[2]; z0++) {
  let ok = true;
  for (let x = x0; x < x0 + PH_W && ok; x++) for (let z = z0; z < z0 + PH_D && ok; z++) ok = topOf(x, z) === PH_BASE;
  if (!ok) continue;
  const d = Math.hypot(x0 + PH_W / 2 - 19, z0 + PH_D / 2 - 18);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) {
  const inRoom = (x, z) => x >= best.x0 && x < best.x0 + PH_W && z >= best.z0 && z < best.z0 + PH_D;
  const nb = (x, z) => (inRoom(x, z) ? PH_TOP : undefined);
  for (let x = best.x0; x < best.x0 + PH_W; x++) for (let z = best.z0; z < best.z0 + PH_D; z++) {
    for (let y = PH_BASE; y < PH_TOP; y++) {
      const ext = exposure(x, y, z, nb);
      if (!ext.length) { const r = (y - PH_BASE) % STOREY; if (r === 0 || r === 3) g.set(x, y, z, "stone"); continue; }
      g.set(x, y, z, skin({ x, z, y, base: PH_BASE, topY: PH_TOP, glass: "tinted_glass", shop: false }));
    }
  }
}

const stats = g.save(OUT);
console.log(`Hobson Heights: ${stats.blocks} blocks, ${stats.palette} palette entries, footprint ${cells.length} cells, top ${Math.max(...[...top.values()])}, plant room ${best ? "on" : "none"}`);
