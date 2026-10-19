// DC75961: Commercial-Office-Large, 400 1st St NW, Washington DC 20534, as a 1.21.1 module (0.42 blocks per metre).
// Read as a mid-century office block of pale precast concrete on a stone base: a three-storey podium (12 blocks, the
// lidar's 11-12 roof) with a two-block plant tower (14 blocks, the lidar's 13-14) set in the middle, so the massing
// steps up once and stays a clear block at a glance. Storeys are 4 blocks (3 of room + 1 course), because a 1-block
// storey cannot carry a window. Every column is solid from y 0 up to its ground, so nothing floats; interior cells
// are air behind the glass except one floor slab per storey, and glowstone lamps stand on those floors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75961.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75961.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar gaps and noise drop out).
const roof = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  roof.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Two massing tiers: the podium tops out at 12 (three storeys + cornice + parapet), the plant tower at 14.
const topOf = (c) => (roof.get(key(c.x, c.z)) >= 13 ? 14 : 12);

// Palette
const STONE = "stone_bricks";          // plinth, storey courses, cornice
const PIER = "white_concrete";         // precast piers and spandrels
const GLASS = "light_blue_stained_glass_pane";
const FLOOR = "smooth_stone";          // interior floor slabs and the roof membrane
const PARAPET = "stone_brick_wall";
const LOUVRE = "iron_bars";            // plant-tower louvres
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const AC = "iron_block";

const g = new Voxels([22, 16, 14]);

const outward = (c) => DIRS.filter(([dx, dz]) => !inF(c.x + dx, c.z + dz));
const shell = (c) => outward(c).length > 0;
// Piers sit on every third cell along a face; corners are always piers. Glass fills the bays between.
const isPier = (c) => {
  const o = outward(c);
  const outZ = o.some(([, dz]) => dz !== 0), outX = o.some(([dx]) => dx !== 0);
  if (outZ && outX) return true;
  if (outZ) return c.x % 3 === 0;
  if (outX) return c.z % 3 === 0;
  return false;
};

// Entrance: a double dark-oak door in the middle of the south (+z) face, under a stone lintel.
const FRONT_Z = 13;
const doorCells = new Set([key(10, FRONT_Z), key(11, FRONT_Z)]);
const lintelCells = [8, 9, 10, 11, 12, 13].map((x) => key(x, FRONT_Z));

const lit = (c, k) => (c.x * 7 + c.z * 13 + k * 5) % 7 === 0;

for (const c of F.values()) {
  const T = topOf(c);
  const core = T === 14;
  const sh = shell(c);
  const pier = sh && isPier(c);
  for (let y = 0; y < T; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, STONE); continue; }                      // foundation under the cell's ground
    if (y === T - 1) { g.set(c.x, y, c.z, sh ? STONE : FLOOR); continue; }     // cornice or roof membrane
    const k = Math.floor(y / 4), r = y % 4;
    if (!sh) { if (r === 0) g.set(c.x, y, c.z, FLOOR); continue; }             // interior: one floor slab per storey, air elsewhere
    if (r === 0) { g.set(c.x, y, c.z, core && k === 3 ? (pier ? PIER : LOUVRE) : STONE); continue; } // string course; plant louvres at the tower top
    if (k === 0 && c.z === FRONT_Z && y <= 2 && doorCells.has(key(c.x, c.z))) {
      g.set(c.x, y, c.z, DOOR, { facing: "south", half: y === 1 ? "lower" : "upper", hinge: c.x === 10 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (k === 0 && c.z === FRONT_Z && r === 3 && lintelCells.includes(key(c.x, c.z))) {
      g.set(c.x, y, c.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (r === 3) { g.set(c.x, y, c.z, PIER); continue; }                       // spandrel below the next course
    g.set(c.x, y, c.z, pier ? PIER : GLASS);                                   // window band
  }
  if (sh && !core) g.set(c.x, T, c.z, PARAPET);                                // parapet on the podium edge
  if (!sh && !core && c.x % 4 === 1 && c.z % 4 === 1) g.set(c.x, T, c.z, AC);  // roof units on the podium terrace
}

// Warm lights: some glazed bays on the three office storeys show a glowstone lamp on the floor just inside.
for (const c of F.values()) {
  if (!shell(c) || isPier(c) || topOf(c) === 14) continue;
  const o = outward(c);
  const sx = o.some(([dx]) => dx !== 0) ? -Math.sign(o.find(([dx]) => dx !== 0)[0]) : 0;
  const sz = o.some(([, dz]) => dz !== 0) ? -Math.sign(o.find(([, dz]) => dz !== 0)[1]) : 0;
  const ix = c.x + sx, iz = c.z + sz;
  if (!inF(ix, iz) || shell(F.get(key(ix, iz)))) continue;
  for (let k = 0; k < 3; k++) {
    if (!lit(c, k) || doorCells.has(key(c.x, c.z))) continue;
    if (c.z === FRONT_Z && k === 0) continue;                                  // keep the shopfront clear
    g.set(ix, 4 * k + 1, iz, LAMP);
  }
}

const res = g.save(OUT);
console.log(`DC75961: ${res.blocks} blocks, palette ${res.palette}`);
