// 1150 Avenue of the Americas, a 1930s Midtown office block: a brick shaft of nine storeys on a granite base, pale
// limestone storey bands and corner quoins, a stepped crown over the middle (the lidar's 32 tier, one storey above the
// shoulders), a two-storey annex to the east, and a 2-cell alley between them. Footprint x 0..33, z 0..17; z 0 is the
// street front, x 0 the avenue front (shopfronts and the lobby). Each footprint cell is a solid column from y 0 to its roof,
// with floor slabs at the storey lines and the roof slab on top, and the inside left as air, so the walls are one block
// thick with an air gap behind the glass. Lit rooms sit behind some windows; the lobby is lit behind the doors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1034218.cells.json`, "utf8"));

const W = 34, D = 18, H = 44;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const inRange = (x, z) => x >= 0 && z >= 0 && x < W && z < D;

// ---- Massing: the lidar roof per cell, de-noised into flat tiers. ----
const LIDAR = new Map(), FOOT = new Set();
for (const [x, z, , r] of cells) { FOOT.add(key(x, z)); LIDAR.set(key(x, z), r); }
const lidar = (x, z) => LIDAR.get(key(x, z));
const nbrs = (x, z) => DIRS.map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => FOOT.has(key(a, b)));

// Building cells: lidar roofs of 20 and up (the shaft, the crown and the 25s and 26s, which are stair and lift noise).
const building = new Set();
for (const [x, z, , r] of cells) if (r >= 20) building.add(key(x, z));
// Open cells (lidar 0) with three or more building neighbours are lidar holes in the roof, not courts: fill them, twice.
for (let pass = 0; pass < 2; pass++) {
  for (const [x, z, , r] of cells) {
    if (r !== 0 || building.has(key(x, z))) continue;
    if (nbrs(x, z).filter(([a, b]) => building.has(key(a, b))).length >= 3) building.add(key(x, z));
  }
}
// Slivers: a building cell with fewer than two building neighbours is a stray column (the 25s at the alley edge).
for (const k of [...building]) {
  const [x, z] = k.split(",").map(Number);
  if (nbrs(x, z).filter(([a, b]) => building.has(key(a, b))).length < 2) building.delete(k);
}
// The east end of the north front (x 29..33, z 0..2) is lidar clutter over the alley, not wall: open ground.
for (const k of [...building]) { const [x, z] = k.split(",").map(Number); if (x >= 29 && z <= 2) building.delete(k); }

// Each building cell's tier is the median of the building roofs in its 3x3 block: 31 and up is the crown (32), else the
// shaft (29). Wing cells (lidar 4..6) are the two-storey annex at 6.
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const R = new Map();
for (const k of building) {
  const [x, z] = k.split(",").map(Number);
  const rs = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const kk = key(x + dx, z + dz);
    if (building.has(kk)) rs.push(LIDAR.get(kk) >= 20 ? LIDAR.get(kk) : 29);
  }
  R.set(k, median(rs) >= 31 ? 32 : 29);
}
for (const [x, z, , r] of cells) if (r >= 1 && r <= 10) R.set(key(x, z), 6);
const roofAt = (x, z) => (inRange(x, z) ? R.get(key(x, z)) ?? null : null);

// Tier map, for the record: '.' open, 'w' annex, '9' shaft, '3' crown.
const ascii = [];
for (let z = 0; z < D; z++) {
  let row = "";
  for (let x = 0; x < W; x++) { const v = roofAt(x, z); row += v == null ? (FOOT.has(key(x, z)) ? "." : " ") : v === 6 ? "w" : v === 29 ? "9" : "3"; }
  ascii.push(row);
}
console.log("massing (rows z 0..17, cols x 0..33):\n" + ascii.join("\n"));

