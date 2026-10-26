// FR245184468: a Haussmann-era residential block (1870), seven storeys of limestone (calcite) on a stone plinth.
// Storey lines sit at y 6, 10, 14, 18, 22 (4-block storeys, the ground storey 0-6); a mansard of deepslate tiles
// tops the building at y 29 (the lidar's roof). The lidar's roof heights are quantised to tiers (6, 10, 14, 18, 22, 29)
// so the massing steps down to the lower north-east wing. Walls are hollow: a shell, floor slabs at each storey line,
// a roof deck and air behind the glass, with a few glowstone lamps set behind panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184468.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184468.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 27, D = 24, H = 45;
const FLOORS = [6, 10, 14, 18, 22];                       // storey lines (slabs and string courses)
const DIRS = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] };

// lidar roof height -> the building's flat tier
const tierOf = (r) => (r >= 25 ? 29 : r >= 20 ? 22 : r >= 16 ? 18 : r >= 12 ? 14 : r >= 8 ? 10 : 6);

const col = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) col[x][z] = { g, T: tierOf(r) };
const at = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? col[x][z] : null);
// a wall face is exposed where the neighbour is off the footprint or stands lower than this row
const exposed = (x, y, z, dir) => { const [dx, dz] = DIRS[dir]; const n = at(x + dx, z + dz); return !n || n.T <= y; };

const spec = new Map();
const put = (x, y, z, block, state) => spec.set(`${x},${y},${z}`, { block, state });
const paneState = (dir) => (dir === "north" || dir === "south"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lamps = [];

// the street door, on the south face (the sheet's front): a pair of doors under a lintel, pilasters either side
function entrance(x, y, z) {
  if (y === 3) return put(x, y, z, "smooth_stone");                       // lintel over the doors
  if (x === 6 || x === 9) return put(x, y, z, "polished_andesite");       // pilasters
  const half = y === 1 ? "lower" : "upper";
  put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: x === 7 ? "left" : "right", open: "false", powered: "false" });
}

function facade(x, y, z, c, dir) {
  const [dx] = DIRS[dir];
  const u = dx !== 0 ? z : x;                                             // position along the face
  const bay = u % 3 !== 0;                                                // a pier every third block, glass between
  if (c.T === 29 && y >= 27) {                                            // the mansard: tiles, dormers at y 27
    if (y === 27 && bay && Math.floor(u / 3) % 2 === 0) return glass(x, y, z, dir);
    return put(x, y, z, "deepslate_tiles");
  }
  if (y < 6) {                                                            // ground storey: shopfront glass under a lintel
    if (y === 5) return put(x, y, z, "smooth_stone");
    return bay ? glass(x, y, z, dir) : put(x, y, z, "calcite");
  }
  const lo = FLOORS.filter((f) => f <= y).pop();                          // the storey's floor line
  if (lo === 6 && y === 7 && bay) return put(x, y, z, "iron_bars", paneState(dir));  // piano nobile balcony rail
  return bay ? glass(x, y, z, dir) : put(x, y, z, "calcite");
}

function glass(x, y, z, dir) {
  put(x, y, z, "glass_pane", paneState(dir));
  if ((x * 7 + y * 5 + z * 3) % 11 === 0) lamps.push([x, y, z, DIRS[dir]]);  // roughly one pane in eleven is lit
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 0; y < c.T; y++) {
    if (z === D - 1 && x >= 6 && x <= 9 && y >= 1 && y <= 3) { entrance(x, y, z); continue; }
    if (y < c.g) { put(x, y, z, "stone_bricks"); continue; }              // foundation up to the lidar ground
    if (y === c.g) { put(x, y, z, "polished_andesite"); continue; }       // plinth
    if (y === c.T - 1) { put(x, y, z, c.T === 29 ? "deepslate_tiles" : "smooth_stone"); continue; }  // roof deck, cornice
    if (FLOORS.includes(y)) { put(x, y, z, "smooth_stone"); continue; }   // floor slab = string course
    const faces = Object.keys(DIRS).filter((d) => exposed(x, y, z, d));
    if (faces.length) facade(x, y, z, c, faces[0]);                       // interior stays air
  }
}

// chimney stacks on the mansard roof
for (const [x, z] of [[4, 9], [12, 15], [18, 19]]) for (let y = 29; y <= 31; y++) put(x, y, z, "bricks");

// lamps behind glass: the cell just inside a lit pane, if it is air
for (const [x, y, z, [dx, dz]] of lamps) {
  const k = `${x - dx},${y},${z - dz}`;
  if (!spec.has(k)) spec.set(k, { block: "glowstone" });
}

const out = new Voxels([W, H, D]);
for (const [k, { block, state }] of spec) { const [x, y, z] = k.split(",").map(Number); out.set(x, y, z, block, state); }
const { blocks, palette } = out.save(OUT);
console.log(`FR245184468: ${blocks} blocks, ${palette} palette entries, ${lamps.length} lit panes`);
