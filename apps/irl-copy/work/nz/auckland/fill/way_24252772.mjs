// The CAB: a 1970s concrete-frame office block on Auckland's CBD ridge, read from the lidar: the roof runs 5 to 88 blocks
// above y 0 (about 4 to 73 m), so the massing is a 20-storey slab with a taller tower core to the north, a lower light-well
// roof inside the court and a stepped plant room on top. Each cell's roof is the median of its 5x5 neighbourhood, rounded
// to whole storeys (4 blocks), so the tiers are clean flats. Solid foundation runs from y 0 up to each cell's ground, so
// the downhill side carries its extra storeys. The outline is a one-block shell of light-grey concrete piers, pale floor
// lines, dark spandrels and blue-tinted glass, with a polished andesite plinth; step faces above a lower tier are dressed
// the same way. Behind some windows a glowstone or shroomlight sits in the air gap. Two glazed entrances sit on the
// face with the most outline, one third and two thirds along it. Nothing is hollowed out: the interior is air with a
// floor slab per storey, and a smooth stone roof caps each tier with a concrete parapet on the outline.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(dir + "way_24252772.cells.json", "utf8"));
const W = 35, D = 52, H = 101, STOREY = 4;

const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const ground = grid(-1), lidar = grid(-1);
for (const [x, z, g, r] of cells) { ground[x][z] = g; lidar[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DOOR_FACING = { "1,0": "west", "-1,0": "east", "0,1": "north", "0,-1": "south" };   // a door faces inward

// depth: 1 on the outline, 2 one cell in, and so on (a breadth-first walk in from outside the footprint)
const depth = grid(0);
let frontier = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (inside(x, z) && DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { depth[x][z] = 1; frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of DIRS) {
    const a = x + dx, b = z + dz;
    if (inside(a, b) && !depth[a][b]) { depth[a][b] = d + 1; next.push([a, b]); }
  }
  frontier = next;
}

// the roof: the median lidar height over a 5x5 window, rounded to whole storeys
const top = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) vals.push(lidar[x + dx][z + dz]);
  vals.sort((p, q) => p - q);
  top[x][z] = Math.round(vals[vals.length >> 1] / STOREY) * STOREY;
}

const outward = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const isCorner = (x, z) => depth[x][z] === 1 && outward(x, z).length > 1;

// a shell block at (x, y, z): an outline cell's outer face, or the face of a cell standing above a lower neighbour's roof
const shellFace = (x, z, y) => {
  if (depth[x][z] === 1) return outward(x, z)[0];
  for (const d of DIRS) { const a = x + d[0], b = z + d[1]; if (inside(a, b) && top[a][b] <= y) return d; }
  return null;
};

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < H) v.set(x, y, z, block, state); };

// the entrances: the face with the most outline, the two lobby doors a third and two thirds along its run
const faceCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && depth[x][z] === 1) for (const d of outward(x, z)) faceCount[d] = (faceCount[d] || 0) + 1;
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0].split(",").map(Number);
const idxAlong = (x, z, d) => (d[0] !== 0 ? z : x);
const run = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (inside(x, z) && depth[x][z] === 1 && outward(x, z).some(([dx, dz]) => dx === front[0] && dz === front[1]) && !isCorner(x, z)) run.push([x, z]);
}
run.sort((a, b) => idxAlong(a[0], a[1], front) - idxAlong(b[0], b[1], front));
const doorCells = [];
for (const k of [Math.floor(run.length / 3), Math.floor((2 * run.length) / 3)]) {
  for (let i = k; i < run.length; i++) {
    const [x, z] = run[i];
    if (idxAlong(x, z, front) % 3 !== 0) { doorCells.push([x, z]); break; }
  }
}
const isDoor = (x, z) => doorCells.some(([a, b]) => a === x && b === z);

function facade(x, z, y, d, g) {
  if (y === g) return ["polished_andesite"];
  const idx = idxAlong(x, z, d);
  if (isCorner(x, z) || idx % 3 === 0) return ["white_concrete"];        // piers: corners and every third bay, pale against the spandrels
  if (y % STOREY === 0) return ["light_gray_concrete"];                  // pale floor lines
  if (y % STOREY === 3) return ["gray_concrete"];                        // dark spandrels under each floor
  return ["light_blue_stained_glass"];
}

