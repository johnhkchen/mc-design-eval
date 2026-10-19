// DC87051: 601 Pennsylvania Avenue NW, Washington DC 20004, as a 1.21.1 module. Commercial-Office-Large, read as a
// 1930s stripped-classical limestone office in the Federal Triangle manner: a street wall on the z=0 side (lidar roof 10)
// stepping back to four storeys and a five-storey core with a penthouse (lidar 16-17), both on the solid footprint.
// Lidar roof heights are smoothed (3x3 median over the footprint) and snapped to the storey tops 5, 8, 11, 14, 17.
// Storeys are 3 blocks (a spandrel band and two rows of glass); the ground storey is 4 (base course, shopfront glass,
// transom). Every column is solid from y 0 up to its top, so nothing floats and no storey is empty under a tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87051.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87051.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));

// Storey tops above y 0, snapped from the smoothed lidar roof.
const TOPS = [5, 8, 11, 14, 17];
const snap = (h) => TOPS.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a));
const TOP = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  TOP.set(key(c.x, c.z), snap(vals[vals.length >> 1]));
}
const T = (x, z) => TOP.get(key(x, z)) ?? 0;
const inV = (x, y, z) => inF(x, z) && y >= 0 && y < T(x, z);                       // the solid massing
const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const bnd = (x, y, z) => NB.some(([dx, dy, dz]) => !inV(x + dx, y + dy, z + dz));  // touches air: a shell voxel
const FACES = [["n", 0, -1], ["s", 0, 1], ["w", -1, 0], ["e", 1, 0]];              // outward normals
const faceOf = (x, y, z) => FACES.find(([, dx, dz]) => !inV(x + dx, y, z + dz));

// Palette: Indiana-style limestone (calcite and stone bricks), granite plinth, blue-grey glass, roof deck.
const BASE = "polished_granite";
const STONE = "stone_bricks";
const WALL = "calcite";
const BAND = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";
const DECK = "smooth_stone";
const LAMP = "glowstone";
const AC = "iron_block";
const DOOR = "dark_oak_door";

const STOREY_BASES = [5, 8, 11, 14];          // spandrel band rows above the ground storey (ground storey = rows 1-4)
const FLOOR_LINES = [1, ...STOREY_BASES];     // interior floor slabs
const ENTRANCE_X = 13;                        // the door on the z=0 face; its surround spans 12-14
const glassBay = (u) => u % 3 !== 0;          // two panes, then a calcite pier

const panes = (face) => (face === "n" || face === "s")
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" };

function facade(x, y, z, face, t) {
  const u = face === "n" || face === "s" ? x : z;
  if (y === 0 || y === 1) return BASE;                                             // plinth and base course
  if (y === t - 1) return STONE;                                                   // parapet
  if (y === t - 2 && t - 2 > 4) return STONE;                                      // cornice
  if (y === 4) return STONE;                                                       // ground transom
  if (STOREY_BASES.includes(y)) return BAND;                                       // spandrel bands, lighter than the cornice
  if (face === "n" && z === 0 && x >= ENTRANCE_X - 1 && x <= ENTRANCE_X + 1 && (y === 2 || y === 3)) {
    return x === ENTRANCE_X ? DOOR : STONE;                                        // door in a stone surround
  }
  return glassBay(u) ? GLASS : WALL;
}

const g = new Voxels([28, 29, 24]);
const glassN = [];                                                                  // north-face glass, for the lamps

for (const c of F.values()) {
  const { x, z } = c, t = T(x, z);
  for (let y = 0; y < c.g; y++) g.set(x, y, z, BASE);                              // foundation to the cell's ground
  for (let y = 0; y < t; y++) {
    if (!bnd(x, y, z)) {                                                           // interior: air, with floor slabs
      if (y < t - 1 && FLOOR_LINES.includes(y)) g.set(x, y, z, DECK);
      continue;
    }
    if (y === t - 1 && !inV(x, y + 1, z)) {                                        // roof: parapet on the edge, deck inside
      g.set(x, y, z, faceOf(x, y, z) ? STONE : DECK);
      continue;
    }
    const face = faceOf(x, y, z);
    if (y === 0 || !face) { g.set(x, y, z, BASE); continue; }
    const name = facade(x, y, z, face[0], t);
    if (name === DOOR) {
      const st = { facing: "south", hinge: "left", open: "false", powered: "false" };
      g.set(x, y, z, DOOR, { ...st, half: y === 2 ? "lower" : "upper" });
    } else if (name === GLASS) {
      g.set(x, y, z, GLASS, panes(face[0]));
      if (face[0] === "n") glassN.push([x, y, z]);
    } else {
      g.set(x, y, z, name);
    }
  }
}

// Warm light behind some north-face glass: one air cell inside the glass, where the room is.
for (const [x, y, z] of glassN) {
  if ((x * 7 + y * 5) % 11 !== 0) continue;
  if (inV(x, y, z + 1) && !bnd(x, y, z + 1)) g.set(x, y, z + 1, LAMP);
}

// Roof plant: AC units on the flat wing roofs (set in from the parapet), and a penthouse on the core.
for (const c of F.values()) {
  const { x, z } = c, t = T(x, z);
  if (t !== 11) continue;
  const inset = NB.slice(0, 4).every(([dx, dz]) => inF(x + dx, z + dz) && T(x + dx, z + dz) >= 11);
  if (inset && (x * 5 + z * 3) % 13 === 0) g.set(x, t, z, AC);
}
const PH = { x0: 11, x1: 18, z0: 6, z1: 9, y0: 17, y1: 18 };
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) if (T(x, z) !== 17) throw new Error(`penthouse cell ${x},${z} is not on the core`);
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  const face = x === PH.x0 ? "w" : x === PH.x1 ? "e" : z === PH.z0 ? "n" : "s";
  if (edge) {
    const u = face === "n" || face === "s" ? x : z;
    g.set(x, PH.y0, z, glassBay(u) ? GLASS : WALL, glassBay(u) ? panes(face) : undefined);
    g.set(x, PH.y1, z, WALL);
    g.set(x, PH.y1 + 1, z, STONE);                                                // coping
  } else {
    g.set(x, PH.y1 + 1, z, DECK);                                                 // penthouse roof
  }
}
const stats = g.save(OUT);
console.log(`DC87051: ${stats.blocks} blocks, palette ${stats.palette}`);
