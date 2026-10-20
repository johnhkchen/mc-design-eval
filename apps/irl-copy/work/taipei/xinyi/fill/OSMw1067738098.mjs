import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738098";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

const W = 23, H = 33, D = 22;
const g = new Voxels([W, H, D]);

// ---- footprint helpers ----
const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const inF = (x, z) => fp.has(key(x, z));
const grd = (x, z) => fp.get(key(x, z));

// body base (highest ground under the footprint) and roof levels
const B = Math.max(...cells.map((c) => c[2]));
const ROOF = 20;   // roof slab top course
const PAR = 21;    // parapet course
const F = [0, 1, 2, 3, 4].map((k) => B + Math.round((k * (ROOF - B)) / 4)); // floor lines
const F4 = F[4];

// centre of footprint
const cx = Math.round(cells.reduce((a, c) => a + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((a, c) => a + c[1], 0) / cells.length);

// ---- facade classification ----
function faceOf(x, z) {
  const mW = !inF(x - 1, z), mE = !inF(x + 1, z);
  const mN = !inF(x, z - 1), mS = !inF(x, z + 1);
  const xf = mW || mE, zf = mN || mS;
  if (!xf && !zf) return null;                 // interior cell
  if (xf && zf) return { corner: true, axis: null, along: 0 };
  if (xf) return { corner: false, axis: "x", along: z };
  return { corner: false, axis: "z", along: x };
}

const PANE = "light_blue_stained_glass_pane";
function paneProps(axis) {
  return axis === "x"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

// returns [id, props?] for an edge (facade) cell at height y, or null
function edgeBlock(x, z, y) {
  const f = faceOf(x, z);
  if (!f) return null;
  const pier = f.corner || f.along % 3 === 0;

  if (y === B) return ["stone_bricks"];                 // base course
  if (y === F4) return ["smooth_quartz"];               // cornice under roof
  if (y === PAR) return ["white_concrete"];             // parapet
  if (y === PAR + 1) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];

  let s = 0;
  for (let k = 0; k < 4; k++) if (y >= F[k]) s = k;
  if (y === F[s]) return ["smooth_quartz"];             // storey line

  const rel = y - F[s];
  const h = F[s + 1] - F[s];

  if (s === 0) {                                        // shopfront storey
    if (rel === h - 1) return ["green_concrete"];       // awning band
    if (pier) return ["black_concrete"];
    return [PANE, paneProps(f.axis)];
  }
  if (pier) return ["white_concrete"];
  if (rel === 1) return ["light_gray_concrete"];        // sill
  if (rel === h - 1) return ["white_concrete"];         // lintel
  return [PANE, paneProps(f.axis)];
}

function put(x, y, z, r) {
  if (!r) return;
  const [id, props] = r;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- 1. foundation, slabs, walls ----
for (const [x, z, gr] of cells) {
  // foundation: stone below original ground, podium concrete up to body base
  for (let y = 0; y < B; y++) {
    g.set(x, y, z, y < gr ? "stone_bricks" : "white_concrete");
  }

  const f = faceOf(x, z);
  if (!f) {
    // interior: floor slabs only, air in between (no interiors)
    for (const fy of F) {
      g.set(x, fy, z, fy === F4 ? "light_gray_concrete" : "light_gray_concrete");
    }
    // warm light behind some windows: placed on interior cells next to facade (done below)
  } else {
    for (let y = B; y <= F4; y++) put(x, y, z, edgeBlock(x, z, y));
    put(x, PAR, z, edgeBlock(x, z, PAR));
    put(x, PAR + 1, z, edgeBlock(x, z, PAR + 1));
  }
}

// ---- 2. warm lights behind some ground/upper windows ----
for (const [x, z] of cells) {
  const f = faceOf(x, z);
  if (!f || f.corner || f.along % 3 === 0) continue;
  // inward neighbour
  let ix = x, iz = z;
  if (f.axis === "x") ix = !inF(x - 1, z) ? x + 1 : x - 1;
  else iz = !inF(x, z - 1) ? z + 1 : z - 1;
  if (!inF(ix, iz) || faceOf(ix, iz)) continue;
  for (let s = 0; s < 4; s++) {
    if (((x * 7 + z * 3 + s * 5) % 6) !== 0) continue;
    const ly = F[s] + 3;
    if (ly >= F[s + 1] - 1) continue;
    g.set(ix, ly, iz, "glowstone");
  }
}

// ---- 3. entrance on the north (low-z) face, near the centre ----
let entrance = null;
for (const [x, z] of cells) {
  const f = faceOf(x, z);
  if (!f || f.corner || f.axis !== "z") continue;
  if (inF(x, z - 1)) continue;
  if (!entrance || Math.abs(x - cx) < Math.abs(entrance[0] - cx)) entrance = [x, z];
}
if (entrance) {
  const [ex, ez] = entrance;
  const doorBase = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(ex, B + 1, ez, "dark_oak_door", { ...doorBase, half: "lower" });
  g.set(ex, B + 2, ez, "dark_oak_door", { ...doorBase, half: "upper" });
}

// ---- 4. roof: parapet slab cap is already set; rooftop penthouse + antenna ----
const penX0 = cx - 4, penX1 = cx + 4, penZ0 = cz - 3, penZ1 = cz + 3;
const penOk = (x, z) => inF(x, z) && !faceOf(x, z);
for (let x = penX0; x <= penX1; x++) {
  for (let z = penZ0; z <= penZ1; z++) {
    if (!penOk(x, z)) continue;
    const perim = x === penX0 || x === penX1 || z === penZ0 || z === penZ1;
    for (let y = PAR; y <= 23; y++) {
      if (perim) {
        if ((y === 22 || y === 23) && (x + z) % 3 === 0) {
          g.set(x, y, z, PANE, paneProps(x === penX0 || x === penX1 ? "x" : "z"));
        } else {
          g.set(x, y, z, "smooth_quartz");
        }
      }
    }
    g.set(x, 24, z, "light_gray_concrete");   // penthouse roof
  }
}
if (penOk(cx, cz)) {
  for (let y = 25; y <= 29; y++) {
    g.set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${base}.nbt`);
