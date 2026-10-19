// DC60299: 401 9th St NW, Washington DC 20004, as a 1.21.1 module. Commercial-office-large, read as a 1930s-50s
// limestone-faced office block: a granite base course, calcite piers and spandrels with glass bays, stone heads and
// string courses, a 4-block storey module (slab / two glass rows / head). The lidar roof is smoothed with a 3x3 median
// and snapped to two tiers: the lower wings at 16 (4 storeys over the base) and the main mass at 20 (5 storeys), with
// a set-back penthouse on the main mass and roof units. Everything is solid up to its own tier, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60299.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/DC60299.nbt`;

const W = 12, L = 52, H = 28;
const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // east, west, south, north (outward when on that edge)

// Tiers: 3x3 median of the lidar roof (noise out), then 16 for the wings and 20 for the main mass.
const tier = new Map();
for (const c of F.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  tier.set(key(c.x, c.z), v[v.length >> 1] >= 18 ? 20 : 16);
}
const T = (x, z) => tier.get(key(x, z));
const faces = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));  // outward faces of a footprint cell
const crown = (x, z) => T(x, z) === 20 && x >= 2 && x <= W - 3 && z >= 14 && z <= 37;   // penthouse, set back 2 from the sides

// Palette
const BASE = "polished_andesite";  // base course and foundation (granite read as brick at street level)
const WALL = "calcite";            // piers and penthouse walls, the limestone
const STRING = "smooth_stone";     // floor slabs, string courses, roof surface
const HEAD = "stone_bricks";       // window heads, the cornice band
const GLASS = "glass_pane";
const DOOR = "dark_oak_door";
const STAIR = "stone_brick_stairs";
const LAMP = "glowstone";
const AC = "iron_block";
const PARAPET = "stone_brick_wall";
const LANTERN = "lantern";

const pane = ([dx]) => (dx !== 0
  ? { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
const parapet = (x, z, t) => {
  const side = (dx, dz) => (inF(x + dx, z + dz) && faces(x + dx, z + dz).length && T(x + dx, z + dz) === t ? "low" : "none");
  return { up: "true", east: side(1, 0), west: side(-1, 0), north: side(0, -1), south: side(0, 1), waterlogged: "false" };
};

const g = new Voxels([W, H, L]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (const c of F.values()) {
  const { x, z } = c, t = T(x, z), fs = faces(x, z), perim = fs.length > 0, corner = fs.length > 1;
  const [dx, dz] = fs[0] ?? [0, 0];
  const idx = dx !== 0 ? z : x;                                      // position along the face
  const pier = corner || idx % 3 === 0 || idx === (dx !== 0 ? L - 1 : W - 1);

  for (let y = 0; y < 3; y++) put(x, y, z, BASE);                    // base course, down to the lowest ground
  for (let y = 3; y < t; y++) {
    const r = y % 4;
    if (r === 3) { put(x, y, z, STRING); continue; }                // floor slab and string course
    if (!perim) continue;                                           // interior: air behind the glass
    if (r === 2) { put(x, y, z, HEAD); continue; }                  // window head band
    if (corner) { put(x, y, z, WALL); continue; }
    if (pier) { put(x, y, z, y < 8 ? BASE : WALL); continue; }      // shopfront piers are granite
    put(x, y, z, GLASS, pane(fs[0]));
  }

  // Lit windows: glowstone on the floor just inside a lower glass row.
  if (perim && !corner && !pier) for (let y = 4; y < t; y += 4) {
    if ((idx + y) % 8 !== 0) continue;
    const nx = x - dx, nz = z - dz;
    if (inF(nx, nz) && faces(nx, nz).length === 0 && T(nx, nz) > y) put(nx, y, nz, LAMP);
  }

  if (perim) put(x, t, z, PARAPET, parapet(x, z, t));               // parapet on the outer ring
  else if (t === 16 && x % 4 === 1 && z % 8 === 4) put(x, t, z, AC);  // roof units on the wings
  else if (t === 20 && !crown(x, z) && x % 5 === 2 && z % 9 === 6) put(x, t, z, AC);
}

// Entrance on the 9th Street (west) face: a portico between two calcite pillars, two doors, granite steps.
for (const z of [24, 25]) {
  put(0, 2, z, STAIR, { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
  for (const [y, half] of [[4, "lower"], [5, "upper"]]) {
    put(0, y, z, DOOR, { facing: "west", half, hinge: z === 24 ? "left" : "right", open: "false", powered: "false" });
  }
}
for (const z of [23, 26]) for (const y of [4, 5]) put(0, y, z, WALL);

// Penthouse: a calcite box with a glass band, a slab roof, lanterns on the corners.
for (const c of F.values()) {
  const { x, z } = c;
  if (!crown(x, z)) continue;
  const fs = DIRS.filter(([dx, dz]) => !crown(x + dx, z + dz));
  const [dx, dz] = fs[0] ?? [0, 0];
  const idx = dx !== 0 ? z : x;
  const edge = fs.length > 0, corner = fs.length > 1;
  const pier = corner || idx % 3 === 0 || idx === (dx !== 0 ? L - 1 : W - 1);
  for (let y = 20; y <= 22; y++) {
    if (!edge) continue;
    if (y === 21 && !pier) put(x, y, z, GLASS, pane(fs[0]));
    else put(x, y, z, WALL);
  }
  put(x, 23, z, HEAD);                                                // penthouse roof
  if (x % 4 === 3 && z % 10 === 5) put(x, 24, z, AC);
}
for (const [x, z] of [[2, 14], [9, 14], [2, 37], [9, 37]]) put(x, 24, z, LANTERN, { hanging: "false", waterlogged: "false" });

const stats = g.save(OUT);
const h = { 16: 0, 20: 0 };
for (const c of F.values()) h[T(c.x, c.z)]++;
console.log(`DC60299: ${stats.blocks} blocks, palette ${stats.palette}; tiers 16:${h[16]} 20:${h[20]}; penthouse cells ${[...F.values()].filter((c) => crown(c.x, c.z)).length}`);