// the envelope column by column
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const g = ground[x][z], T = top[x][z];
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");                  // foundation down to the cell's ground
  for (let y = g; y < T; y++) {
    const d = shellFace(x, z, y);
    if (d) {
      if (isDoor(x, z) && (y === g + 1 || y === g + 2)) {
        const half = y === g + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: DOOR_FACING[d], half, hinge: "left", open: "false", powered: "false" });
      } else {
        const [block] = facade(x, z, y, d, g);
        put(x, y, z, block);
      }
    } else if (y % STOREY === 0) put(x, y, z, "light_gray_concrete");          // a floor slab per storey, air between
  }
  put(x, T, z, "smooth_stone");                                              // the roof of this tier
  if (depth[x][z] === 1) put(x, T + 1, z, "light_gray_concrete");              // parapet on the outline
}

// warm light behind some windows: a glowstone (or a shroomlight) in the air gap a cell inside the glass
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || depth[x][z] !== 1) continue;
  for (const d of outward(x, z)) {
    const ix = x - d[0], iz = z - d[1];
    if (!inside(ix, iz) || depth[ix][iz] < 2) continue;
    for (let y = ground[x][z] + 1; y < top[x][z] - 1; y++) {
      if (y % STOREY !== 1 && y % STOREY !== 2) continue;
      if (y >= top[ix][iz] || shellFace(ix, iz, y) || isDoor(x, z)) continue;
      const h = (x * 7 + z * 13 + y * 5) % 11;
      if (h === 0) put(ix, y, iz, "glowstone");
      else if (h === 5) put(ix, y, iz, "shroomlight");
    }
  }
}

// roof plant: a penthouse on the tower core, two plant boxes on the main tier
const boxOK = (x0, z0, s, T) => {
  for (let x = x0; x < x0 + s; x++) for (let z = z0; z < z0 + s; z++) {
    if (!inside(x, z) || top[x][z] !== T || depth[x][z] < 3) return false;
  }
  return true;
};
const boxes = (T, s) => {
  const out = [];
  for (let x = 0; x <= W - s; x++) for (let z = 0; z <= D - s; z++) if (boxOK(x, z, s, T)) out.push([x, z]);
  return out;
};
const centroid = (T) => {
  let sx = 0, sz = 0, n = 0;
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && top[x][z] === T) { sx += x; sz += z; n++; }
  return [sx / n, sz / n];
};
const nearest = (cands, [px, pz], taken) => {
  let best = null, bd = Infinity;
  for (const [x, z] of cands) {
    if (taken.some(([a, b]) => Math.abs(a - x) < 3 && Math.abs(b - z) < 3)) continue;
    const dd = (x + 1.5 - px) ** 2 + (z + 1.5 - pz) ** 2;
    if (dd < bd) { bd = dd; best = [x, z]; }
  }
  return best;
};

const towerT = 88;
const [tcx, tcz] = centroid(towerT);
const pent = nearest(boxes(towerT, 5), [tcx, tcz], []);
if (pent) {
  const [px, pz] = pent, y0 = towerT + 1;
  for (let x = px; x < px + 5; x++) for (let z = pz; z < pz + 5; z++) {
    const edge = x === px || x === px + 4 || z === pz || z === pz + 4;
    for (let y = y0; y < y0 + 3; y++) put(x, y, z, edge && y === y0 + 1 ? "light_blue_stained_glass" : "light_gray_concrete");
    put(x, y0 + 3, z, "smooth_stone");
  }
  put(px + 2, y0 + 4, pz + 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const mainT = 84;
const [mcx, mcz] = centroid(mainT);
const taken = [];
for (const target of [[mcx - 7, mcz], [mcx + 7, mcz]]) {
  const b = nearest(boxes(mainT, 3), target, taken);
  if (!b) continue;
  taken.push(b);
  const [bx, bz] = b;
  for (let x = bx; x < bx + 3; x++) for (let z = bz; z < bz + 3; z++) {
    put(x, mainT + 1, z, "gray_concrete");
    put(x, mainT + 2, z, "gray_concrete");
    put(x, mainT + 3, z, "iron_block");
  }
}

v.save(dir + "way_24252772.nbt");
