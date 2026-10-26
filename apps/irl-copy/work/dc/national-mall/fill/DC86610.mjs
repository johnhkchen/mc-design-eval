import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86610";

const W = 6, D = 15, HMAX = 30;
const STOREY = 3;

// Load footprint: [x, z, ground, roof] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Quantise each cell's roof to whole 3-block storeys above its own ground
const cells = new Map();
for (const [x, z, gr0, roof0] of raw) {
  const gr = Math.round(gr0);
  let n = Math.round((roof0 - gr) / STOREY);
  n = Math.max(1, Math.min(n, 7));
  let H = gr + STOREY * n;
  if (H > HMAX - 3) H = HMAX - 3;
  cells.set(`${x},${z}`, { gr, H });
}

const has = (x, z) => cells.has(`${x},${z}`);
const info = (x, z) => cells.get(`${x},${z}`);
const zFaceOf = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const xFaceOf = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const perim = (x, z) => zFaceOf(x, z) || xFaceOf(x, z);
const isPier = (x, z) => {
  const zF = zFaceOf(x, z), xF = xFaceOf(x, z);
  return zF ? (x % 2 === 0 || xF) : (z % 2 === 0);
};

const g = new Voxels([W, HMAX, D]);

const put = (x, y, z, block, state) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= HMAX) return;
  if (state) g.set(x, y, z, block, state);
  else g.set(x, y, z, block);
};

// Massing and facade pass
for (const [key, { gr, H }] of cells) {
  const [x, z] = key.split(",").map(Number);
  const edge = perim(x, z);
  const pier = isPier(x, z);
  const top = H - gr - 1;

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let k = 0; k <= top; k++) {
    const y = gr + k;
    if (!edge) {
      // Interior: floor slabs per storey and roof slab; air gap behind glass
      if (k % STOREY === 0 || k === top) put(x, y, z, "smooth_stone");
      continue;
    }
    let b;
    if (k === top) b = "smooth_stone";              // parapet cap
    else if (k === 0) b = "polished_granite";       // base course
    else if (k % STOREY === 0) b = "polished_andesite"; // storey line spandrel
    else if (pier) b = "white_concrete";            // mullions, contrast with glass
    else b = "light_blue_stained_glass";            // window glass
    put(x, y, z, b);
  }

  // Penthouse on interior cells of the taller blocks, with a cap
  if (!edge && H - gr >= 6 && H + 2 <= HMAX) {
    put(x, H, z, "white_concrete");
    put(x, H + 1, z, "polished_andesite");
  }
}

// Entrances on both street (z) faces, two doors so one always reads from the street
const doorState = (facing, half) => ({
  facing, half, hinge: "left", open: "false", powered: "false",
});
const zFrontCells = [];
for (const [key, { gr, H }] of cells) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1)) zFrontCells.push({ x, z, gr, H, facing: "north", score: Math.abs(x - 2) });
  if (!has(x, z + 1)) zFrontCells.push({ x, z, gr, H, facing: "south", score: Math.abs(x - 3) });
}
zFrontCells.sort((a, b) => a.score - b.score);
// Take the best candidate on each facing, if the cell is tall enough
const picked = new Set();
for (const c of zFrontCells) {
  if (picked.has(c.facing)) continue;
  if (c.H - c.gr < 3) continue;
  picked.add(c.facing);
  // Dark frame around the door: trim blocks flank the doorway on the ground course
  const dx = c.x, dz = c.z, y0 = c.gr;
  put(dx, y0 + 1, dz, "dark_oak_door", doorState(c.facing, "lower"));
  put(dx, y0 + 2, dz, "dark_oak_door", doorState(c.facing, "upper"));
  // Lintel over the door in dark oak trim
  put(dx, y0 + 3, dz, "dark_oak_planks");
  // Dark trim on either side of the door in the storefront
  for (const side of [-1, 1]) {
    const sx = dx + side;
    if (has(sx, dz) && perim(sx, dz)) {
      put(sx, y0 + 1, dz, "dark_oak_planks");
      put(sx, y0 + 2, dz, "dark_oak_planks");
    }
  }
}

// Warm light: glowstone set just inside some window glass
for (const [key, { gr, H }] of cells) {
  const [x, z] = key.split(",").map(Number);
  if (!perim(x, z) || isPier(x, z)) continue;
  const top = H - gr - 1;
  for (let k = 2; k < top; k++) {
    if (k % STOREY !== 2) continue;
    if ((x * 3 + z + Math.floor(k / STOREY)) % 4 !== 0) continue;
    const y = gr + k;

    let ix = null, iz = null;
    if (!has(x, z - 1)) { ix = x; iz = z + 1; }
    else if (!has(x, z + 1)) { ix = x; iz = z - 1; }
    else if (!has(x - 1, z)) { ix = x + 1; iz = z; }
    else if (!has(x + 1, z)) { ix = x - 1; iz = z; }
    if (ix === null || !has(ix, iz) || perim(ix, iz)) continue;

    const inner = info(ix, iz);
    if (y < inner.gr || y >= inner.H - 1) continue;
    put(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
