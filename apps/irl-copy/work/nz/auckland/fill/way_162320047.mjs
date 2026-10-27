// Eclipse Apartments, Mt Eden / Eden Terrace, Auckland (way 162320047): an 11-storey precast-concrete apartment block of
// the 1970s-80s (white panels, pale spandrels, blue-tint glazing in white piers, a volcanic basalt plinth since the city
// is built on cones). The lidar roof (51 above y 0 under most of the footprint) is median-smoothed and snapped to a
// 4-block storey grid from a datum at y 7 (the uphill ground): 11 storeys stand exactly on it, lower edge wings step down.
// Every column is solid from y 0 to its datum (the plinth, so nothing floats on the slope) and then stacked storeys: a
// basalt base course, a grey floor line, two rows of glass in white piers, a pale spandrel. Walls are one block thick
// with air behind the glass and a solid slab per storey. Some bays are open loggias (iron railings), a recessed lobby
// faces north with a lintel and a hanging lantern, and some windows show glowstone behind the glass at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162320047.cells.json", "utf8"));
const W = 39, D = 35, H = 63, DATUM = 7, STOREY = 4;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                              // G: ground (-1 = outside the footprint), R: lidar roof
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar roof, 3x3 median over the footprint, then snapped to the storey grid (at least two storeys)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const TOP = grid(0);                                          // a column occupies y < TOP
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const n = Math.max(2, Math.round((median(x, z) - DATUM) / STOREY));
  TOP[x][z] = DATUM + STOREY * n; tiers[TOP[x][z]] = (tiers[TOP[x][z]] || 0) + 1;
}
console.log("roof tiers (top y: cells)", JSON.stringify(tiers));

// a face is exposed at height y if the cell beside it is outside the footprint or stops below y
const exposedAt = (x, z, y) => DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || TOP[x + dx][z + dz] <= y);
const outwardOf = (x, z, y) => DIRS.find(([dx, dz]) => !inside(x + dx, z + dz) || TOP[x + dx][z + dz] <= y);

// the lobby: the middle of the north run (the four-cell north edge), recessed one cell, door one cell in
const LOBBY_X = 16, LOBBY = [15, 16, 17];

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
let glows = 0;

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const top = TOP[x][z];
  for (let y = 0; y < top; y++) {
    const ext = exposedAt(x, z, y);
    // plinth: basalt on the outside, stone within, solid up to the datum
    if (y < DATUM) { put(x, y, z, ext ? "polished_basalt" : "stone"); continue; }
    const s = Math.floor((y - DATUM) / STOREY), r = (y - DATUM) % STOREY;
    const roofRow = y === top - 1;
    if (r === 0) {                                             // floor line / slab; ground storey gets a basalt base course
      put(x, y, z, ext ? (s === 0 ? "polished_basalt" : "smooth_stone") : "smooth_stone");
      continue;
    }
    if (r === 3) {                                             // spandrel, or the roof deck and coping on the top row
      if (roofRow) put(x, y, z, ext ? "smooth_stone" : "light_gray_concrete");
      else if (ext) put(x, y, z, "light_gray_concrete");
      continue;                                                // interior spandrel row is air behind the glass
    }
    if (!ext) continue;                                        // rows 1-2 inside: air gap
    // rows 1-2 on the outside: the lobby recess, loggias on some bays above the ground, else glass in white piers
    const onNorthRing = z === 0 && !inside(x, -1);
    if (onNorthRing && LOBBY.includes(x)) continue;            // recess: air in rows 1-2
    if (s >= 1 && (x + z + s) % 7 === 0) { if (r === 1) put(x, y, z, "iron_bars"); continue; }   // loggia: railing, open above
    if ((x + z) % 3 === 0) { put(x, y, z, "white_concrete"); continue; }                        // pier
    put(x, y, z, "light_blue_stained_glass_pane");
    // warm light behind some panes
    if ((x * 7 + z * 5 + y * 3) % 17 === 0) {
      const [dx, dz] = outwardOf(x, z, y);
      const nx = x - dx, nz = z - dz;
      if (inside(nx, nz) && !exposedAt(nx, nz, y)) { put(nx, y, nz, "glowstone"); glows++; }
    }
  }
}

// lobby: the spandrel row over the recess is its lintel; a hanging lantern under it, a glazed door one cell in
put(LOBBY_X, DATUM + 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
put(LOBBY_X, DATUM, 1, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(LOBBY_X, DATUM + 1, 1, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// roof plant: a lift overrun and plant box on the flat roof, set in from the coping
for (let x = 16; x <= 18; x++) for (let z = 15; z <= 17; z++) {
  if (TOP[x][z] !== 51) continue;
  put(x, 51, z, "light_gray_concrete"); put(x, 52, z, "light_gray_concrete");
  put(x, 53, z, x === 17 && z === 16 ? "iron_bars" : "smooth_stone");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162320047.nbt");
console.log("built", g.count(), "blocks,", glows, "lit panes");
