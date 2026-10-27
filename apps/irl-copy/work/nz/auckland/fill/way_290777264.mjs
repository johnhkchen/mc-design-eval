// The Lighthouse, Auckland: a seven-storey reinforced-concrete office block of the 1960s-70s. White precast piers
// between tinted glazing, a granite base course, light-grey storey belts, stepped setbacks to a 4-tier roof, and a
// glass drum with a sea-lantern core on top (the lighthouse read from the crater rim). Solid massing, hollowed to an
// air gap behind the glass with a floor slab per storey; the foundation fills from y 0 to each cell's ground.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_290777264.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..21, z 0..34

const W = 22, D = 35, H = 42;
const key = (x, z) => x + "," + z;
const foot = new Map(); for (const [x, z, g, r] of cells) foot.set(key(x, z), { g, r });
const cell = (x, z) => foot.get(key(x, z));

// Lidar roof (above y 0) smoothed into four flat tiers: the surface y of each tier. Lidar gaps (roof < 10) take the
// lowest tier of their neighbours, so no stray spire is grown out of a gap.
const tierOf = (r) => (r <= 20 ? 18 : r <= 23 ? 22 : r <= 27 ? 26 : 29);
const top = new Map();
for (const [x, z, , r] of cells) {
  let t;
  if (r >= 10) t = tierOf(r);
  else {
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => cell(x + dx, z + dz)).filter((c) => c && c.r >= 10).map((c) => tierOf(c.r));
    t = n.length ? Math.min(...n) : 18;
  }
  top.set(key(x, z), t);
}
const T = (x, z) => top.get(key(x, z));

// solid: footprint cell below its tier surface (foundation, storeys and roof all fill from the ground up)
const solid = (x, y, z) => x >= 0 && z >= 0 && x < W && z < D && y >= 0 && cell(x, z) !== undefined && y < T(x, z);
const HORIZ = [[0, -1, "n"], [0, 1, "s"], [-1, 0, "w"], [1, 0, "e"]];
const exposed = (x, y, z) => HORIZ.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const isExterior = (x, y, z) => !solid(x, y + 1, z) || !solid(x, y - 1, z) || exposed(x, y, z).length > 0;
// storey belts: a floor slab at y = 5, 9, 13, ... ; the ground floor's slab is its own base (y = g)
const belt = (y) => y >= 5 && y % 4 === 1;
const floorAt = (g, y) => y === g || belt(y);
const pier = (idx) => idx % 3 === 0;

const GLASS = { north: "true", south: "true", east: "true", west: "true" };
const DOOR = { x: 11, z: 34 };   // the lobby: the one footprint cell with a free south face

// Hollow: inside the shell, not a floor or roof layer. These are the only cells the lights may fill.
const isHollow = (x, y, z) => solid(x, y, z) && !isExterior(x, y, z) && !floorAt(cell(x, z).g, y) && y !== T(x, z) - 1;
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const lights = [];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = cell(x, z); if (!c) continue;
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const ext = isExterior(x, y, z);
    if (!ext) {
      // interior: solid floors and roof, air between
      if (floorAt(c.g, y) || y === t - 1) put(x, y, z, "smooth_stone");
      continue;
    }
    const faces = exposed(x, y, z);
    if (y < c.g) { put(x, y, z, "stone_bricks"); continue; }                         // foundation fill
    if (y === t - 1) { put(x, y, z, "smooth_stone"); continue; }                     // roof and parapet cap
    if (y === c.g && faces.length) { put(x, y, z, "polished_granite"); continue; }   // base course
    if (faces.length === 0) { put(x, y, z, "white_concrete"); continue; }            // top or bottom face only
    if (belt(y)) { put(x, y, z, "light_gray_concrete"); continue; }                  // storey line
    const [dx, dz] = faces[0];
    const idx = dx !== 0 ? z : x;                                                   // position along the wall
    const corner = faces.length > 1;
    const shopfront = y <= 4;                                                       // ground storey
    if (shopfront) {
      if (corner || pier(idx)) put(x, y, z, "polished_andesite");
      else put(x, y, z, "gray_stained_glass_pane", GLASS);
      continue;
    }
    const winRow = y % 4 !== 1;                                                     // rows 0, 2, 3 of each storey are glazed
    if (corner || pier(idx) || !winRow) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "gray_stained_glass_pane", GLASS);
    // warm light in some windows: glowstone on the room side of the glass
    if ((idx + y) % 9 === 4) lights.push([x - dx, y, z - dz, "glowstone"]);
  }
}

// Ground-floor shopfront light: lanterns standing on the floor just inside the glass
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = cell(x, z); if (!c) continue;
  if (c.g + 1 < T(x, z) - 1 && (x + z) % 5 === 0) lights.push([x, c.g + 1, z, "lantern", { hanging: "false" }]);
}
for (const [x, y, z, b, st] of lights) if (isHollow(x, y, z)) put(x, y, z, b, st);

// Lobby entrance: a dark-oak door in the south face of cell (11, 34), a lintel over it
put(DOOR.x, 1, DOOR.z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR.x, 2, DOOR.z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(DOOR.x, 3, DOOR.z, "polished_andesite");

// The lighthouse drum: a 4 x 4 glass drum on the top tier (surface 29), capped, with a sea-lantern core
let best = null, cx = 0, cz = 0, n = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (cell(x, z) && T(x, z) === 29) { cx += x; cz += z; n++; }
cx /= n; cz /= n;
for (let z0 = 0; z0 + 3 < D; z0++) for (let x0 = 0; x0 + 3 < W; x0++) {
  let ok = true;
  for (let dz = 0; dz < 4 && ok; dz++) for (let dx = 0; dx < 4 && ok; dx++) ok = cell(x0 + dx, z0 + dz) !== undefined && T(x0 + dx, z0 + dz) === 29;
  if (!ok) continue;
  const d = Math.hypot(x0 + 1.5 - cx, z0 + 1.5 - cz);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) {
  const { x0, z0 } = best;
  for (let y = 29; y <= 32; y++) for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
    const edge = dx === 0 || dx === 3 || dz === 0 || dz === 3, corner = (dx === 0 || dx === 3) && (dz === 0 || dz === 3);
    if (!edge) continue;
    put(x0 + dx, y, z0 + dz, corner ? "white_concrete" : "light_blue_stained_glass_pane", GLASS);
  }
  for (let dz = 1; dz <= 2; dz++) for (let dx = 1; dx <= 2; dx++) put(x0 + dx, 30, z0 + dz, "sea_lantern");
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
    const core = dx >= 1 && dx <= 2 && dz >= 1 && dz <= 2;
    put(x0 + dx, 33, z0 + dz, core ? "sea_lantern" : "smooth_stone");
  }
}

// Roof plant: two-high air-handling units on 2 x 2 patches of one tier's roof (the 26 and 22 tiers first)
const plant = [];
for (const want of [26, 22, 18]) for (let z = 0; z + 1 < D && plant.length < 3; z++) for (let x = 0; x + 1 < W && plant.length < 3; x++) {
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => cell(x + dx, z + dz) !== undefined && T(x + dx, z + dz) === want);
  if (!ok || plant.some(([px, pz]) => Math.abs(px - x) < 4 && Math.abs(pz - z) < 4)) continue;
  plant.push([x, z, want]);
}
for (const [x, z, t] of plant) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) for (let y = t; y <= t + 1; y++) put(x + dx, y, z + dz, "iron_block");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_290777264.nbt");
console.log(`way_290777264: ${stats.blocks} blocks, ${stats.palette} palette entries; drum ${best ? `at ${best.x0},${best.z0}` : "not placed"}; plant ${plant.length}`);
