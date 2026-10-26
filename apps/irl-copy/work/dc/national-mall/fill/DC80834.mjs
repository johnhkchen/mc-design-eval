// 1712 16th St NW: a four-storey red-brick apartment block with limestone trim (c. 1920s DC walk-up with a lift),
// on a 12 x 9 footprint. The lidar roof is smoothed to three flat tiers (top heights 11, 12, 13) by a 5x5 mean, so a
// stepped core rises over the main roof. Every column is solid from y 0 to its top: the perimeter is
// a facade (glass in piers of brick, calcite quoins and string courses), the interior is air with a floor slab on the
// storey rows, so nothing floats and the glass has air behind it. Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80834.cells.json`, "utf8"));

const W = 12, D = 9, H = 25;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const roofRaw = new Map();
for (const [x, z, , roof] of cells) roofRaw.set(key(x, z), roof);
const inside = (x, z) => roofRaw.has(key(x, z));

// ---- massing: the lidar roof is noisy (11..13 cell to cell), so a 5x5 mean smooths it into three flat tiers:
// main (top height 11), middle (12) and a core (13) that rises over the main roof. The top block index = height - 1.
const topIdx = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (inside(x + dx, z + dz)) near.push(roofRaw.get(key(x + dx, z + dz)));
  }
  const m = near.reduce((a, b) => a + b, 0) / near.length;
  const height = m >= 12 ? 13 : m >= 11.6 ? 12 : 11;
  topIdx.set(key(x, z), height - 1);
}
// no single-cell stubs: a cell taller than every footprint neighbour drops to the tallest of them
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => topIdx.has(key(x + dx, z + dz)))
    .map(([dx, dz]) => topIdx.get(key(x + dx, z + dz)));
  if (nb.length && topIdx.get(key(x, z)) > Math.max(...nb)) topIdx.set(key(x, z), Math.max(...nb));
}
const T = (x, z) => topIdx.get(key(x, z));

// ---- the storey rows (the y of each block row), shared by every face ----
const FLOORS = [4, 7, 10];            // floor slabs inside; calcite string courses on the facade
const BANDS = [4, 7, 10];
const WIN_ROWS = [2, 5, 6, 8, 9];     // ground storey glazing, then two storeys of two-high windows
const ATTIC_ROW = 11;                 // a one-high attic band of windows where the core rises to 12

const WALL = "bricks";
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
const isFront = (z) => z === 0;       // the street face: shopfront glazing and the entrance
// bays: on the long faces windows at x 1,2 4,5 7,8 10 with brick piers between; on the short faces z 1,2 4,5 7
const bayWindow = (x, z) => {
  if (isCorner(x, z)) return false;
  if (z === 0 || z === D - 1) return [1, 2, 4, 5, 7, 8, 10].includes(x);
  return [1, 2, 4, 5, 7].includes(z);
};
const DOOR_X = 5;

const pane = (x, y, z, horiz) => g.set(x, y, z, "glass_pane", {
  north: horiz ? "false" : "true", south: horiz ? "false" : "true",
  east: horiz ? "true" : "false", west: horiz ? "true" : "false", waterlogged: "false",
});

// ---- 1. every footprint column: plinth/floor at y 0, the perimeter facade up to its top, the interior air ----
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const top = T(x, z);
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  g.set(x, 0, z, edge ? "stone_bricks" : "smooth_stone");   // the plinth and the floor on grade (lowest ground is y 0)
  for (let y = 1; y <= top; y++) {
    if (!edge) {
      // interior: floor slabs on the storey rows and the roof deck on top; the rest is air
      if (y === top || FLOORS.includes(y)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === top) { g.set(x, y, z, "calcite"); continue; }                     // cornice on the top row
    if (isCorner(x, z)) { g.set(x, y, z, y % 2 === 1 ? "calcite" : WALL); continue; }   // quoins
    if (BANDS.includes(y)) { g.set(x, y, z, "calcite"); continue; }              // string courses
    const front = isFront(z);
    const winRow = WIN_ROWS.includes(y) || (y === ATTIC_ROW && top >= 12) || (front && y === 1);
    if (winRow && bayWindow(x, z)) {
      if (front && y <= 2 && x === DOOR_X) { /* the entrance, set below */ }
      else { pane(x, y, z, z === 0 || z === D - 1); continue; }
    }
    if (front && x >= 1 && x <= 10 && y === 1 && !bayWindow(x, z)) { g.set(x, y, z, WALL); continue; }
    if (front && y === 3) { g.set(x, y, z, "calcite"); continue; }              // shopfront lintel
    if (!front && y === 1) { g.set(x, y, z, "stone_bricks"); continue; }        // plinth on the back and flanks
    g.set(x, y, z, WALL);
  }
}

// ---- 2. the entrance on the street face: a dark-oak door in the shopfront, a dark canopy over it ----
for (let x = DOOR_X - 1; x <= DOOR_X + 1; x++) g.set(x, 3, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
g.set(DOOR_X, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// ---- 3. warm lights behind some panes (interior air at z 1 behind the street face, x 1 behind the flanks) ----
for (const x of [1, 2, 4, 5, 7, 8, 10]) for (const y of [2, 5, 8]) {
  if ((x * 3 + y) % 4 === 0 && T(x, 1) >= y) g.set(x, y, 1, "glowstone");
}
g.set(7, 5, 1, "shroomlight");     // one warm lamp on the upper street front

// ---- 4. roof equipment on the main roof (the flat tier, clear of the core) ----
for (const [x, z] of [[2, 4], [3, 4], [9, 6]]) {
  if (inside(x, z) && T(x, z) === 10) g.set(x, 11, z, "light_gray_concrete");
}

const stats = g.save(`${DIR}/DC80834.nbt`);
console.log("saved", stats);
