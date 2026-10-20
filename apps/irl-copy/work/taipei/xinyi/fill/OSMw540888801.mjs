import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888801.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888801.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 11, H = 23, D = 13;
const ROOF_Y = 10;     // roof deck
const PARAPET_Y = 11;  // top of parapet, about 11 blocks above lowest ground
const BAND_Y = 5;      // storey line between the two storeys

// Palette: 1980s Taipei mid-rise commercial, tiled beige walls, dark glass, stone base
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "white_terracotta";
const BAND = "light_gray_concrete";
const FLOOR = "smooth_stone";
const ROOF = "gray_concrete";
const PARAPET = "smooth_stone";
const GLASS = "gray_stained_glass_pane";
const LAMP = "lantern";
const AC = "smooth_stone";

const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const has = (x, z) => G.has(x + "," + z);
const gAt = (x, z) => G.get(x + "," + z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (state) g.set(x, y, z, block, state);
  else g.set(x, y, z, block);
};

// Exposure of a cell's four faces
function exposure(x, z) {
  return {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}

// Choose a single entrance on the south (or north) street face near the middle
let doorCell = null;
{
  let best = Infinity;
  const mid = (W - 1) / 2;
  for (const [x, z] of cells) {
    const ex = exposure(x, z);
    if (ex.s && !ex.w && !ex.e) {
      const d = Math.abs(x - mid);
      if (d < best) { best = d; doorCell = [x, z]; }
    }
  }
}

// Window rows: ground shopfront (glass from gr+1 to 3, head at 4), upper storey glass at 7-8
function isWindowRow(y, gr) {
  if (y > gr && y <= 3) return true;           // shopfront glass
  if (y === 7 || y === 8) return true;          // upper storey glass
  return false;
}

// Facade block for a perimeter cell at height y
function facade(x, z, y, gr, ex) {
  const exZ = ex.n || ex.s;
  const exX = ex.w || ex.e;
  if (exZ && exX) return { block: WALL }; // corner pier

  const alongX = exZ && !exX; // face runs along x (north/south face)
  const p = alongX ? x : z;

  // Entrance door on the chosen south face cell
  if (doorCell && x === doorCell[0] && z === doorCell[1] && (y === gr + 1 || y === gr + 2) && y <= 4) {
    const half = y === gr + 1 ? "lower" : "upper";
    return {
      block: "oak_door",
      state: { facing: "south", half, hinge: "left", open: "false", powered: "false" },
    };
  }

  if (p % 3 !== 0 && isWindowRow(y, gr)) {
    const state = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    return { block: GLASS, state };
  }

  return { block: WALL };
}

for (const [x, z, gr] of cells) {
  const ex = exposure(x, z);
  const perim = ex.n || ex.s || ex.w || ex.e;

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  if (gr > PARAPET_Y) continue;

  for (let y = gr; y <= PARAPET_Y; y++) {
    if (y === gr) {
      put(x, y, z, perim ? BASE : FLOOR);
    } else if (y === BAND_Y) {
      if (perim) put(x, y, z, BAND);
      else put(x, y, z, FLOOR);
    } else if (y === ROOF_Y) {
      if (perim) put(x, y, z, BAND);
      else put(x, y, z, ROOF);
    } else if (y === PARAPET_Y) {
      if (perim) put(x, y, z, PARAPET);
    } else if (perim) {
      const f = facade(x, z, y, gr, ex);
      put(x, y, z, f.block, f.state);
    }
  }

  // Warm lights behind the glass: inside cell next to some windows
  if (perim && !(ex.n && ex.s) && !(ex.w && ex.e)) {
    let ix = x, iz = z;
    if (ex.n) iz = z + 1;
    else if (ex.s) iz = z - 1;
    else if (ex.w) ix = x + 1;
    else if (ex.e) ix = x - 1;
    const interiorOk = has(ix, iz) && !(() => {
      const e2 = exposure(ix, iz);
      return e2.n || e2.s || e2.w || e2.e;
    })();
    const p = (ex.n || ex.s) ? x : z;
    if (interiorOk && p % 6 === 2) {
      const lampY = gr + 1 <= 3 ? gr + 1 : null;
      if (lampY !== null && lampY > gr) put(ix, lampY, iz, LAMP, { hanging: "false", waterlogged: "false" });
      put(ix, 6, iz, LAMP, { hanging: "false", waterlogged: "false" });
    }
  }
}

// Rooftop air-conditioning units on the roof deck, inside the parapet
for (const [x, z, gr] of cells) {
  if (gr > ROOF_Y) continue;
  const ex = exposure(x, z);
  const perim = ex.n || ex.s || ex.w || ex.e;
  if (!perim && x % 4 === 1 && z % 4 === 1) {
    put(x, PARAPET_Y, z, AC);
  }
}

g.save(OUT);
