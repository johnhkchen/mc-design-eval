// Way 1105752285, Auckland CBD (Queen Street fringe): a 1980s concrete-and-tinted-glass office block.
// Massing follows the lidar roof, smoothed into flat tiers: 3-storey wings (lidar 9-14), a 4-storey podium
// (15-39), a 21-storey office slab (40-84) and a 91-block plant-topped core (x 15-35, z 19-36). Solid foundation
// from y 0 to each cell's ground; a 1-block shell with air behind it and a slab per storey (y % 4 == 0).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1105752285.cells.json`, "utf8"));
const W = 62, D = 47, H = 104;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Per-cell ground and top (height above y 0), from the lidar roof.
const GR = new Int16Array(W * D).fill(-1);
const TOP = new Int16Array(W * D);
const ix = (x, z) => z * W + x;
const inFP = (x, z) => x >= 0 && x < W && z >= 0 && z < D && GR[ix(x, z)] >= 0;
const topAt = (x, z) => (inFP(x, z) ? TOP[ix(x, z)] : 0);
const exposed = (x, y, z) => NB.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);
const nextSpand = (g) => 4 * (Math.floor(g / 4) + 1);

function tierOf(r, x, z) {
  if (r < 15) return 12;                                                  // low wings, 3 storeys
  if (r < 40) return 16;                                                  // podium, 4 storeys
  if (r >= 85 && x >= 15 && x <= 35 && z >= 19 && z <= 36) return 91;     // tower core with plant
  return 84;                                                              // office slab, 21 storeys
}
for (const [x, z, g, r] of cells) { GR[ix(x, z)] = g; TOP[ix(x, z)] = tierOf(r, x, z); }
// Lidar noise: drop single-cell slivers, then demote isolated office-height cells to the podium (two passes).
const nbCount = (x, z, pred) => NB.filter(([dx, dz]) => pred(x + dx, z + dz)).length;
for (const [x, z] of cells) if (nbCount(x, z, inFP) <= 1) GR[ix(x, z)] = -1;
// ...and detached pieces under 12 cells (stray annexes that would read as floating stubs).
const seen = new Set();
for (const [x0, z0] of cells) {
  if (!inFP(x0, z0) || seen.has(ix(x0, z0))) continue;
  const comp = [], stack = [[x0, z0]]; seen.add(ix(x0, z0));
  while (stack.length) {
    const [x, z] = stack.pop(); comp.push([x, z]);
    for (const [dx, dz] of NB) { const a = x + dx, b = z + dz;
      if (inFP(a, b) && !seen.has(ix(a, b))) { seen.add(ix(a, b)); stack.push([a, b]); } }
  }
  if (comp.length < 12) for (const [x, z] of comp) GR[ix(x, z)] = -1;
}
for (let pass = 0; pass < 2; pass++)
  for (const [x, z] of cells) if (inFP(x, z) && TOP[ix(x, z)] >= 84 && nbCount(x, z, (a, b) => topAt(a, b) >= 84) <= 1) TOP[ix(x, z)] = 16;
for (const [x, z, g] of cells) if (inFP(x, z) && TOP[ix(x, z)] < g + 4) throw new Error(`cell ${x},${z} too low for its ground`);

// Facade block for an exposed shell voxel: base course, cornice, spandrel per storey, shopfront, then piers and glass.
function facade(x, y, z, [dx, dz], g, t) {
  if (y === g) return ["polished_andesite"];
  if (y === t - 1) return ["white_concrete"];
  if (y % 4 === 0) return ["white_concrete"];
  const along = dx !== 0 ? z : x;                       // coordinate running along this face
  const pier = along % 3 === 0;
  if (y < nextSpand(g)) return [pier ? "stone_bricks" : "glass"];
  return [pier ? "light_gray_concrete" : "cyan_stained_glass"];
}

const B = new Voxels([W, H, D]);

// Foundation, shell, interior roof and floor slabs.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  const g = GR[ix(x, z)], t = TOP[ix(x, z)];
  for (let y = 0; y < t; y++) {
    if (y < g) { B.set(x, y, z, "stone"); continue; }
    const dirs = exposed(x, y, z);
    if (dirs.length) { const [b, s] = facade(x, y, z, dirs[0], g, t); B.set(x, y, z, b, s); }
    else if (y === t - 1) B.set(x, y, z, "gray_concrete");
    else if (y % 4 === 0 && y > g) B.set(x, y, z, "light_gray_concrete");   // floor slab, interior air above
  }
}

// Parapet on every roof edge (a neighbour lower or outside).
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  const t = TOP[ix(x, z)];
  if (NB.some(([dx, dz]) => topAt(x + dx, z + dz) < t)) B.set(x, t, z, "light_gray_concrete");
}

// Entrance on the north face of the slab: recessed doorway, glazed vestibule, lintel and soffit.
const north = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (inFP(x, z) && !inFP(x, z - 1) && TOP[ix(x, z)] === 84 && GR[ix(x, z)] <= 4) north.push([x, z]);
north.sort((a, b) => a[0] - b[0]);
const [xc, zf] = north[Math.floor(north.length / 2)];
const eg = GR[ix(xc, zf)];
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
B.set(xc, eg, zf, "dark_oak_door", doorState("lower"));
B.set(xc, eg + 1, zf, "dark_oak_door", doorState("upper"));
for (const xx of [xc - 1, xc + 1]) { B.set(xx, eg, zf, "glass"); B.set(xx, eg + 1, zf, "glass"); }
for (const xx of [xc - 1, xc, xc + 1]) { B.set(xx, eg + 2, zf, "light_gray_concrete"); B.set(xx, eg + 2, zf + 1, "light_gray_concrete"); }

// Roof plant: two boxes on the office roof, one on the core, with a lightning rod.
function plantBox(x0, z0, w, d, top, y0, h) {
  for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++)
    if (!inFP(x, z) || TOP[ix(x, z)] !== top) return false;
  for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) {
    for (let y = y0; y < y0 + h - 1; y++) B.set(x, y, z, "light_gray_concrete");
    B.set(x, y0 + h - 1, z, "iron_block");
  }
  return true;
}
plantBox(6, 22, 6, 4, 84, 84, 2);
plantBox(36, 30, 6, 4, 84, 84, 2);
plantBox(6, 33, 6, 4, 84, 84, 2);
plantBox(21, 25, 7, 6, 91, 91, 3);
B.set(24, 94, 27, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Warm light behind some upper windows: glowstone on the slab, just inside the glass.
let lights = 0;
for (const [x, z] of cells) {
  if (!inFP(x, z)) continue;
  const t = TOP[ix(x, z)];
  for (let y = 5; y < t - 2; y++) {
    if (y % 4 !== 1) continue;
    const dirs = exposed(x, y, z);
    if (!dirs.length) continue;
    const [dx, dz] = dirs[0];
    const along = dx !== 0 ? z : x;
    if (along % 3 === 0) continue;                                      // a pier, not glass
    const ax = x - dx, az = z - dz;
    if (!inFP(ax, az) || exposed(ax, y, az).length) continue;           // inside the shell
    if (y >= TOP[ix(ax, az)] - 1 || B.val(ax, y, az) !== 0 || B.val(ax, y - 1, az) === 0) continue;
    if (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % 9 !== 0) continue;
    B.set(ax, y, az, "glowstone"); lights++;
  }
}

const out = B.save(`${DIR}/way_1105752285.nbt`);
console.log(JSON.stringify({ entrance: [xc, zf], lights, ...out }));
