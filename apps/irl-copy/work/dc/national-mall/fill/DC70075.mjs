// 148 S St NW (DC 20001): a red-brick flat-roofed block of c.1900, with a shopfront on the street (z 0) and a
// seven-block tower at the west end. The lidar roof heights are smoothed into flat tiers (GRID below).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70075.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70075.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const X = 15, Y = 20, Z = 6;

// Tier height per footprint cell, z rows 0..5 (z 0 = the street front), x 0..14.
// '.' = off the footprint, '0' = yard (lidar roof 0: no building, left open).
const GRID = [
  "5.0..44..66..0.",
  "775444444555500",
  ".75444444555500",
  ".70444444555500",
  ".70444444555500",
  ".70444444555500",
];

const cellAt = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? "." : GRID[z][x]);
const H = (x, z) => (cellAt(x, z) === "." || cellAt(x, z) === "0" ? 0 : Number(cellAt(x, z)));
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];   // west, east, street (z-), rear (z+)

// check the grid against the lidar record: same footprint, roofs within 2 blocks after smoothing
let footprint = 0;
for (const row of GRID) for (const c of row) if (c !== ".") footprint++;
if (footprint !== cells.length) throw new Error(`grid has ${footprint} cells, record ${cells.length}`);
for (const [x, z, , roof] of cells) {
  const c = cellAt(x, z);
  if (roof === 0 ? c !== "0" : (c === "." || c === "0" || Math.abs(Number(c) - roof) > 2))
    throw new Error(`cell ${x},${z}: grid ${c} vs lidar ${roof}`);
}

const perim = (x, z) => DIRS.some(([dx, dz]) => H(x + dx, z + dz) < H(x, z));   // has a face showing at some height
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => H(x + dx, z + dz) <= y);  // faces open to air at height y
// a floor slab at the storey line only where no window can sit in front of air: the cell and all its neighbours are interior
const deep = (x, z) => !perim(x, z) && DIRS.every(([dx, dz]) => H(x + dx, z + dz) > 0 && !perim(x + dx, z + dz));

// storey bands: 1..2 ground windows, a string course at 3 where the block has two storeys, cornice on the top course
const rowKind = (h, y) => (y === 0 ? "plinth" : y === h - 1 ? "cornice" : h >= 6 && y === 3 ? "string" : "window");

// the face of a row-0 cell that looks onto the street (z-), if it has one
const streetFace = (z, ex) => (z === 0 ? ex.find(([, dz]) => dz === -1) : undefined);

function skin(x, z, y, h, ex) {
  const kind = rowKind(h, y);
  if (kind === "plinth" || kind === "cornice") return { block: "stone_bricks" };
  if (kind === "string") return { block: "smooth_stone" };
  const street = streetFace(z, ex);
  if (street && y <= 2) {                                        // the street front: entrance and shopfront
    if (x === 5) return { block: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    if (x === 6) return { block: "glass" };
  }
  if (ex.length > 1) return { block: "stone_bricks" };           // quoins at the corners
  const [dx, dz] = street ?? ex[0];
  const along = dz !== 0 ? x : z;
  if (along % 3 === 1) {                                         // glass pane in its frame of stone jambs
    const state = dz !== 0 ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
    return { block: "glass_pane", state };
  }
  return { block: "bricks" };                                    // red common brick between the panes
}

const g = new Voxels([X, Y, Z]);
const lamps = [];

// foundation: solid from y 0 up to each cell's ground (all zero here, so nothing floats)
for (const [x, z, ground] of cells) for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const h = H(x, z);
  if (!h) continue;
  for (let y = 0; y < h; y++) {
    const ex = exposed(x, z, y);
    if (ex.length) {
      const b = skin(x, z, y, h, ex);
      g.set(x, y, z, b.block, b.state);
      if (b.block === "glass_pane" || b.block === "glass") lamps.push([x, y, z, streetFace(z, ex) ?? ex[0]]);
    } else if (y === 0) g.set(x, y, z, "smooth_stone");          // ground-floor slab
    else if (y === h - 1) g.set(x, y, z, "stone");               // flat roof
    else if (y === 3 && h >= 5 && deep(x, z)) g.set(x, y, z, "smooth_stone");   // upper floor slab
  }
}

// warm light in some windows: a glowstone just inside the glass, in the air gap
for (const [x, y, z, [dx, dz]] of lamps) {
  const along = dz !== 0 ? x : z;
  const ix = x - dx, iz = z - dz;
  if ((along + y) % 4 !== 0 && !(x === 6 && z === 0)) continue;   // the shopfront is always lit
  if (H(ix, iz) > y && !g.get(ix, y, iz)) g.set(ix, y, iz, "glowstone");
}

// roof equipment, each standing on the roof course
g.set(10, 5, 3, "bricks"); g.set(10, 6, 3, "bricks"); g.set(10, 7, 3, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
g.set(1, 7, 3, "bricks"); g.set(1, 8, 3, "bricks"); g.set(1, 9, 3, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
g.set(4, 4, 3, "iron_block"); g.set(6, 4, 2, "iron_block");

const info = g.save(OUT);
console.log(`saved ${OUT}: ${info.blocks} blocks, ${info.palette} palette entries`);
