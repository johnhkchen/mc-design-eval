import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Puawaitahi / Auckland City Child Protection Team: a four-storey 1970s concrete-frame office (white concrete
// piers, light-grey spandrels, aluminium-framed glass), on the Mt Eden side of the CBD ridge. Four storeys of 4
// blocks each put the roof at y 16, the lidar's 16 on most cells, so the 16/17/7/15 noise is smoothed to one flat
// tier; the 17 cells become a rooftop plant box.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170798673.cells.json", "utf8"));
const W = 34, D = 36, H = 30, ROOF = 16, STOREY = 4;

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { x, z, g: ground, roof });
const inF = (x, z) => cell.has(`${x},${z}`);
const at = (x, z) => cell.get(`${x},${z}`);

// a perimeter cell is one with a missing neighbour; "ns" faces run along x, "ew" faces along z, corners are piers
function faceOf(x, z) {
  const n = !inF(x, z - 1), s = !inF(x, z + 1), w = !inF(x - 1, z), e = !inF(x + 1, z);
  if ((n || s) && (w || e)) return "corner";
  if (n || s) return "ns";
  if (w || e) return "ew";
  return null;
}
const pierAt = (x, z, face) => face === "corner" || (face === "ns" ? x % 3 === 0 : face === "ew" ? z % 3 === 0 : false);

// entrance: the south-most (largest z) perimeter run, centred on its mean x, on the lowest ground of that run
const southRun = [...cell.values()].filter(c => !inF(c.x, c.z + 1));
const meanX = Math.round(southRun.reduce((a, c) => a + c.x, 0) / southRun.length);
const doorCell = southRun.reduce((best, c) => (Math.abs(c.x - meanX) < Math.abs(best.x - meanX) || (Math.abs(c.x - meanX) === Math.abs(best.x - meanX) && c.g < best.g) ? c : best));
const cx = doorCell.x, cz = doorCell.z, gE = doorCell.g;
const bayX = (x) => Math.abs(x - cx) <= 1;
const canopyX = (x) => Math.abs(x - cx) <= 2;

// full glazed blocks: a single pane is a 2/16 sliver that vanishes at street and aerial scale, so the window grid
// reads as glazing only as whole blocks set between the white concrete piers
const GLASS = "light_blue_stained_glass";
const DOOR = "iron_door";

const g = new Voxels([W, H, D]);

for (const { x, z, g: gr, roof } of cell.values()) {
  const face = faceOf(x, z);
  const pier = face !== null && pierAt(x, z, face);
  const bay = face !== null && z === cz && bayX(x);

  if (!face) {
    // interior: a solid foundation below grade, floor slabs at each storey line, a roof deck at 15
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
    for (let y = gr; y < ROOF; y++) {
      if (y % STOREY === 0) g.set(x, y, z, "light_gray_concrete");
      else if (y === ROOF - 1) g.set(x, y, z, "smooth_stone");
    }
    if (roof >= 17) g.set(x, ROOF, z, "light_gray_concrete");   // rooftop plant box where the lidar reads 17
    continue;
  }

  for (let y = 0; y <= ROOF; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }   // foundation to grade
    if (y === ROOF) { g.set(x, y, z, "white_concrete"); continue; }   // parapet
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }      // base course
    const r = y % STOREY;
    if (bay && y === gE + 1 || bay && y === gE + 2) {
      if (x === cx) g.set(x, y, z, DOOR, { facing: "south", half: y === gE + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, GLASS);
      continue;
    }
    if (bay && y === gE + 3) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (z === cz && canopyX(x) && y === gE + 4) { g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (r === 0 || r === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel and header
    if (pier) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, GLASS);
  }
}

// warm light behind some of the glass: a lantern on the floor slab of the interior cell next to a window
for (const { x, z, g: gr } of cell.values()) {
  const face = faceOf(x, z);
  if (!face || pierAt(x, z, face) || (z === cz && bayX(x))) continue;
  for (let k = 0; k < 4; k++) {
    const y = STOREY * k + 1;
    if (y < gr || y >= ROOF || ((x * 5 + z * 3 + k * 2) % 7) !== 0) continue;
    const n = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].find(([nx, nz]) => inF(nx, nz) && !faceOf(nx, nz) && y >= at(nx, nz).g);
    if (n) g.set(n[0], y, n[1], "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170798673.nbt");
