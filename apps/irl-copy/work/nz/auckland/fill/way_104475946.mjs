// WS Building: a 1970s-80s concrete-frame office block, nine storeys over a stone plinth, the kind of mid-rise that
// filled the Auckland CBD's ridge and its edges in that period. Decided from the record: an 87 x 52 footprint, the
// lidar roof about 30 blocks over most of the plan with a central core to 36 and a few edge cells to 44. Storeys are
// 4 blocks: a light-concrete floor band, two rows of glazing between piers, a light spandrel band. Blue-tinted glass
// and white piers; a glazed ground floor with two dark-oak entrances; a white parapet on a solid roof deck; a
// penthouse and plant on the core; warm lights behind some of the glass. The shell is one block thick with an air
// gap behind the glass and a floor slab per storey, so nothing hangs: every column runs from its own ground up.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104475946.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104475946.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([87, 58, 52]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const FOUND = "stone";
const PLINTH = "polished_andesite";
const SLAB = "light_gray_concrete";     // floor slabs, storey bands, spandrels, the roof deck
const WALL = "white_concrete";          // piers, corners, the parapet
const DOOR = "dark_oak_door";

// deterministic pseudo-random in [0, 1) so the same build repeats
const H = (a, b, c) => {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(key(x, z), { g: ground, r: roof });
const inFoot = (x, z) => raw.has(key(x, z));

// --- massing -------------------------------------------------------------------------------------------------------
// the 3x3 median of the lidar roof, snapped to a 4-block storey line so each tier is flat; a column is never below
// eight blocks above its own ground
const col = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = raw.get(key(x + dx, z + dz)); if (n) near.push(n.r); }
  near.sort((a, b) => a - b);
  const m = near[(near.length - 1) >> 1];
  col.set(k, { x, z, g: c.g, T: Math.max(4 * Math.round(m / 4), c.g + 8), edge: 0 });
}
const at = (x, z) => col.get(key(x, z));

// distance in cells from the outside of the footprint (1 = on the edge)
const queue = [];
for (const c of col.values()) if (DIRS.some(([dx, dz]) => !inFoot(c.x + dx, c.z + dz))) { c.edge = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && !n.edge) { n.edge = c.edge + 1; queue.push(n); } }
}

// setbacks: the core and the tower step in as they rise, so each tier stands on the one below it
for (const c of col.values()) {
  if (c.T >= 40 && c.edge < 6) c.T = 36;
  if (c.T >= 36 && c.edge < 3) c.T = 32;
}

// the sides of a column that look onto open air at height y: no footprint beside it, or the neighbour's roof is below y
const openAt = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T <= y; });
const along = ([dx, dz], x, z) => (dx !== 0 ? z : x);   // the coordinate that runs along a face, for the bays

// --- entrances: one on the north face and one on the east, each in a glazed bay near the middle of its face -------
const doors = new Map();      // key -> { dir, lower/upper }
const canopy = new Set();     // ground-floor cells of the canopy over each door
for (const dir of [[0, -1], [1, 0]]) {
  const cand = [...col.values()].filter((c) => {
    const ex = openAt(c, c.g + 1);
    return ex.length === 1 && ex[0][0] === dir[0] && ex[0][1] === dir[1] && along(dir, c.x, c.z) % 3 !== 0 && c.T > c.g + 8;
  });
  if (!cand.length) continue;
  const mid = cand.map((c) => along(dir, c.x, c.z)).sort((a, b) => a - b)[cand.length >> 1];
  const d = cand.reduce((best, c) => (Math.abs(along(dir, c.x, c.z) - mid) < Math.abs(along(dir, best.x, best.z) - mid) ? c : best));
  doors.set(key(d.x, d.z), { dir });
  for (const c of cand) if (Math.abs(along(dir, c.x, c.z) - along(dir, d.x, d.z)) <= 1) canopy.add(key(c.x, c.z));
}
const doorState = (dir, half) => ({
  facing: FACING[`${dir[0]},${dir[1]}`], half, hinge: "left", open: "false", powered: "false",
});

