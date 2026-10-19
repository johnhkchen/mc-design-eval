// U.S. Government Central Heating Plant, 301 13th St NW. Early-1930s federal brick plant: a red-brick boiler hall
// with limestone (smooth sandstone) belts, a clerestory and a coping, stepping down to two lower wings and a site
// yard. Built from the lidar roof per cell: a core tier at 19, wings at 14 and 12, site cells at grade.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC68779.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 41, D = 31, H = 31;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cell = new Map(); for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, r });
const inFoot = (x, z) => cell.has(`${x},${z}`);
const G = (x, z) => cell.get(`${x},${z}`).g;

// Tier from the lidar roof: 0 = site (grade yard), 12 = low wing, 14 = wing, 19 = boiler-hall core.
const tierOf = (r) => (r >= 17 ? 19 : r >= 13 ? 14 : r >= 9 ? 12 : 0);
const raw = new Map(); for (const [k, { r }] of cell) raw.set(k, tierOf(r));
// One majority pass over the 3x3 neighbourhood: lidar noise becomes clean tiers, not a speckle of steps.
const tiers = new Map();
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(`${x + dx},${z + dz}`); if (c === undefined) continue;
    votes.set(c, (votes.get(c) || 0) + 1);
  }
  let best = raw.get(k), bv = votes.get(best) || 0;
  for (const [c, v] of votes) if (v > bv) { best = c; bv = v; }
  tiers.set(k, best);
}
const T = (x, z) => (inFoot(x, z) ? tiers.get(`${x},${z}`) : undefined);
const isBuilding = (x, z) => T(x, z) > 0;

// Floor lines: the ground floor sits on its own ground; upper floors every 4 blocks; the cap closes the tier.
const floorsOf = (L, g) => [g, ...[5, 9, 13].filter((f) => f > g && f < L - 1)];

// Faces of a building column at height y that are open to air: the outside, lower grade, or a lower tier.
function exposed(x, z, y) {
  const L = T(x, z), g = G(x, z);
  if (y < g || y >= L) return [];
  const out = [];
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (!inFoot(nx, nz)) out.push([dx, dz]);
    else if (!isBuilding(nx, nz)) { if (y >= G(nx, nz)) out.push([dx, dz]); }
    else if (y >= T(nx, nz)) out.push([dx, dz]);
  }
  return out;
}

const v = new Voxels([W, H, D]);

// Pass 1: columns. Fill to grade, then the storeys, walls, floors, cap and coping.
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  const g = G(x, z), L = T(x, z);
  if (!isBuilding(x, z)) {
    for (let y = 0; y < g; y++) v.set(x, y, z, "stone");               // yard edge reads as masonry, not a dirt wall
    v.set(x, g, z, "grass_block");
    continue;
  }
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");        // foundation to grade
  const floors = floorsOf(L, g);
  for (let y = g; y < L; y++) {
    const ex = exposed(x, z, y);
    if (y === L - 1) { v.set(x, y, z, "stone"); continue; }             // roof slab
    if (floors.includes(y)) { v.set(x, y, z, ex.length ? "smooth_sandstone" : "smooth_stone"); continue; }
    if (!ex.length) {                                                    // interior air, with pillars on a 6-block grid
      if (x % 6 === 4 && z % 6 === 4) v.set(x, y, z, "stone_bricks");
      continue;
    }
    const [dx, dz] = ex[0];
    const f = Math.max(...floors.filter((q) => q <= y));
    const r = y - f;
    const u = dz !== 0 ? x : z;                                          // position along the face
    if (r === 0) v.set(x, y, z, "smooth_sandstone");                    // belt course
    else if (r <= 2 && y !== L - 2) {
      if (u % 3 === 0) v.set(x, y, z, "bricks");                        // pier
      else v.set(x, y, z, "glass_pane", dz !== 0 ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
    } else if (y === L - 2) v.set(x, y, z, "smooth_sandstone");         // band under the cap
    else v.set(x, y, z, "bricks");
  }
  // Coping on the outer edge of the roof.
  if (exposed(x, z, L - 1).length) v.set(x, L, z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm light two cells behind some glass, with an air gap between (no room is furnished).
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (!isBuilding(x, z)) continue;
  const L = T(x, z), g = G(x, z), floors = floorsOf(L, g);
  for (let y = g; y < L - 2; y++) {
    if (floors.includes(y)) continue;
    const ex = exposed(x, z, y);
    if (!ex.length || (y - Math.max(...floors.filter((q) => q <= y))) > 2) continue;
    const [dx, dz] = ex[0];
    if (u(x, z, dx, dz) % 3 === 0) continue;                            // not a glass cell
    if ((x * 31 + y * 17 + z * 13) % 9 !== 0) continue;                 // a few lit windows, not all
    const x1 = x - dx, z1 = z - dz, x2 = x - 2 * dx, z2 = z - 2 * dz;
    if (!isBuilding(x1, z1) || !isBuilding(x2, z2)) continue;
    if (exposed(x1, z1, y).length || exposed(x2, z2, y).length) continue;
    if (x2 % 6 === 4 && z2 % 6 === 4) continue;                        // a pillar is there
    v.set(x2, y, z2, "glowstone");
  }
}
function u(x, z, dx, dz) { return dz !== 0 ? x : z; }

// Pass 3: the main entrance on the north face, under the boiler hall's street front.
{
  const ex = 13, ez = 1, gE = G(ex, ez);
  for (const sx of [12, 14]) for (let y = gE; y <= gE + 3; y++) v.set(sx, y, ez, "smooth_sandstone");
  for (let x = 11; x <= 15; x++) v.set(x, gE + 3, ez, "smooth_sandstone");
  v.set(ex, gE, ez, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(ex, gE + 1, ez, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  v.set(ex, gE + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 4: the stack on the boiler hall (3x3 over the core's centre), and two plant boxes on the wing roofs.
{
  const core = [...cell.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => T(x, z) === 19);
  const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length);
  const cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
  for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) for (let y = 19; y <= 25; y++) v.set(x, y, z, "bricks");
  for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) v.set(x, 26, z, "smooth_sandstone");
  for (const [x, z] of [[cx, cz]]) v.set(x, 27, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

  for (let x = 2; x <= 36; x++) for (let z = 2; z <= 26; z++) {
    if (x % 9 !== 4 || z % 7 !== 3) continue;
    const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (!quad.every(([a, b]) => T(a, b) === 14 && !exposed(a, b, 13).length)) continue;
    for (const [a, b] of quad) for (let y = 14; y <= 15; y++) v.set(a, y, b, "iron_block");
  }
}

const out = v.save(`${dir}/DC68779.nbt`);
console.log(JSON.stringify({ file: "DC68779.nbt", ...out }));
