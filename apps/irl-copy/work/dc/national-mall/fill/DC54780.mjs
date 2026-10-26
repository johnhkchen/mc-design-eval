// 1638 R St NW (Dupont Circle): a Store-Misc brick commercial block of the early 1900s. A stone-based shopfront on the
// street (north) face, three storeys of punched brick windows over a stone storey line each, and a stone cornice.
// Massing from the lidar roof (cells file): 6-block wings on the west and the south arm, an 8-block mid tier, and the
// 9-block core on the east side, with a small penthouse and a chimney on top. Roofs are quantised to those three tiers.
// Every column is solid from y 0 up to its roof, so nothing floats; the floor slabs (odd rows) are solid across the
// footprint, and the rows between them are an air gap behind each window, with glowstone in some of the gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC54780.cells.json`, "utf8"));

// lidar roof -> three flat tiers (noise smoothed: 5s and 6s are one wing tier, 7 is the step to 8)
const tier = (r) => (r <= 6 ? 6 : r >= 9 ? 9 : 8);
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, R: tier(r) });
const at = (x, z) => foot.get(`${x},${z}`);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
// the outward faces of a cell: the neighbours that are outside the footprint
const exteriorDirs = (x, z) => DIRS.filter(([dx, dz]) => !at(x + dx, z + dz));

const BASE = "polished_granite", BAND = "smooth_stone", BRICK = "bricks", CORNICE = "stone_bricks", CARVED = "chiseled_stone_bricks";
const PANE = "light_blue_stained_glass_pane", SHOP = "light_blue_stained_glass";   // light glass reads as windows from the street
const WINDOW_ROWS = [2, 4, 6];
// the shopfront on the north face: piers at the ends, glass either side of the door, and the door in the middle
const SHOP_DOOR = { x: 4, z: 0 };

const g = new Voxels([8, 21, 11]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const isWindowRow = (y, R) => WINDOW_ROWS.includes(y) && y < R - 2;

// a window is on a face: panes sit between brick piers one block apart; a corner is always a pier
const paneOn = (x, z, [dx, dz]) => (dz !== 0 ? x : z) % 2 === 1;
const paneState = ([dx, dz]) => (dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

const openings = [];   // window cells on a face, so the air gap behind each can be cut

for (const [key, { g: ground, R }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const ext = exteriorDirs(x, z);
  for (let y = 0; y < R; y++) {
    if (y < ground) { put(x, y, z, BASE); continue; }                    // foundation up to the lidar ground
    if (y <= 1) { put(x, y, z, BASE); continue; }                        // base course (plinth)
    if (y === R - 1) { put(x, y, z, CORNICE); continue; }                // cap: the roof edge
    if (y === R - 2) { put(x, y, z, (x + z) % 2 === 0 ? CARVED : CORNICE); continue; }   // dentil cornice
    if (y % 2 === 1) { put(x, y, z, BAND); continue; }                   // storey line: a solid floor slab
    if (isWindowRow(y, R) && ext.length === 1 && paneOn(x, z, ext[0])) {
      put(x, y, z, PANE, paneState(ext[0]));
      openings.push({ x, y, z, dir: ext[0] });
      continue;
    }
    put(x, y, z, BRICK);                                                 // pier, corner, or solid interior
  }
}

// shopfront: glass either side of the door, and the door itself (lower and upper half) on the north face
for (const x of [1, 2, 3, 5, 6]) {
  put(x, 2, 0, SHOP);
  openings.push({ x, y: 2, z: 0, dir: [0, -1] });
}
const { x: dx0, z: dz0 } = SHOP_DOOR;
put(dx0, 2, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx0, 3, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
// a pitched hood over the door, sloping down to the street
for (const x of [3, 4, 5]) put(x, 4, 0, "dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });

// the air gap behind each opening (the interior cell one step in), with glowstone in some of them
for (const { x, y, z, dir: [dx, dz] } of openings) {
  const ix = x - dx, iz = z - dz;
  const inner = at(ix, iz);
  if (!inner || !isWindowRow(y, inner.R) || exteriorDirs(ix, iz).length) continue;   // not behind this face, or a thin wall
  if (y % 2 === 0 && (x * 3 + z * 5 + y) % 4 === 0 && !(ix === dx0 && iz === dz0)) put(ix, y, iz, "glowstone");
  else put(ix, y, iz, "air");
}

// the penthouse on the core (a 2x2 set back from the front), and a chimney on the back of the core
for (const [x, z] of [[4, 4], [5, 4], [4, 5], [5, 5]]) {
  put(x, 9, z, BRICK); put(x, 10, z, BRICK);
  put(x, 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
put(2, 9, 10, BRICK); put(2, 10, 10, BRICK);
put(2, 11, 10, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

g.save(`${DIR}/DC54780.nbt`);
console.log("DC54780.nbt written");
