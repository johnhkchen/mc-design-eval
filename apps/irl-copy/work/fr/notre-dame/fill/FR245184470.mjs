// FR245184470: a residential block of 1800, five storeys of pale limestone (calcite) on a stone plinth, with deepslate
// mansards. The lidar roof is median-smoothed and snapped to five tiers (8, 13, 18 flat terraces; 23 and 29 mansard), so
// each tier stands on the one below and steps in as it rises: the 29 tier is the corner pavilion and the SE tower.
// Storey lines are absolute: belts at 5, 9, 13, 17 (and 20 on the tower), glass between them, a band under each sill.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184470.cells.json`, "utf8"));

const W = 18, D = 17, H = 45;
const g = new Voxels([W, H, D]);

const NEI = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];   // [dx, dz, facing name]
const k2 = (x, z) => `${x},${z}`;

// footprint cells, each snapped to its roof tier
const fp = cells.map(([x, z, , roof]) => ({ x, z, roof }));
const byXZ = new Map(fp.map((c) => [k2(c.x, c.z), c]));
const near = (x, z) => byXZ.get(k2(x, z));
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const tierOf = (r) => (r >= 25 ? 29 : r >= 20 ? 23 : r >= 15 ? 18 : r >= 11 ? 13 : 8);
for (const c of fp) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = near(c.x + dx, c.z + dz); if (n) vals.push(n.roof); }
  c.t = tierOf(median(vals));
}
// a tower is at least two cells across: a strip of the top tier one or two cells wide drops to the tier below
let dropped = true;
while (dropped) {
  dropped = false;
  for (const c of fp) {
    if (c.t !== 29) continue;
    const same = NEI.filter(([dx, dz]) => near(c.x + dx, c.z + dz)?.t === 29).length;
    if (same < 2) { c.t = 23; dropped = true; }
  }
}

// wall top per tier: a flat tier has its cap at t - 1; a mansard tier has walls to wt and (t - wt) layers of roof
const WALL_TOP = { 8: 7, 13: 12, 18: 17, 23: 20, 29: 25 };
const sameTier = (c, n) => !!n && n.t === c.t;

// distance inward from its tier's edge (edge = 1), so each mansard layer is the cells at d >= k + 2 plus a sloping ring at d = k + 1
let frontier = [];
for (const c of fp) if (NEI.some(([dx, dz]) => !sameTier(c, near(c.x + dx, c.z + dz)))) { c.d = 1; frontier.push(c); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of NEI) {
    const n = near(c.x + dx, c.z + dz);
    if (sameTier(c, n) && n.d === undefined) { n.d = d + 1; next.push(n); }
  }
  frontier = next;
}

// a slope's lower edge faces outward: the first side that is open or lower than this layer
const slopeFacing = (c, k) => {
  for (const [dx, dz, name] of NEI) { const n = near(c.x + dx, c.z + dz); if (!sameTier(c, n) || n.d <= k) return name; }
};

// 1. the solid: walls, then the roof of each tier
for (const c of fp) {
  const wt = WALL_TOP[c.t];
  for (let y = 0; y < wt; y++) g.set(c.x, y, c.z, y === 0 ? "stone_bricks" : "calcite");   // plinth course, then limestone
  if (c.t < 23) {
    g.set(c.x, wt, c.z, c.d === 1 ? "stone_bricks" : "smooth_stone");                       // terrace: parapet ring, deck inside
  } else {
    for (let k = 0; k < c.t - wt; k++) {
      if (c.d >= k + 2) g.set(c.x, wt + k, c.z, "deepslate_tiles");
      else if (c.d === k + 1) g.set(c.x, wt + k, c.z, "deepslate_tile_stairs", { facing: slopeFacing(c, k), half: "bottom", shape: "straight", waterlogged: "false" });
    }
  }
}

// roof equipment: brick flues on the main mansard deck (its top layer is full where d >= 4)
for (const c of fp) if (c.t === 23 && c.d >= 4 && (c.x * 3 + c.z * 5) % 13 === 0) { g.set(c.x, 23, c.z, "bricks"); g.set(c.x, 24, c.z, "bricks"); }

// 2. the facade: every wall cell with air beside it, read before any recess is cut
const DOOR_X = 6;
const at3 = (x, y, z) => `${x},${y},${z}`;
const BELT = new Set([5, 9, 13, 17, 20]);           // string courses
const BAND = new Set([4, 8, 12, 16, 23, 24]);       // sill and lintel bands, cornice
const GLASS = new Set([1, 2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 21, 22]);

const facade = [];
for (const c of fp) for (let y = 0; y < WALL_TOP[c.t]; y++) {
  const dirs = NEI.filter(([dx, dz]) => g.val(c.x + dx, y, c.z + dz) === 0);
  if (dirs.length) facade.push({ x: c.x, y, z: c.z, dirs });
}
const faces = new Map(facade.map((f) => [at3(f.x, f.y, f.z), f]));
const isFace = (x, y, z, dir) => { const f = faces.get(at3(x, y, z)); return !!f && f.dirs.some((d) => d[2] === dir[2]); };

// a pilaster: at a corner, at the end of a run, or every third cell along a run (so windows come in pairs)
const pillar = (f, dir) => {
  if (f.dirs.length > 1) return true;
  const [ax, az] = dir[1] !== 0 ? [1, 0] : [0, 1];                        // a z-face runs along x, an x-face along z
  const run = (s) => isFace(f.x + ax * s, f.y, f.z + az * s, dir);
  if (!run(-1) || !run(1)) return true;
  let j = 0; while (run(-(j + 1))) j++;
  return j % 3 === 0;
};

const paneState = (dz) => (dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const f of facade) {
  const dir = f.dirs[0];
  const [dx, dz] = dir;
  const { x, y, z } = f;

  // the entrance on the north front: a dark oak door between two pilasters, a stone lintel over it, a glazed transom
  if (z === 0 && dz === -1 && x >= DOOR_X - 1 && x <= DOOR_X + 1 && y <= 3) {
    if (x === DOOR_X && y <= 1) g.set(x, y, z, "dark_oak_door", { facing: "south", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" });
    else if (x === DOOR_X && y === 3) g.set(x, y, z, "glass_pane", paneState(dz));
    else g.set(x, y, z, "polished_andesite");
    continue;
  }

  if (BELT.has(y) || BAND.has(y)) g.set(x, y, z, "polished_andesite");
  else if (GLASS.has(y)) {
    if (pillar(f, dir)) { g.set(x, y, z, "polished_andesite"); continue; }
    // the glass sits in a one-block recess; a few windows have glowstone behind them
    const ix = x - dx, iz = z - dz;
    const lit = y >= 6 && (x * 7 + y * 13 + z * 31) % 11 === 0;
    if (g.val(ix, y, iz) && g.val(ix - dx, y, iz - dz)) g.set(ix, y, iz, lit ? "glowstone" : "air");
    g.set(x, y, z, "glass_pane", paneState(dz));
  }
}

const r = g.save(`${DIR}/FR245184470.nbt`);
console.log(`FR245184470: ${r.blocks} blocks, ${r.palette} palette entries`);
