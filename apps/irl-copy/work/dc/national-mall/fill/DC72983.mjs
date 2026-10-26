// 930 M St NW: a 1920s-30s Colonial-Revival apartment block with an elevator penthouse, brick over a stone plinth,
// calcite string courses and window frames. Storeys are 3 blocks (slab row, two window rows); the lidar roof height
// snaps to 3n+1 (roof deck) with a parapet above. Front (entrance) on the z=20 face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC72983.cells.json`, "utf8"));
const [X, Y, Z] = [29, 28, 21];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// footprint and lidar roof height per cell (cells are [x, z, ground, roof])
const roof = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, , r] of cells) roof[z][x] = r;
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && roof[z][x] > 0;

// storeys from the roof: n = round((roof - 1) / 3), the deck at 3n+1 (roof 12-13 -> 4 storeys, 15-16 -> 5)
const n0 = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) =>
  inFp(x, z) ? Math.min(5, Math.max(1, Math.round((roof[z][x] - 1) / 3))) : 0));

// smooth lidar noise: the median storey count of the cell and its footprint neighbours
const med = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(n0[z + dz][x + dx]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const n1 = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => (inFp(x, z) ? med(x, z) : 0)));

// distance in cells from the outside edge: the tower steps in one storey at the edge, a ring at a time
const dist = Array.from({ length: Z }, () => Array(X).fill(Infinity));
const queue = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (inFp(x, z) && NB.some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist[z][x] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && dist[nz][nx] > dist[z][x] + 1) { dist[nz][nx] = dist[z][x] + 1; queue.push([nx, nz]); }
  }
}
const N = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) =>
  inFp(x, z) ? Math.min(n1[z][x], dist[z][x] + 3) : 0));

// a cell is open at height y when it is off the footprint or its deck is below y
const open = (x, z, y) => !inFp(x, z) || y > 3 * N[z][x] + 1;
const exposed = (x, z, y) => NB.filter(([dx, dz]) => open(x + dx, z + dz, y));

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const doorCell = [21, 20];   // the entrance on the z=20 face
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFp(x, z)) continue;
  const n = N[z][x], deck = 3 * n + 1, parapet = 3 * n + 2;
  set(x, 0, z, "stone_bricks");                                   // plinth: foundation under every cell
  for (let y = 1; y <= parapet; y++) {
    const ex = exposed(x, z, y);
    if (y === parapet) { if (ex.length) set(x, y, z, "stone_bricks"); continue; }
    if (ex.length === 0) {
      if (y % 3 === 1) set(x, y, z, y === deck ? "gray_concrete" : "smooth_stone");   // interior floor slabs, roof membrane
      continue;
    }
    if (ex.length >= 2) { set(x, y, z, "bricks"); continue; }   // corner piers
    const [dx, dz] = ex[0];
    if (y % 3 === 1) { set(x, y, z, "calcite"); continue; }   // string course at every floor line and the cornice
    // window rows: a 4-column bay of frame, glass, glass, brick pier along the face
    const s = dx !== 0 ? z : x, m = ((s % 4) + 4) % 4;
    if (m === 0) { set(x, y, z, "calcite"); continue; }
    if (m === 3) { set(x, y, z, "bricks"); continue; }
    const state = { north: "false", south: "false", east: "false", west: "false" };
    if (dz !== 0) { state.east = m === 1 ? "true" : "false"; state.west = m === 2 ? "true" : "false"; }
    else { state.south = m === 1 ? "true" : "false"; state.north = m === 2 ? "true" : "false"; }
    set(x, y, z, "glass_pane", state);
    // warm light: a hanging lantern in the room behind some windows, under the floor slab above
    const ix = x - dx, iz = z - dz;
    if (y % 3 === 0 && inFp(ix, iz) && exposed(ix, iz, y).length === 0 && (x * 7 + z * 3 + y) % 4 === 0) {
      set(ix, y, iz, "lantern", { hanging: "true" });
    }
  }
}

// the entrance: the frame is calcite (pattern m=0 at x=20, the right-hand jamb at x=22 is also set to calcite)
const [dx0, dz0] = doorCell;
for (const y of [2, 3]) set(dx0 + 1, y, dz0, "calcite");
set(dx0, 2, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
set(dx0, 3, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
set(dx0, 3, dz0 - 1, "lantern", { hanging: "true" });   // lobby light above the door, under the slab at y 4

// elevator penthouse on the tallest tier: a box of brick with glass on its faces and a stone cap
const maxN = Math.max(...N.flat());
let best = null;
for (const [w, d] of [[5, 3], [3, 5], [3, 3]]) for (let z0 = 0; z0 + d <= Z; z0++) for (let x0 = 0; x0 + w <= X; x0++) {
  let ok = true;
  for (let z = z0; z < z0 + d && ok; z++) for (let x = x0; x < x0 + w && ok; x++) ok = inFp(x, z) && N[z][x] === maxN && dist[z][x] >= 2;
  if (!ok) continue;
  const cx = x0 + (w - 1) / 2, cz = z0 + (d - 1) / 2;
  const score = Math.hypot(cx - 14, cz - 10) - w * d * 0.1;
  if (!best || score < best.score) best = { x0, z0, w, d, score };
}
if (best) {
  const { x0, z0, w, d } = best, base = 3 * maxN + 2;
  for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) {
    const edgeX = x === x0 || x === x0 + w - 1, edgeZ = z === z0 || z === z0 + d - 1;
    for (let y = base; y <= base + 2; y++) {
      if (!edgeX && !edgeZ) continue;               // the inside is air
      if (y === base + 1 && !(edgeX && edgeZ)) {
        const st = { north: "false", south: "false", east: "false", west: "false" };
        if (edgeZ) { st.east = x < x0 + w - 1 ? "true" : "false"; st.west = x > x0 ? "true" : "false"; }
        else { st.south = z < z0 + d - 1 ? "true" : "false"; st.north = z > z0 ? "true" : "false"; }
        set(x, y, z, "glass_pane", st);
      } else set(x, y, z, "bricks");
    }
    set(x, base + 3, z, "stone_bricks");            // the cap
  }
}

const info = g.save(`${DIR}/DC72983.nbt`);
console.log(`cells ${cells.length}, storeys ${[...new Set(N.flat().filter(Boolean))].sort().join("/")}, top ${3 * maxN + 5}, penthouse ${best ? "yes" : "no"}, blocks ${info.blocks}, palette ${info.palette}`);
