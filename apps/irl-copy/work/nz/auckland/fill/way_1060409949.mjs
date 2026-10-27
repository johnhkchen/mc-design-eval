// Te Hā: a 1980s precast-and-glass office block on a volcanic-stone base, Mt Eden / CBD edge. Roof record: a 26-block
// tower core, 22-block wings, 4-block terrace on the east fringe; lidar roofs are snapped to flat tiers (8, 12, 20, 22, 26).
// Storeys run on absolute lines (y = 4, 8, 12 ...) so every floor is continuous across cells of different ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1060409949.cells.json", "utf8"));
const W = 34, D = 32, H = 39;
const FLOOR = 4;                                           // ground-floor level, shared by every cell

const tier = (r) => (r <= 5 ? r : r <= 10 ? 8 : r <= 15 ? 12 : r <= 19 ? 20 : r <= 23 ? 22 : 26);

const at = new Map();
for (const [x, z, gr, rr] of cells) at.set(`${x},${z}`, { gr, r: tier(rr) });
const cellOf = (x, z) => at.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// facade: exposed to the outside, or to a taller neighbour (a setback face)
const ring = (x, z) => {
  const c = cellOf(x, z);
  return DIRS.some(([dx, dz]) => { const n = cellOf(x + dx, z + dz); return !n || n.r < c.r; });
};

// the door: a ground-floor facade cell on the north edge (outward z-), else any outward ground-floor cell
const outward = (x, z) => DIRS.filter(([dx, dz]) => !cellOf(x + dx, z + dz)).map(([dx, dz]) => [dx, dz]);
let door = [...at.entries()]
  .map(([k, c]) => [k.split(",").map(Number), c])
  .filter(([[x, z], c]) => c.gr === FLOOR && c.r >= 12 && ring(x, z) && outward(x, z).some(([, dz]) => dz === -1))
  .sort((a, b) => Math.abs(a[0][0] - 16) - Math.abs(b[0][0] - 16) || a[0][1] - b[0][1])[0];
if (!door) throw new Error("no north-facing ground-floor cell for the entrance");
const doorways = new Set([`${door[0][0]},${door[0][1]}`, `${door[0][0] + 1},${door[0][1]}`]);
console.log("entrance at", door[0], "+ east neighbour", doorways);

const g = new Voxels([W, H, D]);

// interior cells beside the facade get a warm light behind the glass, on the floor line above the slab
const warmAt = (x, z, y) => {
  if (ring(x, z)) return false;
  if (!DIRS.some(([dx, dz]) => { const n = cellOf(x + dx, z + dz); return n && ring(x + dx, z + dz); })) return false;
  const h = (x * 7 + z * 13 + y * 5) % 11;
  return (y === 5 || y === 9 || y === 13 || y === 17 || y === 21) && h === 0;
};

// bays run along the face: a face whose outward normal is along x counts cells along z, and vice versa
const bayOf = (x, z) => {
  const xOut = !cellOf(x - 1, z) || !cellOf(x + 1, z) || cellOf(x - 1, z).r < cellOf(x, z).r || cellOf(x + 1, z).r < cellOf(x, z).r;
  return xOut ? z : x;
};

function facadeBlock(x, z, y, r) {
  if (y === FLOOR) return ["polished_andesite"];              // base course
  const mullion = bayOf(x, z) % 3 === 0;
  if (y <= 6) {                                              // shopfront
    if (doorways.has(`${x},${z}`)) return null;               // doorway opening
    return mullion ? ["stone_bricks"] : ["light_blue_stained_glass"];
  }
  if (y === 7) return ["gray_concrete"];                     // fascia
  const k = (y - FLOOR) % 4;                                 // 0 storey line, 1-2 glass, 3 lintel
  if (k === 0) return y === 24 ? ["smooth_stone"] : ["light_gray_concrete"];  // y 24: cornice
  if (k === 3) return ["light_gray_concrete"];
  return mullion ? ["white_concrete"] : ["light_blue_stained_glass"];   // precast mullions, glass
}

for (const [x, z, gr, rr] of cells) {
  const { r } = cellOf(x, z);
  if (r <= gr) {                                             // terrace: paving on the foundation top
    for (let y = 0; y < gr - 1; y++) g.set(x, y, z, "polished_andesite");
    g.set(x, gr - 1, z, "smooth_stone");
    continue;
  }
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");   // foundation
  for (let y = gr; y < r; y++) {
    if (y === r - 1) { g.set(x, y, z, "stone_bricks"); continue; }     // roof slab / parapet
    if (y < FLOOR) { g.set(x, y, z, "polished_andesite"); continue; }  // downhill plinth
    if (ring(x, z)) {
      const b = facadeBlock(x, z, y, r);                      // null = open doorway
      if (b) g.set(x, y, z, ...b);
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }   // floor slab
    if (warmAt(x, z, y)) g.set(x, y, z, (x + z) % 2 ? "glowstone" : "shroomlight");
  }
}

// lanterns hang in the doorway under the fascia
for (const k of doorways) {
  const [x, z] = k.split(",").map(Number);
  if (cellOf(x, z)) g.set(x, 6, z, "lantern", { hanging: "true" });
}

// roof plant on the tower: a small block of cooling units on the parapet slab
for (const [x, z, , rr] of cells) {
  if (tier(rr) !== 26 || ring(x, z)) continue;
  if (x >= 15 && x <= 18 && z >= 10 && z <= 12) { g.set(x, 26, z, "gray_concrete"); g.set(x, 27, z, "gray_concrete"); }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1060409949.nbt";
console.log(g.save(out));
