// 10 East 47th Street (1913), commercial and office block, built from the lidar cells.
// Massing: each cell's roof is median-smoothed over its neighbours and snapped to a storey tier (3-block storeys, floor
// lines at y = 1 mod 3). Walls are one block thick with air behind the glass and a floor slab per storey, so the shell
// is what the eye reads. Street front on z = 0 (47th Street, shopfronts and the entrance), the 129-block tower is the
// two-cell sliver along the west edge (x 0..1), the east flank rises in a one-cell wall, and the rear court is open to the south.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1035406.cells.json`, "utf8"));
const X = 23, Z = 28, YMAX = 141;

// Raw per-cell ground (G) and roof (R), indexed [x][z].
const G = [...Array(X)].map(() => []), R = [...Array(X)].map(() => []);
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }

// Smooth lidar noise: median of the 3x3 neighbourhood (in-footprint cells only).
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const xx = x + dx, zz = z + dz;
    if (xx >= 0 && zz >= 0 && xx < X && zz < Z) v.push(R[xx][zz]);
  }
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};

// Snap a smoothed roof to a storey tier. Tops sit on floor lines (top - 1 = 1 mod 3), so each tier's roof is a storey slab.
// Returns 0 for no building: the ground court, light wells and open yard (roof <= 1).
const tier = (r) => {
  if (r <= 1) return 0;
  if (r <= 6) return 5;      // one-storey lower wing
  if (r <= 9) return 8;      // two storeys
  if (r <= 13) return 11;    // three
  if (r <= 24) return 20;    // six storeys (the main Fifth-Avenue-scale block)
  if (r <= 31) return 29;    // nine: the setback
  if (r <= 37) return 35;
  if (r <= 47) return 41;    // setback tier over the tower's ends
  if (r <= 58) return 56;
  if (r <= 70) return 68;
  if (r <= 100) return 80;   // east flank
  return 129;                // the tower
};

const T = [...Array(X)].map(() => []), B0 = [...Array(X)].map(() => []);
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  T[x][z] = tier(median(x, z));
  B0[x][z] = Math.max(G[x][z], 1);
}

// Building occupancy (the solid volume before the walls are hollowed out) and the ground below it.
const occ = (x, y, z) => x >= 0 && z >= 0 && x < X && z < Z && T[x][z] > 0 && y >= B0[x][z] && y < T[x][z];
const ground = (x, y, z) => x >= 0 && z >= 0 && x < X && z < Z && y < Math.max(G[x][z], 1);
const solid = (x, y, z) => y >= 0 && (ground(x, y, z) || occ(x, y, z));

// Classify each occupied voxel: 1 = interior (air behind the glass, slab on floor lines), 2 = shell (wall, roof or cap).
const idx = (x, y, z) => (z * YMAX + y) * X + x;
const kind = new Uint8Array(X * YMAX * Z);
const exposed = (x, y, z) => ({
  n: !solid(x, y, z - 1), s: !solid(x, y, z + 1), w: !solid(x - 1, y, z), e: !solid(x + 1, y, z), top: !solid(x, y + 1, z),
});
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 0; y < YMAX; y++) {
  if (!occ(x, y, z)) continue;
  const f = exposed(x, y, z);
  kind[idx(x, y, z)] = (f.n || f.s || f.w || f.e || f.top) ? 2 : 1;
}

const g = new Voxels([X, YMAX, Z]);

// Foundation to each cell's ground (stone), the paved yard at y 0 (smooth stone), and the court surface.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  for (let y = 0; y < Math.max(G[x][z], 1); y++) g.set(x, y, z, y < G[x][z] ? "stone_bricks" : "smooth_stone");
  if (T[x][z] === 0) g.set(x, 0, z, "smooth_stone");
}

// Walls, floors, roofs.
const windows = [];   // window voxels with the direction into the room, for the warm lights
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 0; y < YMAX; y++) {
  if (kind[idx(x, y, z)] === 0) continue;
  if (kind[idx(x, y, z)] === 1) { if (y % 3 === 1) g.set(x, y, z, "stone"); continue; }   // floor slab; the rest is air

  const f = exposed(x, y, z);
  const sideOpen = f.n || f.s || f.w || f.e;
  if (!sideOpen) { g.set(x, y, z, "smooth_stone"); continue; }                              // roof field

  if (f.top) {                                                                               // cornice and parapet
    g.set(x, y, z, "smooth_sandstone");
    g.set(x, y + 1, z, "sandstone_wall");
    continue;
  }

  // Facade. Bays run along x on a z-face and along z on an x-face; every fourth bay is a pier.
  const alongX = f.n || f.s;
  const bay = alongX ? x : z;
  const pier = bay % 4 === 0;
  const ym = y % 3;
  if (y === 1) { g.set(x, y, z, "polished_granite"); continue; }                             // base course
  if (ym === 1) { g.set(x, y, z, "smooth_sandstone"); continue; }                            // spandrel band
  if (pier) { g.set(x, y, z, y <= 3 ? "polished_granite" : "cut_sandstone"); continue; }
  if (y <= 3) { g.set(x, y, z, "glass"); }                                                  // shopfront glass
  else {
    const pane = alongX ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
                        : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", pane);
  }
  // Inward direction for the window's warm light.
  const [dx, dz] = f.n ? [0, 1] : f.s ? [0, -1] : f.w ? [1, 0] : [-1, 0];
  windows.push([x, y, z, dx, dz]);
}

// Entrance: a pair of dark-oak doors in the bay pair (10, 11) on 47th Street, with hanging lanterns above.
for (const x of [10, 11]) {
  const hinge = x === 10 ? "left" : "right";
  const door = { facing: "north", hinge, open: "false", powered: "false" };
  g.set(x, 1, 0, "dark_oak_door", { ...door, half: "lower" });
  g.set(x, 2, 0, "dark_oak_door", { ...door, half: "upper" });
  g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light in some windows: glowstone or shroomlight just inside the glass, where the room is air.
for (const [x, y, z, dx, dz] of windows) {
  const h = (x * 7 + z * 5 + y * 3) % 13;
  if (h !== 0 && h !== 6) continue;
  const ix = x + dx, iz = z + dz;
  if (ix < 0 || iz < 0 || ix >= X || iz >= Z) continue;
  if (kind[idx(ix, y, iz)] !== 1) continue;
  g.set(ix, y, iz, h === 0 ? "glowstone" : "shroomlight");
}

// Mechanical penthouse on the six-storey roof: walls of stone brick with a glass band, a flat cap, and a lantern on it.
for (let z = 4; z <= 8; z++) for (let x = 7; x <= 11; x++) {
  if (T[x][19] === 0 || !occ(x, 19, z)) continue;
  const edge = x === 7 || x === 11 || z === 4 || z === 8;
  for (let y = 20; y <= 22; y++) {
    if (y === 22) g.set(x, y, z, "smooth_stone");
    else if (!edge) continue;
    else if (y === 21) g.set(x, y, z, "glass");
    else g.set(x, y, z, "stone_bricks");
  }
}
g.set(9, 23, 6, "lantern", { hanging: "false", waterlogged: "false" });

const stats = g.save(`${HERE}/NYC1035406.nbt`);
console.log(JSON.stringify({ ...stats, windows: windows.length, tiers: [...new Set(T.flat())].sort((a, b) => a - b) }));
