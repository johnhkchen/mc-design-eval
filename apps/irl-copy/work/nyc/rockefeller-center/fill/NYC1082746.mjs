// Swiss Bank Towers, 611 Fifth Avenue (NYC landmark, 1924): a limestone Beaux-Arts setback tower on a granite base,
// with a lower shoulder on its north and south ends and a lower annex to the south. Massing follows the lidar roof
// (median-smoothed, snapped to 3-block storeys); every storey has a floor belt, the outer skin is windows between
// calcite piers, and the interior is air behind the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1082746.cells.json`, "utf8"));
const [W, H, D] = [28, 167, 55];
const kk = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [kk(x, z), { g, r }]));
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];          // west, east, north (low z), south

// Building top per cell: lidar roof, median of the 3x3 nonzero neighbours, snapped to whole storeys.
// A cell whose roof is 0 and whose neighbours are mostly 0 is an open court: it stops at its ground.
const top = new Map();
for (const [key, { g, r }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = raw.get(kk(x + dx, z + dz)); if (c) near.push(c.r); }
  if (r === 0 && near.filter((v) => v === 0).length >= 5) { top.set(key, g); continue; }
  const nz = near.filter((v) => v > 0).sort((a, b) => a - b);
  const med = nz.length ? nz[nz.length >> 1] : 0;
  top.set(key, Math.max(g + 3, 3 * Math.round(med / 3)));
}
const topAt = (x, z) => top.get(kk(x, z)) ?? 0;

const v = new Voxels([W, H, D]);
const lanternSpots = [];

for (const [key, { g }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const T = top.get(key);
  if (T <= g) { for (let y = 0; y < g; y++) v.set(x, y, z, "stone"); continue; }   // court: foundation only
  for (let y = 0; y < T; y++) {
    if (y < g) { v.set(x, y, z, "stone"); continue; }                              // foundation to the lowest ground under it
    const out = DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);             // faces that look onto air here
    const ex = out.length > 0;
    const face = out.find(([dx]) => dx !== 0) ?? out[0];                          // west/east faces run along z
    const along = face && face[0] !== 0 ? z : x;
    let block = null;
    if (y === T - 1) block = ex ? "smooth_quartz" : "stone_bricks";                // cornice on the skin, roof on the inside
    else if (y === T - 2 && !ex) block = "stone_bricks";                           // roof deck under the cornice
    else if (y === g) block = "polished_granite";                                  // base course
    else if (y % 3 === 0) block = ex ? "smooth_quartz" : "stone";                  // storey belt and floor slab
    else if (ex) block = along % 3 === 0 ? (y < 3 ? "polished_granite" : "calcite") : "light_blue_stained_glass";
    if (block) v.set(x, y, z, block);
    // Warm light in a few windows: a hanging lantern in the air just inside the top row of a window.
    if (ex && block === "light_blue_stained_glass" && y % 3 === 2 && y < T - 2 && (along + Math.floor(y / 3) * 5) % 7 === 0) {
      const [dx, dz] = face;
      lanternSpots.push([x - dx, y, z - dz]);
    }
  }
}

// Lanterns hang from the floor slab above, only where the inside cell is air.
for (const [x, y, z] of lanternSpots) {
  if (v.get(x, y, z) === null && v.get(x, y + 1, z) !== null) v.set(x, y, z, "lantern", { hanging: "true" });
}

// Main entrance on the west (avenue) face: iron doors in the shopfront bay, a stone lintel over them.
{
  const { g } = raw.get(kk(3, 11));
  v.set(3, g, 11, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(3, g + 1, 11, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  v.set(3, g + 2, 11, "smooth_quartz");
}

// Roof plant: two boxes on the north shoulder (roof 141).
for (let x = 9; x <= 11; x++) for (let z = 8; z <= 9; z++) for (let y = 141; y <= 143; y++) v.set(x, y, z, "stone_bricks");

// Crown on the 156 tower: a shell with a deck, and a small calcite lantern tower on it.
for (let x = 12; x <= 18; x++) for (let z = 21; z <= 33; z++) {
  v.set(x, 156, z, "smooth_quartz");
  v.set(x, 159, z, "stone_bricks");
  if (x === 12 || x === 18 || z === 21 || z === 33) for (const y of [157, 158]) v.set(x, y, z, (x + z) % 3 === 0 ? "calcite" : "light_blue_stained_glass");
}
for (let x = 14; x <= 16; x++) for (let z = 26; z <= 28; z++) {
  v.set(x, 160, z, "calcite"); v.set(x, 161, z, "calcite"); v.set(x, 162, z, "smooth_quartz");
}
v.set(15, 163, 27, "lantern", { hanging: "false" });

const stats = v.save(`${DIR}/NYC1082746.nbt`);
console.log(JSON.stringify({ ...stats, lanterns: lanternSpots.length }));
