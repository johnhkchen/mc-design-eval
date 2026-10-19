// 690 Fifth Avenue, NYC individual landmark, 1897 commercial and office building: a 14-storey Beaux-Arts commercial block
// in grey granite (two storeys, shopfronts and a recessed entrance), red brick shafts with cream limestone storey belts,
// quoins at the corners, and a smooth limestone cornice at each setback. Footprint 48 x 23 (x runs along the street, low z
// is the north face where the entrance is, and the light court notch is open there). Ground: y 0 is the lowest ground
// under it; a cell whose ground is 1 gets a one-block granite foundation. The lidar roof is median-smoothed (3 x 3) and
// snapped to clean tiers (6, 27, 36, 39, 41, 44), so the tower stands at 44 and the wings step down. Every column is solid
// from its foundation to its roof, so nothing floats; the only air is the one-block pocket behind each window (a warm
// glowstone sits in some of them), the recessed entrance, and the air above the penthouse. Storeys are 3 blocks: a
// limestone belt at each storey line, two rows of glass beneath it. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034800.cells.json`, "utf8"));
const X = 48, Y = 56, Z = 23;

const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inFoot = (x, z) => raw.has(`${x},${z}`);
const TIERS = [6, 27, 36, 39, 41, 44];
const nearest = (v) => TIERS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

// Roof tier and ground per cell: the lidar's 3 x 3 median (noise out), then the nearest clean tier.
const top = new Map(), ground = new Map();
for (const [key, { g, r }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) vals.push(raw.get(`${x + dx},${z + dz}`).r);
  vals.sort((a, b) => a - b);
  top.set(key, Math.max(nearest(vals[Math.floor(vals.length / 2)]), g + 3));
  ground.set(key, g);
}
// Second pass: a one-cell spike of a higher tier among lower neighbours is lidar noise, so the tiers take the median
// of their own cell and its four neighbours in the footprint.
const tiered = new Map(top);
for (const [key, t] of tiered) {
  const [x, z] = key.split(",").map(Number);
  const vals = [t, ...[[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => inFoot(x + dx, z + dz)).map(([dx, dz]) => tiered.get(`${x + dx},${z + dz}`))];
  vals.sort((a, b) => a - b);
  top.set(key, vals[Math.floor(vals.length / 2)]);
}
const roofOf = (x, z) => top.get(`${x},${z}`) ?? 0;       // 0 outside the footprint: never solid
const solid = (x, y, z) => y >= 0 && y < roofOf(x, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const lit = (x, y, z) => (x * 31 + y * 17 + z * 7) % 11 === 0;   // a warm window in about one of eleven

const v = new Voxels([X, Y, Z]);
const pockets = [];

for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  const g = ground.get(key);
  for (let y = 0; y < t; y++) {
    const E = DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));   // exposed faces (outward normals)
    if (!E.length) {
      v.set(x, y, z, y === t - 1 ? "smooth_stone" : "stone");          // roof surface, or the hidden core
      continue;
    }
    if (y < g) { v.set(x, y, z, "polished_granite"); continue; }       // foundation
    let block;
    if (y >= t - 2) block = "smooth_quartz";                           // cornice and parapet
    else if (y < 6) block = y % 3 === 0 ? "smooth_quartz" : "polished_granite";   // granite base, limestone belts
    else block = y % 3 === 0 ? "smooth_quartz" : "bricks";             // red brick shaft, limestone belts
    if (E.length === 2 && y >= 6 && y < t - 2) block = "smooth_quartz";  // quoins
    if (E.length === 1 && y % 3 !== 0 && y >= g && y < t - 2) {
      const [dx, dz] = E[0];
      const along = dz !== 0 ? x : z;                                  // windows on the piers' grid: two glass, one pier
      const px = x - dx, pz = z - dz;                                  // the pocket behind the glass
      if (along % 3 !== 0 && inFoot(px, pz) && y < roofOf(px, pz)) {
        block = "glass";
        pockets.push([px, y, pz, lit(x, y, z)]);
      }
    }
    v.set(x, y, z, block);
  }
}
for (const [px, y, pz, warm] of pockets) v.set(px, y, pz, warm ? "glowstone" : "air");

// Recessed entrance on the north face between the pier at x 13 and x 17: a two-deep portal, a door, a hanging lantern
// under the limestone belt.
for (const x of [14, 15, 16]) for (const z of [0, 1]) for (const y of [1, 2]) v.set(x, y, z, "air");
v.set(15, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(15, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
v.set(15, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Penthouse with a copper cap on the largest flat piece of the 44 tower, sitting on its roof.
const tower = [...top].filter(([, t]) => t === 44).map(([k]) => k.split(",").map(Number));
const cx = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
let best = null;
for (let z0 = 0; z0 + 3 < Z; z0++) for (let x0 = 0; x0 + 3 < X; x0++) {
  let ok = true;
  for (let dz = 0; dz < 4 && ok; dz++) for (let dx = 0; dx < 4 && ok; dx++) ok = roofOf(x0 + dx, z0 + dz) === 44;
  if (!ok) continue;
  const d = Math.hypot(x0 + 1.5 - cx, z0 + 1.5 - cz);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) {
  const { x0, z0 } = best;
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
    const ring = dx === 0 || dz === 0 || dx === 3 || dz === 3, corner = (dx === 0 || dx === 3) && (dz === 0 || dz === 3);
    const x = x0 + dx, z = z0 + dz;
    v.set(x, 44, z, "smooth_quartz");
    if (ring) v.set(x, 45, z, corner ? "smooth_quartz" : "glass");
    v.set(x, 46, z, "oxidized_copper");
  }
}

// Check: every block rests on a block below it, hangs from one above (the lantern), or is a storey plate or lintel
// that reaches a supported block beside it (the one-block cantilever over a window's air gap, carried by the core).
const has = (x, y, z) => x >= 0 && z >= 0 && x < X && z < Z && y >= 0 && y < Y && !!v.get(x, y, z);
const supported = (x, y, z) => has(x, y - 1, z) || has(x, y + 1, z);
const orphans = [];
for (let z = 0; z < Z; z++) for (let y = 1; y < Y; y++) for (let x = 0; x < X; x++) {
  if (!has(x, y, z) || supported(x, y, z)) continue;
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => has(x + dx, y, z + dz) && supported(x + dx, y, z + dz))) continue;
  orphans.push([x, y, z]);
}
if (orphans.length) console.warn("unsupported blocks:", orphans.slice(0, 10));

const out = v.save(`${DIR}/NYC1034800.nbt`);
console.log(`NYC1034800.nbt: ${out.blocks} blocks, ${out.palette} palette entries, penthouse ${best ? "yes" : "no"}, ${pockets.length} windows`);
