// 96 On Symonds (way 292861374): a 29 x 22 block footprint, roof at 58 blocks (lidar 58-59, flat, so one roof line).
// Read as a late-20th-century glass-and-precast office block on a three-storey podium: a planted terrace on the podium
// roof, a 4-block storey grid (spandrel line, three rows of glass, piers between bays), a setback to the middle tier at
// y 40 and to the top tier at y 40 and a cornice / parapet at 56-57. Shopfront glass and a dark-oak double door on the
// north face; glowstone on the floor behind some first-glass rows. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861374.cells.json", "utf8"));
const W = 29, D = 22, H = 72, TOP = 58;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
for (const [x, z, g] of cells) G[x][z] = g;
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// distance in cells from the outside (edge cells are 1; outside is 0), so the tiers can step in by inset
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
const d_ = (x, z) => (inside(x, z) ? dist[x][z] : 0);

// the massing: podium to y 12 (ring depth 1, the whole footprint), tower to y 40 (inset 3), crown to y 56 (inset 4)
const tier = (y) => (y <= 12 ? 1 : y <= 40 ? 3 : 4);
// storey lines every 4 rows from the ground, plus the ground's own base row (the footprint's lowest cell is 0 or 1)
const isLine = (y, g) => y % 4 === 0 || y === g;

// the entrance: two dark-oak doors in the north (z = 0) face, nearest the footprint's centre
const northEdge = [];
for (let x = 0; x < W; x++) if (inside(x, 0) && !inside(x, -1) && G[x][0] !== undefined) northEdge.push(x);
let meanX = 0, n = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) { meanX += x; n++; }
meanX /= n;
let doorX = northEdge.reduce((best, x) => (Math.abs(x - meanX) < Math.abs(best - meanX) && inside(x + 1, 0) ? x : best), northEdge[0]);
const doorCells = new Set([`${doorX},0`, `${doorX + 1},0`]);
const doorAt = (x, z) => doorCells.has(`${x},${z}`);

// facade cell: its outward neighbours are the cells one step closer to the outside
const outward = (x, z) => {
  const d = d_(x, z), out = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (d_(x + dx, z + dz) === d - 1) out.push([dx, dz]);
  return out;
};

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const g = G[x][z]; if (g < 0) continue;
  const d = dist[x][z];
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  for (let y = g; y <= 57; y++) {
    const line = isLine(y, g);
    // floor slabs and the storey lines over every cell the tier covers (the ring is the same cells)
    if (line && y <= 56) {
      if (d < tier(y)) continue;
      const ring = d === tier(y);
      let block = "light_gray_concrete";                           // spandrel / floor slab
      if (y === g) block = "smooth_stone";                          // base course
      if (y === 56) block = ring ? "polished_andesite" : "stone";           // cornice / roof surface
      put(x, y, z, block);
      continue;
    }
    if (y === 57) { if (d === 4) put(x, y, z, "smooth_quartz"); continue; }   // parapet on the crown ring

    // podium parapet at y 13-14 on the ring; planters on the terrace (inset 2) over the podium roof
    if (y === 13 || y === 14) {
      if (d === 1) { put(x, y, z, "smooth_quartz"); continue; }
      if (y === 13 && d === 2 && (3 * x + 5 * z) % 7 === 0) { put(x, y, z, "gray_concrete"); continue; }
      if (y === 14 && d === 2 && (3 * x + 5 * z) % 7 === 0) { put(x, y, z, "oak_leaves", { persistent: "true" }); continue; }
    }

    if (d !== tier(y)) continue;                                    // interior: air behind the glass
    const out = outward(x, z);
    if (doorAt(x, z) && z === 0 && y >= g + 1 && y <= g + 2) {
      const upper = y === g + 2;
      put(x, y, z, "dark_oak_door", {
        facing: "north", half: upper ? "upper" : "lower", hinge: x === doorX ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }
    if (out.length !== 1) { put(x, y, z, "smooth_quartz"); continue; }   // corner column
    const [nx, nz] = out[0];
    const u = nx !== 0 ? z : x;                                     // position along the wall
    const pier = u % 3 === 0;
    const b = Math.floor(u / 3);
    if (y === g + 3 && z === 0 && doorX - 1 <= x && x <= doorX + 2 && !isLine(y, g)) {
      put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });   // canopy over the entrance
      continue;
    }
    if (y < 4) {                                                    // ground: shopfront, clear glass between piers
      put(x, y, z, pier ? "polished_andesite" : "glass");
      continue;
    }
    if (pier) { put(x, y, z, "smooth_quartz"); continue; }
    put(x, y, z, b % 4 === 2 ? "cyan_stained_glass" : "light_blue_stained_glass");
    // a warm lamp on the floor just behind some first-glass rows (air between it and the glass's far side)
    if (y % 4 === 1 && (b + Math.floor(y / 4)) % 3 === 0) {
      const ix = x - nx, iz = z - nz;
      if (inside(ix, iz) && dist[ix][iz] === d + 1) put(ix, y, iz, "glowstone");
    }
  }
}

const stats = vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861374.nbt");
console.log(`way 292861374: ${stats.blocks} blocks, ${stats.palette} palette entries, door at x ${doorX}-${doorX + 1}, z 0`);
