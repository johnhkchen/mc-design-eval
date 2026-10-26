// 2000 Florida Ave NW: a 1970s precast-concrete office block on a granite base, stepped from a 13-block tower
// down through a 10-block podium to a 9-block wing and single-block terraces. Storeys are three blocks each: a
// floor band and two window rows. Shell only: one-block facade ring, an air gap behind it, floor bands on every
// storey, and a column grid so no floor hangs in the air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68768.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

// The lidar roof snapped to four masses: the tower (12+), its podium (10-11), the low wing (9), and the
// single-block terraces at the north-east corner (1). Snapping removes the per-cell noise into flat tiers.
const tierOf = (r) => (r <= 1 ? 1 : r >= 12 ? 13 : r >= 10 ? 10 : 9);
const key = (x, z) => `${x},${z}`;
const plan = new Map();
for (const [x, z, , roof] of cells) plan.set(key(x, z), { t: tierOf(roof) });
const tierAt = (x, z) => plan.get(key(x, z))?.t ?? 0;   // 0 = outside the footprint

// a side is open at height y when the cell beside it is outside the footprint or stands lower than y
const open = (x, z, y, dx, dz) => tierAt(x + dx, z + dz) <= y;
const exposed = (x, z, y) => open(x, z, y, 1, 0) || open(x, z, y, -1, 0) || open(x, z, y, 0, 1) || open(x, z, y, 0, -1);
const runsAlongZ = (x, z, y) => open(x, z, y, 1, 0) || open(x, z, y, -1, 0);   // east/west faces: index by z

// rows within a tier: 0 foundation, 1 base course, 2-3 shopfront, then per storey a floor band + two window rows
const FLOOR_ROWS = new Set([4, 7, 9, 10]);   // storey lines (floor slabs; 9 and 10 carry the setback above the podium)

// the column grid that holds the interior floor slabs up (every 4 blocks, clear of the facade ring)
const onGrid = (x, z) => x % 4 === 2 && z % 4 === 2;

function skin(x, z, y, t) {
  const top = y === t - 1;
  if (y === 0) return "stone_bricks";                                  // foundation, the whole footprint
  if (y === 1) return exposed(x, z, y) ? "polished_andesite" : "light_gray_concrete";   // base course, grey not pink granite
  if (!exposed(x, z, y)) {                                            // interior: floor slabs, roof deck, columns, air gap
    if (top) return "gray_concrete";
    if (FLOOR_ROWS.has(y)) return "light_gray_concrete";
    if (onGrid(x, z) && y >= 2 && y <= t - 2) return "light_gray_concrete";
    return null;
  }
  if (top || FLOOR_ROWS.has(y)) return "smooth_quartz";               // cornice and storey bands
  const along = runsAlongZ(x, z, y) ? z : x;                           // mullion index along the face
  const mullion = along % 3 === 0;
  if (y <= 3) return mullion ? "polished_andesite" : "glass";          // shopfront
  if (mullion) return "white_concrete";                                // window frames
  return along % 7 === 3 && y === 5 ? "glowstone" : "light_blue_stained_glass_pane";   // a few lit bays on the first office storey
}

const g = new Voxels([16, 25, 20]);
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const { t } = plan.get(key(x, z));
  for (let y = 0; y < t; y++) {
    const b = skin(x, z, y, t);
    if (b) g.set(x, y, z, b);
  }
}

// entrance on the Florida Ave diagonal: double door under a dark lintel, lanterns either side, one lantern in the lobby
const DOOR = [7, 6];
for (const [y, half] of [[2, "lower"], [3, "upper"]]) {
  g.set(DOOR[0], y, DOOR[1], "dark_oak_door", { facing: "west", half, hinge: "left", open: "false", powered: "false" });
}
for (const [x, z] of [[8, 5], [6, 7]]) g.set(x, 2, z, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (Math.abs(x - DOOR[0]) + Math.abs(z - DOOR[1]) <= 2 && exposed(x, z, 4)) g.set(x, 4, z, "polished_blackstone_bricks");
}
g.set(8, 3, 6, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant on the tower and a planter on the podium terrace
for (const [x, z] of [[6, 11], [7, 11], [6, 12], [7, 12]]) g.set(x, 13, z, "iron_block");
g.set(10, 13, 15, "iron_block");
g.set(13, 10, 11, "flowering_azalea");

// panes join their neighbours so the facade reads as one glazed run
const dirs = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const panes = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (let y = 0; y < plan.get(key(x, z)).t; y++) {
    if (g.get(x, y, z)?.block === "minecraft:light_blue_stained_glass_pane") panes.push([x, y, z]);
  }
}
for (const [x, y, z] of panes) {
  const state = Object.fromEntries(Object.entries(dirs).map(([d, [dx, dz]]) => [d, g.get(x + dx, y, z + dz) ? "true" : "false"]));
  g.set(x, y, z, "light_blue_stained_glass_pane", state);
}

const out = g.save(`${DIR}/DC68768.nbt`);
console.log(`DC68768.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
