import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951881";
const W = 20, H = 23, D = 15;

// Mid-century two-storey commercial block: cream tiled (smooth quartz) walls,
// polished andesite base and storey lines, glazed shopfront, upper-floor
// window bands, flat deck with parapet and rooftop plant.
const STOREY_LINE = 5;  // ground storey ends, first floor slab
const DECK = 10;        // roof deck (top of 2nd storey)
const PARAPET = 11;     // parapet top, roof about 11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const base = Math.min(...cells.map(c => Math.round(c[2])));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr) - base);

const has = (x, z) => ground.has(`${x},${z}`);
const isPerimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr) - base;
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs (storey line and roof deck) across every footprint cell,
//    only where they sit above that cell's ground.
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr) - base;
  if (STOREY_LINE >= gg) put(x, STOREY_LINE, z, "light_gray_concrete");
  if (DECK >= gg) put(x, DECK, z, "light_gray_concrete");
}

// 3. Perimeter facade: base course, shopfront, storey lines, window bands, cornice, parapet.
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr) - base;
  if (!isPerimeter(x, z)) continue;
  const bay = (x + z) % 3 === 0; // mullion positions
  for (let y = gg; y <= PARAPET; y++) {
    if (y === gg) {
      put(x, y, z, "polished_andesite");                       // base course
    } else if (y < STOREY_LINE) {
      if (y === 4) put(x, y, z, "smooth_quartz");              // shopfront lintel
      else put(x, y, z, bay ? "gray_concrete" : "glass");      // glazed shopfront
    } else if (y === STOREY_LINE) {
      put(x, y, z, "polished_andesite");                       // storey line
    } else if (y <= 9) {
      if (y === 7 || y === 8) {
        if (bay) put(x, y, z, "gray_concrete");
        else if ((x * 7 + z * 3 + y) % 9 === 0) put(x, y, z, "glowstone"); // warm lit window
        else put(x, y, z, "glass");
      } else {
        put(x, y, z, "smooth_quartz");
      }
    } else if (y === DECK) {
      put(x, y, z, "polished_andesite");                       // cornice
    } else if (y === PARAPET) {
      put(x, y, z, "smooth_quartz");                           // parapet
    }
  }
}

// 4. Roof plant: a few air-conditioning housings on interior roof cells.
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr) - base;
  if (isPerimeter(x, z) || DECK < gg) continue;
  if (x % 6 === 3 && z % 5 === 2) put(x, PARAPET, z, "stone_bricks");
}

// 5. Entrance: street-facing (south, +z) perimeter cell nearest the middle.
let doorCell = null;
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
for (const [x, z, gr] of cells) {
  if (has(x, z + 1)) continue;
  if (!doorCell || Math.abs(x - meanX) < Math.abs(doorCell[0] - meanX)) doorCell = [x, z, gr];
}
if (doorCell) {
  const [x, z, gr] = doorCell;
  const gg = Math.round(gr) - base;
  put(x, gg, z, "polished_andesite");
  put(x, gg + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gg + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gg + 3, z, "glass");
}

g.save(`${DIR}/${ID}.nbt`);
