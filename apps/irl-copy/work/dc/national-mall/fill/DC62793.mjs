// DC62793: 20 Massachusetts Ave NW, a Hotel-Large as a 1.21.1 module. Read from the record: a 1900s-1920s commercial
// hotel in the DC manner, red brick walls on a granite base, pale limestone-look string courses and a cornice, a
// stone-piered window grid, a shopfront-and-canopy entrance on the long (+z) front. Lidar roof heights are smoothed
// (3x3 median over the footprint) and snapped to a few tops (4, 8, 12, 13, 15), so the core stands 4 storeys over
// 3-storey wings, with a setback where they meet. Each storey is 3 blocks of window or wall plus a course at y 3, 7
// and 11. Every column is solid from y 0 up to its tier: foundation below the cell's ground, a floor at its ground
// level and at each storey line, a ceiling under the roof. Interior is air (an air gap behind the glass), no furniture.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62793.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62793.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 0-1 gaps drop out).
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  c.R = snap(vals[vals.length >> 1]);
}
function snap(h) { return h <= 4 ? 4 : h <= 8 ? 8 : h <= 12 ? 12 : h <= 13 ? 13 : 15; }

// Palette
const FOUND = "polished_granite";   // foundation below the ground, the base course on the street
const STONE = "stone_bricks";       // piers between the windows, the lintel
const BRICK = "bricks";             // the walls
const LIME = "calcite";             // string courses, sills and the cornice (pale limestone)
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";       // floor slabs and ceilings inside
const ROOF = "stone";               // roof membrane
const PARAPET = "stone_brick_wall";
const BLACK = "black_concrete";     // entrance canopy
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const MECH = "iron_block";

const FLOORS = new Set([3, 7, 11]);             // storey lines (floor course under each storey)
const WINDOWS = new Set([1, 2, 5, 6, 9, 10, 13]);   // brick spandrel under each string course at 4, 8, 12
const DIRS = [[0, 1], [1, 0], [-1, 0], [0, -1]]; // +z (the long front) first

const g = new Voxels([43, 27, 26]);

// Faces that need a wall at layer y: the outside of the footprint, or a neighbour whose roof is at or below y + 1
// (the setback face of a taller core). Outside faces win for the pattern.
function faces(c, y) {
  const out = [], set = [];
  for (const [dx, dz] of DIRS) {
    const n = F.get(key(c.x + dx, c.z + dz));
    if (!n) out.push([dx, dz]);
    else if (n.R <= y + 1) set.push([dx, dz]);
  }
  return { out, all: [...out, ...set] };
}

const isDoor = (c) => c.z === 25 && (c.x === 20 || c.x === 21) && c.g <= 1;
const entranceBay = (c) => c.z === 25 && c.x >= 18 && c.x <= 23;

for (const c of F.values()) {
  const R = c.R;
  // foundation under the ground
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, FOUND);
  for (let y = c.g; y < R; y++) {
    const { out, all } = faces(c, y);
    if (!all.length) {
      // interior: floor at ground and storey lines, ceiling under the roof, roof membrane on top; air between
      if (y === c.g || FLOORS.has(y) || y === R - 2) g.set(c.x, y, c.z, FLOOR);
      else if (y === R - 1) g.set(c.x, y, c.z, ROOF);
      continue;
    }
    const [dx, dz] = (out.length ? out : all)[0];
    const idx = dz !== 0 ? c.x : c.z;          // position along the face
    const inward = [c.x - dx, c.z - dz];
    const pier = idx % 3 === 0;

    if (y === 0 && c.g === 0) { g.set(c.x, y, c.z, FOUND); continue; }   // base course
    if (y === R - 1) { g.set(c.x, y, c.z, LIME); continue; }           // cornice

    // the front entrance: doors in the two middle cells, glass either side, a dark canopy over, stone lintel above
    if (dz === 1 && out.length && entranceBay(c)) {
      if (y === 3) { g.set(c.x, y, c.z, BLACK); continue; }
      if (y === 4) { g.set(c.x, y, c.z, STONE); continue; }
      if (y <= 2 && isDoor(c)) {
        const st = { facing: "south", hinge: "left", open: "false", powered: "false" };
        g.set(c.x, y, c.z, DOOR, { ...st, half: y === c.g ? "lower" : "upper" });
        continue;
      }
      if (y <= 2 && (c.x === 19 || c.x === 22)) { g.set(c.x, y, c.z, GLASS); continue; }
      if (y <= 2) { g.set(c.x, y, c.z, STONE); continue; }
    }

    if (FLOORS.has(y)) { g.set(c.x, y, c.z, LIME); continue; }         // string course

    if (WINDOWS.has(y)) {
      if (pier) { g.set(c.x, y, c.z, STONE); continue; }
      g.set(c.x, y, c.z, GLASS);
      // warm light behind the glass in some windows: a glowstone on the room side, on a shelf
      const room = F.get(key(...inward));
      const lit = (y === 5 || y === 9) && idx % 6 === 2 && room && !faces(room, y).all.length;
      if (lit && !g.get(inward[0], y, inward[1])) {
        g.set(inward[0], y - 1, inward[1], FLOOR);             // a shelf under the lamp
        g.set(inward[0], y, inward[1], LAMP);
      }
      continue;
    }
    g.set(c.x, y, c.z, BRICK);
  }

  // parapet on the outside edge of the roof
  if (c.g < R && faces(c, R).out.length) g.set(c.x, R, c.z, PARAPET);
}

// Roof plant on the core: a mechanical penthouse block on a grid of 4, set in from the edge.
for (const c of F.values()) {
  if (c.R !== 15 || c.x % 4 !== 1 || c.z % 4 !== 1) continue;
  let deep = true;
  for (let dx = -2; dx <= 2 && deep; dx++) for (let dz = -2; dz <= 2 && deep; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (!n || n.R < 15) deep = false;
  }
  if (!deep) continue;
  g.set(c.x, 15, c.z, STONE); g.set(c.x, 16, c.z, MECH);
}

const r = g.save(OUT);
console.log(`saved ${OUT}: ${r.blocks} blocks, ${r.palette} palette entries`);
