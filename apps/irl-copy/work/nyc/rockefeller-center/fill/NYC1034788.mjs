// 43 West 54th Street, 1915: a mixed residential and commercial walk-up in Midtown, 5 x 22 cells.
// Street front is the high-z end (the building is on the north side of 54th, so it faces south); z 0 is the rear.
// Massing: lidar roofs snapped to 3-block storeys, light-well zeros and single-cell noise filled from neighbours.
// Materials: granite base course, red brick walls, white terracotta storey bands, stone-brick cornice, stone quoins.
// Interior is air behind the glazing with a floor slab per storey (no rooms); a few windows carry warm light.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034788.cells.json`, "utf8"));   // [x, z, ground, roof]

// Roof height above y 0 per footprint cell, [z][x]: z 0 rear .. 21 street front, x 0..4.
const TIER = [
  [3, 6, 6, 6, 9],     // z0  rear, one-storey service end
  [3, 6, 6, 6, 9],     // z1
  [15, 15, 15, 15, 9], // z2  five storeys; east edge steps down
  [15, 15, 15, 15, 15],
  [15, 15, 15, 15, 15],
  [15, 15, 15, 15, 12],// z5  east setback
  [15, 15, 15, 15, 21], [15, 15, 15, 15, 21], [15, 15, 15, 15, 21], [15, 15, 15, 15, 21],
  [15, 15, 15, 15, 21], [15, 15, 15, 15, 21], [15, 15, 15, 15, 21],   // z6..12 east tower wing
  [21, 15, 15, 15, 21], [21, 15, 15, 15, 21], [21, 15, 15, 15, 21], [21, 15, 15, 15, 21], // z13..21 seven-storey corners
  [21, 15, 15, 15, 21], [21, 15, 15, 15, 21], [21, 15, 15, 15, 21], [21, 15, 15, 15, 21], [21, 15, 15, 15, 21],
];

// Lidar check: where the tier differs from the raw roof by more than 3 blocks, the cell was smoothed on purpose.
const smoothed = cells.filter(([x, z, , roof]) => Math.abs(TIER[z][x] - roof) > 3).map(([x, z, , roof]) => `${x},${z}:${roof}->${TIER[z][x]}`);
console.log(`smoothed cells: ${smoothed.length} ${smoothed.join(" ")}`);

const g = new Voxels([5, 33, 22]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const perimeter = (x, z) => x === 0 || x === 4 || z === 0 || z === 21;
const corner = (x, z) => (x === 0 || x === 4) && (z === 0 || z === 21);
// Window columns: the street and rear faces at x 1 and 3, the side faces on even z (piers on odd z).
const windowAt = (x, z) => {
  if (corner(x, z) || !perimeter(x, z)) return false;
  if (z === 0 || z === 21) return x === 1 || x === 3;
  return z % 2 === 0;
};
// Glass connects to the solid piers beside it: side panes run along z, street and rear panes along x.
const paneState = (x, z) => (z === 0 || z === 21
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
// The cell just inside a perimeter cell, where a window's light sits.
const inside = (x, z) => [x === 0 ? 1 : x === 4 ? 3 : x, z === 0 ? 1 : z === 21 ? 20 : z];

for (const [x, z, ground] of cells) {
  const top = TIER[z][x];
  const n = (top - ground) / 3;                       // storeys, each 3 blocks
  const edge = perimeter(x, z);
  for (let s = 0; s < n; s++) {
    const b = ground + 3 * s;                         // this storey's floor line (band or slab)
    const last = s === n - 1;
    if (!edge) {                                      // interior: air behind the glass, a slab per storey, a roof on top
      put(x, b, z, "smooth_stone");
      if (last) put(x, top - 1, z, "smooth_stone");
      continue;
    }
    // Perimeter: base course, storey bands, glazed or brick rows, then the cornice course on the top row.
    put(x, b, z, s === 0 ? "polished_granite" : "white_terracotta");
    for (const r of [b + 1, b + 2]) {
      if (last && r === b + 2) { put(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
      if (corner(x, z)) { put(x, r, z, "stone_bricks"); continue; }
      if (windowAt(x, z)) { put(x, r, z, "glass_pane", paneState(x, z)); continue; }
      put(x, r, z, "bricks");
    }
    // Entrance on the street front, centre bay: a dark oak door, a stone lintel and a hanging lantern inside.
    if (z === 21 && x === 2 && s === 0) {
      put(2, 0, 21, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(2, 1, 21, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(2, 2, 21, "polished_granite");
      put(2, 2, 20, "lantern", { hanging: "true", waterlogged: "false" });
    }
    // Warm light behind some windows: the shops at street level always, upper floors one window in several.
    if (windowAt(x, z) && !(z === 21 && x === 2)) {
      const [ix, iz] = inside(x, z);
      const shop = z === 21 && s === 0;
      const lit = shop || (x + z + s) % 4 === 0;
      const warm = (x + 2 * z + s) % 5 === 2 ? "shroomlight" : "glowstone";
      if (lit && TIER[iz][ix] > b && g.inBounds(ix, b + 1, iz)) put(ix, b + 1, iz, warm);
    }
  }
}

// Roof equipment: a stair and elevator bulkhead on the 15-tier roof, set back from the street front.
for (const x of [1, 2]) for (const z of [8, 9]) {
  put(x, 15, z, "stone_bricks"); put(x, 16, z, "stone_bricks"); put(x, 17, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const info = g.save(`${DIR}/NYC1034788.nbt`);
console.log(`saved NYC1034788.nbt: ${info.blocks} blocks, ${info.palette} palette entries`);
