import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538458235";
const cells = JSON.parse(readFileSync(BASE + ".cells.json", "utf8"));

const W = 23, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const has = (x, z) => G.has(x + "," + z);

// Common datum: lowest ground under the footprint. Storeys and roof use this datum,
// so the roof is flat at L + 10 (roof top layer at L + 11 counting from L).
const L = Math.min(...cells.map(c => c[2]));
const R = L + 10;

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

function exposed(x, z) {
  return {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}

// Pass 1: solid foundation, facades, floor bands, parapet, roof
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const perim = ex.n || ex.s || ex.w || ex.e;
  const corner = (ex.n || ex.s) && (ex.w || ex.e);
  // position along the exposed face: x on north/south faces, z on east/west faces
  const idx = (ex.n || ex.s) ? x : z;
  const pier = corner || (idx % 3 === 0);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= R; y++) {
    const rel = y - L;

    if (y === R) {
      put(x, y, z, perim ? "smooth_stone" : "gray_concrete");
      continue;
    }

    // floor slabs / string courses between storeys and at the base
    if (rel === 0 || rel === 5) {
      put(x, y, z, perim ? "smooth_stone" : "gray_concrete");
      continue;
    }

    const inStorey1 = rel >= 1 && rel <= 4;
    const inStorey2 = rel >= 6 && rel <= 9;
    if (!(inStorey1 || inStorey2)) continue;
    if (!perim) continue; // interior air behind the glass

    const topRow = rel === 4 || rel === 9;
    const botRow = rel === 1 || rel === 6;

    if (pier) {
      put(x, y, z, inStorey1 ? "white_concrete" : "white_concrete");
    } else if (topRow || botRow) {
      put(x, y, z, "gray_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // roof equipment on interior roof cells
  if (!perim && x % 6 === 3 && z % 5 === 2) {
    put(x, R + 1, z, "light_gray_concrete");
  }
}

// Pass 2: entrance door on the south facade, ground storey, nearest the middle
{
  let best = null;
  for (const [x, z, gr] of cells) {
    const ex = exposed(x, z);
    if (!ex.s) continue;
    if (gr > L) continue; // door needs to sit on the common ground datum
    if (!best || Math.abs(x - 11) < Math.abs(best[0] - 11)) best = [x, z];
  }
  if (best) {
    const [x, z] = best;
    put(x, L + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, L + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    // small canopy-style lintel above the door, on the facade line
    put(x, L + 3, z, "gray_concrete");
  }
}

// Pass 3: warm lights behind some upper-storey windows
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const perim = ex.n || ex.s || ex.w || ex.e;
  if (!perim) continue;
  const corner = (ex.n || ex.s) && (ex.w || ex.e);
  const idx = (ex.n || ex.s) ? x : z;
  if (corner || idx % 3 === 0 || idx % 6 !== 1) continue;

  // step inward from the exposed face
  let xi = x, zi = z;
  if (ex.n) zi = z + 1;
  else if (ex.s) zi = z - 1;
  else if (ex.w) xi = x + 1;
  else if (ex.e) xi = x - 1;

  if (!has(xi, zi)) continue;
  const inner = exposed(xi, zi);
  if (inner.n || inner.s || inner.w || inner.e) continue; // only truly interior cells
  const gi = G.get(xi + "," + zi);
  if (gi > L + 7) continue;
  put(xi, L + 7, zi, "glowstone");
}

g.save(BASE + ".nbt");
