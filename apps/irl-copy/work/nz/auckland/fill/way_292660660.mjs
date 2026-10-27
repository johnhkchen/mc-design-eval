// Auckland District Court (way 292660660): a late-1980s civic courthouse. A tall court tower (lidar 60 to 68, snapped to
// 4-block storeys) rises from a 24-block podium of wings, with two setbacks as it climbs: a 28 ledge at its edge, a 44
// terrace one band in, then the core at its lidar height. Cream precast concrete (white_concrete piers and head bands,
// light_gray spandrels at each floor line), tinted glazing in 3-block bays, a stone plinth on the ground storey, a dark-oak
// entrance on the lowest street face, a cornice and parapet on every roof, plant on the wings and a mast on the tower.
// Interiors are air with a floor slab per storey; glowstone sits on some floors behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${SRC}/way_292660660.cells.json`, "utf8"));
const W = 92, D = 80, Y = 81;

const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under the cell (foundation top), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const key = (x, y, z) => `${x},${y},${z}`;

const SIDES = [
  { d: "E", dx: 1, dz: 0, facing: "east" },
  { d: "W", dx: -1, dz: 0, facing: "west" },
  { d: "S", dx: 0, dz: 1, facing: "south" },
  { d: "N", dx: 0, dz: -1, facing: "north" },
];

// median of the 3x3 lidar roof heights (noise out), then flat tiers on the 4-block storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));    // the solid column runs y 0 .. H-1
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z);
  H[x][z] = m < 12 ? 8 : 4 * Math.round(m / 4);
}

// the tower: columns of 48 or more, and each one's distance in from the tower's edge (1 on the outer ring)
const TOWER = 48;
const isTower = (x, z) => inside(x, z) && H[x][z] >= TOWER;
const td = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (isTower(x, z)) {
  if (SIDES.some(s => !isTower(x + s.dx, z + s.dz))) { td[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const s of SIDES) {
    const nx = x + s.dx, nz = z + s.dz;
    if (isTower(nx, nz) && !td[nx][nz]) { td[nx][nz] = td[x][z] + 1; queue.push([nx, nz]); }
  }
}
// setbacks as it rises: a 28 ledge at the edge, a 44 terrace one band in, the core to its lidar height
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (td[x][z]) {
  if (td[x][z] <= 2) H[x][z] = Math.min(H[x][z], 28);
  else if (td[x][z] <= 4) H[x][z] = Math.min(H[x][z], 44);
}

// the sides of a cell open to the air at height y: beyond the footprint, or beside a neighbour whose roof is below y
const open = (x, z, y) => SIDES.filter(s => {
  const nx = x + s.dx, nz = z + s.dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
const along = (s, x, z) => (s.dx ? z : x);   // position along a face: x on the north and south faces, z on east and west

// entrance: the face with the most low-ground cells (the street side), at the middle of that run, ground storey
const fronts = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || H[x][z] < 20 || G[x][z] < 1 || G[x][z] > 2) continue;
  const o = open(x, z, G[x][z]);
  if (o.length === 1) (fronts[o[0].d] ||= []).push({ x, z, s: o[0] });
}
const faceKey = Object.keys(fronts).sort((a, b) => fronts[b].length - fronts[a].length)[0];
const face = faceKey ? fronts[faceKey].sort((a, b) => along(a.s, a.x, a.z) - along(b.s, b.x, b.z)) : [];
const mid = face[face.length >> 1];
const entrance = mid ? face.filter(c => Math.abs(along(c.s, c.x, c.z) - along(mid.s, mid.x, mid.z)) <= 2) : [];

// overrides for the entrance: a recessed door, a pier either side, a dark-oak lintel and an awning band
const over = new Map();
for (const c of entrance) {
  const g0 = G[c.x][c.z];
  if (c === mid) {
    const door = { facing: c.s.facing, hinge: "left", open: "false", powered: "false" };
    over.set(key(c.x, g0, c.z), { block: "dark_oak_door", state: { ...door, half: "lower" } });
    over.set(key(c.x, g0 + 1, c.z), { block: "dark_oak_door", state: { ...door, half: "upper" } });
    over.set(key(c.x, g0 + 2, c.z), { block: "dark_oak_planks" });
  } else {
    over.set(key(c.x, g0, c.z), { block: "stone_bricks" });
    over.set(key(c.x, g0 + 1, c.z), { block: "stone_bricks" });
    over.set(key(c.x, g0 + 2, c.z), { block: "dark_oak_planks" });
  }
  over.set(key(c.x, g0 + 3, c.z), { block: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } });
}

const placed = new Map();   // "x,y,z" -> { block, state, side }
const put = (x, y, z, block, state, side) => placed.set(key(x, y, z), { block, state, side });

