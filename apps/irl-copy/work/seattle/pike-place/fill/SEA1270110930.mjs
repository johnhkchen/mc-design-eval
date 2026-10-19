// FIFTEEN TWENTY-ONE SECOND AVENUE CONDOMINIUM (2008, mixed use). Lidar roof ~195 blocks above the lowest ground.
// Reads as a 2008 Seattle mixed-use block: a six-storey concrete podium with a shopfront ground floor on the low
// (street) side, a planted podium roof with mechanical boxes, and a set-back residential tower of punched glass bays
// rising to a penthouse. Level storey lines (slabs every 5 blocks, at y = 4 + 5k) on a stepped foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270110930.cells.json", "utf8"));

const W = 60, D = 156, H = 207;
const PODIUM_TOP = 34;     // podium roof slab (a storey line: 34 % 5 === 4)
const ROOF = 194;          // tower roof slab (also a storey line)
const PARAPET = 195;       // tower parapet course / penthouse base
const PENT_TOP = 203;      // penthouse cap
const TOWER_INSET = 6;     // tower sits this many cells in from the footprint edge
const PENT_INSET = 11;     // penthouse sits this far in from the footprint edge
const TERRACE = 35;        // podium roof planting level

const ground = new Int16Array(W * D).fill(-1);
const foot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[z * W + x] >= 0;
for (const [x, z, g] of cells) ground[z * W + x] = g;

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Depth of each footprint cell from the footprint edge (edge = 0).
const inset = new Int16Array(W * D).fill(-1);
const queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!foot(x, z)) continue;
  if (N4.some(([dx, dz]) => !foot(x + dx, z + dz))) { inset[z * W + x] = 0; queue.push([x, z]); }
}
for (let h = 0; h < queue.length; h++) {
  const [x, z] = queue[h]; const d = inset[z * W + x];
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz;
    if (foot(nx, nz) && inset[nz * W + nx] < 0) { inset[nz * W + nx] = d + 1; queue.push([nx, nz]); }
  }
}
const depth = (x, z) => (foot(x, z) ? inset[z * W + x] : -1);
const edge0 = (x, z) => depth(x, z) === 0;
const isTower = (x, z) => depth(x, z) >= TOWER_INSET;
const isPent = (x, z) => depth(x, z) >= PENT_INSET;
const towerEdge = (x, z) => isTower(x, z) && N4.some(([dx, dz]) => !isTower(x + dx, z + dz));
const pentEdge = (x, z) => isPent(x, z) && N4.some(([dx, dz]) => !isPent(x + dx, z + dz));
const normal = (x, z, inSet) => N4.find(([dx, dz]) => !inSet(x + dx, z + dz));
const facingOf = ([dx, dz]) => ({ [1]: "east", [-1]: "west" }[dx] ?? ({ [1]: "south", [-1]: "north" })[dz]);
const hash = (x, y, z) => (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0;

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const BASE = "polished_andesite";
const STONE = "stone_bricks";
const FOUNDATION = "stone_bricks";

const lights = [];    // [x, y, z, block, state?] placed after the shell, behind glass

// Facade block on an exterior cell: base course, shopfront (low side), spandrels, punched window bays and piers.
function facade(x, z, y, n, g, podium) {
  const [dx] = n;
  const t = dx !== 0 ? z : x;                                       // position along the wall
  const shop = podium && g <= 3;
  if (y === g) return { b: BASE };
  if (shop && y >= g + 1 && y <= g + 3) {
    if (t % 12 === 6) {                                              // entrance: door in the bay, lintel over it
      if (y === g + 1) return { b: "dark_oak_door", s: { facing: facingOf(n), half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (y === g + 2) return { b: "dark_oak_door", s: { facing: facingOf(n), half: "upper", hinge: "left", open: "false", powered: "false" } };
      return { b: "dark_oak_slab", s: { type: "top" } };             // canopy course over the door
    }
    if (t % 4 === 0) return { b: STONE };
    return { b: GLASS, shop: true };
  }
  if (y % 5 === 4) return { b: SPANDREL };
  if (t % 4 === 0 || t % 4 === 3) return { b: PIER };
  return { b: GLASS };
}

// Column content for footprint cell (x, z) at height y: null = air.
function cell(x, z, y) {
  const g = ground[z * W + x];
  if (y < g) return { b: FOUNDATION };
  const tower = isTower(x, z);

  if (y <= PODIUM_TOP) {                                             // podium: six storeys over the whole footprint
    if (edge0(x, z)) return facade(x, z, y, normal(x, z, foot), g, true);
    return y % 5 === 4 ? { b: SPANDREL } : null;
  }

  if (!tower) {                                                      // podium roof: planted terrace with plant boxes
    if (y === TERRACE) {
      if (edge0(x, z)) return { b: "stone_brick_wall" };
      return mech(x, z) ? { b: SPANDREL } : { b: "moss_block" };
    }
    if (y === TERRACE + 1) {
      if (mech(x, z)) return { b: SPANDREL };
      if (hash(x, y, z) % 29 === 0) return { b: "flowering_azalea" };
      if (hash(x, y, z) % 53 === 0) return { b: "lantern", s: { hanging: "false" } };
    }
    return null;
  }

  // Tower storeys.
  if (y <= ROOF) {
    if (towerEdge(x, z)) return facade(x, z, y, normal(x, z, isTower), g, false);
    return y % 5 === 4 ? { b: SPANDREL } : null;
  }

  // Parapet and penthouse above the tower roof.
  if (y === PARAPET && !isPent(x, z)) return towerEdge(x, z) ? { b: "stone_brick_wall" } : null;
  if (!isPent(x, z)) return null;
  if (y === PENT_TOP) return { b: STONE };
  if (pentEdge(x, z)) {
    if (y === PARAPET) return { b: STONE };
    const t = normal(x, z, isPent)[0] !== 0 ? z : x;
    return y >= 197 && y <= 199 && t % 3 === 1 ? { b: GLASS } : { b: STONE };
  }
  return null;
}

// Plant boxes on the podium roof: a grid of concrete boxes two blocks tall, kept off the parapet and the tower.
function mech(x, z) {
  return !isTower(x, z) && depth(x, z) >= 3 && x % 9 >= 3 && x % 9 <= 5 && z % 11 >= 3 && z % 11 <= 6;
}

// Interior cell behind a window (the air gap that holds the warm light).
function interiorAt(x, z, y) {
  if (!foot(x, z)) return false;
  if (y <= PODIUM_TOP) return !edge0(x, z);
  return isTower(x, z) && !towerEdge(x, z) && y <= ROOF;
}

const v = new Voxels([W, H, D]);
let placed = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!foot(x, z)) continue;
  for (let y = 0; y < H; y++) {
    const c = cell(x, z, y);
    if (!c) continue;
    v.set(x, y, z, c.b, c.s);
    placed++;
    if (c.b === GLASS && c.shop === undefined && y > ground[z * W + x] && y % 5 !== 4) {
      // residential window: a glowstone behind some glass
      const n = towerEdge(x, z) && y > PODIUM_TOP ? normal(x, z, isTower) : normal(x, z, foot);
      if (n && hash(x, y, z) % 7 === 0 && interiorAt(x - n[0], z - n[1], y)) lights.push([x - n[0], y, z - n[1], "glowstone"]);
    } else if (c.shop && hash(x, y, z) % 5 === 0) {
      const n = normal(x, z, foot);
      if (n && interiorAt(x - n[0], z - n[1], y)) lights.push([x - n[0], y, z - n[1], "shroomlight"]);
    }
  }
}

// Warm light behind some glass (residential glowstone, shopfront shroomlight), set in the air gap after the shell.
for (const [x, y, z, b] of lights) v.set(x, y, z, b);

const out = process.argv[2] ?? "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270110930.nbt";
const r = v.save(out);
console.log(`cells ${cells.length}, placed ${placed}, lights ${lights.length}, tower cells ${cells.filter(([x, z]) => isTower(x, z)).length}, penthouse cells ${cells.filter(([x, z]) => isPent(x, z)).length}`);
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}`);
