// Sugartree Centro, Auckland (way 682574974): read from the lidar record, not from a survey of the building. The footprint
// is 57 x 73 blocks (about 47 m by 61 m); the lidar roof runs from 6 to 56 blocks. A 14-storey commercial block of a
// 1970s-80s concrete frame: a basalt plinth and base course, white concrete piers and floor bands, blue-tinted glass
// panes between light-grey spandrels, black shopfront fascias on the ground storey, and a recessed double entrance
// on the longest street frontage. The lidar is snapped to a 4-block storey grid (floor lines at 1 + 4k); the tall
// core (roof 54 and over) carries a three-block attic with a glazed band and a smooth stone cap at 56, and the
// lower tiers step down to podiums at 5, 9, 17, 33 and 49. Interiors are air with a floor slab per storey; warm lamps
// stand inside some windows, and roof plant boxes sit on the open tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_682574974.cells.json", "utf8"));
const W = 57, D = 73, HY = 68;
const IN = Array.from({ length: W }, () => Array(D).fill(false));
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, , r] of cells) { IN[x][z] = true; R[x][z] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && IN[x][z];

// Storey grid: a floor line (its slab top) at y = 1 + 4k, so the lidar roof snaps down onto the nearest line below it.
const deckOf = (x, z) => 1 + 4 * Math.floor((R[x][z] - 1) / 4);
const isAttic = (x, z) => R[x][z] >= 54;                       // the tall core: three more blocks to 56
const topOf = (x, z) => (isAttic(x, z) ? 56 : deckOf(x, z));   // highest solid block + 1

const DIRS = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] };
// the faces of a cell at height y that look out at air: beyond the footprint, or over a lower neighbour
const exposed = (x, z, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => {
  const nx = x + dx, nz = z + dz; return !inF(nx, nz) || topOf(nx, nz) < y;
}).map(([k]) => k);

const paneState = (ex) => (ex.includes("px") || ex.includes("nx")
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }   // a wall running along z
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }); // a wall running along x
const pane = (ex) => ["light_blue_stained_glass_pane", paneState(ex)];

const v = new Voxels([W, HY, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const hash = (x, y, z) => (x * 73 + y * 31 + z * 17) % 97;

// -- the massing and the facade, cell by cell, one column each ----------------------------------------------------------
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!IN[x][z]) continue;
  const deck = deckOf(x, z), top = topOf(x, z), attic = isAttic(x, z);
  put(x, 0, z, "polished_basalt");                              // the plinth: solid from y 0 up to the first floor
  for (let y = 1; y <= top; y++) {
    const ex = exposed(x, z, y), E = ex.length > 0;
    if (attic && y > deck) {
      if (y === 56) put(x, y, z, "smooth_stone");                // the cap over the core
      else if (y === 55) {
        const wi = ex.includes("px") || ex.includes("nx") ? z : x;
        if (E && wi % 3 !== 0) put(x, y, z, ...pane(ex));
        else put(x, y, z, E ? "white_concrete" : "light_gray_concrete");
      } else put(x, y, z, E ? "white_concrete" : "light_gray_concrete");   // the attic's string course at 54
      continue;
    }
    if (y === deck + 1) { if (E) put(x, y, z, "white_concrete"); continue; }      // parapet on the perimeter
    if (y === deck) { put(x, y, z, E ? "white_concrete" : "smooth_stone"); continue; }  // cornice band or roof membrane
    const floorLine = (y - 1) % 4 === 0;
    if (floorLine) { put(x, y, z, E ? (y === 1 ? "polished_basalt" : "white_concrete") : "light_gray_concrete"); continue; }
    if (!E) {
      // a warm lamp on the floor slab just inside a glass pane (one storey in four, some windows)
      const ry = (y - 1) % 4;
      if (ry === 1 && hash(x, y, z) % 6 === 0 && y > 1) {
        const glassNear = Object.entries(DIRS).some(([, [dx, dz]]) => {
          const nx = x + dx, nz = z + dz; return inF(nx, nz) && exposed(nx, nz, y).length > 0 && topOf(nx, nz) >= y;
        });
        if (glassNear) put(x, y, z, hash(x, y, z) % 12 === 0 ? "shroomlight" : "glowstone");
      }
      continue;
    }
    const ry = (y - 1) % 4, ground = y <= 4;
    const wi = ex.includes("px") || ex.includes("nx") ? z : x;
    const pier = wi % 3 === 0;
    if (ground) {
      if (pier) put(x, y, z, "polished_basalt");
      else if (ry === 3) put(x, y, z, "black_concrete");
      else put(x, y, z, ...pane(ex));
    } else {
      if (pier) put(x, y, z, "white_concrete");
      else if (ry === 3) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, ...pane(ex));
    }
  }
  // roof plant boxes on the open tiers, inside the perimeter, above the 9-block podium
  if (!attic && deck >= 9 && exposed(x, z, deck + 1).length === 0 && hash(x, deck, z) % 19 === 0) {
    put(x, deck + 1, z, "light_gray_concrete"); put(x, deck + 2, z, "light_gray_concrete"); put(x, deck + 3, z, "iron_block");
  }
}

