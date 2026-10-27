// Way 906100281, Mt Eden view: a 1980s concrete-frame office block, 14 storeys on a 4-block-storey grid, with a
// stepped slab (the lidar's 35/24/10 steps) on a stone plinth beside a 2-wide tower and a two-storey lobby wing.
// Each cell is a column from its ground up to its roof; a face is glazed where no neighbour rises to meet it,
// and the cells the neighbours enclose are sealed air with floor slabs, so every storey stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_906100281.cells.json`, "utf8"));

// Roof snapped to its own storey lines (4 blocks) so every tier is flat: 56 on ground 1 becomes 57.
const M = new Map();
for (const [x, z, g, r] of cells) {
  const R = g + Math.max(4, 4 * Math.round((r - g) / 4));
  M.set(`${x},${z}`, { x, z, g, R });
}
const cellAt = (x, z) => M.get(`${x},${z}`);

const FACES = [["E", 1, 0], ["W", -1, 0], ["S", 0, 1], ["N", 0, -1]];
// the faces where no neighbour is there to meet the wall at this height (a neighbour rising past y closes it)
function exposed(c, y) {
  return FACES.filter(([, dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return !n || y >= n.R; });
}

// the front door: the south face of the lobby wing at ground level, lit by a lantern under the lintel
const DOOR = { x: 22, z: 25 };

// one cell's block at height y: [name, state] or null for sealed air
function place(c, y) {
  const { x, z, g, R } = c;
  if (y < g) return ["stone_bricks"];                       // foundation fill from y 0 up to the ground
  if (y === R - 1) return ["light_gray_concrete"];           // roof deck and parapet
  const ex = exposed(c, y), rel = y - g, k = Math.floor(rel / 4);
  if (ex.length && y === R - 2) return ["polished_andesite"]; // cornice
  if (rel === 0) return ex.length ? ["polished_andesite"] : ["light_gray_concrete"]; // base course / floor slab
  if (rel % 4 === 0) return ["light_gray_concrete"];        // floor slab per storey
  if (!ex.length) return null;                              // sealed void between neighbours' walls
  if (rel % 4 === 3) return ["stone"];                      // spandrel under each window band
  // window band: a pier every third cell along each exposed face, glass between
  const along = ex.map(([f]) => (f === "E" || f === "W" ? z : x));
  if (along.some((a) => a % 3 === 0)) return ["light_gray_concrete"];
  if (k === 0) return ["glass"];                            // clear shopfront glazing at street level
  if ((x * 5 + z * 7 + y) % 17 === 0) return ["glowstone"]; // a lit room behind the glass
  const bay = Math.floor(along[0] / 3);
  return [(bay + k) % 3 === 0 ? "gray_stained_glass" : "light_blue_stained_glass"];
}

const g = new Voxels([24, 69, 27]);
for (const c of M.values()) {
  for (let y = 0; y < c.R; y++) {
    const b = place(c, y);
    if (b) g.set(c.x, y, c.z, b[0]);
  }
}

// entrance: a double door on the lobby's south face, a lit lantern hanging under the lintel
const dc = cellAt(DOOR.x, DOOR.z);
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, dc.g, DOOR.z, "oak_door", doorState("lower"));
g.set(DOOR.x, dc.g + 1, DOOR.z, "oak_door", doorState("upper"));
g.set(DOOR.x, dc.g + 2, DOOR.z, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: two concrete plant boxes on the tower top and an aviation light on its north-west corner
const tower = cellAt(20, 19).R;
g.set(20, tower, 20, "light_gray_concrete");
g.set(20, tower + 1, 20, "light_gray_concrete");
g.set(21, tower, 22, "light_gray_concrete");
g.set(21, tower + 1, 22, "light_gray_concrete");
g.set(20, tower, 19, "redstone_lamp");

const out = `${DIR}/way_906100281.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ out, ...stats, roofs: [...new Set([...M.values()].map((c) => c.R))].sort((a, b) => a - b) }));
