// An eight-storey office block of the 1970s and 80s on the lidar footprint of way 23907417 (49 x 55 blocks, roof 35 blocks
// above the lowest ground at its highest). The record gives an office block of the period: a precast-look concrete frame
// with pale piers and bands, grey spandrels, tinted blue glazing set one block back from the face so an air gap sits
// behind it, a dark basalt base course (Auckland's volcanic stone) with a shopfront and two dark-oak entrances under a
// basalt lintel, a cornice and a parapet, and a plant room on the top. Storeys are 4 blocks, with the lidar roof medianed
// over 5 x 5 and quantised to storeys, so setbacks step where the record steps. Every column is solid from y 0 up to its
// own top, so nothing floats; the storey lines sit on the same absolute rows, so each band runs level across the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const X = 49, Y = 48, Z = 55;
const cells = JSON.parse(readFileSync(`${DIR}/way_23907417.cells.json`, "utf8"));
const SOLID = "light_gray_concrete";

// the footprint as grids: inF[x][z], lidar roof R
const grid = (v) => Array.from({ length: X }, () => new Array(Z).fill(v));
const inF = grid(false), R = grid(0);
for (const [x, z, , r] of cells) { inF[x][z] = true; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && inF[x][z];

// the top of each column (exclusive): a 2-block basalt plinth, then 4-block storeys, one to nine of them, from the
// lidar roof medianed over 5 x 5
const H = grid(0);
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) vals.push(R[x + dx][z + dz]);
  vals.sort((a, b) => a - b);
  const n = Math.min(9, Math.max(1, Math.round((vals[vals.length >> 1] - 2) / 4)));
  H[x][z] = 2 + 4 * n;
}

// outward faces, with the facing name a door takes
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
// a face is exposed where the cell beside it is outside the footprint or stands lower than this row
const exposed = (x, z, d, y) => { const [dx, dz] = DIRS[d]; const nx = x + dx, nz = z + dz; return !inside(nx, nz) || y >= H[nx][nz]; };
const exposedDirs = (x, z, y) => [0, 1, 2, 3].filter((d) => exposed(x, z, d, y));

// V: "x,y,z" -> { block, state }; a missing cell is air
const V = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => V.set(key(x, y, z), { block, state });
const glass = [];   // the window cells, with the face each is on

// the solid body and the facade on its exposed faces
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const h = H[x][z];
  for (let y = 0; y < h; y++) {
    if (y < 2) { put(x, y, z, "polished_andesite"); continue; }
    const ex = exposedDirs(x, z, y);
    if (!ex.length) { put(x, y, z, y === h - 1 ? "smooth_stone" : SOLID); continue; }
    const [dx] = DIRS[ex[0]];
    const u = dx !== 0 ? z : x;                       // position along the wall: piers every third block
    const s = Math.floor((y - 2) / 4), py = (y - 2) % 4, pier = u % 3 === 0;
    let block;
    if (y === h - 1) block = "smooth_quartz";                                          // cornice
    else if (py === 0) block = s === 0 ? "polished_andesite" : "smooth_quartz";        // storey line
    else if (pier || py === 3) block = s === 0 ? "polished_andesite" : pier ? "white_concrete" : SOLID;
    else { glass.push({ x, y, z, d: ex[0] }); continue; }                                // window between piers
    put(x, y, z, block);
  }
}

// the glazing: tinted panes, a few lamps in the air gap behind, and the gap itself carved out behind each pane
const lit = (x, y, z) => (x * 7 + y * 13 + z * 31) % 9 === 0;
const paneFace = new Map();
for (const { x, y, z, d } of glass) {
  const pane = (x * 5 + y * 3 + z * 7) % 4 === 1 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane";
  put(x, y, z, pane);
  paneFace.set(key(x, y, z), d);
  const [dx, dz] = DIRS[d];
  const bx = x - dx, bz = z - dz;                     // the cell behind the glass
  if (!inside(bx, bz) || exposedDirs(bx, bz, y).length) continue;
  if (lit(x, y, z)) put(bx, y, bz, "glowstone"); else V.delete(key(bx, y, bz));
}

// entrances: the longest run of storey-0 faces on each of the two longest walls, a door at the run's middle
const runs = [];
for (let d = 0; d < 4; d++) {
  const along = DIRS[d][0] !== 0;
  const lines = new Map();
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (!exposed(x, z, d, 3)) continue;
    const line = along ? x : z, u = along ? z : x;
    if (!lines.has(line)) lines.set(line, []);
    lines.get(line).push(u);
  }
  for (const [line, us] of lines) {
    us.sort((a, b) => a - b);
    let s = 0;
    for (let i = 1; i <= us.length; i++) {
      if (i === us.length || us[i] !== us[i - 1] + 1) {
        const len = i - s;
        if (len >= 5) runs.push({ d, along, line, mid: us[s + (len >> 1)], len });
        s = i;
      }
    }
  }
}
runs.sort((a, b) => b.len - a.len);
const entrances = [], usedFace = new Set();
for (const r of runs) if (!usedFace.has(r.d) && entrances.length < 2) { entrances.push(r); usedFace.add(r.d); }
for (const e of entrances) {
  const [dx, dz, facing] = DIRS[e.d];
  const x = e.along ? e.line : e.mid, z = e.along ? e.mid : e.line;
  const door = { facing, hinge: "left", open: "false", powered: "false" };
  put(x, 3, z, "dark_oak_door", { ...door, half: "lower" });
  put(x, 4, z, "dark_oak_door", { ...door, half: "upper" });
  for (const o of [-1, 1]) {                         // the portal's basalt jambs, with the lintel already above
    const ox = e.along ? x : x + o, oz = e.along ? z + o : z;
    if (!inside(ox, oz)) continue;
    put(ox, 3, oz, "polished_andesite"); put(ox, 4, oz, "polished_andesite");
  }
  V.delete(key(x - dx, 3, z - dz)); V.delete(key(x - dx, 4, z - dz));   // the lobby behind the door is air
}

// the parapet: one block more on the outer edge of the top of each column
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if ([0, 1, 2, 3].some((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]))) put(x, H[x][z], z, "white_concrete");
}

// roof plant: a 3 x 3 box on the highest roof that has room for one inside its edge
const cand = cells.map((c) => [c[0], c[1]]).sort((a, b) => H[b[0]][b[1]] - H[a[0]][a[1]]);
const roomy = (cx, cz) => {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (!inside(cx + dx, cz + dz) || H[cx + dx][cz + dz] !== H[cx][cz]) return false;
  }
  return true;
};
const spot = cand.find(([x, z]) => roomy(x, z));
if (spot) {
  const [cx, cz] = spot, top = H[cx][cz];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    put(cx + dx, top, cz + dz, SOLID);
    put(cx + dx, top + 1, cz + dz, SOLID);
    put(cx + dx, top + 2, cz + dz, "smooth_quartz");
  }
}

// each pane joins the panes and piers in its own wall's plane, not the air gap or the wall it stands in front of
const has = (x, y, z) => V.has(key(x, y, z));
for (const [k, v] of V) {
  if (!v.block.endsWith("stained_glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  const along = DIRS[paneFace.get(k)][0] !== 0;      // a wall running along z (east or west face) joins north and south
  v.state = along
    ? { north: has(x, y, z - 1), east: false, south: has(x, y, z + 1), west: false }
    : { north: false, east: has(x + 1, y, z), south: false, west: has(x - 1, y, z) };
}

const g = new Voxels([X, Y, Z]);
for (const [k, v] of V) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
g.save(`${DIR}/way_23907417.nbt`);
