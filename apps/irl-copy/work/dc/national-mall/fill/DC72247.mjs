// DC72247: a stripped-classical federal office block on the Mall's north side, Indiana-limestone look (smooth quartz
// walls, andesite base, chiseled belts, stone cornice), three massing tiers from the lidar roof: a 12-block tower
// pavilion on the west flank, a 6-block (two storey) main body with a central front pavilion on a 1-block terrace,
// and 3-block one-storey wings. Hollow: a glazed ring with an air gap behind it, a floor slab at each storey line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72247.cells.json", "utf8"));
const W = 11, D = 13, H = 24;

// lidar roof -> smoothed tier (the roof's top, in blocks above y 0). Lidar noise (5s, 7s, 2s, 4s) snaps to the nearest tier.
function tierOf(x, z, r) {
  if (x === 0 && r >= 10) return 12;                                   // west tower, one bay wide, 4 storeys
  if (z === 0) return 1;                                               // front terrace, a 1-block plinth
  if (x === 1 && z >= 7 && z <= 9) return 1;                           // sunken court edge beside the tower
  if (x >= 2 && x <= 3 && ((z >= 7 && z <= 9) || z === 12)) return 3;  // one-storey wings
  return 6;                                                            // two-storey body
}

// rows by height above the cell's ground: windows (glazed bays), storey belts (floor slabs), the top course
const WIN = { 1: [], 3: [1], 6: [1, 2, 4], 12: [1, 2, 4, 5, 7, 8, 10] };
const BELT = { 1: [], 3: [], 6: [3], 12: [3, 6, 9] };

const info = new Map();
for (const [x, z, g, r] of cells) info.set(`${x},${z}`, { g, T: tierOf(x, z, r) });
const at = (x, z) => info.get(`${x},${z}`);

// the faces of the voxel (x, y, z) that open outside the footprint or to the sky over a lower neighbour
function exposed(x, z, y) {
  const out = [];
  for (const [dx, dz, face] of [[-1, 0, "W"], [1, 0, "E"], [0, -1, "N"], [0, 1, "S"]]) {
    const n = at(x + dx, z + dz);
    if (!n || y >= n.T) out.push(face);
  }
  return out;
}

const v = new Voxels([W, H, D]);
const lamps = [];   // [x, y, z, face] of glazed bays, lit from the room behind them

for (const [x, z] of cells) {
  const { g, T } = at(x, z);
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");                 // foundation up to the lidar ground
  for (let y = g; y < T; y++) {
    const ex = exposed(x, z, y), outer = ex.length > 0;
    if (y === T - 1) { v.set(x, y, z, outer ? "stone_bricks" : "stone"); continue; }        // cornice / roof deck
    if (y === g) { v.set(x, y, z, outer ? "polished_andesite" : "smooth_quartz"); continue; } // base course / floor
    if (BELT[T].includes(y)) { v.set(x, y, z, outer ? "chiseled_quartz_block" : "smooth_quartz"); continue; }
    if (WIN[T].includes(y) && outer) {
      const corner = ex.some((f) => f === "W" || f === "E") && ex.some((f) => f === "N" || f === "S");
      const face = ex[0], u = face === "W" || face === "E" ? z : x;
      if (corner || u % 3 === 0) v.set(x, y, z, "quartz_pillar");
      else { v.set(x, y, z, "light_blue_stained_glass"); lamps.push([x, y, z, face, y === WIN[T][0]]); }
    }
  }
}

// the penthouse on the main body roof: a stone box two blocks high on the roof deck
for (let x = 4; x <= 6; x++) for (let z = 4; z <= 5; z++) {
  v.set(x, 6, z, "smooth_quartz"); v.set(x, 7, z, "stone_bricks");
}

// warm rooms: some glazed bays have a lamp in the air gap just behind them, standing on the floor slab
const BEHIND = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
for (const [x, y, z, face, low] of lamps) {
  if ((x + z + y) % 4 !== 0) continue;
  const [dx, dz] = BEHIND[face], bx = x + dx, bz = z + dz, n = at(bx, bz);
  if (!n || n.T <= y || exposed(bx, bz, y).length || v.get(bx, y, bz)) continue;   // only air inside the shell
  if (low) v.set(bx, y, bz, "glowstone");
  else v.set(bx, y, bz, "lantern", { hanging: "false", waterlogged: "false" });
}

// the front entrance: a bronze door in the pavilion's centre bay, quartz piers either side, a canopy on posts over the terrace
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
v.set(5, 1, 1, "iron_door", { ...door, half: "lower" });
v.set(5, 2, 1, "iron_door", { ...door, half: "upper" });
for (const x of [4, 6]) for (const y of [1, 2]) v.set(x, y, 1, "quartz_pillar");
for (const x of [4, 6]) for (const y of [1, 2]) v.set(x, y, 0, "quartz_pillar");
for (let x = 4; x <= 6; x++) v.set(x, 3, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const out = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72247.nbt");
console.log(JSON.stringify(out));
