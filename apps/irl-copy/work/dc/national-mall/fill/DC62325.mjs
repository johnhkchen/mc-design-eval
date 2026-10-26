import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Lincoln Congregational Temple UCC (1701 11th St NW): a late-19th-century brick church. Red brick walls, sandstone
// quoins / string courses / cornice (the Richardsonian trim of the period), a stone plinth, two storeys of tall
// windows, a slate roof. Massing follows the lidar roof field, median-smoothed, so the west end rises to 7 and the
// east wing drops to 4. The interior is solid massing; only the glass bands get an air pocket behind them.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62325.cells.json`, "utf8"));

const W = 13, H = 19, D = 12;
const g = new Voxels([W, H, D]);

const roofAt = new Map();
const groundAt = new Map();
for (const [x, z, gr, roof] of cells) { roofAt.set(`${x},${z}`, roof); groundAt.set(`${x},${z}`, gr); }
const inF = (x, z) => roofAt.has(`${x},${z}`);

// Median of the 3x3 neighbourhood: removes single-cell lidar spikes, leaving clean tiers
function topAt(x, z) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (inF(x + dx, z + dz)) v.push(roofAt.get(`${x + dx},${z + dz}`));
  }
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
}

// Exposed faces of a footprint cell: n = toward -z (street side), s = +z, w = -x, e = +x
const OUT = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const IN = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
const facesOf = (x, z) => Object.keys(OUT).filter(d => !inF(x + OUT[d][0], z + OUT[d][1]));

const TOP = new Map();
for (const [x, z] of cells.map(c => [c[0], c[1]])) TOP.set(`${x},${z}`, topAt(x, z));
const topOf = (x, z) => TOP.get(`${x},${z}`);

// 1. Solid massing: ring (street wall) cells get the plinth, quoins, string course and cornice; interior is brick.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const T = topOf(x, z), gr = groundAt.get(`${x},${z}`), fx = facesOf(x, z), ring = fx.length > 0;
  for (let y = 0; y < T; y++) {
    let b;
    if (y < gr) b = "stone_bricks";
    else if (ring) {
      if (fx.length >= 2) b = "smooth_sandstone";                       // corner quoins, full height
      else if (y === 0) b = "stone_bricks";                             // plinth course
      else if (y === 3 || y === T - 1) b = "smooth_sandstone";          // storey string course, cornice
      else b = "bricks";
    } else {
      b = y === T - 1 ? "deepslate_tiles" : "bricks";                   // slate roof deck over the interior
    }
    g.set(x, y, z, b);
  }
}

// 2. Windows: one-cell glass panes on odd positions along each street-facing face, two storeys of bands.
//    Behind each pane an air pocket (or a warm glowstone in some) sits in the first interior cell.
const lit = [];
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fx = facesOf(x, z);
  if (fx.length !== 1) continue;                                         // corners stay quoins
  const d = fx[0], T = topOf(x, z);
  const along = d === "n" || d === "s" ? x : z;
  if (along % 2 !== 1) continue;
  const bands = [[1, 2]];
  if (T - 2 >= 4) bands.push([4, T - 2]);
  const [ix, iz] = [x + IN[d][0], z + IN[d][1]];
  const pocketOk = inF(ix, iz) && facesOf(ix, iz).length === 0;
  for (const [lo, hi] of bands) {
    for (let y = lo; y <= hi; y++) {
      const state = d === "n" || d === "s"
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", state);
      if (pocketOk) {
        const warm = (x + y + z) % 3 === 0;
        g.set(ix, y, iz, warm ? "glowstone" : "air");
        if (warm) lit.push([ix, y, iz]);
      }
    }
  }
}

// 2b. Parapet: on each street-facing face, every other cornice block drops out, so the roofline reads as a crenellated
//     parapet on the lidar height rather than a flat sandstone lid. The gaps sit on the brick course below (nothing floats).
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fx = facesOf(x, z);
  if (fx.length !== 1) continue;
  const along = fx[0] === "n" || fx[0] === "s" ? x : z;
  const T = topOf(x, z);
  if (along % 2 === 0 && T - 1 > 3) g.set(x, T - 1, z, "air");
}

// 3. Street entrance: a dark-oak double-leaf door under the wide middle of the north wing, with sandstone pilasters
//    either side, and an air vestibule behind it.
const DOOR_X = 9, DOOR_Z = 0;
g.set(DOOR_X, 1, DOOR_Z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 2, DOOR_Z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [DOOR_X - 1, DOOR_X + 1]) for (const y of [1, 2]) g.set(x, y, DOOR_Z, "smooth_sandstone");
for (const y of [1, 2]) g.set(DOOR_X, y, DOOR_Z + 1, "air");
g.set(DOOR_X, 3, DOOR_Z + 1, "smooth_sandstone");

g.save(`${DIR}/DC62325.nbt`);
console.log(JSON.stringify({ blocks: g.count(), size: g.size, lit: lit.length, maxTop: Math.max(...TOP.values()) }));
