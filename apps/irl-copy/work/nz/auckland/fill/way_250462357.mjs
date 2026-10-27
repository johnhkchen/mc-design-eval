// New Zealand Media and Entertainment, Auckland (way 250462357): a 1980s-90s concrete-framed office block on the CBD's
// basalt-plinth fringe. Lidar roof heights are median-smoothed and snapped to a 4-block storey grid: wings at 36 (nine
// storeys), a tower at 40 on the interior, a 44 crown over the core. A basalt plinth at the street, a glazed shopfront
// storey with a canopy and a dark-oak entrance on the lowest face, then pale precast piers (white concrete) between
// blue-tinted glass ribbons with light-grey spandrels, and a parapet on every outer roof edge. Interiors are air with a
// floor slab per storey (on the storey lines and the ground), and glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_250462357.cells.json", "utf8"));
const W = 68, D = 57, H = 55;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

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

// median-smoothed lidar roof, then one flat top per cell on the storey grid (multiples of 4)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));   // top of the cell's massing (roof deck at T - 1)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z), d = dist[x][z];
  const top = m < 20 ? Math.max(8, 4 * Math.round(m / 4)) : m >= 40 && d >= 5 ? 44 : m >= 38 ? 40 : 36;
  T[x][z] = Math.max(top, 4 * Math.ceil((G[x][z] + 4) / 4));   // at least one storey above the ground under the cell
}

// horizontal faces exposed at height y: outside the footprint, or beside a neighbour whose top is at or below y
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const expo = (x, z, y) => DIRS.filter(([, dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y >= T[nx][nz];
}).map(([k]) => k);

// the street face: the outward-facing edge with the lowest average ground, its entrance at the middle of its run
const faceCells = { N: [], S: [], E: [], W: [] };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (const [k, dx, dz] of DIRS) if (!inside(x + dx, z + dz)) faceCells[k].push([x, z]);
}
const along = (face, x, z) => (face === "N" || face === "S" ? x : z);
let street = null;
for (const k of Object.keys(faceCells)) {
  const list = faceCells[k]; if (list.length < 6) continue;
  const avg = list.reduce((s, [x, z]) => s + G[x][z], 0) / list.length;
  if (!street || avg < street.avg) street = { face: k, avg, list };
}
const byAlong = street.list.slice().sort((a, b) => along(street.face, a[0], a[1]) - along(street.face, b[0], b[1]));
const [ex, ez] = byAlong[byAlong.length >> 1];
const ePos = along(street.face, ex, ez);   // the entrance's coordinate along the street face
const FACE_STATE = { N: "north", S: "south", E: "east", W: "west" };
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// the facade's pattern: 1-block piers at every fourth coordinate, a 3-block glass bay between
const facadeAlongX = (e) => e.includes("N") || e.includes("S");
const isPier = (x, z, e) => (facadeAlongX(e) ? x : z) % 4 === 0;
const paneState = (e) => facadeAlongX(e)
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g0 = G[x][z], top = T[x][z];
  for (let y = 0; y < top; y++) {
    if (y < g0) { put(x, y, z, "stone_bricks"); continue; }   // foundation, so nothing floats on the slope
    const e = expo(x, z, y);
    if (e.length) {
      const pier = isPier(x, z, e), row = y % 4, band = Math.floor(y / 4);
      // the street entrance: a dark-oak door at the middle of the street face, a lantern under the canopy
      const onStreet = e.includes(street.face) && (facadeAlongX(e) ? x : z) === ePos && band === 1;
      if (onStreet) {
        if (row === 0) put(x, y, z, "dark_oak_door", { facing: FACE_STATE[street.face], half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (row === 1) put(x, y, z, "dark_oak_door", { facing: FACE_STATE[street.face], half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (row === 2) put(x, y, z, "stone_bricks");
        else put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (y < 4) { put(x, y, z, "stone_bricks"); continue; }                  // the basalt plinth course
      if (band === 1) {                                                        // shopfront storey
        if (row === 0) put(x, y, z, "smooth_stone");
        else if (row === 3) put(x, y, z, "white_concrete");
        else if (pier) put(x, y, z, "stone_bricks");
        else put(x, y, z, "light_blue_stained_glass_pane", paneState(e));
        continue;
      }
      if (band === 2 && row === 0 && e.includes(street.face) && Math.abs((facadeAlongX(e) ? x : z) - ePos) <= 2) {
        put(x, y, z, "stone_bricks"); continue;                              // the canopy over the entrance
      }
      if (pier) put(x, y, z, "white_concrete");
      else if (row === 0) put(x, y, z, "light_gray_concrete");              // spandrel under each window ribbon
      else if (row === 3) put(x, y, z, "white_concrete");                    // floor line
      else put(x, y, z, "light_blue_stained_glass_pane", paneState(e));
      continue;
    }
    // no exposed face: a storey slab on the storey lines and the ground, the roof deck on top, air between
    if (y === g0 || y % 4 === 0) put(x, y, z, "light_gray_concrete");
    else if (y === top - 1) put(x, y, z, "light_gray_concrete");
  }
  // a parapet on every outer edge of the roof, one storey line of coping above the wall
  if (expo(x, z, top).length) { put(x, top, z, "white_concrete"); put(x, top + 1, z, "white_concrete"); }
}

// mechanical plant on the roofs: 2x2 boxes on a roof of one height, set in from the edges
for (let x = 0; x < W - 1; x++) for (let z = 0; z < D - 1; z++) {
  if (x % 9 !== 4 || z % 7 !== 3) continue;
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cs.every(([a, b]) => inside(a, b) && dist[a][b] >= 3 && T[a][b] === T[x][z] && !expo(a, b, T[x][z]).length)) continue;
  for (const [a, b] of cs) for (let y = T[x][z]; y < T[x][z] + 2; y++) put(a, y, b, "stone");
}

// warm light behind some panes: glowstone on the interior side of a window (a single exposed face, in the air gap)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (let y = 4; y < T[x][z]; y++) {
    const e = expo(x, z, y);
    if (e.length !== 1 || y % 4 === 0 || y % 4 === 3 || y < G[x][z]) continue;
    if (isPier(x, z, e) || (street && e.includes(street.face) && Math.abs(along(e[0], x, z) - ePos) <= 2)) continue;
    if ((x * 7 + z * 13 + y * 5) % 9 !== 0) continue;
    const [, dx, dz] = DIRS.find(([k]) => k === e[0]);
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && !expo(ix, iz, y).length && vox.val(ix, y, iz) === 0) put(ix, y, iz, "glowstone");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_250462357.nbt";
const { blocks, palette } = vox.save(out);
console.log(`way 250462357: ${blocks} blocks, ${palette} palette entries; street face ${street.face} (entrance at ${ex},${ez}); tops ${[...new Set(cells.map(([x, z]) => T[x][z]))].sort((a, b) => a - b)}`);
