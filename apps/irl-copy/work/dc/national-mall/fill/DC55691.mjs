// 1800 M St NW: a 1980s-style Commercial-Office-Large on the lidar footprint. Ground-to-roof massing with three tiers
// (wings 16, main mass 18, tower 19) from a median-smoothed roof map, a stone foundation, a granite base course,
// quartz spandrels and piers with gray-tinted glass rows, a glass shopfront storey, and a double-door entrance on
// the south (z = 40) street face. Each storey is a 2-block module (spandrel + window row), so the floors stack on
// the floors below. The skin is one cell thick; behind each window row sits an air pocket with a floor slab under
// and over it; the core is solid, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55691.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => raw.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Tiers: lidar roofs are noisy, so take a 3x3 median of the footprint's roof heights and bin it to flat tiers.
const tierOf = (r) => (r <= 3 ? 3 : r <= 16 ? 16 : r <= 18 ? 18 : 19);
const median = (v) => v.sort((a, b) => a - b)[v.length >> 1];
const top = new Map();
for (const c of raw.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = raw.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r); }
  top.set(key(c.x, c.z), tierOf(median(vals)));
}

// Depth from the outside edge (0 = skin, 1 = the layer behind it, 2+ = core).
const depth = new Map();
const queue = [];
for (const c of raw.values()) {
  if (DIRS.some(([dx, dz]) => !inF(c.x + dx, c.z + dz))) { depth.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz);
    if (raw.has(k) && !depth.has(k)) { depth.set(k, d + 1); queue.push(raw.get(k)); }
  }
}

const Y = 31;
const g = new Voxels([26, Y, 41]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const ENTRY_Z = 40, ENTRY_X = [12, 13];
const isEntry = (x, z) => z === ENTRY_Z && ENTRY_X.includes(x);
const isLanternBay = (x, z) => z === ENTRY_Z && (x === 11 || x === 14);

for (const c of raw.values()) {
  const { x, z, g: G } = c;
  const k = key(x, z);
  const T = top.get(k), dep = depth.get(k);
  const outside = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
  const hTop = T - G - 1;   // the topmost row of this cell's column (cornice on the skin, roof cap inside)

  for (let y = 0; y < T; y++) {
    if (y < G) { put(x, y, z, "stone_bricks"); continue; }     // foundation up to this cell's ground
    const h = y - G;
    // skin faces at this level: the outside edge, or a neighbour whose tier is at or below this row
    const faces = [...outside, ...DIRS.filter(([dx, dz]) => inF(x + dx, z + dz) && top.get(key(x + dx, z + dz)) <= y)];
    const skin = faces.length > 0;

    if (h === hTop) { put(x, y, z, skin ? "smooth_quartz" : "light_gray_concrete"); continue; }   // cornice / roof cap

    if (!skin) {
      if (dep >= 2 || h === 0 || h % 2 === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // core, base, floor slabs
      // dep 1, window row: an air gap behind the glass, with a warm lamp in some bays
      if ((x * 7 + z * 3 + h) % 9 === 0) put(x, y, z, "glowstone");
      continue;
    }

    // skin: piers every third bay along the face the cell looks out of (z faces run along x, x faces along z)
    const zFace = faces.some(([, dz]) => dz !== 0);
    const along = zFace ? x : z;
    const pier = along % 3 === 0;

    if (isEntry(x, z) && h <= 1) {
      put(x, y, z, "iron_door", { facing: "south", half: h === 0 ? "lower" : "upper", hinge: x === ENTRY_X[0] ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (isEntry(x, z) && h === 2) { put(x, y, z, "smooth_quartz"); continue; }   // canopy band over the doors
    if (isLanternBay(x, z) && h === 1) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }

    if (h === 0) put(x, y, z, "polished_granite");                                  // base course
    else if (h === 1) put(x, y, z, pier ? "quartz_pillar" : "light_blue_stained_glass", pier ? { axis: "y" } : undefined);   // shopfront
    else if (h % 2 === 0) put(x, y, z, pier ? "quartz_pillar" : "smooth_quartz", pier ? { axis: "y" } : undefined);            // storey spandrel
    else put(x, y, z, pier ? "quartz_pillar" : "gray_stained_glass", pier ? { axis: "y" } : undefined);                       // window row
  }
}

// Roof plant: a two-storey penthouse on the tower and one screened plant bay on the east wing.
for (const c of raw.values()) {
  const { x, z } = c;
  const k = key(x, z);
  const T = top.get(k), dep = depth.get(k);
  if (dep < 2) continue;
  if (T === 19 && x >= 9 && x <= 11 && z >= 6 && z <= 8) { put(x, T, z, "smooth_quartz"); put(x, T + 1, z, "gray_stained_glass"); }
  if (T === 16 && x >= 19 && x <= 22 && z >= 27 && z <= 30) put(x, T, z, "light_gray_concrete");
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55691.nbt");
console.log(JSON.stringify(out));
