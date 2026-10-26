// 1120 G St NW: a Commercial-Office block of the 1960s-70s, cream limestone-clad, four storeys on a
// stepped massing (lidar roof 14-17 blocks, the core highest). Solid massing with a one-block air gap behind the
// glass, floor bands per storey, a recessed entrance, and warm light in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55023.cells.json", "utf8"));
const X = 13, Z = 16, Y = 29;

// footprint: [x, z, ground, roof]
const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));

// lidar noise -> flat tiers: the 3x3 median of the roof heights around each cell
const H = new Map();
for (const [key, { r }] of at) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at.get(`${x + dx},${z + dz}`); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  H.set(key, vals[Math.floor(vals.length / 2)] ?? r);
}

const CALCITE = "calcite", BASE = "polished_deepslate", BAND = "smooth_stone", GLASS = "light_blue_stained_glass";
const CORE = "stone_bricks", ROOF = "stone";
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

const isPerim = (x, z) => x === 0 || x === 12 || z === 0 || z === 15;
const isCorner = (x, z) => (x === 0 || x === 12) && (z === 0 || z === 15);
const isDoorPortal = (x, z, r) => z === 0 && x >= 5 && x <= 7 && r <= 2;

// the facade cell at row r: storey rows are 4 high (sill, two glass rows, band), the band on row 3 is the ground-floor head
function facade(x, z, r, h) {
  if (r === h - 1) return { block: BAND };                                          // cornice
  if (isCorner(x, z)) return { block: CALCITE };
  if (isDoorPortal(x, z, r)) {
    if (x === 6 && r <= 1) return { block: "iron_door", state: { ...DOOR, half: r === 0 ? "lower" : "upper" } };
    return { block: BASE };                                                         // portal pilasters and lintel
  }
  if (r === 0) return { block: BASE };                                             // base course
  const local = r % 4;
  if (local === 0) return { block: CALCITE };                                      // sill
  if (local === 3) return { block: BAND };                                         // floor string course
  const i = z === 0 || z === 15 ? x : z;                                           // along the face
  if (i % 3 === 0) return { block: CALCITE };                                      // pier
  return { block: GLASS };
}

// windows get a one-block air gap behind the glass; every fourth or so is lit from behind
const pockets = new Map();
const lit = (x, z, r) => (x * 7 + z * 3 + r * 5) % 6 === 0;
for (const [key] of at) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  const h = H.get(key);
  const inward = z === 0 ? [x, 1] : z === 15 ? [x, 14] : x === 0 ? [1, z] : [11, z];
  for (let r = 1; r < h; r++) {
    if (isDoorPortal(x, z, r)) continue;
    const local = r % 4;
    if (local !== 1 && local !== 2) continue;
    const i = z === 0 || z === 15 ? x : z;
    if (i % 3 === 0) continue;
    const [px, pz] = inward;
    const warm = local === 1 && lit(x, z, r);
    pockets.set(`${px},${r},${pz}`, warm ? { block: "glowstone" } : { block: "air" });
  }
}
// the entrance: an air gap behind the door with a hanging lantern under the lintel
pockets.set("6,0,1", { block: "air" });
pockets.set("6,1,1", { block: "lantern", state: { hanging: "true", waterlogged: "false" } });

const v = new Voxels([X, Y, Z]);
for (const [key, { g }] of at) {
  const [x, z] = key.split(",").map(Number);
  const h = H.get(key);
  for (let y = g; y < h; y++) {
    const pk = pockets.get(`${x},${y},${z}`);
    if (pk) { if (pk.block !== "air") v.set(x, y, z, pk.block, pk.state); continue; }
    if (isPerim(x, z)) { const f = facade(x, z, y, h); v.set(x, y, z, f.block, f.state); }
    else v.set(x, y, z, y === h - 1 ? ROOF : CORE);
  }
  // parapet: a continuous calcite coping on the perimeter, standing on the cornice, with a taller pier at each corner
  if (isPerim(x, z)) v.set(x, h, z, isCorner(x, z) ? CALCITE : BAND);
}

// roof plant: 2x2 air-handling boxes on the core (equal-height 2x2 squares), standing on the roof surface
const plant = [[3, 5], [8, 9]];
for (const [px, pz] of plant) {
  const hs = [[px, pz], [px + 1, pz], [px, pz + 1], [px + 1, pz + 1]].map(([x, z]) => H.get(`${x},${z}`));
  if (hs.every((h) => h === hs[0]) && hs[0] >= 16) {
    for (const [x, z] of [[px, pz], [px + 1, pz], [px, pz + 1], [px + 1, pz + 1]]) {
      v.set(x, hs[0], z, "light_gray_concrete"); v.set(x, hs[0] + 1, z, "light_gray_concrete");
    }
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55023.nbt";
const r = v.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
