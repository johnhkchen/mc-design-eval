// way 343886721, Mt Eden / Eden Terrace side of the CBD: a 1930s stripped-classical brick commercial block.
// Three storeys on the lidar plateau (roof 15), a 19-block stepped tower at the north end (roof 16-18), and
// one-storey wings on the low east edge. Brick walls, cream pilasters and string courses, a basalt base course,
// window bays recessed one block with glass and an air gap behind (some lit by glowstone), a recessed door with
// a lintel and lantern on the uphill west frontage. Storey lines sit on absolute heights (3, 7, 11, 15, 19), so
// the downhill side shows its extra storey below the first floor line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886721.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886721.nbt";

const X = 36, Y = 30, Z = 49;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// footprint: ground g (fill below it) and the lidar roof r; the roof is median-smoothed over the 3x3 neighbourhood,
// then snapped to flat tiers (top surface at t: blocks sit at y < t)
const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const at = (x, z) => raw.get(key(x, z));
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[(s.length - 1) >> 1]; };
const tier = (r) => (r >= 16 ? 19 : r >= 12 ? 15 : r >= 8 ? 11 : 7);
const cols = new Map();
for (const c of raw.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.r); }
  cols.set(key(c.x, c.z), { x: c.x, z: c.z, g: c.g, t: tier(median(near)) });
}
const col = (x, z) => cols.get(key(x, z));

// a neighbour is air at height y when it is outside the footprint or its top is below y
const airAt = (x, z, y) => { const c = col(x, z); return !c || y >= c.t; };
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// spec per block: key "x,y,z" -> [block, state]; the windows and the door are written over the walls
const S = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, b, s) => { if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) return; S.set(k3(x, y, z), [b, s]); };
const clear = (x, y, z) => S.delete(k3(x, y, z));
const inside = (x, y, z) => { const c = col(x, z); return !!c && y < c.t && x >= 0 && z >= 0; };
const glassState = (dx) => (dx !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

for (const c of cols.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");
  for (let y = c.g; y < c.t; y++) {
    const faces = DIRS.filter(([dx, dz]) => airAt(c.x + dx, c.z + dz, y));
    const r = y % 4;
    let b = "bricks", s;
    if (y === c.t - 1) b = faces.length ? "smooth_quartz" : "smooth_stone";           // parapet cap / roof deck
    else if (faces.length === 0) b = "bricks";                                       // hidden core
    else if (y === c.g) b = "polished_andesite";                                     // basalt base course
    else if (faces.length >= 2) b = "smooth_quartz";                                 // corner pilaster
    else {
      const [dx] = faces[0];
      const u = dx !== 0 ? c.z : c.x;                                                // position along the wall
      const m = u % 4;
      if (r === 3) b = "smooth_quartz";                                              // storey string course
      else if (m === 0 || m === 3) b = "smooth_quartz";                              // cream pilasters
      else if (r === 2) b = "bricks";                                                // spandrel
      else { b = "glass_pane"; s = glassState(dx); }                                 // window (rows 0-1, cols 1-2)
    }
    put(c.x, y, c.z, b, s);
  }
}

// window bays: glass set one block back, air in front of it (the recess) and air behind it (the gap); some lit
for (const c of cols.values()) {
  for (let y = c.g + 1; y < c.t - 1; y++) {
    const faces = DIRS.filter(([dx, dz]) => airAt(c.x + dx, c.z + dz, y));
    if (faces.length !== 1) continue;
    const [dx, dz] = faces[0];
    const u = dx !== 0 ? c.z : c.x;
    if (y % 4 > 1 || u % 4 === 0 || u % 4 === 3) continue;
    const p2 = [c.x - dx, y, c.z - dz], p3 = [c.x - 2 * dx, y, c.z - 2 * dz];
    if (!inside(p2[0], y, p2[2])) { put(c.x, y, c.z, "glass_pane", glassState(dx)); continue; }
    clear(c.x, y, c.z);
    put(p2[0], y, p2[2], "glass_pane", glassState(dx));
    if (inside(p3[0], y, p3[2])) {
      const lit = (c.x * 7 + y * 5 + c.z * 3) % 5 === 0;
      if (lit) put(p3[0], y, p3[2], "glowstone"); else clear(p3[0], y, p3[2]);
    }
  }
}

// entrance: the uphill west frontage, recessed one block, a door in the wall and a lintel with a hanging lantern
let door = null;
for (let z = 24; z <= 30 && !door; z++) {
  const xs = [...cols.values()].filter((c) => c.z === z).map((c) => c.x);
  if (!xs.length) continue;
  const x0 = Math.min(...xs), c = col(x0, z);
  const g = c.g, top = c.t - 1;
  if (!airAt(x0 - 1, z, g) && !airAt(x0 - 1, z, g + 1)) continue;
  if (g + 2 >= top || !inside(x0 + 1, g + 1, z)) continue;
  door = { x0, z, g };
}
if (door) {
  const { x0, z, g } = door;
  clear(x0, g, z); clear(x0, g + 1, z);                                              // porch recess
  put(x0, g + 2, z, "smooth_quartz");                                                // lintel / canopy
  put(x0, g + 1, z, "lantern", { hanging: "true", waterlogged: "false" });           // hangs from the lintel
  put(x0 + 1, g, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x0 + 1, g + 1, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// roof plant: light boxes on the 15-tier deck, set in from the parapet so they stand on roof, not in air
for (let x = 6; x < X - 3; x += 11) for (let z = 10; z < Z - 3; z += 13) {
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].map(([a, b]) => col(a, b));
  if (cs.some((c) => !c || c.t !== 15)) continue;
  const edge = [-2, -1, 0, 1, 2, 3].some((d) => airAt(x - 1, z + d, 14) || airAt(x + 2, z + d, 14) || airAt(x + d, z - 1, 14) || airAt(x + d, z + 2, 14));
  if (edge) continue;
  for (const [a, b] of [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]]) for (const y of [15, 16]) put(a, y, b, "light_gray_concrete");
}

const g = new Voxels([X, Y, Z]);
for (const [k, [b, s]] of S) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, b, s); }
const res = g.save(OUT);
console.log(JSON.stringify({ out: OUT, ...res, door }));
