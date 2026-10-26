// Phyllis Wheatley YWCA, 901 Rhode Island Ave NW: a brick Colonial Revival block on a stone base, a flat roof behind a
// quartz cornice and parapet, a two-storey-over-base tower core at the middle of the south side (roof 8) on a lower
// wing (roof 7), and one-storey wings (roof 5, 6). Built from the footprint cells: each cell's column runs from its
// ground to its roof; the outer skin is brick, with window panes on odd bays of each exposed face and an air pocket
// (lit in some) behind each pane; the core is solid, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66100.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66100.nbt";
const SIZE = 20;

// footprint cell (x, z) -> { g: ground, r: roof height above y 0 }
const FP = new Map();
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) FP.set(`${x},${z}`, { g, r });
const cell = (x, z) => FP.get(`${x},${z}`);
const roof = (x, z) => cell(x, z)?.r ?? -1;

// lidar smoothing: the lone roof-3 cell is noise between roof-5 cells; the tower core is one clean 4 x 2 block at roof 8
cell(10, 11).r = 5;
for (let z = 13; z <= 14; z++) for (let x = 9; x <= 12; x++) cell(x, z).r = 8;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const key = (x, y, z) => `${x},${y},${z}`;

// the faces of cell (x, z) that show at row y: outside the footprint, or above a lower neighbour's roof (a setback)
const faces = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d];
  const nr = roof(x + dx, z + dz);
  return nr < 0 || y >= nr;
});
// windows sit on odd columns of a face, so each bay is a pane with a brick pier beside it
const along = (x, z, d) => (d === "N" || d === "S" ? x : z);
const bays = (x, z, y) => faces(x, z, y).filter((d) => along(x, z, d) % 2 === 1);
// a row is solid inside the mass when the cell and all four neighbours stand above it
const deep = (x, z, y) => roof(x, z) > y && Object.values(DIRS).every(([dx, dz]) => roof(x + dx, z + dz) > y);

const ENTRY = [10, 0];                       // the doorway on the z = 0 face
const PILASTERS = [[9, 0], [11, 0]];         // quartz piers and lanterns either side of it
const isEntry = (x, z) => x === ENTRY[0] && z === ENTRY[1];
const isPilaster = (x, z) => PILASTERS.some(([px, pz]) => px === x && pz === z);

// window rows: the two rows between storey bands (heights 1-2, 4-5, 7-8 above ground); the air pockets behind them
const winRow = (h) => h % 3 === 1 || h % 3 === 2;
const pockets = new Set();   // air behind a pane, at a window row, in the solid mass
const lights = new Set();    // of those, the lower row of some get a warm glowstone
for (const [k, { g, r }] of FP) {
  const [x, z] = k.split(",").map(Number);
  for (let y = g + 1; y < r - 2; y++) {
    if (!winRow(y - g) || isEntry(x, z) || isPilaster(x, z)) continue;
    const bs = bays(x, z, y);
    if (!bs.length) continue;
    const [dx, dz] = DIRS[bs[0]];
    const px = x - dx, pz = z - dz;              // the cell behind the pane, inward
    if (!cell(px, pz) || !deep(px, pz, y)) continue;
    pockets.add(key(px, y, pz));
    if (y === g + 1 && (x * 3 + z) % 4 === 0) lights.add(key(px, y, pz));
  }
}

const B = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(key(x, y, z), { block, state });

for (const [k, { g, r }] of FP) {
  const [x, z] = k.split(",").map(Number);
  const T = r - 1;           // parapet row (top of the column)
  const M = r - 2;           // cornice row, and the roof membrane is the solid row below the cornice's interior
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");        // foundation under a downhill cell
  for (let y = g; y <= T; y++) {
    const h = y - g;
    const ring = faces(x, z, y).length > 0;
    const k3 = key(x, y, z);
    const outer = Object.values(DIRS).some(([dx, dz]) => roof(x + dx, z + dz) < 0);
    if (y === T) { if (outer) put(x, y, z, "smooth_quartz"); continue; }   // parapet on the outer edge only; setbacks stay flush
    if (y === M) { put(x, y, z, ring ? "smooth_quartz" : "smooth_stone"); continue; }   // cornice / roof membrane
    if (pockets.has(k3)) { if (lights.has(k3)) put(x, y, z, "glowstone"); continue; }  // air behind the glass
    if (h === 0) { put(x, y, z, ring ? "stone_bricks" : "bricks"); continue; }          // base course
    if (h % 3 === 0) { put(x, y, z, ring ? "smooth_quartz" : "bricks"); continue; }     // storey band (floor slab inside)
    if (ring && bays(x, z, y).length) put(x, y, z, "glass_pane");
    else put(x, y, z, "bricks");
  }
}

// the entrance: a lower and upper door in the z = 0 face, a quartz lintel above, the vestibule behind it open
const [ex, ez] = ENTRY;
const eg = cell(ex, ez).g, er = cell(ex, ez).r;
put(ex, eg + 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 3, ez, "smooth_quartz");
for (let y = eg + 1; y <= eg + 2; y++) B.delete(key(ex, y, ez + 1));   // vestibule air behind the door
for (const [px, pz] of PILASTERS) {
  put(px, eg + 1, pz, "smooth_quartz");
  put(px, eg + 2, pz, "smooth_quartz");
  put(px, eg + 3, pz, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof equipment on the wing membrane: two cooling units standing on the solid roof
for (const [x, z] of [[9, 3], [9, 6]]) put(x, cell(x, z).r - 1, z, "iron_block");

// a glass pane joins the panes and solid blocks beside it, as it would when placed
const joins = (x, y, z) => { const b = B.get(key(x, y, z)); return !!b && !/door|lantern/.test(b.block); };
for (const [k, v] of B) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  v.state = {
    north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)),
    east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), waterlogged: "false",
  };
}

const out = new Voxels([SIZE, SIZE, SIZE]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  out.set(x, y, z, block, state);
}
const { blocks, palette } = out.save(OUT);
console.log(`DC66100: ${blocks} blocks, palette ${palette}, ${pockets.size} pockets, ${lights.size} lit`);
