import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1809 20th St NW (Dupont Circle): a red-brick walk-up with limestone trim. Two storeys
// above a stone base course, a calcite cornice, and a one-block penthouse where the lidar
// reads 7. The shell is one cell thick; interiors are air with a floor slab per storey.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60918.cells.json`, "utf8"));

const g = new Voxels([20, 19, 8]);

const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(`${x},${z}`, { gr, roof });
const has = (x, z) => map.has(`${x},${z}`);

// which faces of a footprint cell are on the outside
const exposed = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });

// the street face is the south (z = 7) side; the door sits in a window bay near its middle
const DOOR = [10, 7];
// interior cells behind these south-face windows get a glowstone (warm light behind glass)
const LIT_X = new Set([4, 7, 13, 16]);

// a pane joins a neighbouring wall cell (a shell cell with its mass at this height); interiors stay open
const glass = (x, y, z) => {
  const side = (dx, dz) => {
    const n = map.get(`${x + dx},${z + dz}`);
    const shellN = n && Object.values(exposed(x + dx, z + dz)).some(Boolean);
    return shellN && y <= n.roof - 1 ? "true" : "false";
  };
  return { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
};

// What stands at x, y, z: { block, state } or null for air. Mass rules first, then the facade.
function blockAt(x, y, z) {
  const c = map.get(`${x},${z}`);
  if (!c || y < 0) return null;
  const ex = exposed(x, z);
  const sides = [ex.n, ex.s, ex.w, ex.e].filter(Boolean).length;
  const shell = sides > 0;
  const corner = sides >= 2;
  const top = c.roof - 1;                       // the top row of this cell's mass
  if (y > top) return null;
  if (y < c.gr) return { block: "stone_bricks" };  // foundation up to the cell's ground
  if (!shell) {
    // interiors: ground floor slab, a 2nd floor slab, the roof deck, a penthouse cap where the mass reaches 7
    if (y === c.gr) return { block: "stone_bricks" };
    if (y === 3) return { block: "smooth_stone" };
    if (y === 5) return { block: "stone" };
    if (y === 6) return { block: "calcite" };
    if (y === 1 && z === 6 && LIT_X.has(x)) return { block: "glowstone" };
    return null;
  }
  const t = top - y;                            // rows counted down from the top
  if (t === 0) return { block: "calcite" };      // cornice
  if (t >= 5) return { block: "stone_bricks" };  // base course
  if (corner) return { block: "calcite" };       // quoins
  if (t === 2) return { block: "calcite" };      // storey band
  // window bays: every third cell along the face is a brick pier; the rest are glass
  const idx = ex.w || ex.e ? z : x;
  if (idx % 3 === 0) return { block: "bricks" };
  if (ex.s && x === DOOR[0] && z === DOOR[1] && (y === 1 || y === 2)) {
    const half = y === 1 ? "lower" : "upper";
    return { block: "dark_oak_door", state: { facing: "south", half, hinge: "left", open: "false", powered: "false" } };
  }
  return { block: "glass_pane", state: glass(x, y, z) };
}

// Fill every footprint cell from y 0 up to its top, skipping air.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const c = map.get(`${x},${z}`);
  for (let y = 0; y <= c.roof - 1; y++) {
    const b = blockAt(x, y, z);
    if (b) g.set(x, y, z, b.block, b.state);
  }
}

// Roof plant on the deck, standing on the roof slab.
for (const [x, z] of [[7, 5], [14, 5]]) g.set(x, 6, z, "light_gray_concrete");

const out = `${DIR}/DC60918.nbt`;
const res = g.save(out);
console.log(JSON.stringify(res));
