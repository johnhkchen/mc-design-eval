// CTS House, Auckland (way 292861472): a 1980s precast-concrete office tower on a granite plinth, 18 storeys over a
// 17-storey setback shoulder and an 11-storey wing. Lidar roof heights are median-smoothed and snapped to the storey
// grid (tops at 4k+5, so every tier's floor lines run on one datum at y 2): crown 74, shoulder 70, wing 46, low edges 6-30.
// Facade: white floor bands, light-grey piers framing three-pane glass bays, grey spandrels, tinted blue glass, a
// polished-andesite cornice on every roof edge, a dark-oak entrance on the north face under a stone lintel, glowstone
// behind some panes. Interiors are air with a floor slab per storey; every slab rests on the solid layer below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861472.cells.json", "utf8"));
const W = 37, D = 30, H = 86;
const DATUM = 2;                                   // the ground floor's slab; storey k's slab is at DATUM + 4k

// the storey grid: a roof snaps to 6 + 4k (its top layer at 5 + 4k is a spandrel or the cap); under 8 it is a plinth
const roofTop = (r) => (r < 8 ? 1 : 4 * Math.floor((r - 6) / 4 + 0.4) + 5);

const top = Array.from({ length: W }, () => Array(D).fill(-1));   // top layer per cell, -1 = not footprint
const low = Array.from({ length: W }, () => Array(D).fill(0));    // the lidar roof, for the median
for (const [x, z, , r] of cells) { low[x][z] = r; }
const footprint = new Set(cells.map(([x, z]) => `${x},${z}`));
const isIn = (x, z) => x >= 0 && z >= 0 && x < W && z < D && footprint.has(`${x},${z}`);
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (isIn(x + dx, z + dz)) v.push(low[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (isIn(x, z)) top[x][z] = roofTop(median(x, z));

// the solid shell: a cell is occupied at height y if it is in the footprint and y is at or below its top
const occ = (x, z, y) => isIn(x, z) && y <= top[x][z];
const perimeter = (x, z, y) => !occ(x - 1, z, y) || !occ(x + 1, z, y) || !occ(x, z - 1, y) || !occ(x, z + 1, y);
const exposedX = (x, z, y) => !occ(x - 1, z, y) || !occ(x + 1, z, y);   // east or west face: its bays run along z
const windowRow = (y) => (y - DATUM) % 4 === 1 || (y - DATUM) % 4 === 2;
const glassAt = (x, z, y) => isIn(x, z) && windowRow(y) && perimeter(x, z, y) && !isDoor(x, z, y) &&
  (exposedX(x, z, y) ? z : x) % 4 !== 0;
const glassFacing = (x, z, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => glassAt(x + dx, z + dz, y));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the entrance: north face of the tower at x 8, lintel above, pilasters either side
const DOOR = { x: 8, z: 1 };
const isDoor = (x, z, y) => x === DOOR.x && z === DOOR.z && (y === 3 || y === 4);
const isLintelOrPilaster = (x, z, y) => z === DOOR.z && Math.abs(x - DOOR.x) <= 1 && (y === 5 || y === 3 || y === 4);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!isIn(x, z)) continue;
  // foundation and base course: solid from the ground to the ground floor's slab
  put(x, 0, z, "polished_andesite"); put(x, 1, z, "polished_andesite");
  for (let y = 2; y <= top[x][z]; y++) {
    const per = perimeter(x, z, y), ph = (y - DATUM) % 4, cap = y === top[x][z];
    if (isDoor(x, z, y)) {
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (per && isLintelOrPilaster(x, z, y)) { put(x, y, z, "polished_andesite"); continue; }
    if (ph === 0) {                                // a floor line: the white band outside, the slab inside
      put(x, y, z, per ? (y === DATUM ? "polished_andesite" : "white_concrete") : "light_gray_concrete");
    } else if (ph === 3) {                         // a spandrel under each window band; the roof cap on top
      put(x, y, z, per ? (cap ? "polished_andesite" : "gray_concrete") : (cap ? "gray_concrete" : "light_gray_concrete"));
    } else if (per) {                              // a window band: piers every 4th block, tinted glass between
      const u = exposedX(x, z, y) ? z : x;
      put(x, y, z, u % 4 === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
    } else if (glassFacing(x, z, y) && (x * 7 + z * 13 + y * 3) % 9 === 0) {
      put(x, y, z, "glowstone");                   // an air gap behind the glass; a warm light in some bays
    }
  }
}

// roof plant: a plant room on the crown, a small one on the wing's terrace
for (let x = 7; x <= 10; x++) for (let z = 5; z <= 8; z++) for (let y = 74; y <= 75; y++) put(x, y, z, "light_gray_concrete");
for (let x = 28; x <= 29; x++) for (let z = 10; z <= 11; z++) { put(x, 46, z, "gray_concrete"); put(x, 47, z, "light_gray_concrete"); }

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861472.nbt");
console.log(JSON.stringify({ footprint: footprint.size, ...stats }));
