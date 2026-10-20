import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833582";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 21;
const ROOF = 11;               // roof slab top, absolute y (about 11 blocks above lowest ground)
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => cellMap.has(`${x},${z}`);
const groundOf = (x, z) => cellMap.get(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// perimeter = any side open to outside the footprint
const perimeter = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const missX = (x, z) => !has(x + 1, z) || !has(x - 1, z);
const missZ = (x, z) => !has(x, z + 1) || !has(x, z - 1);
const isCorner = (x, z) => missX(x, z) && missZ(x, z);
const pillar = (x, z) => isCorner(x, z) || (x + z) % 3 === 0;
const nearFacade = (x, z) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz]) => has(x+dx,z+dz) && perimeter(x+dx,z+dz));

// ---- entrance: north-most row, column nearest its middle ---------------
let minZ = Infinity;
for (const [x, z] of cellMap.keys().map(k => k.split(",").map(Number))) if (z < minZ) minZ = z;
const northRow = [...cellMap.keys()].map(k => k.split(",").map(Number)).filter(([, z]) => z === minZ);
const meanX = northRow.reduce((s, [x]) => s + x, 0) / northRow.length;
const doorCell = northRow.reduce((best, c) => (Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best));
const doorX = doorCell[0], doorZ = doorCell[1];

// ---- columns ------------------------------------------------------------
for (const [x, z, gg] of [...cellMap.keys()].map(k => [...k.split(",").map(Number), groundOf(...k.split(",").map(Number))])) {
  const per = perimeter(x, z);

  // foundation up to ground
  for (let y = 0; y < gg; y++) put(x, y, z, per ? "stone_bricks" : "stone");

  if (!per) {
    // interior: floor, storey slab, roof slab, air between, warm lamps behind facade glass
    put(x, gg, z, "smooth_stone");
    put(x, ROOF - 6, z, "smooth_quartz");
    put(x, ROOF, z, "light_gray_concrete");
    if (nearFacade(x, z) && (x * 3 + z * 5) % 4 === 0) put(x, ROOF - 4, z, "glowstone");
    continue;
  }

  // facade column
  put(x, gg, z, "stone_bricks");                      // plinth course
  const isDoor = x === doorX && z === doorZ;
  const pil = pillar(x, z);

  for (let y = gg + 1; y < ROOF; y++) {
    let b = "light_blue_stained_glass", p;
    if (y <= gg + 3) {
      // shopfront
      if (isDoor) {
        if (y === gg + 1) { b = "dark_oak_door"; p = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
        else if (y === gg + 2) { b = "dark_oak_door"; p = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
        else b = "light_blue_stained_glass";
      } else if (pil) b = "smooth_quartz";
      else if (y === gg + 1) b = "gray_concrete";     // kickplate
      else b = "light_blue_stained_glass";
    } else if (y === gg + 4) {
      b = "smooth_quartz";                             // shopfront lintel
    } else if (y === ROOF - 6) {
      b = "smooth_quartz";                             // storey line
    } else if (y > ROOF - 6 && y <= ROOF - 3) {
      b = pil ? "smooth_quartz" : "light_blue_stained_glass";   // upper windows, quartz mullions
    } else if (y === ROOF - 2) {
      b = "smooth_quartz";                             // frieze
    } else if (y === ROOF - 1) {
      b = "stone_brick_slab"; p = { type: "top", waterlogged: "false" };   // cornice
    } else {
      b = pil ? "smooth_quartz" : "light_blue_stained_glass";
    }
    put(x, y, z, b, p);
  }

  // parapet
  put(x, ROOF, z, "stone_brick_wall");
}

// ---- roof plant: 2x2 penthouse near the centre of the roof -------------
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
const plantCells = [[cx - 1, cz - 1], [cx, cz - 1], [cx - 1, cz], [cx, cz]];
if (plantCells.every(([x, z]) => has(x, z) && !perimeter(x, z))) {
  for (const [x, z] of plantCells) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
  for (const [x, z] of plantCells) put(x, ROOF + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  // a small ventilation plate on the penthouse
  put(cx - 1, ROOF + 3, cz - 1, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
