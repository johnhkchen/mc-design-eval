// Te Pane-Iriiri: a 1970s-80s office block on Auckland's CBD-edge ridge. Lidar roof heights are median-smoothed and
// snapped to 4-block storeys, so the massing is a stepped tower of concrete and glass: a podium on the low side,
// tiers rising to ~10 storeys, and plant boxes on the top tier. Facades carry storey bands, glass bays with
// mullions, pier corners, a recessed entrance with a canopy, and glowstone lights in some bays behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_969652656.cells.json", "utf8"));
const X = 75, Z = 112, H = 59;
const idx = (x, z) => z * X + x;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const inside = new Uint8Array(X * Z), G = new Int16Array(X * Z), T = new Int16Array(X * Z), R = new Int16Array(X * Z);
for (const [x, z, g, r] of cells) { inside[idx(x, z)] = 1; G[idx(x, z)] = g; R[idx(x, z)] = r; }
const ok = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && inside[idx(x, z)] === 1;

// Tiers: median of the lidar roof over a 5x5 window, snapped to whole storeys (4 blocks), at least one above the ground
for (const [x, z, g] of cells) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (ok(x + dx, z + dz)) vals.push(R[idx(x + dx, z + dz)]);
  vals.sort((a, b) => a - b);
  T[idx(x, z)] = Math.max(g + 4, 4 * Math.round(vals[vals.length >> 1] / 4));
}

// Which sides of a body cell at height y face air: the footprint edge, or a neighbouring column whose top is below y
const exposed = (x, z, y) => {
  const out = [];
  DIRS.forEach(([dx, dz], d) => {
    const nx = x + dx, nz = z + dz;
    if (!ok(nx, nz) || y >= T[idx(nx, nz)]) out.push(d);
  });
  return out;
};
// A solid wall layer one cell inside an exposed face (the wall is two cells thick, so windows can be recessed)
const nearExposed = (x, z, y) => DIRS.some(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return ok(nx, nz) && y >= G[idx(nx, nz)] && y < T[idx(nx, nz)] && exposed(nx, nz, y).length > 0;
});

// Depth from the outer edge (for the plant boxes, which sit set back from the walls)
const depth = new Int16Array(X * Z).fill(-1);
let frontier = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) if (DIRS.some(([dx, dz]) => !ok(x + dx, z + dz))) { depth[idx(x, z)] = 1; frontier.push([x, z]); }
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (ok(nx, nz) && depth[idx(nx, nz)] < 0) { depth[idx(nx, nz)] = depth[idx(x, z)] + 1; next.push([nx, nz]); }
  }
  frontier = next;
}

const g = new Voxels([X, H, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const windows = [];

for (const [x, z, gr] of cells) {
  const t = T[idx(x, z)];
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                       // foundation down to the lowest ground
  for (let y = gr; y < t; y++) {
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }                        // base course / ground floor slab
    if (y === t - 1) { put(x, y, z, "gray_concrete"); continue; }                    // roof deck
    const E = exposed(x, z, y);
    if (E.length >= 1) {                                                              // a facade (stair-stepped edges too: no solid piers)
      const [dx] = DIRS[E[0]];
      const along = dx !== 0 ? z : x;                                                  // position along that facade
      if (y % 4 === 0) put(x, y, z, "smooth_stone");                                    // storey line
      else if (along % 3 === 2) put(x, y, z, "gray_concrete");                          // window mullion
      else { put(x, y, z, "cyan_stained_glass"); windows.push([x, y, z, E[0], along]); }
      continue;
    }
    if (nearExposed(x, z, y)) put(x, y, z, "light_gray_concrete");                      // wall layer
    else if (y % 4 === 0) put(x, y, z, "smooth_stone");                                 // floor slab per storey
    // else: air, the interior
  }
  if (DIRS.some(([dx, dz]) => !ok(x + dx, z + dz))) put(x, t, z, "smooth_stone");      // parapet on the edge
  // roof plant boxes on the upper tiers, set back from the edge
  if (t >= 40 && depth[idx(x, z)] >= 6 && x % 12 >= 3 && x % 12 <= 8 && z % 12 >= 3 && z % 12 <= 7) {
    for (let y = t; y < t + 2; y++) put(x, y, z, "light_gray_concrete");
    put(x, t + 2, z, "smooth_stone");
  }
}

// Windows: an air pocket behind each glass pane, with a glowstone light in some of them
for (const [x, y, z, d, along] of windows) {
  const [dx, dz] = DIRS[d];
  const ix = x - dx, iz = z - dz;
  put(ix, y, iz, "air");
  if ((along + 3 * (y >> 2) + d) % 7 === 0) put(ix, y, iz, "glowstone");
}

// Entrance: on the north face at the middle of the building, a recessed bay with a door, piers and a canopy
const xE = 37;
let zF = 0;
while (!ok(xE, zF)) zF++;
const yE = G[idx(xE, zF)] + 1;
for (const x of [35, 36, 38, 39]) { put(x, yE, zF, "light_gray_concrete"); put(x, yE + 1, zF, "light_gray_concrete"); }
for (let x = 35; x <= 39; x++) put(x, yE + 2, zF, "smooth_stone");                  // canopy
put(xE, yE, zF, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(xE, yE + 1, zF, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 36; x <= 38; x++) for (let y = yE; y <= yE + 1; y++) put(x, y, zF + 1, "air");
for (let x = 36; x <= 38; x++) put(x, yE - 1, zF + 1, "stone_bricks");               // lobby floor
put(xE, yE, zF + 1, "lantern", { hanging: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_969652656.nbt");
const tiers = {};
for (const [x, z] of cells.map(([x, z]) => [x, z])) tiers[T[idx(x, z)]] = (tiers[T[idx(x, z)]] || 0) + 1;
console.log("tiers (top y: columns)", JSON.stringify(tiers), "blocks", g.count(), "windows", windows.length);
