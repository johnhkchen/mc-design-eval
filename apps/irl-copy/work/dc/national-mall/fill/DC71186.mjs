// DC71186 — 2000 M St NW, a mid-century (1960s) Portland-stone office block: a 12-block podium of five storeys
// (glass bands between calcite spandrels, polished piers) carrying a 15-block tower (Rosslyn-era setback) with a
// 16-block penthouse on its south side, a one-storey lobby wing at the south-west corner, and roof plant on the podium.
// Storeys are 2 blocks (a glass row over a spandrel row). The massing is a closed shell with a floor slab per storey,
// air behind the glass, and no interiors, so nothing is hung in the air: every storey and tier sits on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71186.cells.json", "utf8"));
const X = 22, Y = 28, Z = 29;

// footprint, lidar ground and roof per cell
const G = Array.from({ length: Z }, () => Array(X).fill(null));
const R = Array.from({ length: Z }, () => Array(X).fill(null));
for (const [x, z, g, r] of cells) { G[z][x] = g; R[z][x] = r; }
const inFp = (x, z) => x >= 0 && x < X && z >= 0 && z < Z && R[z][x] != null;

// lidar roof, smoothed into flat tiers: a 3x3 mean, then the tier it falls in
const tierOf = (s) => (s < 8.5 ? 3 : s < 13.5 ? 12 : s < 15.6 ? 15 : 16);
const H = Array.from({ length: Z }, () => Array(X).fill(0));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) { s += R[z + dz][x + dx]; n++; }
  H[z][x] = tierOf(s / n);
}
// clean rectangles where the lidar tiers are noisy: the tower, its penthouse, the lobby wing
const rect = (x0, x1, z0, z1, h) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (inFp(x, z)) H[z][x] = h; };
rect(9, 17, 5, 23, 15);     // tower
rect(11, 15, 19, 20, 16);   // penthouse on the tower's south side
rect(0, 6, 27, 28, 3);      // one-storey lobby wing
const hAt = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : H[z][x]);
const gAt = (x, z) => (inFp(x, z) ? G[z][x] : 0);

// the distinct tier tops: each tier's roof layer (h-1) is solid across the whole footprint, the slab it stands on
const tierTops = new Set();
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (inFp(x, z)) tierTops.add(H[z][x] - 1);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a cell is exterior when a side neighbour (or the outside of the footprint) is lower than it
const exterior = (x, y, z) => DIRS.some(([dx, dz]) => hAt(x + dx, z + dz) <= y);

// the block at a cell, or null for air; { block, state } otherwise. Panes take their connections from their neighbours,
// which are asked without their own states (withState false), so the question does not recurse.
function kind(x, y, z, withState = true) {
  if (!inFp(x, z)) return null;
  const hh = H[z][x];
  if (y < gAt(x, z)) return { block: "stone_bricks" };                              // foundation under a slope
  if (y >= hh) return null;
  // the front entrance on the street face: two dark oak doors, a glass lobby above the base
  if (z === 0 && (x === 12 || x === 13) && y <= 1) {
    return { block: "dark_oak_door", state: { facing: "north", half: y === 0 ? "lower" : "upper", hinge: x === 12 ? "left" : "right", open: "false", powered: "false" } };
  }
  // the canopy over the door, on the first and second rows in, at the storey line
  if (y === 2 && z <= 1 && x >= 11 && x <= 14) return { block: "polished_andesite" };
  const ext = exterior(x, y, z);
  if (y === hh - 1) return { block: ext ? "stone_bricks" : "smooth_stone" };        // parapet cornice / roof
  if (!ext) return y % 2 === 0 || tierTops.has(y) ? { block: "smooth_stone" } : null; // floor slab / tier slab / air gap
  if (y === 0) return { block: "stone_bricks" };                                    // base course
  if (y % 2 === 0) return { block: "calcite" };                                     // spandrel at each storey line
  // glass row: piers on every third bay, the lobby glass unbroken on the street face
  const zFace = hAt(x, z - 1) <= y || hAt(x, z + 1) <= y;
  const xFace = hAt(x - 1, z) <= y || hAt(x + 1, z) <= y;
  const lobby = y === 1 && z === 0 && x >= 10 && x <= 15;
  const pier = !lobby && ((zFace && x % 3 === 0) || (xFace && z % 3 === 0) || (zFace && xFace));
  if (pier) return { block: "polished_andesite" };
  if (!withState) return { block: "light_blue_stained_glass_pane" };
  // pane connections: a neighbour in the same row (any block) joins the pane
  const conn = (dx, dz) => kind(x + dx, y, z + dz, false) != null;
  return { block: "light_blue_stained_glass_pane", state: { north: String(conn(0, -1)), south: String(conn(0, 1)), east: String(conn(1, 0)), west: String(conn(-1, 0)), waterlogged: "false" } };
}

const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  for (let y = 0; y < Y; y++) {
    const k = kind(x, y, z);
    if (k) g.set(x, y, z, k.block, k.state);
  }
}

// warm light behind some glass rows: a glowstone on the air side of a window, never on the street-face lobby
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  for (let y = 1; y < H[z][x]; y += 2) {
    const k = kind(x, y, z);
    if (!k || k.block !== "light_blue_stained_glass_pane") continue;
    if ((x * 5 + y * 7 + z * 3) % 9 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      if (hAt(x + dx, z + dz) > y) continue;           // this side is inside the building, not outside
      const ix = x - dx, iz = z - dz;                    // the cell on the other side of the pane
      if (inFp(ix, iz) && hAt(ix, iz) > y && !exterior(ix, y, iz)) { g.set(ix, y, iz, "glowstone"); break; }
    }
  }
}

// roof plant on the podium: two plant rooms, each a light concrete box on the podium's roof layer
const plant = (x0, x1, z0, z1) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
  if (!inFp(x, z) || H[z][x] !== 12) continue;
  g.set(x, 12, z, "light_gray_concrete"); g.set(x, 13, z, "light_gray_concrete");
} };
plant(6, 8, 22, 25);
plant(19, 21, 19, 21);

// lanterns on the penthouse corners, warm at dusk
for (const [x, z] of [[11, 19], [15, 20]]) g.set(x, 16, z, "lantern", { hanging: "false", waterlogged: "false" });

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71186.nbt");
console.log(out);
