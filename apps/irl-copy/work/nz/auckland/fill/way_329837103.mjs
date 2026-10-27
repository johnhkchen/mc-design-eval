// Wharau o Tāmaki / Auckland House: a 1980s-90s glass-and-concrete office tower on a stone base. The lidar roof is
// three flat tiers one storey apart (134, 138, 142 blocks): wings on the north and east, a body, and a core that
// rises from the middle of the plan. Storeys are 4 blocks above a 6-block ground floor, each one a spandrel, two
// glass rows and a head, with piers every 3 blocks. Interior air is kept behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_329837103.cells.json`, "utf8"));
const W = 47, H = 153, D = 54;

const k = (x, z) => `${x},${z}`;
const ground = new Map(), roofRaw = new Map();
for (const [x, z, g, r] of cells) { ground.set(k(x, z), g); roofRaw.set(k(x, z), r); }

// A 3x3 median knocks out single-cell lidar spikes; the median then snaps to the three tiers.
const median = (vs) => vs.sort((a, b) => a - b)[Math.floor(vs.length / 2)];
const tierOf = (r) => (r <= 135 ? 134 : r <= 138 ? 138 : 142);
const roof = new Map();
for (const key of roofRaw.keys()) {
  const [x, z] = key.split(",").map(Number);
  const vs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roofRaw.get(k(x + dx, z + dz)); if (r !== undefined) vs.push(r);
  }
  roof.set(key, tierOf(median(vs)));
}

const top = (x, z) => roof.get(k(x, z));      // undefined outside the footprint
const base = (x, z) => ground.get(k(x, z));
const LINE = (y) => y >= 6 && (y - 6) % 4 === 0;   // storey floors: 6, 10, ... 134, 138, 142
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a wall face is seen where the neighbour has no building at this height (outside the footprint, or above its roof)
const exposed = (x, z, y) => NB.some(([dx, dz]) => { const t = top(x + dx, z + dz); return t === undefined || y >= t; });

// the north street face at ground level: the middle of its run of ground-zero cells gets the entrance
const northRun = cells.filter(([x, z, g]) => z === 0 && g === 0).map(([x]) => x).sort((a, b) => a - b);
const DOOR_X = northRun[Math.floor(northRun.length / 2)];

// one glazed bay = a 3-block run between piers; a few bays are tinted, the rest light blue
const glass = (x, z) => { const m = Math.floor((x + z) / 3) % 7; return m === 0 ? "gray_stained_glass" : m === 3 ? "cyan_stained_glass" : "light_blue_stained_glass"; };

// the block a footprint cell takes at height y: [name, state?] or null for air
function skin(x, z, y, gc, tc, ex) {
  if (y < gc) return ["stone_bricks"];                                           // foundation up to the ground
  if (y === gc) return ["polished_andesite"];                                    // floor / base course
  if (z === 0 && x === DOOR_X && (y === 1 || y === 2)) {                         // entrance door
    return ["dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (z === 0 && Math.abs(x - DOOR_X) === 1 && y >= 1 && y <= 4 && ex) return ["polished_andesite"];   // door piers
  if (y === tc - 1) return ex ? ["smooth_stone"] : ["gray_concrete"];           // parapet or roof
  if (ex && y >= tc - 2) return ["smooth_stone"];                               // cornice
  if (y < 6) {                                                                  // ground storey: stone base, shopfront
    if (!ex) return null;
    if (y === 5) return ["polished_andesite"];                                  // lintel
    return (x + z) % 3 === 0 ? ["polished_andesite"] : ["cyan_stained_glass"];
  }
  if (!ex) return LINE(y) ? ["white_concrete"] : null;                          // interior: floor slab per storey, air behind glass
  if (LINE(y)) return ["white_concrete"];                                       // spandrel
  const rel = (y - 6) % 4;
  if (rel === 3) return ["white_concrete"];                                     // head
  if ((x + z) % 3 === 0) return ["light_gray_concrete"];                        // pier
  return [glass(x, z)];
}

const v = new Voxels([W, H, D]);
for (const [x, z, gc] of cells) {
  const tc = top(x, z);
  for (let y = 0; y < tc; y++) {
    const b = skin(x, z, y, gc, tc, exposed(x, z, y));
    if (b) v.set(x, y, z, b[0], b[1]);
  }
}

// warm lights: some lit glazed bays get a glowstone or shroomlight on the floor just inside the glass
for (const [x, z] of cells) {
  const tc = top(x, z);
  for (let y = 7; y < tc - 2; y += 4) {                                          // row 1 of a storey: floor below
    if (!exposed(x, z, y) || ((x * 5 + z * 3 + y) % 4) !== 0) continue;
    const n = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => {
      const t = top(nx, nz);
      return t !== undefined && t > y && base(nx, nz) <= y - 1 && !exposed(nx, nz, y) && !LINE(y);
    });
    if (n) v.set(n[0], y, n[1], ((x + z + y) % 3) ? "glowstone" : "shroomlight");
  }
}

// roof plant: a 7x7 louvred box on the core tier, nearest the core's middle
const core = cells.filter(([x, z]) => top(x, z) === 142).map(([x, z]) => [x, z]);
const mid = [core.reduce((s, [x]) => s + x, 0) / core.length, core.reduce((s, [, z]) => s + z, 0) / core.length];
let plant = null;
for (const [x, z] of core) {
  let ok = true;
  for (let dz = -3; dz <= 3 && ok; dz++) for (let dx = -3; dx <= 3 && ok; dx++) if (top(x + dx, z + dz) !== 142) ok = false;
  if (!ok) continue;
  const d = Math.hypot(x - mid[0], z - mid[1]);
  if (!plant || d < plant.d) plant = { x, z, d };
}
if (plant) {
  for (let y = 142; y <= 144; y++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
    if (Math.abs(dx) !== 3 && Math.abs(dz) !== 3) continue;                    // the ring, interior air
    const louvre = y === 143 && (dx + dz) % 2 === 0;
    v.set(plant.x + dx, y, plant.z + dz, louvre ? "gray_stained_glass" : "light_gray_concrete");
  }
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) v.set(plant.x + dx, 145, plant.z + dz, "gray_concrete");
}

const stats = v.save(`${DIR}/way_329837103.nbt`);
console.log(`way_329837103: ${stats.blocks} blocks, ${stats.palette} palette entries, plant at ${plant ? `${plant.x},${plant.z}` : "none"}, entrance x=${DOOR_X}`);
