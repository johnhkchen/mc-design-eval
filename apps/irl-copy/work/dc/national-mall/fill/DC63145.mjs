import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1100 G St NW: a 1920s Classical limestone office, the kind the 1910 Height Act produced (130 ft cap, so
// 18 blocks ~ 43 m). Lidar roof, smoothed into four flat tiers: a 3-high SW wing, a 15-high base (the street
// front is z 0), a 16-high setback ring, and the 9x9 tower core at 18. Storeys are two blocks: a glass band over a
// calcite spandrel. The front has seven window rows (ground + six), the tower adds one more, a copper cap on top.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63145.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63145.nbt";

const GLASS = "light_blue_stained_glass", STONE = "calcite", PLINTH = "polished_granite", FLOOR = "smooth_stone";
const ROOF = { 3: "stone_bricks", 15: "chiseled_stone_bricks", 16: "stone_bricks", 18: "oxidized_cut_copper" };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

// lidar roof -> flat tier. The 16/17 noise on the ring is one setback; the street row and east column stay at the base.
function tierOf(x, z, roof) {
  if (roof <= 4) return 3;                       // low SW wing
  if (roof >= 18) return 18;                     // tower core, 9x9
  if (roof >= 16 && x < 11 && z > 0) return 16;  // setback ring
  return 15;                                     // base
}
const TOP = new Map(), GROUND = new Map();
for (const [x, z, ground, roof] of cells) { TOP.set(key(x, z), tierOf(x, z, roof)); GROUND.set(key(x, z), ground); }
const top = (x, z) => TOP.get(key(x, z)) ?? -1;  // -1: outside the footprint, so every face there is exposed

// a face is exposed at height y when the neighbour beside it is lower than y (or outside the footprint)
const exposed = (x, z, y) => DIRS.some(([dx, dz]) => y >= top(x + dx, z + dz));

// what a cell is at height y: foundation, plinth or floor, roof, wall (the shell), a floor slab, air, or nothing.
// The shell is one block thick, so the air behind a window is the cell inside it; floors sit on even rows to 14,
// and the tower's own storey (16) is open between a floor at 15 and its roof at 17.
function kindOf(x, z, y) {
  const T = top(x, z), G = GROUND.get(key(x, z));
  if (y < G) return "foundation";
  if (y >= T) return "none";
  if (y === 0) return exposed(x, z, y) ? "plinth" : "floor";
  if (y === T - 1) return "roof";
  if (exposed(x, z, y)) return "wall";
  if (y % 2 === 0 && y <= 14) return "floor";
  if (T === 18 && y === 15) return "floor";
  return "air";
}

// the shell: calcite spandrels on even rows, glass on odd rows (and the tower's row 16); piers every third bay
function wallOf(x, z, y, T) {
  const windowRow = y % 2 === 1 || (T === 18 && y === 16);
  if (!windowRow || T === 3) return STONE;      // the SW wing is solid stone, no glass without a room behind it
  if (z === 0) return [0, 3, 8, 11].includes(x) ? STONE : GLASS;   // the street front: piers at the ends and 3, 8
  const ew = top(x - 1, z) <= y || top(x + 1, z) <= y;             // on an east/west face the bays run along z
  return (ew ? z : x) % 3 === 0 ? STONE : GLASS;
}

function blockOf(x, z, y) {
  switch (kindOf(x, z, y)) {
    case "foundation": case "plinth": return PLINTH;
    case "floor": return FLOOR;
    case "roof": return ROOF[top(x, z)];
    case "wall": return wallOf(x, z, y, top(x, z));
    default: return null;                       // air and nothing are left out of the file
  }
}

const g = new Voxels([12, 30, 16]);
for (const [x, z] of cells.map(([x, z]) => [x, z]))
  for (let y = 0; y < top(x, z); y++) { const b = blockOf(x, z, y); if (b) g.set(x, y, z, b); }

// the street entrance: a pair of dark oak doors (hinged to the outside) under a copper canopy
const door = (hinge, half) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
for (const [x, hinge] of [[5, "left"], [6, "right"]]) {
  g.set(x, 1, 0, "dark_oak_door", door(hinge, "lower"));
  g.set(x, 2, 0, "dark_oak_door", door(hinge, "upper"));
}
for (let x = 4; x <= 7; x++) g.set(x, 3, 0, "oxidized_cut_copper");

// warm light behind some windows: a lantern on the floor, or a glowstone where there is no floor to stand on
let warm = 0;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = top(x, z);
  for (let y = 1; y < T - 1; y++) {
    if (blockOf(x, z, y) !== GLASS || (x * 7 + y * 3 + z * 5) % 9 !== 0) continue;
    const inward = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([ax, az]) => kindOf(ax, az, y) === "air");
    if (!inward) continue;
    const [ax, az] = inward;
    if (kindOf(ax, az, y - 1) === "floor") g.set(ax, y, az, "lantern", { hanging: "false" });
    else g.set(ax, y, az, "glowstone");
    warm++;
  }
}

// roof plant on the south base roof, and lanterns on the tower's corners
for (const x of [3, 4, 8, 9]) for (const y of [15, 16]) g.set(x, y, 12, "light_gray_concrete");
for (const [x, z] of [[1, 2], [9, 2], [1, 10], [9, 10]]) g.set(x, 18, z, "lantern", { hanging: "false" });

const stats = g.save(OUT);
console.log(`DC63145: ${stats.blocks} blocks, palette ${stats.palette}, warm lights ${warm}`);