// --- the main pass: one column per footprint cell ------------------------------------------------------------------
for (const c of col.values()) {
  const { x, z, g: gr, T } = c;
  const k = key(x, z);
  const s0 = Math.ceil((gr + 3) / 4) * 4;             // first storey line above the ground band (at least 3 high)
  const door = doors.get(k);

  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND); // foundation up to the lidar ground, so nothing floats on a slope

  for (let y = gr; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, SLAB); continue; }                      // the roof deck, solid across
    if (canopy.has(k) && y === gr + 3) { g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y >= s0 && y % 4 === 0) { g.set(x, y, z, SLAB); continue; }           // floor slab / storey line, solid across
    const ex = openAt(c, y);
    if (!ex.length) continue;                                                  // interior: an air gap, no rooms
    const face = ex[0];
    const corner = ex.length > 1;
    if (y === gr) { g.set(x, y, z, PLINTH); continue; }                        // base course
    if (door && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, DOOR, doorState(door.dir, y === gr + 1 ? "lower" : "upper"));
      continue;
    }
    if (y < s0) {                                                              // ground floor: glazed shopfront
      if (y === s0 - 1) { g.set(x, y, z, SLAB); continue; }                    // fascia over the shopfront
      if (corner || along(face, x, z) % 3 === 0) { g.set(x, y, z, WALL); continue };
      g.set(x, y, z, H(x, y, z) < 0.16 ? "cyan_stained_glass" : "light_blue_stained_glass");
      continue;
    }
    const rel = y % 4;
    if (rel === 3) { g.set(x, y, z, SLAB); continue; }                         // spandrel band under the window row
    if (corner || ((along(face, x, z) % 3) + 3) % 3 === 0) { g.set(x, y, z, WALL); continue; }  // piers every third block
    g.set(x, y, z, H(x, y, z) < 0.16 ? "cyan_stained_glass" : "light_blue_stained_glass");
    // a warm light in some windows: glowstone on the floor slab just inside the glass (an interior cell with air above)
    if (rel === 1 && H(x, y, z + 1000) < 0.10) {
      const ix = x - face[0], iz = z - face[1], inner = at(ix, iz);
      if (inner && inner.T > y && openAt(inner, y).length === 0) g.set(ix, y, iz, "glowstone");
    }
  }

  // the parapet: a white course on the sides that look down onto a lower neighbour or open air
  if (DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T < T; })) g.set(x, T, z, WALL);
}

// --- penthouse on the highest tier (a box inside the footprint, clear of the edge) ---------------------------------
const top = Math.max(...[...col.values()].map((c) => c.T));
let pick = null, best = -1;
for (let x0 = 0; x0 <= 87 - 8; x0++) for (let z0 = 0; z0 <= 52 - 5; z0++) {
  let ok = true, score = 99;
  for (let x = x0; x < x0 + 8 && ok; x++) for (let z = z0; z < z0 + 5; z++) {
    const c = at(x, z);
    if (!c || c.T !== top || c.edge < 4) { ok = false; break; }
    score = Math.min(score, c.edge);
  }
  if (ok && score > best) { best = score; pick = { x0, z0 }; }
}
const inPent = (x, z) => pick && x >= pick.x0 && x < pick.x0 + 8 && z >= pick.z0 && z < pick.z0 + 5;
if (pick) {
  const x1 = pick.x0 + 7, z1 = pick.z0 + 4;
  for (let x = pick.x0; x <= x1; x++) for (let z = pick.z0; z <= z1; z++) {
    const side = x === pick.x0 || x === x1 || z === pick.z0 || z === z1;
    const corner = (x === pick.x0 || x === x1) && (z === pick.z0 || z === z1);
    const pier = corner || (x === pick.x0 || x === x1 ? z : x) % 3 === 0;   // glazed sides between white piers
    if (side) { g.set(x, top, z, WALL); g.set(x, top + 3, z, WALL); }
    if (side) for (let y = top + 1; y <= top + 2; y++) g.set(x, y, z, pier ? WALL : "light_blue_stained_glass");
    g.set(x, top + 4, z, SLAB);
  }
}

// --- plant on the roofs of the lower tiers: 2 x 2 boxes, two blocks high, a few places only ------------------------
for (const c of col.values()) {
  if (inPent(c.x, c.z) || c.edge < 3 || H(c.x, c.z, 77) > 0.05) continue;
  const sq = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
  if (sq.some((n) => !n || n.T !== c.T || n.edge < 3 || inPent(n.x, n.z))) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let y = c.T; y <= c.T + 1; y++) g.set(c.x + dx, y, c.z + dz, "smooth_stone");
}

const tiers = {};
for (const c of col.values()) tiers[c.T] = (tiers[c.T] || 0) + 1;
const res = g.save(OUT);
console.log("tiers (roof top: columns)", JSON.stringify(tiers), "penthouse", pick ? `${pick.x0},${pick.z0}` : "none");
console.log("saved", OUT, res);
