// Social Sciences 201N, Auckland: a 1970s university block on the Mt Eden slope. Board-marked white concrete frame,
// blue-tinted glazing in pier-and-spandrel bays, a stone plinth that shows its extra storeys on the downhill side, a
// two-storey podium with a planted terrace, a setback upper body, and a plant crown on the core (lidar 33 vs 30).
// Storey lines are shared across the footprint (slabs at 10, 14, 18, 22, 26, 30, crown 33) so the bands run level.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_434385698.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 48, DEPTH = 50;
const WALL = "white_concrete", LG = "light_gray_concrete", GLASS = "light_blue_stained_glass", FILL = "stone";
const PLINTH = "stone_bricks", PIER_STONE = "polished_andesite", CANOPY = "smooth_stone";
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const PODIUM_TOP = 18, UPPER_TOP = 30, CROWN_TOP = 33, FLOOR = 10;   // datum 10 = the uphill ground

const key = (x, z) => z * W + x;
const fp = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < DEPTH && fp.has(key(x, z));
const cell = (x, z) => fp.get(key(x, z));

// distance in cells from the outside: 1 = outer wall, 2 = next, ...
const dist = new Map();
let frontier = [];
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (N4.some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist.set(key(x, z), 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz) || dist.has(key(nx, nz))) continue;
    dist.set(key(nx, nz), d + 1); next.push([nx, nz]);
  }
  frontier = next;
}
const dd = (x, z) => dist.get(key(x, z)) ?? 0;

// the upper core: lidar roof 33 (against 30 elsewhere), smoothed over the 3x3 neighbourhood, set back 4+ cells
const smoothRoof = (x, z) => {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = cell(x + dx, z + dz); if (c) { s += c.r; n++; } }
  return s / n;
};
const isCore = (x, z) => inFp(x, z) && dd(x, z) >= 4 && smoothRoof(x, z) >= 32;
const isUpper = (x, z) => inFp(x, z) && dd(x, z) >= 3;
const isOuterOf = (test, x, z) => N4.some(([dx, dz]) => !test(x + dx, z + dz));

// the face a wall cell looks out of: the neighbour one step closer to outside (or the first outside one for sets)
const outward = (x, z) => N4.find(([dx, dz]) => dd(x + dx, z + dz) === dd(x, z) - 1 && (dd(x, z) - 1 > 0 || !inFp(x + dx, z + dz))) ?? N4.find(([dx, dz]) => !inFp(x + dx, z + dz));
const inward = (x, z) => N4.find(([dx, dz]) => dd(x + dx, z + dz) === dd(x, z) + 1);

const g = new Voxels([W, 46, DEPTH]);
const at = (x, y, z, b, s) => g.set(x, y, z, b, s);

// the entrance: the uphill (north-west) outer wall, at the highest ground, where the most neighbours share its climb
const outOfCell = (x, z) => N4.find(([dx, dz]) => !inFp(x + dx, z + dz)) ?? null;
const uphill = cells.filter(([x, z, gr]) => dd(x, z) === 1 && gr >= 9 && outOfCell(x, z) && ["north", "west"].includes(DIR_NAME[outOfCell(x, z).join(",")]));
const near = ([x, z]) => uphill.filter(([a, b]) => Math.max(Math.abs(a - x), Math.abs(b - z)) <= 2).length;
const door = uphill.reduce((best, c) => (near(c) > near(best) ? c : best));
const doorOut = outOfCell(door[0], door[1]);
const doorIn = N4.find(([dx, dz]) => dd(door[0] + dx, door[1] + dz) === 2) ?? [-doorOut[0], -doorOut[1]];
console.log("entrance", door, "out", DIR_NAME[doorOut.join(",")], "uphill candidates", uphill.length);

// one storey of a facade: glass in bays of two between piers, a spandrel above, lamps behind some panes
function storeyOfFacade(x, z, F, out, inn, lamps = true) {
  const along = out[0] !== 0 ? z : x;
  const pier = along % 3 === 0;
  for (const y of [F + 1, F + 2]) at(x, y, z, pier ? WALL : GLASS);
  at(x, F + 3, z, LG);
  if (lamps && !pier && inn && (x * 31 + z * 17 + F) % 11 === 0) at(x + inn[0], F + 1, z + inn[1], "glowstone");
}

