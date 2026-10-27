// A Mt Eden-side commercial block (way 293020952): a 1930s brick shop-and-office wing, four storeys with a shopfront on
// its west face, joined to a 1970s concrete-frame tower of eleven storeys. The lidar roof reads 17-18 on the wing and
// 43-44 on the tower; the tower is stepped in as it rises (outer ring to 32, the next ring to 40, the core to 44) with a
// plant room on the core. Storey lines sit on absolute multiples of 4 so windows line up across the building. The ground
// is a solid plinth up to each cell's ground, so nothing floats. Interiors are air behind the facade with a floor slab
// per storey; glowstone sits behind some windows. The tower's lobby is recessed on its south face under a dark canopy;
// the wing's shop door is on its west face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020952.cells.json", "utf8"));
const X = 60, Z = 42, Y = 57;
const G = Array.from({ length: X }, () => Array(Z).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: X }, () => Array(Z).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// ring: 1 on the outside edge, then one more per step inward (4-neighbour distance from the edge)
const ring = Array.from({ length: X }, () => Array(Z).fill(0));
const queue = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inFP(x, z) && DIRS.some(([dx, dz]) => !inFP(x + dx, z + dz))) { ring[x][z] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) { const a = x + dx, b = z + dz; if (inFP(a, b) && !ring[a][b]) { ring[a][b] = ring[x][z] + 1; queue.push([a, b]); } }
}

// the wing is the lidar's low block (roof under 30); everything else is the tower. Tops are snapped to clean tiers:
// the wing to 18, the tower's outer ring to 32, its next ring to 40, the core to 44 (the lidar's 43-44 plateau).
// a lone high cell (two-wide spikes off the wing's north tip) is lidar noise, not a tower: the tower needs a 3x3 majority
const isWing = (x, z) => {
  let tall = 0;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (inFP(x + a, z + b) && R[x + a][z + b] >= 30) tall++;
  return R[x][z] < 30 || tall < 5;
};
const top = (x, z) => (isWing(x, z) ? 18 : ring[x][z] === 1 ? 32 : ring[x][z] === 2 ? 40 : 44);
const solid = (x, y, z) => inFP(x, z) && y < top(x, z);                  // plinth or building
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// the entrances: a three-cell recess on the outer ring with a door in its middle, under a dark canopy one storey up
const cellsOf = (wing) => { const out = []; for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inFP(x, z) && isWing(x, z) === wing) out.push([x, z]); return out; };
const centroid = (list) => [list.reduce((s, c) => s + c[0], 0) / list.length, list.reduce((s, c) => s + c[1], 0) / list.length];
function findEntrance(wing, [dx, dz]) {
  const list = cellsOf(wing), [cx, cz] = centroid(list), along = dz !== 0 ? [1, 0] : [0, 1];
  let best = null, bestD = Infinity;
  for (const [x, z] of list) {
    const run = [-1, 0, 1].map((k) => [x + along[0] * k, z + along[1] * k]);
    const ok = run.every(([a, b]) => inFP(a, b) && isWing(a, b) === wing && ring[a][b] === 1 && !inFP(a + dx, b + dz));
    if (!ok) continue;
    const d = Math.abs(x - cx) + Math.abs(z - cz);
    if (d < bestD) { bestD = d; best = { mid: [x, z], run, dir: [dx, dz] }; }
  }
  return best;
}
const entrances = [findEntrance(false, [0, 1]), findEntrance(true, [-1, 0])].filter(Boolean);

