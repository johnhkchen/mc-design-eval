// DC70744: Hotel-Large, 1733 N St NW (Dupont Circle). Lidar roof 12 to 14 blocks over a footprint that falls
// from 1 block on the north and west to 0 on the south. Read as a 1910s Beaux-Arts hotel: red brick walls, calcite
// (limestone) bands, sills, lintels and quoins, a 3-block storey grid, a 4x4 tower on the middle of the plan
// that rises two blocks over a 13-high setback, a shopfront-and-portico base on the street (z=0) face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70744.cells.json", "utf8"));
const W = 11, D = 9, H = 26;

const C = new Map();
for (const [x, z, g, r] of cells) C.set(`${x},${z}`, { g, r });
const cellAt = (x, z) => C.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// storey lines: ground floor y1-3, then 3-block storeys (4-6, 7-9, 10-12, 13-15); the base rows carry the floor slabs
const BASES = new Set([1, 4, 7, 10, 13]);
const base = (y) => (y <= 1 ? 1 : 1 + 3 * Math.floor((y - 1) / 3));

// the first row at which a cell's wall is open to air: a footprint edge (0), or the row above a lower neighbour's roof,
// snapped down to a storey line so every shell stands on a slab. Above it the cell is shell, below it interior.
const S = new Map();
for (const [x, z] of C.keys().map((k) => k.split(",").map(Number))) {
  let s = Infinity;
  for (const [dx, dz] of DIRS) {
    const n = cellAt(x + dx, z + dz);
    if (!n) { s = 0; break; }
    if (n.r - 1 < cellAt(x, z).r - 1) s = Math.min(s, base(n.r));
  }
  S.set(`${x},${z}`, s);
}
const isShell = (x, z, y) => { const c = cellAt(x, z); return !!c && S.get(`${x},${z}`) <= c.r - 1 && y >= S.get(`${x},${z}`); };

// a window bay is a pier (calcite pilaster, brick between) or a window; a cell's bay runs along the face that is open
const isWindowBay = (x, z, y) => {
  const zOpen = [[0, 1], [0, -1]].some(([dx, dz]) => { const n = cellAt(x + dx, z + dz); return !n || n.r - 1 < y; });
  return (zOpen ? x : z) % 2 === 1;
};

const occ = new Map();
const put = (x, y, z, block, state) => occ.set(`${x},${y},${z}`, { block, state });

for (const [x, z, , r] of cells) {
  const top = r - 1, s = S.get(`${x},${z}`);
  for (let y = 0; y <= top; y++) {
    const shell = y >= s && s <= top;
    if (y === 0) { put(x, y, z, shell ? "stone_bricks" : "stone"); continue; }     // foundation / plinth
    if (!shell) {
      if (y === top) put(x, y, z, "smooth_stone");                              // roof deck over the interior
      else if (BASES.has(y)) put(x, y, z, "smooth_stone");                      // floor slab per storey
      else if (y >= base(top)) put(x, y, z, "stone");                           // solid attic under the deck
      continue;
    }
    if (y === top) { put(x, y, z, "calcite"); continue; }                       // cornice
    const k = (y - 1) % 3;                                                      // 0 sill/base, 1 window, 2 lintel
    if (z === 0 && x === 5 && (y === 1 || y === 2)) {                           // the entrance door
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 1) { put(x, y, z, "calcite"); continue; }                         // base course
    if (y === 3 && z === 0 && x >= 4 && x <= 6) { put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; } // portico canopy
    if (!isWindowBay(x, z, y)) { put(x, y, z, k === 1 && (x === 4 || x === 6) && z === 0 ? "calcite" : "bricks"); continue; }   // piers brick, portico pilasters calcite
    if (k === 0) put(x, y, z, "calcite");                                       // window sill
    else if (k === 1) put(x, y, z, y === 2 ? "glass" : "glass_pane");           // shopfront glass / upper panes
    else put(x, y, z, "calcite");                                               // window lintel
  }
}

// warm light behind some windows: glowstone on the interior floor slab, inside the glass
for (const [x, z, , r] of cells) {
  for (let y = 2; y < r - 1; y += 3) {
    if (!isWindowBay(x, z, y) || isShell(x, z, y) === false || (x + y) % 3 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const n = cellAt(x + dx, z + dz);
      if (!n || isShell(x + dx, z + dz, y) || y >= n.r - 1) continue;
      if (!occ.has(`${x + dx},${y},${z + dz}`)) { put(x + dx, y, z + dz, "glowstone"); break; }
    }
  }
}

// the tower's penthouse, a mechanical box on the 13 setback, and a brick chimney on the wing
for (const [x, z] of [[5, 3], [6, 3], [5, 4], [6, 4]]) { put(x, 14, z, "calcite"); put(x, 15, z, "oxidized_cut_copper"); }
for (const [x, z] of [[9, 3], [10, 3]]) put(x, 13, z, "stone_bricks");
put(1, 12, 4, "bricks"); put(1, 13, 4, "bricks");

const g = new Voxels([W, H, D]);
const occupied = (x, y, z) => occ.has(`${x},${y},${z}`);
for (const [key, { block, state }] of occ) {
  const [x, y, z] = key.split(",").map(Number);
  let st = state;
  if (block === "glass_pane") {
    st = {
      north: String(occupied(x, y, z - 1)), south: String(occupied(x, y, z + 1)),
      east: String(occupied(x + 1, y, z)), west: String(occupied(x - 1, y, z)), waterlogged: "false",
    };
  }
  g.set(x, y, z, block, st);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70744.nbt");
console.log("blocks", g.count(), "palette", g.palette.length - 1);
