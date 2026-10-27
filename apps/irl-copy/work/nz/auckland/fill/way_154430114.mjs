// Auckland CBD, way 154430114: a 1960s-70s concrete-frame office block (white concrete piers, light-grey spandrels,
// blue-glass ribbon windows, the era's typical Auckland office). Stepped tiers from the lidar roof: an 8-storey
// tower on the west, a 7-storey setback, a 6-storey main plate, a 5-storey south wing, and a 2-storey light court in
// the middle. Storey lines every 4 blocks: slab at 4k, two rows of glass, spandrel at 4k+3, so each tier tops out
// at 4k+4 (32, 28, 24, 20) and every storey stands on the slab below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430114.cells.json", "utf8"));
const N = 24, H = 44;
const WHITE = "white_concrete", GREY = "light_gray_concrete", FOUND = "stone", BASE = "stone_bricks";
const PANE = "light_blue_stained_glass_pane", SKY = "light_blue_stained_glass";
const DIRS = [["e", 1, 0], ["w", -1, 0], ["s", 0, 1], ["n", 0, -1]];

// the lidar roof: 3x3 median over the footprint (kills single-cell noise), then one of four clean tiers
const tops = Array.from({ length: N }, () => Array(N).fill(0));
const gnd = Array.from({ length: N }, () => Array(N).fill(0));
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = raw.get(`${x + dx},${z + dz}`); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (m) => (m >= 29 ? 32 : m >= 25 ? 28 : m >= 21 ? 24 : m >= 13 ? 20 : 8);
for (const [x, z, g] of cells) { tops[z][x] = tierOf(median(x, z)); gnd[z][x] = g; }

const inFp = (x, z) => x >= 0 && z >= 0 && x < N && z < N && tops[z][x] > 0;
const T = (x, z) => (inFp(x, z) ? tops[z][x] : 0);
// the sides of (x, y, z) that face air: outside the footprint, or over a lower tier
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !(inFp(x + dx, z + dz) && y < T(x + dx, z + dz))).map(([d]) => d);
// a roof-edge cell: the parapet runs round the outside and down the step to any lower tier
const edge = (x, z) => DIRS.some(([, dx, dz]) => !inFp(x + dx, z + dz) || T(x + dx, z + dz) < T(x, z));

// the block at a cell, as [name, state] or null for air (interior, between the slabs)
function block(x, z, y) {
  if (!inFp(x, z)) return null;
  const t = T(x, z), g = gnd[z][x];
  if (y >= t) return y === t && edge(x, z) ? [WHITE] : null;
  // the entrance: a recessed door on the west face, a canopy over it, a lantern in the porch
  if (x === 2 && (z === 10 || z === 11) && y === 3) return [ "stone_brick_slab", { type: "bottom", waterlogged: "false" } ];
  if (x === 2 && z === 11 && (y === 1 || y === 2)) return [ "dark_oak_door", { facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } ];
  const ex = exposed(x, z, y);
  if (y < g) return [ex.length ? BASE : FOUND];                        // foundation fill under the lidar ground; plinth on the face
  if (y === t - 1) return [t === 8 ? SKY : GREY];                       // roof deck (the court's glass floor is its ground)
  if (y % 4 === 0 || y % 4 === 3) return [GREY];                         // slabs and spandrels, solid across the footprint
  if (!ex.length) return null;                                          // the air gap behind the glass
  if (ex.length >= 2) return [WHITE];                                    // corner pier
  const along = ex[0] === "e" || ex[0] === "w" ? z : x;
  if (along % 4 === 0 && y >= 4) return [WHITE];                         // pier between the 3-pane bays; the ground storey is a continuous shopfront
  return [PANE];
}

// the pane's connections: only along the face, to whatever stands beside it
function paneState(x, z, y) {
  const ex = exposed(x, z, y), st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  const alongZ = ex[0] === "e" || ex[0] === "w";
  if (alongZ) { st.north = block(x, z - 1, y) ? "true" : "false"; st.south = block(x, z + 1, y) ? "true" : "false"; }
  else { st.west = block(x - 1, z, y) ? "true" : "false"; st.east = block(x + 1, z, y) ? "true" : "false"; }
  return st;
}

const g = new Voxels([N, H, N]);
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  const top = T(x, z); if (!top) continue;
  for (let y = 0; y <= top; y++) {
    const b = block(x, z, y); if (!b) continue;
    const state = b[0] === PANE ? paneState(x, z, y) : b[1];
    g.set(x, y, z, b[0], state);
  }
}

// warm light behind some of the lower-row panes: the interior cell just inside the glass (glowstone, lit at dusk)
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  const top = T(x, z); if (!top) continue;
  for (let y = 1; y < top; y += 4) {
    const ex = exposed(x, z, y);
    if (ex.length !== 1 || block(x, z, y)?.[0] !== PANE) continue;
    if ((x * 7 + z * 3 + (y >> 2)) % 3 !== 0) continue;
    const [dx, dz] = { e: [-1, 0], w: [1, 0], s: [0, -1], n: [0, 1] }[ex[0]];
    if (!block(x + dx, z + dz, y)) g.set(x + dx, y, z + dz, "glowstone");
  }
}

// the porch lantern (hanging under the canopy's ceiling) and roof plant on the tower and the main plate
g.set(3, 2, 11, "lantern", { hanging: "true", waterlogged: "false" });
for (let z = 8; z <= 10; z++) for (let x = 4; x <= 6; x++) {
  g.set(x, 32, z, GREY); g.set(x, 33, z, GREY); g.set(x, 34, z, WHITE);
}
for (let z = 5; z <= 6; z++) for (let x = 16; x <= 17; x++) {
  g.set(x, 24, z, "iron_block"); g.set(x, 25, z, GREY);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430114.nbt");
