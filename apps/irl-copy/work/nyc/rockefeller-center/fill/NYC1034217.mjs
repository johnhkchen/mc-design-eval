// 1140 Avenue of the Americas, 1931 commercial and office building: a 34 x 3 block sliver (about 38 m along the street,
// 3 m deep) rising 74 blocks (about 82 m, roughly 23 storeys) in three setback tiers. Lidar roofs are read as clean
// tiers, not followed cell by cell: 58 at the west end (x 0-4), 68 at x 5-11, 70 at x 12-14, and 74 for the main block
// (x 15-33). The lidar gap at (20, 2) is filled as the main roof. Lidar has no ground difference under it, so each cell
// stands on y 0 (a granite base course).
// Long faces are the street fronts (z 0 and z 2). Each 3-block storey has a calcite band (spandrel and slab) at its
// bottom, then two rows of glass set one block out from a floor slab line, with buff sandstone piers every 3 columns.
// The air gap at z 1 is the interior, with a smooth-stone floor slab in each band row; no interiors. The end walls and
// the walls where a tier steps down are solid party walls. The ground floor is a clear-glass shopfront with granite
// piers, a dark oak door at x 16, and a black awning over it. A bulkhead with a calcite cap sits on the main roof.
// Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034217.cells.json`, "utf8"));
const X = 34, Y = 78, Z = 3;

const inFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z && cells.some(([cx, cz]) => cx === x && cz === z);
// Smoothed lidar tiers (block heights above y 0), by x band.
const tierTop = (x) => (x <= 4 ? 58 : x <= 11 ? 68 : x <= 14 ? 70 : 74);
const top = (x, z) => (inFoot(x, z) ? tierTop(x) : 0);
const built = (x, y, z) => inFoot(x, z) && y < top(x, z);
// A party wall: an end of the sliver, or a face where the neighbour tier is lower at this height.
const isEnd = (x, y, z) => !built(x - 1, y, z) || !built(x + 1, y, z);
const outer = (z) => z === 0 || z === 2;
const ROW = (y) => y % 3;            // 0 = band (slab / spandrel), 1 and 2 = glass rows
const DOOR_X = 16;
const isDoor = (x, y, z) => z === 0 && x === DOOR_X && (y === 1 || y === 2);
const isPier = (x) => x % 3 === 0;
// Glass: a window cell on a street front, not a pier, end, door, or the cornice.
const glassAt = (x, y, z) =>
  built(x, y, z) && outer(z) && ROW(y) !== 0 && y < top(x, z) - 1 && !isPier(x) && !isEnd(x, y, z) && !isDoor(x, y, z);
const paneState = (x, y, z) => ({
  east: glassAt(x + 1, y, z) ? "true" : "false",
  west: glassAt(x - 1, y, z) ? "true" : "false",
  north: "false",
  south: "false",
  waterlogged: "false",
});
const lit = (x, y, z) => ROW(y) !== 0 && y >= 4 && glassAt(x, y, z) && (x * 5 + y * 3 + (z === 2 ? 4 : 0)) % 11 === 0;

const g = new Voxels([X, Y, Z]);

// 1. The shell: base course, storey bands, glass rows, piers, party walls, cornice, and the air gap behind the glass.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = top(x, z);
  if (!t) continue;
  for (let y = 0; y < t; y++) {
    const street = outer(z);
    // Base course, granite at the street, stone brick inside.
    if (y === 0) { g.set(x, y, z, street ? "polished_granite" : "stone_bricks"); continue; }
    // Cornice (the top block of each tier) and the storey bands, which are also the floor slabs inside.
    if (y === t - 1) { g.set(x, y, z, street ? "calcite" : "smooth_stone"); continue; }
    if (ROW(y) === 0) { g.set(x, y, z, street ? "calcite" : "smooth_stone"); continue; }
    // Party walls: ends of the sliver and steps down between tiers.
    if (isEnd(x, y, z)) { g.set(x, y, z, "smooth_sandstone"); continue; }
    // Interior: air behind the glass (the lit panes get a glowstone below).
    if (!street) continue;
    // Shopfront on the ground floor: granite piers, clear glass, the door at DOOR_X.
    if (y < 3) {
      if (isDoor(x, y, z)) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      g.set(x, y, z, isPier(x) ? "polished_granite" : "glass_pane", isPier(x) ? undefined : paneState(x, y, z));
      continue;
    }
    // Upper storeys: buff piers every 3 columns, and light blue glass in the bays.
    g.set(x, y, z, isPier(x) ? "smooth_sandstone" : "light_blue_stained_glass_pane", isPier(x) ? undefined : paneState(x, y, z));
  }
}

// 2. The entrance canopy: a black awning over the door, on the band that runs across the street front.
for (let x = DOOR_X - 2; x <= DOOR_X + 2; x++) g.set(x, 3, 0, "black_terracotta");

// 3. Warm lights: glowstone on the interior side of the lit panes, so the glass glows from the street.
for (let z = 0; z < Z; z += 2) for (let x = 0; x < X; x++) for (let y = 4; y < 74; y++) {
  if (lit(x, y, z)) g.set(x, y, 1, "glowstone");
}

// 4. Roof equipment: a bulkhead with a calcite cap on the main roof (x 22-26), standing on the cornice.
const mainTop = 74;
for (let x = 22; x <= 26; x++) for (let z = 0; z < Z; z++) {
  for (let y = mainTop; y < mainTop + 2; y++) g.set(x, y, z, "smooth_sandstone");
  g.set(x, mainTop + 2, z, "calcite");
}

g.save(`${DIR}/NYC1034217.nbt`);
console.log(`NYC1034217: ${g.count()} blocks, palette ${g.palette.length}`);
