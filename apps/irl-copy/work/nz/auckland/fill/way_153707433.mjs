// Hamburg Süd House, Auckland (way 153707433): a 1980s-90s office block of the Viaduct and Quay Street kind, eleven to
// thirteen storeys (lidar roof 44 to 52 blocks above the lowest ground, 1.2 blocks a metre) on a basalt plinth. The lidar
// roof is median-smoothed and snapped to the 4-block storey grid: a 52 core (a plant room on it), a 48 ring, a 44 body
// and 24 wings on the northwest edge. Each cell's ground is smoothed and its floors start at the next 4-block line, so
// the plinth stands on the street and the downhill side shows its extra storeys. Facade: basalt base course and shopfront
// on the ground floor, white floor bands, light-blue glass panes between white piers (every third block), light-grey
// spandrels, a stone cornice and parapet. A dark-oak entrance on the street face, warm glowstone behind some panes.
// Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153707433.cells.json", "utf8"));
const W = 31, D = 30, TOP = 65;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (lowest-ground datum), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// median of a neighbourhood (radius n) inside the footprint: lidar noise out, edges kept
const median = (A, x, z, n = 1) => {
  const v = [];
  for (let dx = -n; dx <= n; dx++) for (let dz = -n; dz <= n; dz++) if (inside(x + dx, z + dz)) v.push(A[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

// per cell: B = floor line (the ground rounded up to a storey line, so no air under the first storey), T = roof top
const B = Array.from({ length: W }, () => Array(D).fill(0));
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const b = 4 * Math.ceil(median(G, x, z) / 4);
  const r = median(R, x, z, 2);                                   // 5 by 5: no slivers of a tier on the edge
  const t = r >= 50 ? 52 : r >= 46 ? 48 : r >= 40 ? 44 : 24;      // tiers: core, ring, body, wings
  B[x][z] = b; T[x][z] = Math.max(t, b + 4);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
// a face of a cell at height y is open to the air when the neighbour has no storey there (or is outside the footprint)
const exposed = (x, z, y, k) => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y >= T[nx][nz];
};
const sidesAt = (x, z, y) => Object.keys(DIRS).filter(k => exposed(x, z, y, k));

const g = new Voxels([W, TOP, D]);
const PANE = (k) => (k === "N" || k === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// the street face: the outward face on the lowest floor line, and the middle of its run, gets the entrance
let street = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (const k of sidesAt(x, z, B[x][z] + 1)) {
    if (k !== "N" && k !== "S") continue;                        // the entrance faces the road to the north or south
    const key = B[x][z] * 10 + (k === "N" ? 0 : 1);
    if (!street || key < street.key) street = { key, k, x, z };
  }
}
const entrance = new Set();
if (street) {
  const run = [];
  for (let x = 0; x < W; x++) if (inside(x, street.z) && exposed(x, street.z, B[x][street.z] + 1, street.k) && B[x][street.z] === B[street.x][street.z]) run.push(x);
  const mid = run[run.length >> 1];
  if (mid !== undefined) entrance.add(`${mid},${street.z}`);
}

// the lit windows: a warm glowstone just inside a few panes, on an upper floor and on a storey with air above
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const b = B[x][z], t = T[x][z];
  // foundation: basalt from y 0 up to the floor line, so nothing floats on a slope
  for (let y = 0; y < b; y++) g.set(x, y, z, "polished_andesite");

  for (let y = b; y < t; y++) {
    const k = Math.floor((y - b) / 4), r = (y - b) % 4, top = y === t - 1, ground = k === 0;
    const ex = sidesAt(x, z, y);
    const shell = ex.length > 0;
    if (!shell) {                                    // interior: a floor slab per storey, air between
      if (r === 0 || top) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (r === 0) { g.set(x, y, z, ground ? "polished_andesite" : "white_concrete"); continue; }          // floor band
    if (r === 3) { g.set(x, y, z, top ? "smooth_stone" : ground ? "smooth_stone" : "light_gray_concrete"); continue; }   // spandrel / cornice / fascia
    // r = 1, 2: the glazed bays between piers, or the entrance door
    if (ground && entrance.has(`${x},${z}`) && ex.includes(street.k)) {
      const facing = FACING[street.k];
      g.set(x, y, z, "dark_oak_door", { facing, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const corner = ex.some(k => k === "N" || k === "S") && ex.some(k => k === "E" || k === "W");
    const k0 = ex[0];
    const onNS = k0 === "N" || k0 === "S";
    const pier = corner || (onNS ? x % 3 === 0 : z % 3 === 0);
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(k0));
    if (r === 1 && !ground && (x * 5 + z * 7 + k) % 7 === 0) {
      const [dx, dz] = DIRS[k0];
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && sidesAt(ix, iz, y).length === 0) glowAt.push([ix, y, iz]);   // only into an interior cell
    }
  }

  // roof: a parapet on the sides that drop away from this cell's top
  const t2 = t;
  for (const k of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || T[nx][nz] < t2) { g.set(x, t2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); break; }
  }
}

// warm light behind the glass: an interior cell on a floor slab, one air block in from its pane
for (const [x, y, z] of glowAt) if (inside(x, z) && y < T[x][z] && y % 4 !== 0) g.set(x, y, z, "glowstone");

// the plant room on the 52 core, a solid box on the roof deck
for (let x = 9; x <= 13; x++) for (let z = 15; z <= 19; z++) {
  if (!inside(x, z) || T[x][z] !== 52) continue;
  for (let y = 52; y <= 54; y++) g.set(x, y, z, "light_gray_concrete");
  g.set(x, 55, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153707433.nbt");
console.log("built", g.count(), "blocks");
