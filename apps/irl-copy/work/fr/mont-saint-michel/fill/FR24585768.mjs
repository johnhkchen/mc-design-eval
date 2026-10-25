import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR24585768";
const W = 10, H = 36, D = 12;

// Four cardinal directions: [dx, dz, facing name]
const DIRS = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- read footprint -------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const fp = new Map();
const k = (x, z) => `${x},${z}`;
for (const [x, z, gr, rf] of raw) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  fp.set(k(x, z), {
    x, z,
    g: Math.max(0, Math.round(gr)),
    R: Math.round(rf),
  });
}
const inFp = (x, z) => fp.has(k(x, z));
const cellAt = (x, z) => fp.get(k(x, z));

// ---- distance from the outside, measured separately along x and z ---------
// Rectangular hip: d = min(run to edge in x, run to edge in z). Gives clean
// steps down each side and a level ridge along the long axis.
const runTo = (x, z, dx, dz) => {
  let n = 0;
  let cx = x + dx, cz = z + dz;
  while (inFp(cx, cz)) { n++; cx += dx; cz += dz; }
  return n + 1; // distance to the first cell outside the footprint
};

// ---- massing: wall top and roof top per cell -------------------------------
for (const c of fp.values()) {
  const dx = Math.min(runTo(c.x, c.z, -1, 0), runTo(c.x, c.z, 1, 0));
  const dz = Math.min(runTo(c.x, c.z, 0, -1), runTo(c.x, c.z, 0, 1));
  c.d = Math.min(dx, dz);
  c.wt = Math.min(H - 7, Math.max(c.g + 10, c.R - 5));
  c.T = Math.min(H - 2, c.wt + c.d);
}
const topOf = (x, z) => (inFp(x, z) ? cellAt(x, z).T : -1);

// ---- materials -------------------------------------------------------------
const FOUNDATION = "cobblestone";
const WALL = "stone_bricks";
const BAND = "smooth_stone";
const SILL = "stone_brick_slab";
const GLASS = "glass_pane";
const ROOF = "deepslate_tiles";
const ROOF_STAIR = "deepslate_tile_stairs";
const CHIMNEY = "stone_bricks";
const DOOR = "spruce_door";

// ---- entrance: street-side (south) edge cell nearest the centre -----------
let doorCell = null, doorOut = null;
{
  const outsOf = c => DIRS.filter(([dx, dz]) => !inFp(c.x + dx, c.z + dz));
  const edgeCells = [...fp.values()].filter(c => c.d === 1 && outsOf(c).length === 1);
  const south = edgeCells.filter(c => outsOf(c)[0][2] === "south");
  const pool = south.length ? south : edgeCells;
  if (pool.length) {
    pool.sort((a, b) => Math.abs(a.x - 4.5) - Math.abs(b.x - 4.5));
    doorCell = pool[0];
    doorOut = outsOf(doorCell)[0];
  }
}

// ---- build each footprint column --------------------------------------------
for (const c of fp.values()) {
  const { x, z, g: gr, wt, T, d } = c;
  const edge = d === 1;
  const outs = DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));

  // foundation up to the cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, FOUNDATION);

  // walls / interior
  for (let y = gr + 1; y < wt; y++) {
    if (!edge) {
      // interior: air, with a floor slab each storey
      if (y % 5 === 0) put(x, y, z, BAND);
      continue;
    }
    const rm = y % 5;
    if (rm === 0) { put(x, y, z, BAND); continue; }        // floor line / string course
    if (rm === 4) { put(x, y, z, WALL); continue; }        // lintel band
    if (outs.length > 1) { put(x, y, z, WALL); continue; } // corner pier

    const [ox, oz] = outs[0];
    const isNS = ox === 0;
    const i = isNS ? x : z;
    const len = isNS ? W : D;
    const win = i % 2 === 0 && i > 0 && i < len - 1;
    if (!win) { put(x, y, z, WALL); continue; }
    if (rm === 1) { put(x, y, z, SILL, { type: "bottom", waterlogged: "false" }); continue; }
    // rm 2 or 3: glass
    put(x, y, z, GLASS, {});
    // warm light set back behind the glass, with an air gap
    if (rm === 2 && (x * 31 + z * 17 + y * 7) % 4 === 0) {
      const ix = x - ox, iz = z - oz;
      if (inFp(ix, iz) && cellAt(ix, iz).d > 1) put(ix, y, iz, "glowstone");
    }
  }

  // cornice / ceiling band at the wall top
  put(x, wt, z, BAND);

  // roof: solid core, then a stair step on every column that drops away
  for (let y = wt + 1; y < T; y++) put(x, y, z, ROOF);
  const lower = DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) < T);
  if (T > wt && lower.length) {
    put(x, T, z, ROOF_STAIR, { facing: lower[0][2], half: "bottom", shape: "straight", waterlogged: "false" });
  } else if (T > wt) {
    put(x, T, z, ROOF);
  }
}

// ---- entrance: two-high door under a stone lintel ---------------------------
if (doorCell) {
  const { x, z, g: gr, wt } = doorCell;
  const facing = doorOut[2];
  put(x, gr + 1, z, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // stone lintel over the door, one course above the opening
  if (gr + 3 < wt) put(x, gr + 3, z, WALL);
}

// ---- chimney on the highest roof cell with a full (unstepped) top ---------------
{
  const cands = [...fp.values()]
    .filter(c => c.T > c.wt && !DIRS.some(([dx, dz]) => topOf(c.x + dx, c.z + dz) < c.T))
    .sort((a, b) => b.T - a.T || a.x - b.x);
  if (cands.length) {
    const c = cands[0];
    for (let y = c.T + 1; y <= c.T + 3; y++) put(c.x, y, c.z, CHIMNEY);
  }
}

g.save(`${DIR}/${ID}.nbt`);
