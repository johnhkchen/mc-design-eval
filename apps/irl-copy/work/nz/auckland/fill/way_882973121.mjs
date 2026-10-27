// Sudima Hotel, Auckland (way 882973121): read from the lidar as a 1990s-style concrete-frame hotel, twelve storeys of
// 4 blocks over a stone foundation. The roof is near-flat at 46-51 above y 0: the 3x3 median snaps to the storey grid,
// the rim (5 or less in from the edge) stops at 48, the core takes one more storey to 52 (a setback crown), and the low
// stub on the west side (roof 9-24) steps down to 8-20. Facade: white-concrete piers and head bands with blue-tinted
// glass panes between them, a light-grey floor line per storey, a polished-andesite base course, a glass ground storey
// with a dark-oak door on the south face under a black canopy; glowstone behind some windows; iron-block plant on the
// rim roof. The interior is air behind the glass with a floor slab per storey, and the roof and parapet close the top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_882973121.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const N = 38, H = 64;
const G = Array.from({ length: N }, () => Array(N).fill(-1));   // ground, -1 = not footprint
const R = Array.from({ length: N }, () => Array(N).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < N && z < N && G[x][z] >= 0;
const SIDES = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

// distance in from the edge (1 on the rim), BFS through the footprint
const dist = Array.from({ length: N }, () => Array(N).fill(0));
const queue = [];
for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
  if (inFP(x, z) && SIDES.some(([dx, dz]) => !inFP(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of SIDES) {
    const nx = x + dx, nz = z + dz;
    if (inFP(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// roof: 3x3 median of the lidar, snapped to the 4-block storey grid; the rim stops at 48, the core rises to 52
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFP(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: N }, () => Array(N).fill(0));    // top of the building: roof slab at T-1, parapet at T
for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) if (inFP(x, z)) {
  let t = Math.max(8, 4 * Math.round(median(x, z) / 4));
  if (t > 48) t = dist[x][z] >= 5 ? 52 : 48;
  T[x][z] = t;
}

// a cell is building at height y when it is in the footprint and below its top; the first side with no building beside it
// at that height is the outward face (the shell), and a cell with none is interior
const solid = (x, z, y) => inFP(x, z) && y < T[x][z];
const outward = (x, z, y) => SIDES.find(([dx, dz]) => !solid(x + dx, z + dz, y));

// the entrance: the ground-level south face nearest the middle, preferring the far (south) edge
let door = null, best = Infinity;
for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
  if (!inFP(x, z)) continue;
  const f = outward(x, z, G[x][z]);
  if (!f) continue;
  const score = Math.abs(x - 18) - 2 * z + (f[1] === 1 ? 0 : 6);
  if (score < best) { best = score; door = { x, z, side: f[2] }; }
}

const paneState = (side) => (side === "north" || side === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const b = new Voxels([N, H, N]);
const glowPlaces = [];
for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
  if (!inFP(x, z)) continue;
  const g = G[x][z], t = T[x][z];
  for (let y = 0; y < t; y++) {
    if (y < g) { b.set(x, y, z, "stone_bricks"); continue; }                  // foundation up to the ground
    if (y === t - 1) { b.set(x, y, z, "light_gray_concrete"); continue; }     // roof slab
    const local = y - g, face = outward(x, z, y);
    if (local % 4 === 0) {                                                   // floor line, base course at the ground
      b.set(x, y, z, face && local === 0 ? "polished_andesite" : "light_gray_concrete");
      continue;
    }
    if (!face) continue;                                                     // interior air behind the glass
    const [dx, dz, side] = face;
    const along = dx !== 0 ? z : x;                                          // position along the wall
    const ground = local < 4, band = local % 4, pier = along % 3 === 0;
    if (band === 3) {                                                        // head band, black canopy over the door
    const canopy = door && ground && Math.abs(x - door.x) + Math.abs(z - door.z) <= 1;
      b.set(x, y, z, canopy ? "black_concrete" : "white_concrete");
      continue;
    }
    if (door && ground && x === door.x && z === door.z) {                    // dark-oak door, lower then upper half
      b.set(x, y, z, "dark_oak_door", { facing: door.side, half: band === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (pier) { b.set(x, y, z, "white_concrete"); continue; }
    if (ground) { b.set(x, y, z, "light_blue_stained_glass"); continue; }    // shopfront
    b.set(x, y, z, "light_blue_stained_glass_pane", paneState(side));
    if ((x + z + y) % 13 === 0) glowPlaces.push([x - dx, y, z - dz]);        // a lit room behind this window
  }
  if (outward(x, z, t - 1)) b.set(x, t, z, "white_concrete");               // parapet on the outer edge of the top
}

// glowstone in the lit rooms (interior air only)
for (const [x, y, z] of glowPlaces) if (inFP(x, z) && !b.get(x, y, z)) b.set(x, y, z, "glowstone");

// iron-block plant boxes (2x2) on the rim roof, away from the edge
for (let x = 0; x < N - 1; x++) for (let z = 0; z < N - 1; z++) {
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (x % 6 !== 2 || z % 6 !== 2) continue;
  if (block.every(([i, j]) => inFP(i, j) && T[i][j] === 48 && dist[i][j] >= 3)) {
    for (const [i, j] of block) b.set(i, 48, j, "iron_block");
  }
}

const out = `${dir}/way_882973121.nbt`;
const { blocks, palette } = b.save(out);
console.log(`way_882973121: ${blocks} blocks, palette ${palette}, door ${JSON.stringify(door)} -> ${out}`);
