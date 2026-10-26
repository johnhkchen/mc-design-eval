// FR245190028: a residential block of 1850 on the 32 x 18 U of the cells (its open side faces east). Seven storeys of
// cream limestone (smooth sandstone, cut-sandstone string courses at every storey line, a rusticated stone-brick
// ground floor), tall windows on the piano nobile behind iron balcony grilles, a slate mansard storey with windows
// set in it, a stair eave on each roof edge, a few chimney stacks, one carriage door on the north front, and warm
// glowstone behind some windows. Lower wings and the setbacks at the edges step down in whole storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245190028.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245190028.nbt";

const STONE = "smooth_sandstone", LINE = "cut_sandstone", BASE = "stone_bricks", SLATE = "deepslate_tiles", SLATE_EAVE = "deepslate_tile_stairs";
const GLASS = "light_blue_stained_glass_pane", RAIL = "iron_bars", LIGHT = "glowstone", FLOOR = "smooth_sandstone";
const CHIMNEY = "bricks", CHIMNEY_TOP = "brick_slab";

// the lidar's roof per cell, stepped to whole storeys (5 blocks) so every tier is flat: 33+ is the 7th storey's cap at 35
const topOf = (r) => (r >= 33 ? 35 : r >= 28 ? 30 : r >= 23 ? 25 : 20);
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, top: topOf(roof) }]));
const at = (x, z) => fp.get(`${x},${z}`);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
// a face is shell where there is no neighbour, or the neighbour's top is lower (a setback's vertical face)
const exposed = (x, z) => { const { top: T } = at(x, z); return DIRS.filter(([, dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top < T; }); };

const vox = new Voxels([32, 51, 18]);
const pane = (dx, dz) => (dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const glowAt = [];                                         // interior cells behind a window, lit
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { ground: gr, top: T } = at(x, z);
  const ex = exposed(x, z);
  for (let y = 0; y < gr; y++) vox.set(x, y, z, BASE);      // foundation under the cell's own ground

  if (!ex.length) {
    // interior: a floor slab per storey (and on the ground), air between, no rooms
    for (let y = gr; y < T; y++) if (y === gr || (y % 5 === 0 && y > 0)) vox.set(x, y, z, FLOOR);
    vox.set(x, T, z, SLATE);
    continue;
  }

  const [face, dx, dz] = ex[0];
  const t = dx !== 0 ? z : x;                              // position along the face
  const corner = ex.length > 1;                            // quoins, no windows
  const winCol = !corner && (t % 4 === 1 || t % 4 === 2);  // two-block windows, two-block piers
  for (let y = gr; y < T; y++) {
    const s = Math.floor(y / 5), rel = y % 5;              // storey index (0 = ground) and row within it
    if (y === gr) { vox.set(x, y, z, BASE); continue; }    // base course
    if (rel === 0) { vox.set(x, y, z, LINE); continue; }   // storey line
    const winRows = s === 0 ? [2, 3] : [1, 2, 3];
    if (winCol && rel === 4) { vox.set(x, y, z, LINE); continue; }   // lintel
    if (winCol && winRows.includes(rel)) {
      if (s === 1 && rel === 1) vox.set(x, y, z, RAIL, pane(dx, dz)); // piano nobile balcony grille
      else vox.set(x, y, z, GLASS, pane(dx, dz));
      continue;
    }
    if (corner) { vox.set(x, y, z, LINE); continue; }
    vox.set(x, y, z, s === 0 ? BASE : s === 6 ? SLATE : STONE);      // rustic ground, cream limestone, slate mansard
  }
  // a stair eave on the outside edge, flat slate inside it
  vox.set(x, T, z, SLATE_EAVE, { facing: face, half: "bottom", shape: "straight", waterlogged: "false" });

  // a warm light behind some windows: on the floor of the room inside, one block in from the glass
  if (!corner && winCol && (x * 3 + z * 5) % 4 === 0) {
    for (let s = 1; s <= 6; s++) {
      const yL = 5 * s + 1;
      if (yL >= T - 1) break;
      const ix = x - dx, iz = z - dz, inner = at(ix, iz);
      if (inner && inner.top >= yL && !exposed(ix, iz).length) glowAt.push([ix, yL, iz]);
    }
  }
}

for (const [x, y, z] of glowAt) vox.set(x, y, z, LIGHT);

// the carriage door on the north front (its lintel is the storey line over it)
const door = at(10, 0);
if (door && exposed(10, 0).some(([f]) => f === "north")) {
  const y0 = door.ground + 1;
  vox.set(10, y0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(10, y0 + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// chimney stacks on a few interior tiles of the top storey's roof
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = at(x, z);
  if (c.top !== 35 || exposed(x, z).length || (x * 7 + z * 3) % 37 !== 0) continue;
  vox.set(x, 36, z, CHIMNEY); vox.set(x, 37, z, CHIMNEY);
  vox.set(x, 38, z, CHIMNEY_TOP, { type: "bottom", waterlogged: "false" });
}

const stats = vox.save(OUT);
console.log(JSON.stringify(stats));
