// 1133 19th St NW (Commercial-Office-Large): a 1980s-style precast-and-glass office block. A granite plinth, a
// double-height-ish lobby with a glazed entrance on the north (street) face, four office floors of 3-block storeys in
// cream precast with a tinted-glass window grid, and a 3-storey tower set back on the north side of the footprint.
// Hollow: a one-block shell, air behind the glass, a slab per floor line, a few warm lights behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80916.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const GRANITE = "polished_granite", CREAM = "smooth_quartz", PIER = "white_concrete", CANOPY = "dark_oak_planks";
const PANE = "light_blue_stained_glass_pane", GLASS = "light_blue_stained_glass", ROOF = "light_gray_concrete";
const SLAB_ROWS = [5, 9, 12, 15, 17];   // interior floor slabs (lobby ceiling, then one per storey); the roof deck is the top row
// Smoothed massing from the lidar: the lidar reads 20-21 over the north-centre block (x 11..18, z 0..9) and 17-18 elsewhere
const towerCell = (x, z) => x >= 11 && x <= 18 && z <= 9;
const topRow = (x, z) => (towerCell(x, z) ? 20 : 17);      // last block row of the column (the roof deck)
const baseRing = (x, z) => x === 0 || x === 23 || z === 0 || z === 12;
const towerRing = (x, z) => towerCell(x, z) && (x === 11 || x === 18 || z === 9);
const isRing = (x, z, y) => baseRing(x, z) || (towerRing(x, z) && y >= 18);

const paneState = (alongX) => (alongX
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// The shell block at a ring cell: [block, state?]. Lobby 1..5, then 3-block storeys (spandrel, two window rows), cornice on top.
function facade(x, z, y) {
  const tower = towerCell(x, z);
  const alongX = z === 0 || z === 12 || (tower && z === 9);
  const i = alongX ? x : z;
  const corner = (x === 0 || x === 23 || (tower && (x === 11 || x === 18))) && (z === 0 || z === 12 || (tower && z === 9));
  const pier = corner || i % 3 === 0;
  const pane = [PANE, paneState(alongX)];
  if (z === 0 && x >= 12 && x <= 15 && y <= 5) {         // entrance: glazed bay, double doors, dark canopy
    if (y === 5) return [CANOPY];
    if (x === 13 || x === 14) return y <= 2 ? ["dark_oak_door", doorState(y === 1 ? "lower" : "upper")] : [GLASS];
    return [GRANITE];
  }
  if (y === 1) return [GRANITE];                          // plinth course
  if (y <= 4) return pier ? [GRANITE] : pane;             // lobby storefront
  if (y === 5) return [CREAM];                            // lobby lintel
  if (y === topRow(x, z)) return [CREAM];                 // cornice
  if (y % 3 === 0) return [CREAM];                        // storey spandrels: 6, 9, 12, 15, 18
  return pier ? [PIER] : pane;
}

const v = new Voxels([24, 33, 13]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

for (const [x, z] of cells) {
  const top = topRow(x, z);
  for (let y = 0; y <= top; y++) {
    if (y === 0) { put(x, y, z, GRANITE); continue; }      // foundation to the lowest ground, under every cell
    if (isRing(x, z, y)) {
      const [block, state] = facade(x, z, y);
      put(x, y, z, block, state);
      if (block === PANE && (x * 7 + y * 5) % 11 === 0) {  // a lit room: warm light one block inside the glass
        const dx = x === 0 || x === 11 ? 1 : x === 23 || x === 18 ? -1 : 0;
        const dz = z === 0 ? 1 : z === 12 || z === 9 ? -1 : 0;
        put(x + dx, y, z + dz, "glowstone");
      }
    } else if (SLAB_ROWS.includes(y) || y === top) {       // air gap, floor slab per storey, roof deck on top
      put(x, y, z, CREAM);
    }
  }
  if (baseRing(x, z) || towerRing(x, z)) put(x, top + 1, z, CREAM);   // parapet on the ring, above its cornice
}

// Lobby pendants hang from the lobby ceiling slab (y 5), inside the glass
for (const x of [3, 9, 18, 21]) put(x, 4, 3, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant on the base roof (stands on the deck at y 17) and a tower penthouse on the tower roof (stands on y 20)
for (const [x0, x1, z0, z1] of [[3, 5, 4, 5], [19, 21, 3, 4]]) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
  put(x, 18, z, ROOF); put(x, 19, z, ROOF);
}
for (let x = 13; x <= 16; x++) for (let z = 3; z <= 6; z++) {
  put(x, 21, z, CREAM); put(x, 22, z, CREAM); put(x, 23, z, GRANITE);
}

const report = v.save(`${DIR}/DC80916.nbt`);
console.log(JSON.stringify(report));