// ---- Facade. ----
const solid = (x, y, z) => { const r = roofAt(x, z); return r != null && y < r; };
const streetFront = (x, z, exp) => exp.some(([dx, dz]) => (dz === -1 && z === 0) || (dx === -1 && x === 0));
const ENTRY = (x, z) => x === 0 && z >= 6 && z <= 11;                    // the lobby front on the avenue
const DOOR = (x, z) => x === 0 && (z === 8 || z === 9);
const paneState = (zWall) => (zWall
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

function facade(x, y, z, exp, r) {
  const zWall = exp.some(([, dz]) => dz !== 0);       // the wall runs along x
  const xWall = exp.some(([dx]) => dx !== 0);         // the wall runs along z
  const u = zWall ? x : z;                             // the bay coordinate along the wall
  if (y === 0) return ["polished_granite"];            // base course
  if (y === r - 1) return ["smooth_stone"];            // parapet coping
  if (zWall && xWall) return y % 3 === 0 ? ["calcite"] : ["stone_bricks"];   // quoins at the corners
  if (y % 3 === 0) {                                   // storey band; the lobby marquee over the doors
    if (ENTRY(x, z) && !xWall && exp.some(([dx]) => dx === -1)) return ["black_concrete"];
    return ["calcite"];
  }
  if (y <= 2 && streetFront(x, z, exp)) {              // shopfronts on the two street fronts
    if (DOOR(x, z)) return ["dark_oak_door", { facing: "west", hinge: z === 8 ? "left" : "right", open: "false", powered: "false", half: y === 1 ? "lower" : "upper" }];
    if (ENTRY(x, z) && u === 6) return ["lantern", { hanging: y === 2 ? "true" : "false", waterlogged: "false" }];
    if (ENTRY(x, z) && u === 11) return ["lantern", { hanging: y === 2 ? "true" : "false", waterlogged: "false" }];
    return u % 3 === 0 ? ["dark_oak_planks"] : ["glass"];
  }
  if (u % 3 === 0) return ["bricks"];                  // piers, one block wide every third cell
  return ["glass_pane", paneState(zWall)];
}

const g = new Voxels([W, H, D]);
const LIGHT = new Map();
const hash = (x, y, z) => (x * 7 + y * 5 + z * 11) % 13;

for (const k of building) {
  const [x, z] = k.split(",").map(Number);
  const r = R.get(k);
  for (let y = 0; y < r; y++) {
    const exp = DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
    if (exp.length) {
      const [block, state] = facade(x, y, z, exp, r);
      g.set(x, y, z, block, state);
      // A warm room behind some plain windows: the interior cell one step in, if it is air.
      const isGlass = block === "glass_pane" && exp.length === 1 && y >= 1 && y <= r - 2;
      const room = `${x - exp[0][0]},${y},${z - exp[0][1]}`;
      if (isGlass && hash(x, y, z) === 0) LIGHT.set(room, ["glowstone"]);
      if (isGlass && hash(x, y, z) === 7) LIGHT.set(room, ["shroomlight"]);
    } else if (y % 3 === 0 || y === r - 1) {
      g.set(x, y, z, y === r - 1 ? "stone" : "smooth_stone");   // floor slabs and the roof membrane inside
    }
  }
}
// The lobby: lit behind the doors.
for (const z of [8, 9]) LIGHT.set(`1,1,${z}`, ["glowstone"]);
for (const [p, [b, s]] of LIGHT) {
  const [x, y, z] = p.split(",").map(Number);
  const r = roofAt(x, z);
  if (r == null || y >= r) continue;
  if (DIRS.some(([dx, dz]) => !solid(x + dx, y, z + dz))) continue;   // only where the room cell is interior air
  g.set(x, y, z, b, s);
}

// Open ground (the alley and the court): a stone paving at y 0, not a building.
for (const k of FOOT) {
  const [x, z] = k.split(",").map(Number);
  if (!R.has(k)) g.set(x, 0, z, "stone_bricks");
}

// Two mechanical penthouses on the shaft's roof, standing on the roof slab (roof 29 under all nine cells).
for (const [bx, bz] of [[2, 13], [18, 2]]) {
  const box = [];
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) box.push([bx + dx, bz + dz]);
  if (!box.every(([x, z]) => roofAt(x, z) === 29)) { console.log(`penthouse at ${bx},${bz} skipped: roof not flat`); continue; }
  for (const [x, z] of box) {
    g.set(x, 29, z, "bricks"); g.set(x, 30, z, "bricks"); g.set(x, 31, z, "calcite");
  }
}

const out = `${FILL}/NYC1034218.nbt`;
console.log(g.save(out));
