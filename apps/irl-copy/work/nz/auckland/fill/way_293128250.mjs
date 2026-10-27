// Nautilus Apartments, Auckland (way 293128250): a 1970s-80s concrete-frame apartment block, eleven storeys over a
// ten-storey shoulder and nine-storey wings, tiers taken from the lidar roof (median-smoothed, snapped to 36 / 40 / 44
// blocks above the lowest ground; the tower is set back two cells from its edge onto the shoulder). Basalt plinth
// (polished deepslate) on stone-brick foundations, white concrete piers and floor lines, light-grey spandrels, tinted
// glass (grey on the tower, light blue below), a canopied entrance on the lowest street face, roof plant on the tower,
// planters on the shoulder, glowstone behind some panes. Interiors are air between a slab floor and ceiling per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128250.cells.json", "utf8"));
const W = 38, D = 30, H_MAX = 56;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// lidar noise: a roof reading under 10 (the footprint's edge speckle) takes the median of its good neighbours
const nbrs = (x, z) => { const v = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if ((dx || dz) && inside(x + dx, z + dz)) v.push([x + dx, z + dz]); return v; };
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && R[x][z] < 10) {
  const good = nbrs(x, z).map(([a, b]) => R[a][b]).filter(r => r >= 10);
  R[x][z] = good.length ? median(good) : 36;
}

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// tiers: a 3x3 median of the smoothed roof, snapped to 36 (wings), 40 (shoulder), 44 (tower); the tower steps down to
// the shoulder within two cells of its edge, so it stands on a podium
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median([R[x][z], ...nbrs(x, z).map(([a, b]) => R[a][b])]);
  let t = m >= 42 ? 44 : m >= 38 ? 40 : 36;
  if (t === 44 && dist[x][z] <= 2) t = 40;
  H[x][z] = t;
  tierCount[t] = (tierCount[t] || 0) + 1;
}

// faces: N and S walls run along x, W and E walls along z; a face is exposed at height y if it is the outside or beside
// a neighbour that stops below y (the setbacks)
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ORDER = ["N", "S", "W", "E"];
const AXIS = { N: "x", S: "x", W: "z", E: "z" };
const FACE = { N: "north", S: "south", W: "west", E: "east" };
const exposed = (x, z, y) => ORDER.filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y >= H[nx][nz];
});
const isRing = (x, z) => ORDER.some(k => { const [dx, dz] = DIRS[k]; return !inside(x + dx, z + dz); });

// hashed, so the lit windows scatter rather than line up
const lit = (x, y, z) => (x * 31 + y * 17 + z * 13) % 7 === 0;

// the entrance: on the outside face at the lowest ground, nearest the middle of those faces; its canopy needs room
const cand = [];
const lowest = Math.min(...cells.map(([, , g]) => g));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && G[x][z] === lowest) {
  for (const k of ORDER) {
    const [dx, dz] = DIRS[k];
    if (!inside(x + dx, z + dz) && inside(x - dx, z - dz) && x + 2 * dx >= 0 && z + 2 * dz >= 0 && x + 2 * dx < W && z + 2 * dz < D) cand.push({ x, z, k });
  }
}
const mx = cand.reduce((s, c) => s + c.x, 0) / cand.length, mz = cand.reduce((s, c) => s + c.z, 0) / cand.length;
const door = cand.length ? cand.sort((a, b) => Math.hypot(a.x - mx, a.z - mz) - Math.hypot(b.x - mx, b.z - mz))[0] : null;

const g = new Voxels([W, H_MAX, D]);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z];
  // foundation: solid from y 0 up to the ground under the cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < top; y++) {
    // roof covering on the tier's top row (y % 4 === 3, the same row as the floor line)
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a slab floor (y % 4 === 0) and ceiling (y % 4 === 3) per storey, and the ground floor
      if (y === gr || y % 4 === 0 || y % 4 === 3) g.set(x, y, z, "smooth_stone");
      continue;
    }
    // facade: a storey is four rows, spandrel, two rows of window, floor line
    const k = Math.floor(y / 4), r = y % 4;
    const face = ex[0], axis = AXIS[face];
    const along = axis === "x" ? x : z;
    if (y === gr) g.set(x, y, z, "polished_deepslate");                    // basalt plinth
    else if (r === 3) g.set(x, y, z, "white_concrete");                    // floor line
    else if (r === 0) g.set(x, y, z, "light_gray_concrete");               // spandrel
    else if (along % 3 === 0) g.set(x, y, z, k === 0 ? "polished_deepslate" : "white_concrete");  // pier, every third bay
    else {
      const pane = axis === "x"
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, top >= 44 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane", pane);
    }
  }
}

// cornice and parapet on the outside ring; glowstone behind some glass (on the interior floor, one cell in)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const top = H[x][z];
  if (isRing(x, z)) {
    g.set(x, top - 2, z, "white_concrete");                                // cornice band under the parapet
    g.set(x, top, z, "white_concrete");                                    // parapet
  }
  // glass rows (1 and 2 of a storey, above the first storey) with the interior cell behind them: a warm light there
  for (let y = 5; y < top - 1; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length || y % 4 === 0 || y % 4 === 3) continue;
    const p = ex[0], [dx, dz] = DIRS[p];
    const along = AXIS[p] === "x" ? x : z;
    if (along % 3 === 0 || !lit(x, y, z)) continue;
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && H[ix][iz] > y && exposed(ix, iz, y).length === 0) g.set(ix, y, iz, "glowstone");
  }
}

// the entrance: a door on the street face (two halves), a canopy on two posts, a lantern under the canopy
if (door) {
  const [dx, dz] = DIRS[door.k];
  const L = door.k === "N" || door.k === "S" ? [1, 0] : [0, 1];
  const gr = G[door.x][door.z];
  const facing = FACE[door.k];
  g.set(door.x, gr, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, gr + 1, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  const P = (a, l) => [door.x + a * dx + l * L[0], door.z + a * dz + l * L[1]];
  for (const a of [1, 2]) for (const l of [-1, 0, 1]) { const [px, pz] = P(a, l); if (!inside(px, pz)) g.set(px, gr + 2, pz, "smooth_stone"); }
  for (const l of [-1, 1]) { const [px, pz] = P(2, l); for (let y = 0; y <= gr + 1; y++) g.set(px, y, pz, "polished_deepslate"); }
  const [lx, lz] = P(1, 0);
  g.set(lx, gr + 1, lz, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof plant on the tower (2x2 boxes set well in from the edge), planters on the shoulder roof
for (let x = 1; x < W - 2; x++) for (let z = 1; z < D - 2; z++) {
  const inner = (a, b) => [-1, 0, 1].every(i => [-1, 0, 1].every(j => inside(a + i, b + j) && H[a + i][b + j] === H[a][b]));
  if (!inner(x, z) || H[x][z] !== 44 || (x % 6 !== 2) || (z % 6 !== 2)) continue;
  if (!inner(x + 1, z) || !inner(x, z + 1) || !inner(x + 1, z + 1)) continue;
  for (const [a, b] of [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]]) for (const y of [44, 45]) g.set(a, y, b, "light_gray_concrete");
}
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || H[x][z] !== 40 || (x + z) % 4 !== 0) continue;
  if (ORDER.every(k => { const [dx, dz] = DIRS[k]; return inside(x + dx, z + dz) && H[x + dx][z + dz] === 40; })) g.set(x, 40, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128250.nbt");
console.log(`tiers ${JSON.stringify(tierCount)}, door ${door ? `${door.x},${door.z} ${door.k}` : "none"}, ${info.blocks} blocks, ${info.palette} block states`);
