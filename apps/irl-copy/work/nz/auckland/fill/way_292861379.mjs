// Crombie Lockwood Tower, Auckland (way 292861379): a late-20th-century glass-and-concrete office tower of about 27 storeys.
// Lidar roofs are median-smoothed and snapped to the 4-block storey grid: a 25-storey shoulder at 100 over most of the
// footprint, a three-storey crown at 111 over the core (3 or more blocks in from the edge), and lower wings on their own
// storey lines (24 to 88). The shoulder's roof is a terrace ring round the crown; a plant room with an end-rod mast sits
// on the crown. Facade: a 4-block storey rhythm (white floor band, glass ribbon between light-grey piers, light-grey
// spandrel), a polished-andesite base, a shopfront ground storey, a double-door entrance under a dark-oak canopy, a
// quartz parapet, and glowstone behind some panes. Interiors are air with a floor slab per storey and a column grid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861379.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861379.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 45, D = 41, Y = 123;
const CROWN = 111, SHOULDER = 100, TERRACE = SHOULDER - 1;

const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// distance in cells from the footprint's edge (1 on the outside ring)
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

// median-smoothed roof, then flat tiers on the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));    // top of each column: blocks at y 0..T-1
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z], g = G[x][z];
  const t = r >= 105 && d >= 3 ? CROWN : r >= 95 ? SHOULDER : 4 * Math.round(r / 4);
  T[x][z] = Math.max(t, g + 8);                                  // at least two storeys above the ground under the cell
}

// faces of a cell exposed at height y: outside the footprint, or beside a column that stops at or below y
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || T[nx][nz] <= y;
});

// the entrance: the longest run of low street-level faces (ground at most 1 block) on one side, its middle two cells
const cand = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && G[x][z] <= 1 && T[x][z] >= 24) {
  for (const [dx, , name] of faces(x, z, 1)) cand.push({ x, z, name, line: dx !== 0 ? x : z, along: dx !== 0 ? z : x });
}
const groups = new Map();
for (const c of cand) {
  const k = `${c.name}:${c.line}`;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(c);
}
let run = [];
for (const list of groups.values()) {
  list.sort((a, b) => a.along - b.along);
  let cur = [];
  for (const c of list) {
    if (cur.length && c.along !== cur[cur.length - 1].along + 1) { if (cur.length > run.length) run = cur; cur = []; }
    cur.push(c);
  }
  if (cur.length > run.length) run = cur;
}
const door = new Map();   // "x,z" -> { facing, hinge }
if (run.length >= 2) {
  const mid = run.length >> 1;
  door.set(`${run[mid - 1].x},${run[mid - 1].z}`, { facing: run[mid - 1].name, hinge: "left" });
  door.set(`${run[mid].x},${run[mid].z}`, { facing: run[mid].name, hinge: "right" });
}

// the crown's plant room: crown cells near the middle of the core, with an end-rod mast at its centre
const crown = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && T[x][z] === CROWN && dist[x][z] >= 5) crown.push([x, z]);
const cx = Math.round(crown.reduce((s, [x]) => s + x, 0) / crown.length);
const cz = Math.round(crown.reduce((s, [, z]) => s + z, 0) / crown.length);
const plant = new Set(crown.filter(([x, z]) => Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 4).map(([x, z]) => `${x},${z}`));
const inPlant = (x, z) => plant.has(`${x},${z}`);

const g = new Voxels([W, Y, D]);
const glass = [];   // glass panes on the facade, to light from inside

// the facade of a perimeter cell at height y: piers at the corners and every third cell along each face
const facade = (x, z, y, fs) => {
  const t = T[x][z], gr = G[x][z];
  if (y === gr) return ["polished_andesite"];                   // base course on the ground
  if (y >= t - 2) return ["smooth_quartz"];                     // parapet
  if (y % 4 === 0) return ["white_concrete"];                   // floor band
  if (y % 4 === 3) return ["light_gray_concrete"];              // spandrel
  const along = fs[0][0] !== 0 ? z : x;
  const pier = fs.length > 1 || along % 3 === 0;
  if (pier) return [y < 4 ? "polished_andesite" : "light_gray_concrete"];
  return ["light_blue_stained_glass"];
};

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z], t = T[x][z];
  const column = x % 4 === 0 && z % 4 === 0;                  // structural grid, interior only
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }  // foundation under the cell's ground
    const fs = faces(x, z, y);
    if (fs.length) {
      const [b, s] = facade(x, z, y, fs);
      g.set(x, y, z, b, s);
      if (b === "light_blue_stained_glass" && y % 4 === 1) glass.push({ x, y, z, fs });
      continue;
    }
    if (y === t - 1) { g.set(x, y, z, "gray_concrete"); continue; }     // roof
    if (y === TERRACE && t > TERRACE) { g.set(x, y, z, "gray_concrete"); continue; }   // shoulder terrace under the crown
    if (column) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // floor slab per storey
  }
}

// glowstone behind some panes: the cell just inside a lit pane, on its storey's second row
for (const p of glass) {
  if ((((p.x * 73856093) ^ (p.z * 19349663) ^ (p.y * 83492791)) >>> 0) % 4 !== 0) continue;
  const [dx, dz] = [p.fs[0][0], p.fs[0][1]];
  const ix = p.x - dx, iz = p.z - dz;
  if (inside(ix, iz) && faces(ix, iz, p.y).length === 0 && g.val(ix, p.y, iz) === 0) g.set(ix, p.y, iz, "glowstone");
}

// entrances: a stone threshold, two doors, a dark-oak canopy over them
for (const [key, d] of door) {
  const [x, z] = key.split(",").map(Number);
  g.set(x, 1, z, "dark_oak_door", { facing: d.facing, half: "lower", hinge: d.hinge, open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing: d.facing, half: "upper", hinge: d.hinge, open: "false", powered: "false" });
  g.set(x, 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// the plant room on the crown: light-grey walls with a row of glass, a roof, and the mast
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inPlant(x, z)) {
  const edge = !inPlant(x - 1, z) || !inPlant(x + 1, z) || !inPlant(x, z - 1) || !inPlant(x, z + 1);
  for (let y = CROWN; y <= CROWN + 2; y++) {
    if (!edge) continue;
    const window = y === CROWN + 1 && (x + z) % 2 === 0;
    g.set(x, y, z, window ? "light_blue_stained_glass" : "light_gray_concrete");
  }
  g.set(x, CROWN + 3, z, "gray_concrete");
}
if (inPlant(cx, cz)) for (let y = CROWN + 4; y <= CROWN + 9; y++) g.set(cx, y, cz, "end_rod", { facing: "up" });

const stats = g.save(OUT);
const top = Math.max(...cells.map(([x, z, , r]) => (inside(x, z) ? T[x][z] : 0)));
console.log(`way_292861379: ${stats.blocks} blocks, ${stats.palette} palette entries, tallest column ${top} blocks, entrance ${door.size} doors`);
