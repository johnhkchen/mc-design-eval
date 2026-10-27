// Tiroroa Residences: a 1960s-70s concrete-frame apartment block on Mt Eden's flank, three storeys over a tower
// base. The lidar roof heights are smoothed into three flat tiers: 11+ is the 3-storey tower (top 12, parapet 13),
// 8-10 the 2-storey wings and terraces, 1-3 a single-storey annex. Each storey is 4 blocks: a band (floor slab) in
// the bottom row, a spandrel, two rows of glass in frames of piers, so the walls read as a concrete grid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269676747.cells.json", "utf8"));

const X = 19, Y = 25, Z = 31;
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const FLOOR_ROWS = [3, 7];                  // floor slabs under storeys 2 and 3 (rows 0-2, 4-6, 8-10 are air)
const WINDOW_ROWS = [1, 2, 5, 6, 9, 10];    // the glass rows of each storey
const STONE = "stone_bricks", WALL = "white_concrete", BAND = "light_gray_concrete", PIER = "gray_concrete", ROOF = "smooth_stone";

// footprint cells with their tier top T (roof 0 is nothing)
const at = new Map();
for (const [x, z, g, r] of cells) {
  const T = r >= 11 ? 12 : r >= 8 ? 8 : r >= 1 ? 4 : 0;
  if (T) at.set(`${x},${z}`, { x, z, g, T });
}
const cell = (x, z) => at.get(`${x},${z}`) ?? null;
// the sides that show at row y: a neighbour outside the footprint, or one whose roof is below y
const exposed = (c, y) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; const n = cell(c.x + dx, c.z + dz); return !n || n.T <= y; });
const slabRow = (c, y) => y === c.T - 1 || (FLOOR_ROWS.includes(y) && y < c.T - 1);
// inside the shell (air behind the glass): nothing exposed, not a slab
const hollow = (c, y) => y >= c.g && y < c.T && !slabRow(c, y) && exposed(c, y).length === 0;
const isWindow = (c, y) => WINDOW_ROWS.includes(y) && y > c.g;
const pane = (dir) => (dir === "north" || dir === "south"
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { east: "false", west: "false", north: "true", south: "true" });

const v = new Voxels([X, Y, Z]);
const list = [...at.values()];

for (const c of list) {
  for (let y = 0; y < c.g; y++) v.set(c.x, y, c.z, STONE);                      // plinth under the lower ground
  for (let y = c.g; y < c.T; y++) {
    const ex = exposed(c, y);
    if (!ex.length) { if (slabRow(c, y)) v.set(c.x, y, c.z, ROOF); continue; }   // floors and roof, air otherwise
    if (slabRow(c, y)) { v.set(c.x, y, c.z, BAND); continue; }                  // storey lines and roof edge
    const dir = ex[0];
    const along = dir === "north" || dir === "south" ? c.x : c.z;
    if (ex.length > 1 || along % 3 === 0) { v.set(c.x, y, c.z, PIER); continue; } // corners and piers: the frame
    if (y === c.g && y < 3) { v.set(c.x, y, c.z, STONE); continue; }            // base course
    if (isWindow(c, y) && along % 3 === 1) {                                    // one glass bay in three; the rest is concrete
      v.set(c.x, y, c.z, "glass_pane", pane(dir));
      const [dx, dz] = DIRS[dir], inner = cell(c.x - dx, c.z - dz);
      if (inner && hollow(inner, y) && (c.x * 3 + c.z * 5 + y) % 4 === 0) v.set(inner.x, y, inner.z, "glowstone");
    } else v.set(c.x, y, c.z, WALL);
  }
}

// parapet or coping on the outer edge, one block above the roof
for (const c of list) {
  if (Object.values(DIRS).some(([dx, dz]) => !cell(c.x + dx, c.z + dz))) v.set(c.x, c.T, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// north entrance on the street side (ground 0): double door, a light lintel, and a hanging lantern in the lobby
v.set(9, 0, 1, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(9, 1, 1, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
v.set(9, 2, 1, BAND);
v.set(9, 2, 2, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant room on the tower: 3 x 3 cells of core roof, three courses high under a cap
for (let x = 9; x <= 11; x++) for (let z = 15; z <= 17; z++) {
  const c = cell(x, z);
  if (!c || c.T !== 12 || exposed(c, 11).length) continue;
  for (let y = 12; y <= 14; y++) v.set(x, y, z, BAND);
  v.set(x, 15, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269676747.nbt");
console.log(`way_269676747: ${list.length} footprint cells, ${v.count()} blocks, ${v.palette.length - 1} block states`);