// 1. foundation, plinth and every storey slab, footprint-wide
for (const [x, z, gr] of cells) {
  const d = dd(x, z);
  for (let y = 0; y < FLOOR; y++) at(x, y, z, FILL);
  // the downhill plinth: outer walls from the cell's own ground up to the datum (extra storeys shown on the low side)
  if (d === 1) {
    const out = outward(x, z);
    for (let y = gr; y < FLOOR; y++) {
      if (y === 6 || y === 9) at(x, y, z, LG);
      else if (y === 7 || y === 8) { if (gr <= 7) at(x, y, z, (out[0] !== 0 ? z : x) % 3 === 0 ? PLINTH : GLASS); else at(x, y, z, PLINTH); }
      else at(x, y, z, PLINTH);
    }
  }
  for (const y of [FLOOR, FLOOR + 4, PODIUM_TOP]) at(x, y, z, LG);
  if (d === 1) at(x, PODIUM_TOP + 1, z, "iron_bars");   // terrace rail on the outer ring
  if (d === 2 && (x + z) % 7 === 0) { at(x, PODIUM_TOP + 1, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" }); }
}

// 2. podium walls (ground and first storey) on the outer ring
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (dd(x, z) !== 1) continue;
  const out = outward(x, z), inn = inward(x, z);
  for (const F of [FLOOR, FLOOR + 4]) storeyOfFacade(x, z, F, out, inn);
}

// 3. upper body, set back two cells from the podium's outer wall
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!isUpper(x, z)) continue;
  for (const y of [22, 26, UPPER_TOP]) at(x, y, z, LG);
  if (dd(x, z) === 3) {
    const out = outward(x, z), inn = inward(x, z);
    for (const F of [PODIUM_TOP, 22, 26]) storeyOfFacade(x, z, F, out, inn);
    at(x, UPPER_TOP + 1, z, WALL);   // parapet on the setback wall
  }
  // roof plant: 2 x 2 units on the terrace of the roof
  if (dd(x, z) >= 4 && !isCore(x, z) && x % 6 >= 2 && x % 6 <= 3 && z % 6 >= 2 && z % 6 <= 3) {
    at(x, UPPER_TOP + 1, z, "gray_concrete"); at(x, UPPER_TOP + 2, z, "gray_concrete");
  }
}

// 4. the crown: the core rises three blocks above the roof, as a louvred plant room with a cornice
const core = cells.map(c => [c[0], c[1]]).filter(([x, z]) => isCore(x, z));
for (const [x, z] of core) {
  at(x, UPPER_TOP, z, LG);
  at(x, 22, z, LG); at(x, 26, z, LG);
  at(x, CROWN_TOP, z, LG);
  if (isOuterOf(isCore, x, z)) {
    for (const y of [UPPER_TOP + 1, UPPER_TOP + 2]) {
      const out = N4.find(([dx, dz]) => !isCore(x + dx, z + dz));
      const along = out[0] !== 0 ? z : x;
      at(x, y, z, along % 3 === 0 ? WALL : (y === UPPER_TOP + 1 ? "iron_bars" : LG));
    }
    at(x, CROWN_TOP + 1, z, LG);
  }
}
if (core.length) {
  const cx = core.reduce((s, c) => s + c[0], 0) / core.length, cz = core.reduce((s, c) => s + c[1], 0) / core.length;
  const [mx, mz] = core.reduce((b, c) => (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(b[0] - cx, b[1] - cz) ? c : b));
  at(mx, CROWN_TOP + 1, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// 5. the entrance: a double door on the uphill side under a canopy, glazed vestibule cells beside it, a lantern below
const [dx0, dz0] = door;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (Math.max(Math.abs(x - dx0), Math.abs(z - dz0)) > 2 || dd(x, z) > 2) continue;
  at(x, 13, z, CANOPY);
}
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (dd(x, z) !== 1 || Math.max(Math.abs(x - dx0), Math.abs(z - dz0)) > 1 || (x === dx0 && z === dz0)) continue;
  for (const y of [11, 12]) at(x, y, z, GLASS);
}
const facing = DIR_NAME[doorIn.join(",")];
at(dx0, 11, dz0, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
at(dx0, 12, dz0, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
at(dx0 + doorIn[0], 12, dz0 + doorIn[1], "lantern", { hanging: "true", waterlogged: "false" });

// 6. stray-block sweep: the lamp at the portico must hang from its canopy, and every crown/parapet cell sits on its slab
const hangs = g.get(dx0 + doorIn[0], 13, dz0 + doorIn[1]);
console.log("canopy above lantern:", hangs ? hangs.block : "MISSING");

const counts = g.save(`${DIR}/way_434385698.nbt`);
console.log("core cells", core.length, "entrance", door, "blocks", counts);
