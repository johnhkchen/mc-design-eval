// Grace Victoria Quarter (way 621631721): a mid-rise Auckland CBD office block, massed from the lidar roof record.
// Three roof tiers (tower 42, shoulder 38, lower wing 29 blocks above y 0, read from the median-smoothed lidar);
// storey lines on a common 4-block grid so every tier and the plinth line up; a stone plinth that follows the slope
// (solid from each cell's ground up to the first floor slab); a 1-block shell with an air gap behind the glazing,
// concrete piers on a 3-block bay, glass between, white spandrels, a stone base course, a cornice on each tier, a
// shopfront entrance with a canopy on the south face, lit windows, and a plant room on the tower roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_621631721.cells.json`, "utf8"));

const TOWER = 41, SHOULDER = 37, WING = 29;   // roof tops (exclusive); roof slabs sit at 40 / 36 / 28
const VALID = 20;                             // lidar roof below this along the outline is edge noise, not roof
const BAY = 3;                                // pier every third block on the facades

const at = new Map(cells.map(([x, z, g, roof]) => [`${x},${z}`, { x, z, g, roof }]));
const cell = (x, z) => at.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const validNear = (x, z, r) => {
  const out = [];
  for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    const c = cell(x + dx, z + dz); if (c && c.roof >= VALID) out.push(c.roof);
  }
  return out;
};

// the massing: each column's roof is the median of the valid lidar roofs around it, quantised to three tiers
for (const c of at.values()) {
  let v = validNear(c.x, c.z, 2); if (v.length < 5) v = validNear(c.x, c.z, 4);
  c.sm = v.length ? median(v) : TOWER;
  c.H = c.sm >= 38.5 ? TOWER : c.sm >= 33 ? SHOULDER : WING;
  c.f0 = 4 * (Math.floor(c.g / 4) + 1);       // first floor slab, strictly above this cell's ground: the plinth fills up to it
}

// the faces of column c at height y that show: a neighbour outside the footprint, or one whose roof is below y
const showing = (c, y) => DIRS.filter(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return !n || n.H <= y; });
const faceOf = (c, y) => {
  const s = showing(c, y); if (!s.length) return null;
  const [dx, dz] = s[0];
  return { dx, dz, idx: dz !== 0 ? c.x : c.z };   // position along the face: x on a north/south face, z on an east/west one
};
const isPier = (f) => f.idx % BAY === 0;

// overrides: the entrance, its canopy and lanterns, and the warm windows
const over = new Map();
const put = (x, y, z, block, state) => over.set(`${x},${y},${z}`, [block, state]);

const front = [...at.values()].filter((c) => !cell(c.x, c.z + 1) && c.H >= TOWER);
const meanX = front.reduce((s, c) => s + c.x, 0) / front.length;
const door = front.reduce((best, c) => (Math.abs(c.x - meanX) < Math.abs(best.x - meanX) ? c : best));
const ex = door.x, ez = door.z, fl = door.f0;
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(ex, fl + 1, ez, "dark_oak_door", doorState("lower"));
put(ex, fl + 2, ez, "dark_oak_door", doorState("upper"));
for (const xs of [ex - 1, ex, ex + 1]) {          // canopy: a bottom slab across the entrance bay's head
  if (!cell(xs, ez + 1) && cell(xs, ez)) put(xs, fl + 3, ez, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
for (const xs of [ex - 1, ex + 1]) {              // lanterns hang from the canopy beside the door
  if (cell(xs, ez) && !cell(xs, ez + 1)) put(xs, fl + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
}
for (const c of at.values()) {                    // warm windows: a glowstone just inside a lit window, on the floor slab
  for (let y = c.f0 + 1; y < c.H - 1; y += 4) {
    const f = faceOf(c, y); if (!f || isPier(f) || over.has(`${c.x},${y},${c.z}`)) continue;
    if ((c.x * 5 + c.z * 11 + y * 3) % 9 !== 0) continue;
    const ic = cell(c.x - f.dx, c.z - f.dz);
    if (!ic || ic.H <= y + 1 || showing(ic, y).length) continue;
    put(ic.x, y, ic.z, "glowstone");
  }
}

// the solid part: every column is contiguous from y 0 to its roof, so nothing floats on the slope
const g = new Voxels([45, 54, 57]);
for (const c of at.values()) {
  for (let y = 0; y < c.H; y++) {
    const o = over.get(`${c.x},${y},${c.z}`);
    if (o) { g.set(c.x, y, c.z, o[0], o[1]); continue; }
    const f = faceOf(c, y);
    if (y < c.f0) {
      g.set(c.x, y, c.z, f && y >= c.g ? "stone_bricks" : "stone");
    } else if (y === c.H - 1) {
      g.set(c.x, y, c.z, "light_gray_concrete");   // roof slab
    } else if (y === c.f0) {
      g.set(c.x, y, c.z, f ? "stone_bricks" : "smooth_stone");   // base course on the street face
    } else if (y % 4 === 0) {
      g.set(c.x, y, c.z, f ? "white_concrete" : "smooth_stone");  // floor line: spandrel on the face, slab inside
    } else if (f) {
      if (isPier(f)) g.set(c.x, y, c.z, "light_gray_concrete");
      else g.set(c.x, y, c.z, y % 4 === 3 ? "white_concrete" : "light_blue_stained_glass");   // glazing with a head band
    }
    // any other storey cell inside stays air: the gap behind the glass
  }
  if (faceOf(c, c.H)) g.set(c.x, c.H, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // cornice
}

// plant room on the tower roof: the first 4 x 3 patch of tower roof, nearest the middle of the tower
const towerCells = [...at.values()].filter((c) => c.H === TOWER);
const mx = towerCells.reduce((s, c) => s + c.x, 0) / towerCells.length;
const mz = towerCells.reduce((s, c) => s + c.z, 0) / towerCells.length;
const sites = towerCells.slice().sort((a, b) => Math.hypot(a.x - mx, a.z - mz) - Math.hypot(b.x - mx, b.z - mz));
const plantOk = (x0, z0) => {
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 4; dx++) {
    const c = cell(x0 + dx, z0 + dz);
    if (!c || c.H !== TOWER) return false;
  }
  return true;
};
const site = sites.find((c) => plantOk(c.x, c.z));
if (site) for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 4; dx++) {
  for (const y of [TOWER, TOWER + 1]) g.set(site.x + dx, y, site.z + dz, "stone_bricks");
}

const stats = {}; for (const c of at.values()) stats[c.H] = (stats[c.H] || 0) + 1;
const out = `${DIR}/way_621631721.nbt`;
const r = g.save(out);
console.log(JSON.stringify({ file: out, ...r, columnsByRoofTop: stats, door: [ex, fl + 1, ez], plant: site ? [site.x, site.z] : null }));