// overrides: the recess, the doors and the canopy; null = air
const over = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
for (const e of entrances) {
  const [mx, mz] = e.mid, ge = G[mx][mz], [dx, dz] = e.dir, facing = DIR_NAME[`${dx},${dz}`];
  for (const [x, z] of e.run) {
    over.set(key(x, ge, z), { block: "polished_andesite" });
    over.set(key(x, ge + 1, z), null);
    over.set(key(x, ge + 2, z), null);
    over.set(key(x, ge + 3, z), { block: "dark_oak_planks" });
  }
  over.set(key(mx, ge, mz), { block: "dark_oak_door", state: { facing, half: "lower", hinge: "left", open: "false", powered: "false" } });
  over.set(key(mx, ge + 1, mz), { block: "dark_oak_door", state: { facing, half: "upper", hinge: "left", open: "false", powered: "false" } });
}

// the skin: which block a facade voxel is, by its wing or tower, its storey row and its place along the wall
function skin(x, y, z, dirs, g, wing) {
  const storey = Math.floor(y / 4), row = ((y % 4) + 4) % 4, top_ = top(x, z);
  // the pattern runs on the first outward face; the footprint's steps are many convex corners, so no corner piers
  const [dx, dz] = dirs[0], u = dz !== 0 ? x : z;
  const pane = dz !== 0 ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  if (y === g) return { block: "polished_andesite" };                       // base course
  if (y === top_ - 1) return { block: wing ? "stone_bricks" : "light_gray_concrete" };   // cornice / parapet
  if (wing) {
    if (row === 0) return { block: "stone_bricks" };                          // string course
    if (storey === 0) return u % 3 === 0 ? { block: "stone_bricks" } : { block: "glass_pane", state: pane, glazed: true };   // shopfront
    if (row === 3 || u % 3 === 0) return { block: "bricks" };
    return { block: "glass_pane", state: pane, glazed: true };
  }
  if (row === 0 || row === 3) return { block: "light_gray_concrete" };      // spandrels
  if (u % 3 === 0) return { block: "white_concrete" };                      // piers
  return { block: "cyan_stained_glass_pane", state: pane, glazed: true };
}

// glowstone behind some lit windows: the inward cell of a glazed facade voxel, when it is air (interior)
const glow = new Set();
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFP(x, z)) continue;
  for (let y = G[x][z]; y < top(x, z); y++) {
    const dirs = exposed(x, y, z);
    if (!dirs.length || over.has(key(x, y, z))) continue;
    const [dx, dz] = dirs[0], u = dz !== 0 ? x : z, storey = Math.floor(y / 4);
    const s = skin(x, y, z, dirs, G[x][z], isWing(x, z));
    if (!s.glazed || (u * 5 + storey * 7 + y) % 7 !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (inFP(ix, iz) && y >= G[ix][iz] && y < top(ix, iz) && !exposed(ix, y, iz).length) glow.add(key(ix, y, iz));
  }
}

// one voxel's block (null = air); the foundation, the building's walls, floors and roof, the plant room on the core
function blockAt(x, y, z) {
  const g = G[x][z], t = top(x, z), wing = isWing(x, z);
  if (y < g) return { block: "polished_andesite" };                        // plinth to each cell's ground
  if (y >= t) {
    if (!wing && t === 44 && y < 47 && ring[x][z] >= 6) return { block: "light_gray_concrete" };   // plant room on the core
    if (!wing && t === 44 && y === 44 && ring[x][z] === 3) return { block: "light_gray_concrete" }; // core parapet
    return null;
  }
  if (glow.has(key(x, y, z))) return { block: "glowstone" };
  const dirs = exposed(x, y, z);
  if (dirs.length) return skin(x, y, z, dirs, g, wing);
  if (y === t - 1) return { block: wing ? "gray_concrete" : "smooth_stone" };         // roof over the interior
  if (y === g || y % 4 === 0) return { block: "smooth_stone" };            // floor slab per storey
  return null;
}

const g = new Voxels([X, Y, Z]);
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFP(x, z)) continue;
  for (let y = 0; y < Y; y++) {
    const k = key(x, y, z);
    const b = over.has(k) ? over.get(k) : blockAt(x, y, z);
    if (b) g.set(x, y, z, b.block, b.state);
  }
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020952.nbt");