// the facade of a wall cell: plinth on the ground storey, then a 4-block storey grid (spandrel at each floor line, glass
// between, a head band), 3-block bays with piers, a cornice and parapet on top; corners are solid piers
const facade = (x, y, z, sides, h, g0) => {
  const s = sides[0], corner = sides.length > 1;
  if (y < g0) return { block: "stone_bricks" };                          // foundation on the downhill side
  if (y >= h - 1) return { block: "white_concrete" };                    // parapet
  if (y === h - 2) return { block: "polished_andesite" };                // cornice
  if (corner) return { block: y < g0 + 4 ? "stone_bricks" : "white_concrete" };
  const pier = along(s, x, z) % 3 === 0, bay = Math.floor(along(s, x, z) / 3);
  const glass = { block: bay % 4 === 2 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane", pane: true };
  if (y < g0 + 4) {
    if (y === g0) return { block: "polished_andesite" };                  // base course
    if (y === g0 + 3) return { block: "stone_bricks" };                   // plinth top
    return pier ? { block: "stone_bricks" } : glass;
  }
  const k = y % 4;
  if (k === 0) return { block: "light_gray_concrete" };                   // spandrel at the floor line
  if (k === 3) return { block: "white_concrete" };                        // head band
  return pier ? { block: "white_concrete" } : glass;
};

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const h = H[x][z], g0 = G[x][z];
  for (let y = 0; y < h; y++) {
    const ov = over.get(key(x, y, z));
    if (ov) { put(x, y, z, ov.block, ov.state); continue; }
    const sides = open(x, z, y);
    if (sides.length) {
      const f = facade(x, y, z, sides, h, g0);
      put(x, y, z, f.block, undefined, f.pane ? sides[0] : undefined);
      if (f.pane) placed.get(key(x, y, z)).glass = true;
      continue;
    }
    if (y < g0) put(x, y, z, "stone_bricks");                           // foundation under the building
    else if (y === h - 1) put(x, y, z, "smooth_stone");                   // roof
    else if (y % 4 === 0) put(x, y, z, "light_gray_concrete");           // floor slab per storey
    // else interior air, behind the glass
  }
}

// pane connections: a pane joins the wall (panes and solid blocks) along its face, and is left open to the air otherwise
const wallish = (x, y, z) => { const p = placed.get(key(x, y, z)); return !!p && !/door|slab/.test(p.block); };
let panes = 0;
for (const [k, c] of placed) {
  if (!c.glass) continue;
  const [x, y, z] = k.split(",").map(Number), s = c.side;
  const tf = (dx, dz) => (wallish(x + dx, y, z + dz) ? "true" : "false");
  c.state = s.dx
    ? { east: "false", west: "false", north: tf(0, -1), south: tf(0, 1), waterlogged: "false" }
    : { east: tf(1, 0), west: tf(-1, 0), north: "false", south: "false", waterlogged: "false" };
  panes++;
}

// warm light: glowstone on the floor just inside some windows (a lit floor, not a hanging fixture)
let lamps = 0;
for (const [k, c] of [...placed]) {
  if (!c.glass || !c.side) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 4 !== 1) continue;
  const ix = x - c.side.dx, iz = z - c.side.dz;
  if (!inside(ix, iz) || placed.has(key(ix, y, iz)) || !placed.has(key(ix, y - 1, iz))) continue;
  if ((x * 31 + z * 17 + y) % 6 !== 0) continue;
  put(ix, y, iz, "glowstone"); lamps++;
}

// roof plant: 2x2 boxes on the podium's flat roofs (roof at 24, clear of the edge), kept off the parapet
let plant = 0;
for (let x = 0; x + 1 < W; x++) for (let z = 0; z + 1 < D; z++) {
  if (x % 9 !== 3 || z % 7 !== 2) continue;
  const patch = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!patch.every(([a, b]) => inside(a, b) && H[a][b] === 24 && open(a, b, 23).length === 0)) continue;
  for (const [a, b] of patch) for (const y of [24, 25]) put(a, y, b, "light_gray_concrete");
  plant++;
}

// a 4x4 plant room with a mast on the tower's core, the patch nearest the tower's middle
let cx = 0, cz = 0, n = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (td[x][z] >= 5) { cx += x; cz += z; n++; }
cx /= n; cz /= n;
let best = null;
for (let x = 0; x + 3 < W; x++) for (let z = 0; z + 3 < D; z++) {
  const h = H[x + 1][z + 1];
  const patch = [];
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) patch.push([x + a, z + b]);
  if (!patch.every(([a, b]) => inside(a, b) && td[a][b] >= 5 && H[a][b] === h)) continue;
  const d = Math.hypot(x + 1.5 - cx, z + 1.5 - cz);
  if (!best || d < best.d) best = { d, x, z, h };
}
if (best) {
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (const y of [best.h, best.h + 1]) put(best.x + a, y, best.z + b, "light_gray_concrete");
  put(best.x + 1, best.h + 2, best.z + 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(best.x + 2, best.h + 2, best.z + 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const g = new Voxels([W, Y, D]);
for (const [k, c] of placed) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, c.block, c.state);
}
const out = g.save(`${SRC}/way_292660660.nbt`);
const tops = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) tops[H[x][z]] = (tops[H[x][z]] || 0) + 1;
console.log(JSON.stringify({ ...out, panes, lamps, plant, plantRoom: best ? [best.x, best.z, best.h] : null,
  entrance: mid ? [mid.x, mid.z, mid.s.d, G[mid.x][mid.z]] : null, entranceCells: entrance.length, roofTops: tops }));
