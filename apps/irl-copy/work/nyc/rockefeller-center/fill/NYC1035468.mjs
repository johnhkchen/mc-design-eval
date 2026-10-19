// 7 East 51st Street, 1920 Public Facilities & Institutions building: a 27-block (about 30 m) brick-and-limestone block,
// nine storeys at its tallest, on a granite plinth, with a Beaux-Arts cream stone frame (storey lines, piers, quoins,
// cornice and parapet). Footprint 8 x 27 (x across, low z = north = the street-front end). Lidar roof is read as clean
// 3-block tiers: a 3-block-snapped median (two passes) fills the single-cell lidar dropouts, and the north wing and
// the tall middle step down to the 2-storey south end. Ground: y 0 is the lowest ground, each column's foundation is
// solid stone up to its own ground and its plinth band is the granite course above it. The entrance is a double
// iron door in the north face under a stone surround, with hanging lanterns in the transom. Only the outer shell is
// built: 1-block-thick walls with air behind the glass and a floor slab in each storey (no interiors). Warm glowstone
// and shroomlight sit behind some windows. A few iron boxes stand on the top roof as mechanical plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035468.cells.json`, "utf8"));

const W = 8, D = 27, H = 39;
const inFoot = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));

const G = grid(0), R0 = grid(0);                                  // G: ground, R0: lidar roof (block height above y 0)
for (const [x, z, ground, roof] of cells) { G[x][z] = ground; R0[x][z] = roof; }

// Median of the 3x3 neighbourhood, twice: the lidar drops single cells to 1 or 2 inside a 19-27 field (and a 1-wide run
// at the north wing), and the median fills them from what stands around them.
let R = R0;
for (let pass = 0; pass < 2; pass++) {
  const next = grid(0);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const v = [];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFoot(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
    v.sort((a, b) => a - b);
    next[x][z] = v[v.length >> 1];
  }
  R = next;
}

// Snap every column to whole 3-block storeys, so each tier's top is a flat storey line. T is the top surface (exclusive).
const T = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) T[x][z] = Math.max(3 * Math.round(R[x][z] / 3), G[x][z] + 3);

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                  // north (low z), south, west, east
// Air beside a column at height y: outside the footprint, or above that neighbour's roof. Foundation and building are solid.
const airAt = (x, y, z) => !inFoot(x, z) || y >= T[x][z];
const exposedDirs = (x, y, z) => DIRS.filter(([dx, dz]) => airAt(x + dx, y, z + dz));

// Palette: granite plinth, cream stone (storey lines, piers at the corners, cornice), brick body, grey tar roof.
const FOUNDATION = "stone_bricks", PLINTH = "polished_andesite", STONE = "smooth_sandstone", BRICK = "bricks";
const ROOF = "gray_concrete", FLOOR = "smooth_stone", GLASS = "glass_pane", PLANT = "iron_block";

const g = new Voxels([W, H, D]);
const warm = [];                                                  // glass cells whose inward neighbour is air: lit later
const doorStates = (hinge, half) => ({ facing: "north", half, hinge, open: "false", powered: "false" });

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const gr = G[x][z], top = T[x][z];
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);
  for (let y = gr; y < top; y++) {
    const dirs = exposedDirs(x, y, z);
    const shell = y === top - 1 || dirs.length > 0;
    if (!shell) {
      if (y === gr || (y % 3 === 0 && y > gr)) g.set(x, y, z, FLOOR);   // ground deck and storey floors, inside
      continue;
    }
    if (y === top - 1) { g.set(x, y, z, exposedDirs(x, y, z).length ? STONE : ROOF); continue; }   // cornice ring / tar roof

    const s = Math.floor(y / 3), r = y % 3;                       // storey index, row within the storey
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    const zFace = dirs.some(([, dz]) => dz !== 0);                 // faces north or south: runs along x
    const [dx, dz] = zFace ? dirs.find(([, d]) => d !== 0) : dirs[0];
    const u = zFace ? x : z;
    const bay = zFace ? [1, 2, 4, 5].includes(x) : z >= 1 && z <= D - 2 && z % 3 !== 0;
    const base = s === 0;

    // The north entrance: a stone surround at x 4 and 7, double iron doors at x 5-6, lanterns hanging in the transom.
    if (z === 0 && dz === -1 && base && (x === 4 || x === 7)) { g.set(x, y, z, STONE); continue; }
    if (z === 0 && dz === -1 && base && (x === 5 || x === 6)) {
      if (r === 2) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else g.set(x, y, z, "iron_door", doorStates(x === 5 ? "left" : "right", r === 0 ? "lower" : "upper"));
      continue;
    }

    if (r === 0) { g.set(x, y, z, STONE); continue; }              // spandrel / storey line
    if (bay && (r === 1 || r === 2)) {                              // window, two panes wide; air behind it
      const state = zFace ? { east: "true", west: "true", north: "false", south: "false" }
                          : { north: "true", south: "true", east: "false", west: "false" };
      g.set(x, y, z, GLASS, state);
      if (r === 1) warm.push({ x, y, z, ix: x - dx, iz: z - dz, k: u + s });
      continue;
    }
    // piers: cream stone at the corners, brick between bays; the plinth is granite
    g.set(x, y, z, base ? PLINTH : corner ? STONE : BRICK);
  }
}

// Parapet: one block of cream stone on the roof edge wherever a column stands higher than the air beside it.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const top = T[x][z];
  if (DIRS.some(([dx, dz]) => airAt(x + dx, top, z + dz))) g.set(x, top, z, STONE);
}

// Warm light behind some windows (about one in four, varied): glowstone or shroomlight in the air one block inside.
for (const w of warm) {
  if (w.k % 4 !== 0 || g.get(w.ix, w.y, w.iz)) continue;
  g.set(w.ix, w.y, w.iz, w.k % 8 === 0 ? "shroomlight" : "glowstone");
}

// Mechanical plant on the top roof: iron boxes on the tar, a few cells in from the edge.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (T[x][z] !== 27 || exposedDirs(x, 26, z).length || (x + z) % 4 !== 0) continue;
  g.set(x, 27, z, PLANT);
}

const out = `${DIR}/NYC1035468.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, ${palette} palette entries`);
