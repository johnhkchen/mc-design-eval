// Way 401588415: a 1980s concrete-frame office block, Eden Terrace side of the CBD ridge.
// Footprint 27 x 24, lidar roofs 48..56 blocks: three flat tiers (wing 48, mid 52, crown 56),
// ribbon glazing on 3-block bays with white concrete piers, storey lines every 4 blocks,
// a dark-oak entrance on the north face, warm glowstone behind some glass, roof plant on the tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_401588415.cells.json`, "utf8"));
const W = 27, D = 24, H = 69;

const key = (x, z) => x + "," + z;
const foot = new Map();
for (const [x, z, , r] of cells) foot.set(key(x, z), { r });

// Roof heights -> tiers. A roof under 10 is a one-storey pavilion (one lidar sliver).
const TIER_TOP = [48, 52, 56];
let label = new Map();
for (const [k, { r }] of foot) label.set(k, r < 10 ? -1 : r <= 50 ? 0 : r <= 53 ? 1 : 2);
// Lidar noise -> clean tiers: two passes of 3x3 majority (ties keep the cell's own tier).
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [k, L] of label) {
    if (L < 0) { next.set(k, L); continue; }
    const [x, z] = k.split(",").map(Number);
    const votes = [0, 0, 0];
    votes[L]++;
    for (const [dx, dz] of NB8) { const n = label.get(key(x + dx, z + dz)); if (n !== undefined && n >= 0) votes[n]++; }
    let best = L;
    for (let t = 0; t < 3; t++) if (votes[t] > votes[best]) best = t;
    next.set(k, best);
  }
  label = next;
}

const topOf = (x, z) => { const k = key(x, z); if (!foot.has(k)) return 0; const L = label.get(k); return L < 0 ? 4 : TIER_TOP[L]; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Horizontal sides at height y that face air: outside the footprint, or a neighbour whose tier has already ended.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) <= y);

const g = new Voxels([W, H, D]);
const place = (x, y, z, block, state) => g.set(x, y, z, block, state);
// Glazing is solid tinted glass: 1/8-block panes read as holes at range (the sky shows through the whole facade).
const GLASS = "light_blue_stained_glass";

// Pass 1: the shell. Every column rises from y 0 to its own tier top, so each tier stands on the one below.
const entrance = [];
for (const [k, _] of foot) {
  const [x, z] = k.split(",").map(Number);
  const T = topOf(x, z);
  for (let y = 0; y < T; y++) {
    const ex = exposed(x, z, y);
    if (y === T - 1) { place(x, y, z, "light_gray_concrete"); continue; }   // roof slab / top spandrel
    if (y % 4 === 0) { place(x, y, z, y === 0 ? "polished_andesite" : "smooth_stone"); continue; }   // base course, floor slabs
    if (ex.length === 0) continue;                                     // interior: air gap
    if (y % 4 === 3) { place(x, y, z, "light_gray_concrete"); continue; }   // spandrel under each window band
    // window rows: 3-block bays, a white concrete pier at each bay start, glass between
    const b = ex.some(([, dz]) => dz !== 0) && ex.some(([dx]) => dx !== 0) ? x + z : ex.some(([, dz]) => dz !== 0) ? x : z;
    const ground = y < 4;
    if (y === 1 && ground) entrance.push({ x, z, ex, b });
    if (b % 3 === 0) place(x, y, z, ground ? "polished_andesite" : "white_concrete");
    else place(x, y, z, GLASS);
  }
  // parapet on the exposed top edge of every tier
  if (exposed(x, z, T - 1).length) place(x, T, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance: dark-oak door on the north face, centred on the ground floor, framed by piers and a lintel.
const door = entrance
  .filter(e => e.ex.some(([, dz]) => dz === -1))
  .sort((a, b) => Math.abs(a.x - 12) - Math.abs(b.x - 12))[0];
if (door) {
  const { x, z } = door;
  place(x, 0, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  place(x, 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  place(x, 2, z, "polished_andesite");
  for (const dx of [-1, 1]) { place(x + dx, 0, z, "polished_andesite"); place(x + dx, 1, z, "polished_andesite"); }
}

// Warm light: glowstone on the inner side of some glass, in the air gap behind it.
for (const [k, _] of foot) {
  const [x, z] = k.split(",").map(Number);
  const T = topOf(x, z);
  for (let y = 5; y < T - 1; y += 4) {
    const ex = exposed(x, z, y);
    if (!ex.length || ex.length > 1 || ex[0][0] !== 0 && ex[0][1] !== 0) continue;
    const [dx, dz] = ex[0];
    const b = dz !== 0 ? x : z;
    if (b % 3 === 0 || ((x * 7 + z * 5 + y) % 9) !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (!foot.has(key(ix, iz)) || exposed(ix, iz, y).length) continue;
    place(ix, y, iz, "glowstone");
  }
}

// Roof plant and terraces: boxes on the tiers, two-block plant pods on the crown, planting on the wing roofs.
for (const [k, _] of foot) {
  const [x, z] = k.split(",").map(Number);
  const T = topOf(x, z);
  if (exposed(x, z, T - 1).length) continue;
  if (T === 56 && x % 4 === 1 && z % 4 === 2) { place(x, T, z, "smooth_stone"); place(x, T + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); }
  else if (T === 56 && (x * 3 + z * 7) % 13 === 0) place(x, T, z, "iron_block");
  else if (T === 52 && (x * 3 + z * 7) % 11 === 0) place(x, T, z, "iron_block");
  else if (T === 48 && (x + z) % 5 === 0) place(x, T, z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}

g.save(`${HERE}/way_401588415.nbt`);
console.log("blocks:", g.count(), "palette:", g.palette.length - 1, "door:", door ? [door.x, door.z] : "none");
