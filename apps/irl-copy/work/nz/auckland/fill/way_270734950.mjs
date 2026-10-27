// Way 270734950, Auckland: a stripped-classical commercial block of the late 1920s-30s. Red brick on a basalt plinth,
// cream plaster string courses and a cornice, shopfronts at street level, and a corner tower on the lidar's NE tip
// (a 15-block shoulder around a 25-block core, about six storeys). The lidar roof is smoothed into tiers: 25 (core),
// 15 (shoulder), 10 (an attic on the east edge) and 8 (two storeys, most of the footprint). Each column is fill from
// y 0 to its ground, then walls up to its tier roof, so nothing floats. Outer cells are walls; inner cells are air with
// a floor slab per storey and a roof deck. Some windows get a glowstone in the air cell behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 25, H = 38, D = 39;                       // the footprint box: x 0..24, z 0..38
const cells = JSON.parse(readFileSync(`${DIR}/way_270734950.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r, R: 0 }]));
const at = (x, z) => cell.get(key(x, z));
const grow = (keys) => {                            // the given cells with their footprint neighbours
  const out = new Set();
  for (const k of keys) {
    const c = cell.get(k);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (at(c.x + dx, c.z + dz)) out.add(key(c.x + dx, c.z + dz));
  }
  return out;
};
const hi = (min) => [...cell.values()].filter((c) => c.r >= min).map((c) => key(c.x, c.z));

// Tiers smoothed from the lidar roof: the tower core, a one-cell shoulder around it, an attic on the east edge, the block
const core = grow(hi(20));
const shoulder = new Set([...grow(core), ...hi(12)].filter((k) => !core.has(k)));
for (const c of cell.values()) {
  const k = key(c.x, c.z);
  c.R = core.has(k) ? 25 : shoulder.has(k) ? 15 : c.r >= 9 ? 10 : 8;
  if (c.R <= c.g) c.R = c.g + 1;
}

const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];     // north, south, west, east
// the sides of a cell that show at height y: toward no footprint cell, or toward one whose roof is below y
const faces = (c, y) => NB.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.R <= y; });
const paneState = (dx) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// The entrance: a south-facing street cell near the middle of the front, at grade
const door = [...cell.values()]
  .filter((c) => c.g <= 2 && c.R > c.g + 2 && !at(c.x, c.z + 1))
  .sort((a, b) => a.g - b.g || Math.abs(a.x - 12) - Math.abs(b.x - 12))[0];
const DOOR = door && key(door.x, door.z);

const v = new Voxels([W, H, D]);
const windows = [];
for (const c of cell.values()) {
  const { x, z, g, R } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");          // fill up to the ground
  for (let y = g; y < R; y++) {
    const out = faces(c, y);
    if (!out.length) {                                                  // inside: air, a floor per storey, a roof deck
      if (y === g || y === R - 1 || (y % 4 === 0 && y > g)) v.set(x, y, z, "smooth_stone");
      continue;
    }
    if (DOOR === key(x, z) && y <= g + 1) {
      v.set(x, y, z, "dark_oak_door", { facing: "south", half: y === g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const [dx, dz] = out[0];
    const along = dz !== 0 ? x : z;                                     // position along the face it shows
    let spec;
    if (y === R - 1) spec = ["smooth_quartz"];                          // cornice
    else if (y === g) spec = ["polished_blackstone_bricks"];            // basalt base course
    else if (DOOR === key(x, z) && y === g + 2) spec = ["smooth_quartz"];   // door lintel
    else if (y % 4 === 0) spec = ["smooth_quartz"];                     // storey string course
    else if (y < 4) spec = y === 3 ? ["bricks"] : along % 3 === 0 ? ["smooth_quartz"] : ["glass"];   // shopfront
    else if (y % 4 === 3) spec = ["bricks"];                            // spandrel
    else spec = along % 3 === 1 ? ["glass_pane", paneState(dx)] : ["bricks"];   // window bay or brick pier
    v.set(x, y, z, ...spec);
    if (spec[0] === "glass" || spec[0] === "glass_pane") windows.push({ x, y, z, dx, dz });
  }
  if (faces(c, R - 1).length) v.set(x, R, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // coping
}

// Roof plant on the lower tiers' interior roof decks
for (const c of cell.values()) {
  if (c.R <= 15 && !faces(c, c.R - 1).length && (c.x * 3 + c.z * 7) % 13 === 0) v.set(c.x, c.R, c.z, "iron_block");
}

// Warm light: about a quarter of the glazed bays, the air cell behind the glass lit with glowstone
for (const { x, y, z, dx, dz } of windows) {
  if ((x * 5 + y * 3 + z) % 4 !== 0) continue;
  const bx = x - dx, bz = z - dz, b = at(bx, bz);
  if (!b || faces(b, y).length || v.get(bx, y, bz)) continue;
  v.set(bx, y, bz, "glowstone");
}

const { blocks, palette } = v.save(`${DIR}/way_270734950.nbt`);
console.log(`way_270734950: ${blocks} blocks, palette ${palette}, cells ${cell.size}, core ${core.size}, shoulder ${shoulder.size}`);
