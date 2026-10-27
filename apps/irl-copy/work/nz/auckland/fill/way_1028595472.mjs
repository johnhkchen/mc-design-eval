// 30 Madden: a concrete-frame office block of the 1980s on a stepped podium, a 13-storey tower on the east
// (lidar roof 53), 3-block mullion grid of tinted glazing, a stone plinth and a recessed entrance porch on the z=0 face.
// Massing comes from the lidar roof heights: a 5x5 median, snapped to storey tops (tops sit at 1 mod 4, so 29, 37, 45, 53
// are whole storeys above y=1), then a 3x3 mode filter to lose speckle at tier edges. Each column is solid from the
// foundation up to its own top, and the envelope is the only shell: floor slabs every storey, air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 112, D = 96, H = 67;
const cells = JSON.parse(readFileSync(`${DIR}/way_1028595472.cells.json`, "utf8"));

const grid = (v) => Array.from({ length: W }, () => new Array(D).fill(v));
const raw = grid(0), inFp = grid(false);
for (const [x, z, , r] of cells) { raw[x][z] = r; inFp[x][z] = true; }
const fp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inFp[x][z];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar roof -> storey top, at least one storey (5)
const tier = (r) => Math.max(5, 4 * Math.round((r - 1) / 4) + 1);
const median = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (fp(x + dx, z + dz)) v.push(raw[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
let top = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFp[x][z]) top[x][z] = tier(median(x, z));
const smooth = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp[x][z]) continue;
  const own = top[x][z], count = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (fp(x + dx, z + dz)) {
    const t = top[x + dx][z + dz]; count.set(t, (count.get(t) || 0) + 1);
  }
  let best = own, bestN = 0;
  for (const [t, n] of count) if (n > bestN || (n === bestN && t === own)) { best = t; bestN = n; }
  smooth[x][z] = best;
}
top = smooth;

// entrance: centre of the z=0 front, a 5-wide porch two cells deep
const front = []; for (let x = 0; x < W; x++) if (fp(x, 0)) front.push(x);
const xc = front[Math.floor(front.length / 2)];
const porch = (x, z, y) => fp(x, z) && z <= 1 && Math.abs(x - xc) <= 2 && y >= 1 && y <= 3;
const open = (x, z, y) => !fp(x, z) || y >= top[x][z] || porch(x, z, y);
const ext = (x, z, y) => DIRS.some(([dx, dz]) => open(x + dx, z + dz, y));
const perimeter = (x, z) => DIRS.some(([dx, dz]) => !fp(x + dx, z + dz));

// storey skin: y=1 plinth, 2-3 glazing with a mullion every 3rd column, 4 lintel; roof cap on each column's top
function skin(x, z, y, T, e) {
  const ph = (y - 1) % 4, k = Math.floor((y - 1) / 4);
  if (y === 4 && z <= 1 && Math.abs(x - xc) <= 2) return "smooth_stone";     // porch canopy
  if (y === T - 1) return "gray_concrete";                                    // roof
  if (e) {
    if (ph === 0) return k === 0 ? "polished_andesite" : "light_gray_concrete";
    if (ph === 3) return "white_concrete";
    if ((x + z) % 3 === 0) return "gray_concrete";
    return k === 0 ? "cyan_stained_glass" : "light_blue_stained_glass";
  }
  return ph === 0 ? "light_gray_concrete" : null;
}

const g = new Voxels([W, H, D]);
let lights = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = top[x][z]; if (!T) continue;
  g.set(x, 0, z, "stone_bricks");                                              // foundation under every footprint cell
  for (let y = 1; y < T; y++) {
    if (porch(x, z, y)) continue;
    const e = ext(x, z, y), b = skin(x, z, y, T, e);
    if (b) g.set(x, y, z, b);
  }
}
// warm light just inside some glazed bays (the air gap behind the glass, on the floor slab)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = top[x][z]; if (!T) continue;
  for (let y = 2; y < T; y += 4) {
    if (!ext(x, z, y) || (x + z) % 3 === 0 || porch(x, z, y)) continue;
    const k = Math.floor((y - 1) / 4);
    if ((Math.floor((x + z) / 3) * 5 + k * 3) % 6 !== 0) continue;
    const dir = DIRS.find(([dx, dz]) => open(x + dx, z + dz, y));
    if (!dir) continue;
    const ix = x - dir[0], iz = z - dir[1];
    if (!fp(ix, iz) || y >= top[ix][iz] || ext(ix, iz, y) || porch(ix, iz, y)) continue;
    g.set(ix, y, iz, "glowstone"); lights++;
  }
}
// the entrance: a door set in the z=2 glazing line, posts at the porch corners, a hanging lantern under the canopy
g.set(xc, 1, 2, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(xc, 2, 2, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let y = 1; y <= 3; y++) { g.set(xc - 2, y, 0, "polished_andesite"); g.set(xc + 2, y, 0, "polished_andesite"); }
g.set(xc, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// parapets: one block on the edge of each roof, two on the tower; then the tower's plant room on its roof
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = top[x][z]; if (!T || !perimeter(x, z)) continue;
  g.set(x, T, z, "white_concrete");
  if (T >= 53) g.set(x, T + 1, z, "white_concrete");
}
const tower = []; for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (top[x][z] >= 53) tower.push([x, z]);
const cx = Math.round(tower.reduce((s, [x]) => s + x, 0) / tower.length);
const cz = Math.round(tower.reduce((s, [, z]) => s + z, 0) / tower.length);
for (let x = cx - 5; x <= cx + 4; x++) for (let z = cz - 3; z <= cz + 2; z++) {
  if (!fp(x, z) || top[x][z] !== 53 || perimeter(x, z)) continue;
  g.set(x, 53, z, "light_gray_concrete"); g.set(x, 54, z, "light_gray_concrete"); g.set(x, 55, z, "gray_concrete");
}

const out = g.save(`${DIR}/way_1028595472.nbt`);
const tops = {}; for (const [x, z] of cells.map(([x, z]) => [x, z])) tops[top[x][z]] = (tops[top[x][z]] || 0) + 1;
console.log(JSON.stringify({ ...out, lights, entranceX: xc, tower: { cx, cz, cells: tower.length }, tops }));
