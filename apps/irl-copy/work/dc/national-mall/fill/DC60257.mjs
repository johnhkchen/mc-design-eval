// 1001 G Street NW: a limestone-clad, stripped-classical office block of about six storeys (1920s-30s, the Federal
// Triangle's commercial grain). Lidar roof heights snap to three flat tiers: a central block, the main body, and a
// lower east wing; the roof is stepped on those tiers, not on lidar noise. The footprint is a shell: a 1-block outer
// wall with windows, floor slabs every 3 blocks, a roof plate, interior pillars, and air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60257.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60257.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell

const [X, Y, Z] = [27, 31, 26];
const key = (x, z) => `${x},${z}`;

// Lidar roof heights -> three clean tiers (19 central block, 17 main body, 14 east wing), then a 3x3 majority pass
const tierOf = (r) => (r >= 19 ? 19 : r >= 16 ? 17 : 14);
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), tierOf(r)]));
const top = new Map();
for (const [k, t] of raw) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(key(x + dx, z + dz));
    if (n !== undefined) votes.set(n, (votes.get(n) ?? 0) + 1);
  }
  let best = t, bestN = votes.get(t) ?? 0;
  for (const [v, n] of votes) if (n > bestN) { best = v; bestN = n; }
  top.set(k, best);
}
const inside = (x, z) => top.has(key(x, z));
const T = (x, z) => top.get(key(x, z)) ?? 0;

// Horizontal sides of (x, y, z) facing air: outside the footprint, or a neighbour whose roof is at or below y
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => SIDES.filter(([dx, dz]) => !inside(x + dx, z + dz) || T(x + dx, z + dz) <= y);

// Interior pillars carry the floor slabs between the walls (every slab has something under it)
const PX = [6, 13, 20], PZ = [6, 12, 19];
const isPillar = (x, z) => PX.includes(x) && PZ.includes(z);

const ENTRY = { z: 0, from: 10, to: 14, door: 12 };   // north (street) face: andesite piers, glass, a door at x=12
const onEntryFace = (x, y, z, dz) => z === ENTRY.z && dz === -1 && x >= ENTRY.from && x <= ENTRY.to && y >= 1 && y <= 2;

const paneOn = ([, dz]) => (dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true" }     // runs along x on a z-facing wall
  : { north: "true", south: "true", east: "false", west: "false" });   // runs along z on an x-facing wall

const g = new Voxels([X, Y, Z]);

for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const dirs = exposed(x, y, z);
    if (dirs.length === 0) {                                  // interior: slabs, roof plate, pillars, air
      if (isPillar(x, z) && y > 0) g.set(x, y, z, "quartz_pillar", { axis: "y" });
      else if (y === 0 || y === t - 1 || y % 3 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const [dx, dz] = dirs[0];
    const along = dz !== 0 ? x : z;                           // position along the face
    const corner = dirs.length > 1;
    const pier = corner || along % 3 === 0;
    if (y === 0) {                                            // base course
      if (x === 12 && z === 0) g.set(x, y, z, "polished_andesite_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, "polished_andesite");
    } else if (y === t - 1) {                                 // cornice / parapet cap
      g.set(x, y, z, "smooth_quartz");
    } else if (y % 3 === 0) {                                 // storey lines
      g.set(x, y, z, "smooth_quartz");
    } else if (onEntryFace(x, y, z, dz)) {                    // entrance: andesite jambs, glass, door at x=12
      if (x === ENTRY.door) continue;                         // door set below
      if (x === ENTRY.from || x === ENTRY.to) g.set(x, y, z, "polished_andesite");
      else g.set(x, y, z, "light_blue_stained_glass_pane", paneOn([dx, dz]));
    } else if (pier) {                                        // piers: granite at the shopfront, calcite above
      g.set(x, y, z, y < 3 ? "polished_andesite" : "calcite");
    } else {                                                  // window panes behind which is air (or a light)
      g.set(x, y, z, "light_blue_stained_glass_pane", paneOn([dx, dz]));
    }
  }
}

// Entrance door (two halves, opening onto the street) and a lantern just inside it
for (const half of ["lower", "upper"]) {
  g.set(ENTRY.door, half === "lower" ? 1 : 2, ENTRY.z, "dark_oak_door",
    { facing: "north", half, hinge: "left", open: "false", powered: "false" });
}
g.set(ENTRY.door, 1, ENTRY.z + 1, "lantern", { hanging: "false" });

// Warm lights behind some window panes (air behind the glass only; never a floor or a pillar)
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 1; y < t - 1; y++) {
    if (y % 3 !== 1) continue;
    const dirs = exposed(x, y, z);
    if (dirs.length !== 1) continue;
    const [dx, dz] = dirs[0];
    if (onEntryFace(x, y, z, dz)) continue;
    const along = dz !== 0 ? x : z;
    const ix = x - dx, iz = z - dz;
    if (!inside(ix, iz) || y >= T(ix, iz) - 1 || isPillar(ix, iz) || g.val(ix, y, iz)) continue;
    if (along % 9 === 4) g.set(ix, y, iz, "glowstone");
    else if (along % 9 === 7 && y >= 4) g.set(ix, y, iz, "shroomlight");
  }
}

// Roof plant: a calcite penthouse on the central tier, and HVAC units on the east wing's roof
for (let x = 9; x <= 13; x++) for (let z = 8; z <= 11; z++) {
  if (T(x, z) !== 19) continue;
  g.set(x, 19, z, "calcite"); g.set(x, 20, z, "calcite"); g.set(x, 21, z, "smooth_quartz");
}
for (let x = 21; x <= 22; x++) for (let z = 19; z <= 20; z++) {
  if (T(x, z) === 14) g.set(x, 14, z, "iron_block");
}

const { blocks, palette } = g.save(OUT);
console.log(`DC60257.nbt: ${blocks} blocks, ${palette} palette entries`);
