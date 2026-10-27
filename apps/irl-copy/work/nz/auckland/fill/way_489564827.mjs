// Shortland Chambers, Auckland (way 489564827): a 1980s precast-and-glass office tower on a basalt plinth. Lidar roofs
// are median-smoothed and snapped to flat tiers: a 77 tower core (3+ blocks in from the edge) over a 72 podium that
// wraps its outer ring, 64 and 56 wings, 16 low sheds. The facade is a 4-block storey rhythm (quartz floor line, two
// tinted glass rows, a light-grey spandrel), quartz fins every third bay, a shopfront band on the ground storey with a
// basalt-lintelled entrance and a hanging lantern, and warm glowstone just inside some windows. Interiors are air with
// a floor slab per storey; the roof carries rooftop plant boxes on the tower and a parapet on the outer ring.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_489564827.cells.json", "utf8"));
const W = 30, D = 28, TOP = 89;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// 3x3 median of the lidar roof, then one flat tier per cell
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierTop = (r, d) => r >= 75 ? (d >= 3 ? 77 : 72) : r >= 68 ? 72 : r >= 60 ? 64 : r >= 50 ? 56 : r >= 14 ? 16 : 8;
const H = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  // at least two storeys above the ground under the cell, so the downhill side shows its extra storeys
  H[x][z] = Math.max(tierTop(median(x, z), dist[x][z]), 4 * Math.ceil((G[x][z] + 4) / 4));
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
// the first storey line above a cell's ground; the shopfront runs from the ground up to the fascia just below it
const nextLine = (gr) => 4 * (Math.floor(gr / 4) + 1);

// the facade block of an exposed wall cell at height y (y > ground)
const wallBlock = (x, z, y, ex, gr) => {
  const alongX = ex.some(k => k === "N" || k === "S"), alongZ = ex.some(k => k === "E" || k === "W");
  const pier = (alongX && x % 3 === 0) || (alongZ && z % 3 === 0) || (alongX && alongZ);
  const shopTop = nextLine(gr) - 1;
  if (y <= shopTop) {                                              // ground storey: shopfront glass, fascia, dark basalt piers
    if (y === shopTop) return "smooth_quartz";
    return pier ? "polished_basalt" : "cyan_stained_glass";
  }
  const row = y % 4;
  if (row === 0 || pier) return "smooth_quartz";                  // storey line and quartz fins
  if (row === 3) return "light_gray_concrete";                    // spandrel
  const bay = Math.floor((alongX ? x : z) / 3);
  return bay % 4 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass";
};

const g = new Voxels([W, TOP, D]);
const lit = [];                                                    // [x, y, z] glowstone just inside a window
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  // roof covering on the top of the cell, parapet on the outside ring; rooftop plant boxes on the tower
  g.set(x, top, z, "light_gray_concrete");
  if (d === 1) g.set(x, top + 1, z, "smooth_quartz");
  if (top === 77 && d >= 5 && x % 4 !== 0 && z % 4 !== 0 && x % 4 !== 3 && z % 4 !== 3) {
    for (let y = top + 1; y <= top + 2; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, top + 3, z, "smooth_quartz");
  }

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_basalt"); continue; }   // base course on the plinth
    const block = wallBlock(x, z, y, ex, gr);
    g.set(x, y, z, block);
    // some windows light up: glowstone just inside, where the cell is an interior (not a wall) cell
    const row = y % 4;
    if (block === "light_blue_stained_glass" || block === "cyan_stained_glass") {
      if (row === 1 || row === 2) {
        if ((x * 5 + z * 3 + y) % 9 === 0 && ex.length === 1) {
          const [dx, dz] = DIRS[ex[0]];
          const ix = x - dx, iz = z - dz;
          if (inside(ix, iz) && H[ix][iz] > y && dist[ix][iz] >= 2) lit.push([ix, y, iz]);
        }
      }
    }
  }
}
for (const [x, y, z] of lit) g.set(x, y, z, "glowstone");

// the entrance: the street face with the lowest ground, on a glass bay (the middle of three), lintelled and lit
const lowest = Math.min(...cells.map(c => c[2]));
const cands = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || G[x][z] > lowest + 4 || H[x][z] < 16) continue;
  const ex = exposed(x, z, G[x][z] + 1);
  if (ex.length === 1) cands.push({ x, z, dir: ex[0] });
}
const byDir = {};
for (const c of cands) (byDir[c.dir] ||= []).push(c);
const faceDir = Object.keys(byDir).sort((a, b) => byDir[b].length - byDir[a].length)[0];
if (faceDir) {
  const face = byDir[faceDir], alongX = faceDir === "N" || faceDir === "S";
  const idxOf = (c) => (alongX ? c.x : c.z);
  const bays = face.filter(c => idxOf(c) % 3 === 1).sort((a, b) => idxOf(a) - idxOf(b));
  const door = bays[Math.floor(bays.length / 2)];
  if (door) {
    const { x, z } = door, gr = G[x][z];
    g.set(x, gr + 1, z, "dark_oak_door", { facing: FACING[faceDir], half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "dark_oak_door", { facing: FACING[faceDir], half: "upper", hinge: "left", open: "false", powered: "false" });
    for (const o of [0, 1]) {                                     // the bay's lintel over the door and its glass neighbour
      const lx = x + (alongX ? o : 0), lz = z + (alongX ? 0 : o);
      if (inside(lx, lz)) g.set(lx, gr + 3, lz, "polished_basalt");
    }
    const fx = x + (alongX ? 1 : 0), fz = z + (alongX ? 0 : 1);     // hanging lantern under the lintel, on the glass neighbour
    if (inside(fx, fz)) g.set(fx, gr + 2, fz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_489564827.nbt");