// -- the entrance: a recessed double door on the longest frontage at ground level -----------------------------------
const SIDE = {
  nx: { in: [1, 0], facing: "east", along: "z" }, px: { in: [-1, 0], facing: "west", along: "z" },
  nz: { in: [0, 1], facing: "south", along: "x" }, pz: { in: [0, -1], facing: "north", along: "x" },
};
const count = {};
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (IN[x][z] && deckOf(x, z) >= 5)
  for (const k of exposed(x, z, 2)) count[k] = (count[k] || 0) + 1;
const side = Object.keys(SIDE).sort((a, b) => (count[b] || 0) - (count[a] || 0))[0];
const { in: inW, facing, along } = SIDE[side];
const ring = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (IN[x][z] && exposed(x, z, 2).includes(side) && deckOf(x, z) >= 5) ring.push([x, z]);
ring.sort((a, b) => (along === "z" ? a[1] - b[1] : a[0] - b[0]));
const ai = (p) => (along === "z" ? p[1] : p[0]);
let m = Math.floor(ring.length / 2) - 1;
for (let k = 0; k < ring.length - 1; k++) if (ai(ring[k + 1]) - ai(ring[k]) === 1 && Math.abs(k - ring.length / 2) < Math.abs(m - ring.length / 2)) m = k;
const at = (k) => ring[k];
const [p0, p1] = [at(m), at(m + 1)];
const doorState = (half, hinge) => ({ facing, half, hinge, open: "false", powered: "false" });
for (const [p, hinge] of [[p0, "left"], [p1, "right"]]) {
  put(p[0], 2, p[1], "dark_oak_door", doorState("lower", hinge));
  put(p[0], 3, p[1], "dark_oak_door", doorState("upper", hinge));
  put(p[0], 4, p[1], "black_concrete");
}
for (const k of [m - 1, m + 2]) {                                    // basalt pilasters carry the portico
  const p = at(k); if (!p) continue;
  for (let y = 2; y <= 4; y++) put(p[0], y, p[1], "polished_basalt");
}
// the canopy: a black soffit one step inside the wall, carried on the pilasters and the fascia
for (let k = m - 1; k <= m + 2; k++) {
  const p = at(k); if (!p) continue;
  const qx = p[0] + inW[0], qz = p[1] + inW[1];
  if (inF(qx, qz)) put(qx, 4, qz, "black_concrete");
}
const lx = p0[0] + inW[0], lz = p0[1] + inW[1];
if (inF(lx, lz)) put(lx, 2, lz, "glowstone");                         // the lobby's lamp

v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_682574974.nbt");
console.log(`way_682574974: entrance on the ${side} face; ${v.count()} blocks, ${v.palette.length - 1} palette entries`);
