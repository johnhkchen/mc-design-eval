// Union House, Auckland: a 1970s concrete office-and-student-union block, 14 storeys of 4 blocks on a stone base, with a
// taller stair-and-lift core. The lidar roof is 55-56 blocks over most of the footprint, 60-62 on a ring and 63 on the
// core; those are quantised to tiers at 40/48 (low wings), 56 (the slab), 60 (the setback) and 64 (the core top).
// Every footprint column is solid from y 0 up to its tier, so each storey and setback stands on the one below. Only the
// cells inside the outer ring are hollow (floor plates at every storey line, a roof deck on top), so the glass has air
// behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147113560.cells.json", "utf8"));
const X = 38, Y = 76, Z = 38;
const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147113560.nbt";

// the lidar roof (above y 0) quantised to the building's tiers
const tierOf = (roof) => (roof >= 63 ? 64 : roof >= 60 ? 60 : roof >= 50 ? 56 : Math.round(roof / 4) * 4);
const key = (x, z) => `${x},${z}`;
const col = new Map();
for (const [x, z, ground, roof] of cells) col.set(key(x, z), { g: ground, t: tierOf(roof) });
const top = (x, z) => col.get(key(x, z))?.t ?? -1;
// a ring cell has a neighbour outside the footprint or lower than itself: its whole column is wall, not floor and air
const ring = (x, z) => { const t = top(x, z); return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const n = top(x + dx, z + dz); return n < 0 || n < t; }); };

// the solid map (x, y, z): the columns, the parapet on each ring's top, and the floor and roof planes inside
const S = new Uint8Array(X * Y * Z);
const at = (x, y, z) => (z * Y + y) * X + x;
const isS = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < X && y < Y && z < Z && S[at(x, y, z)] === 1;
const rings = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = col.get(key(x, z)), rg = ring(x, z); rings.set(key(x, z), rg);
  for (let y = 0; y < c.t; y++) if (y < c.g || rg || y === 0 || y % 4 === 0 || y === c.t - 1) S[at(x, y, z)] = 1;
  if (rg) for (const y of [c.t, c.t + 1]) S[at(x, y, z)] = 1;
}

// the entrance: the street-facing ring cell (the largest z) nearest the middle, on a straight run of three ring cells
const isRing = (x, z) => rings.get(key(x, z)) === true;
const straight = (x, z) => isRing(x, z) && isRing(x - 1, z) && isRing(x + 1, z) && top(x, z) === top(x - 1, z) && top(x, z) === top(x + 1, z);
let door = null;
for (const [x, z] of cells) if (straight(x, z) && top(x, z) >= 56 && (!door || Math.abs(x - 18) + (38 - z) < Math.abs(door[0] - 18) + (38 - door[1]))) door = [x, z];
const doorKey = door ? key(door[0], door[1]) : null;

const v = new Voxels([X, Y, Z]);
const facade = (x, y, z, c) => {
  const k = Math.floor(y / 4), r = y % 4;
  if (c.t <= y && y <= c.t + 1) return y === c.t ? "polished_andesite" : "white_concrete";  // cornice and parapet
  if (!isRing(x, z)) return y === c.t - 1 ? "gray_concrete" : "smooth_stone";                // roof deck and floor plates
  if (y === 0) return "stone_bricks";                                                          // base course
  if (k === 0) return y === 3 ? "polished_andesite" : (x + z) % 3 === 0 ? "stone_bricks" : "light_blue_stained_glass_pane";  // shopfront
  if (r === 0) return "polished_andesite";                                                     // string course
  if (r === 3) return "light_gray_concrete";                                                   // spandrel
  const exposed = !isS(x + 1, y, z) || !isS(x - 1, y, z) || !isS(x, y, z + 1) || !isS(x, y, z - 1);
  return exposed && (x + z) % 3 !== 0 ? "light_blue_stained_glass_pane" : "white_concrete";     // window bay or pier
};
const pane = (x, y, z) => ({ north: String(isS(x, y, z - 1)), south: String(isS(x, y, z + 1)), east: String(isS(x + 1, y, z)), west: String(isS(x - 1, y, z)), waterlogged: "false" });

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!col.has(key(x, z))) continue;
  const c = col.get(key(x, z));
  for (let y = 0; y < Y; y++) {
    if (!S[at(x, y, z)]) continue;
    const b = facade(x, y, z, c);
    if (b === "light_blue_stained_glass_pane") v.set(x, y, z, b, pane(x, y, z));
    else v.set(x, y, z, b);
  }
}

// the entrance: a pair of doors, a canopy slab over the bay, and the ground storey's glass around it
if (door) {
  const [x, z] = door;
  v.set(x, 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x, 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) if (isRing(x + dx, z)) v.set(x + dx, 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// warm light: glowstone on the inside of one window in five, on the floor plate behind the glass
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = col.get(key(x, z)); if (!c || !isRing(x, z)) continue;
  for (let y = 1; y < c.t - 1; y++) {
    const r = y % 4; if (!(r === 1 || r === 2) || !S[at(x, y, z)]) continue;
    const exposed = !isS(x + 1, y, z) || !isS(x - 1, y, z) || !isS(x, y, z + 1) || !isS(x, y, z - 1);
    if (!exposed || (x + z + Math.floor(y / 4)) % 5 !== 0 || (door && key(x, z) === doorKey)) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (!col.has(key(nx, nz)) || isRing(nx, nz) || isS(nx, y, nz)) continue;   // the inside neighbour, air
      v.set(nx, y, nz, "glowstone"); break;
    }
  }
}

// roof equipment: a few plant units on the slab's roof, and a lift overrun on the core with a lamp on top
const coreCells = cells.filter(([x, z]) => col.get(key(x, z)).t === 64 && !isRing(x, z));
if (coreCells.length) {
  const cx = Math.round(coreCells.reduce((s, [x]) => s + x, 0) / coreCells.length), cz = Math.round(coreCells.reduce((s, [, z]) => s + z, 0) / coreCells.length);
  for (const [x, z] of coreCells) if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) for (let y = 64; y <= 66; y++) v.set(x, y, z, "light_gray_concrete");
  v.set(cx, 67, cz, "glowstone");
}
for (const [x, z] of cells) {
  const c = col.get(key(x, z));
  if (c.t === 56 && !isRing(x, z) && x % 5 === 2 && z % 5 === 2) { v.set(x, 56, z, "iron_block"); v.set(x, 57, z, "light_gray_concrete"); }
}

const out = v.save(FILE);
console.log(`Union House: ${out.blocks} blocks, ${out.palette} palette entries, door ${door ? door.join(",") : "none"}`);
