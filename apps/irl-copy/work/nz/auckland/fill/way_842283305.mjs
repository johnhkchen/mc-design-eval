// ANZ Building, Auckland CBD (OSM way 842283305), built from the lidar record in way_842283305.cells.json.
// Era and make-up: a late-20th-century corporate office tower, a stone-based podium of four storeys with a
// glazed tower of about 41 storeys above it, stepped back in two setbacks. Materials are the CBD's: light
// concrete and quartz piers, blue-green glazing in bays four blocks wide, a stone-brick base and cornice.
// Lidar roofs are read as tiers (4-block storeys), mode-filtered so the noise goes, and each column stands
// solid on its own foundation; the inside is a floor slab per storey with air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_842283305.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_842283305.cells.json", "utf8"));

const W = 87, D = 81, H = 178, STOREY = 4;
const fp = new Uint8Array(W * D), G = new Int16Array(W * D), R = new Int16Array(W * D);
for (const [x, z, g, r] of cells) { const i = z * W + x; fp[i] = 1; G[i] = g; R[i] = r; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp[z * W + x] === 1;

// Lidar roof height -> a tier: clean flat storeys (multiples of 4) with setbacks as the tower rises.
function tierOf(r) {
  if (r >= 150) return 164;   // tower shaft, 41 storeys
  if (r >= 100) return 120;   // first setback
  if (r >= 60) return 80;     // second setback
  if (r >= 35) return 40;     // midrise shoulder
  if (r >= 18) return 24;     // wing
  if (r >= 10) return 16;     // four-storey podium
  if (r >= 4) return 8;       // two storeys
  return STOREY;              // one storey
}
const tier0 = new Int16Array(W * D);
for (let i = 0; i < W * D; i++) if (fp[i]) tier0[i] = tierOf(R[i]);

// Mode filter over the 3x3 footprint neighbourhood: drops single-cell lidar noise, keeps the tier edges.
// Two passes: the second takes the single-column stubs the first leaves on the podium edges.
function modePass(src) {
  const out = new Int16Array(W * D);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = z * W + x; if (!fp[i]) continue;
    const count = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!inFp(x + dx, z + dz)) continue;
      const t = src[(z + dz) * W + x + dx]; count.set(t, (count.get(t) || 0) + 1);
    }
    let best = src[i], bestN = -1;
    for (const [t, n] of count) if (n > bestN || (n === bestN && t > best)) { best = t; bestN = n; }
    out[i] = best;
  }
  return out;
}
const tier1 = modePass(modePass(tier0));
const TOP = new Int16Array(W * D);
for (let i = 0; i < W * D; i++) if (fp[i]) TOP[i] = Math.max(tier1[i], G[i] + STOREY); // never shorter than one storey over its ground
const top = (x, z) => TOP[z * W + x];
const ground = (x, z) => G[z * W + x];
const solid = (x, z, y) => inFp(x, z) && y < top(x, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// The entrance: the longest run of street-face cells on the north (-z) edge at ground level.
let door = null;
{
  let best = 0;
  for (let z = 0; z < D; z++) {
    let x = 0;
    while (x < W) {
      if (inFp(x, z) && !inFp(x, z - 1)) {
        let e = x; while (e + 1 < W && inFp(e + 1, z) && !inFp(e + 1, z - 1)) e++;
        if (e - x + 1 > best) { best = e - x + 1; door = { x: (x + e) >> 1, z, run: [x, e] }; }
        x = e + 1;
      } else x++;
    }
  }
}

// A hash so the lit windows are scattered, not regular, and the build is identical on every run.
const lit = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 11 === 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Foundations, the whole column from y 0 up to its ground: nothing floats on a slope.
// Above ground: the outer ring is the facade, one block thick; inside the ring is air, with a slab per storey.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  const gr = ground(x, z), T = top(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  for (let y = gr; y < T; y++) {
    const ring = DIRS.some(([dx, dz]) => !solid(x + dx, z + dz, y));
    if (!ring) {
      // interior: the floor slab of each storey (and the ground floor), the roof surface, else air
      if (y === T - 1) put(x, y, z, "smooth_stone");
      else if (y === gr || y % STOREY === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }
    // the facade: cornice, base, storey bands, and a bay grid of piers and glass
    if (y === T - 1) { put(x, y, z, "stone_bricks"); continue; }
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }
    if (y % STOREY === 0) { put(x, y, z, "light_gray_concrete"); continue; }
    const outX = DIRS.some(([dx, dz]) => dz === 0 && !solid(x + dx, z, y));
    const outZ = DIRS.some(([dx, dz]) => dx === 0 && !solid(x, z + dz, y));
    const along = outX && !outZ ? z : x;
    const pier = (outX && outZ) || along % 4 === 0;
    if (pier) put(x, y, z, "smooth_quartz");
    else if (lit(x, y, z) && y > gr + 3) put(x, y, z, "glowstone");
    else put(x, y, z, "light_blue_stained_glass");
  }
  // the parapet on the open edge of each roof
  if (T < H) {
    const exposed = DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz) || top(x + dx, z + dz) <= T);
    if (exposed) put(x, T, z, "stone_brick_wall");
  }
}

// The entrance: a pair of dark oak doors in the middle of the longest north-face run, with a lintel above.
if (door) {
  const { x: mx, z: mz, run: [x0, x1] } = door;
  const gr = ground(mx, mz);
  const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(mx, gr, mz, "dark_oak_door", doorState("lower"));
  put(mx, gr + 1, mz, "dark_oak_door", doorState("upper"));
  for (let x = Math.max(x0, mx - 2); x <= Math.min(x1, mx + 2); x++) put(x, gr + 2, mz, "polished_andesite");
}

// Roof terraces on the podium: a few plant pads on the open podium roof.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z) || top(x, z) !== 16 || x % 9 !== 4 || z % 9 !== 4) continue;
  const interior = DIRS.every(([dx, dz]) => solid(x + dx, z + dz, 15));
  if (!interior) continue;
  put(x, 16, z, "iron_block"); put(x, 17, z, "iron_block");
}

// The tower top: a plant room on the highest tier around its centre, and a lightning rod on the roof.
{
  const tops = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFp(x, z) && top(x, z) === 164) tops.push([x, z]);
  if (tops.length) {
    const cx = tops.reduce((s, [x]) => s + x, 0) / tops.length, cz = tops.reduce((s, [, z]) => s + z, 0) / tops.length;
    // the plant room takes the 24 top-tier cells nearest the centre of the tier
    const near = [...tops].sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz)).slice(0, 24);
    const set = new Set(near.map(([x, z]) => z * W + x));
    for (const [x, z] of near) {
      const edge = DIRS.some(([dx, dz]) => !set.has((z + dz) * W + x + dx));
      for (let y = 164; y < 168; y++) put(x, y, z, edge ? "light_blue_stained_glass" : "smooth_quartz");
      put(x, 168, z, "stone_bricks");
    }
    const [mx, mz] = near.reduce((best, p) => (Math.hypot(p[0] - cx, p[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? p : best));
    for (let y = 169; y <= 176; y++) put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

const stats = g.save(OUT);
console.log(JSON.stringify({ cells: cells.length, ...stats, door, maxTop: Math.max(...TOP) }));
