// 3550 West Pacific Av (Miscellaneous / Mixed-Use), Presidio Tunnel Tops.
// Read from the record: roof about 7 blocks above the lowest ground, footprint 28 x 35. That is three storeys of two
// blocks each on a 1-block red-tile cornice: a 1930s-era stucco mixed-use block (cream stucco, a dark wood shopfront
// with a green awning over the entrance on the street side, clear sash windows between quartz belts, a red-tile rim at
// the roof line). Downhill cells (ground 0) keep one extra base course; the uphill cells sit on a stone foundation fill.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const OUT = `${DIR}/201006.0002548.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/201006.0002548.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [28, 8, 35];
const ROOF = 6;            // red-tile cornice course; the roof deck top face sits at 7 above the lowest ground
const BELT = 4;            // quartz floor line between the upper storeys
const S2 = 3, S3 = 5;      // upper window rows
const EQUIP = 7;           // HVAC boxes on the roof

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIRS = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const shell = (x, z) => inside(x, z) && faces(x, z).length > 0;

// The street side is the south-west edge (faces -x or +z): shopfronts there, residential windows elsewhere.
function facadeOf(x, z) {
  const fs = faces(x, z);
  const n = fs.find(([nx, nz]) => nx === -1 || nz === 1) ?? fs[0];
  return { n, commercial: n[0] === -1 || n[1] === 1, along: n[0] !== 0 ? z : x };
}

// One door bay per street facade, 12 blocks apart; a 3-wide awning over each.
const doorKeys = new Set();
const canopyKeys = new Set();
for (const [x, z] of cells) {
  if (!shell(x, z)) continue;
  const { n, commercial, along } = facadeOf(x, z);
  if (!commercial || along % 12 !== 6) continue;
  doorKeys.add(`${key(...n)}:${along}`);
  for (const d of [-1, 0, 1]) canopyKeys.add(`${key(...n)}:${along + d}`);
}

const glassState = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const g = new Voxels(SIZE);
const counts = { walls: 0, glass: 0, doors: 0, lights: 0 };

for (const [x, z, gr] of cells) {
  // Foundation fill under every cell (nothing floats on a slope).
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!shell(x, z)) {
    // Interior: a floor slab per storey and the roof, air between (the air is the gap behind the glass).
    for (const y of [0, 2, 4]) if (y >= gr) g.set(x, y, z, "smooth_stone");
    g.set(x, ROOF, z, "smooth_stone");
    continue;
  }

  const { n, commercial, along } = facadeOf(x, z);
  const fk = key(...n);
  const isDoor = commercial && doorKeys.has(`${fk}:${along}`);
  const isCanopy = commercial && canopyKeys.has(`${fk}:${along}`);
  const pilaster = along % 4 === 0;                 // a column of quartz between the glass bays
  const door = DIRS[fk];
  const glass = (y) => {
    g.set(x, y, z, "glass_pane", glassState(n)); counts.glass++;
    // Some windows are lit: a glowstone in the air gap behind the pane.
    const ix = x - n[0], iz = z - n[1];
    if (inside(ix, iz) && !shell(ix, iz) && (along * 3 + y) % 7 === 0) { g.set(ix, y, iz, "glowstone"); counts.lights++; }
  };
  const wall = (y, block) => { g.set(x, y, z, block); counts.walls++; };

  // Walls: everything from the lowest course to the cornice, cell by cell. A door sits on its cell's own ground:
  // rows 1-2 on the uphill cells, rows 0-1 (glass transom above) on the downhill ones.
  const doorRow = gr === 0 ? 0 : 1;
  const door2 = (y) => {
    const half = y === doorRow ? "lower" : "upper";
    g.set(x, y, z, "dark_oak_door", { facing: door, half, hinge: "left", open: "false", powered: "false" }); counts.doors++;
  };
  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { wall(y, "red_terracotta"); continue; }                        // red-tile rim
    if (y === BELT) { wall(y, "smooth_quartz"); continue; }                         // quartz floor line
    if (isDoor && (y === doorRow || y === doorRow + 1)) { door2(y); continue; }
    if (isDoor && gr === 0 && y === 2) { glass(y); continue; }                       // transom above the downhill door
    if (y === 0) { wall(y, "stone_bricks"); continue; }                              // base course (downhill cells)

    if (y === 1 || y === 2) {
      if (commercial && y === 2) { wall(y, "dark_oak_planks"); continue; }          // shop sign band
      if (pilaster) { wall(y, "smooth_quartz"); continue; }
      glass(y); continue;
    }
    if (y === S2 || y === S3) {
      if (isCanopy && y === S2) { wall(y, "green_wool"); continue; }                // awning over the entrance
      if (pilaster) { wall(y, "smooth_quartz"); continue; }
      glass(y); continue;
    }
    // Stucco between the glass (a plain cream wall in every other row).
    wall(y, "white_concrete");
  }
}

// Roof plant: two HVAC boxes on the flat roof, each on the nearest 2x2 of roof cells that are all interior.
const interior = (x, z) => inside(x, z) && !shell(x, z);
function nearest2x2(tx, tz) {
  let best = null, bd = Infinity;
  for (const [x, z] of cells) {
    if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => interior(x + dx, z + dz))) continue;
    const d = (x - tx) ** 2 + (z - tz) ** 2;
    if (d < bd) { bd = d; best = [x, z]; }
  }
  return best;
}
for (const [tx, tz] of [[12, 16], [19, 11]]) {
  const p = nearest2x2(tx, tz);
  if (!p) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(p[0] + dx, EQUIP, p[1] + dz, "light_gray_concrete");
}

const stats = g.save(OUT);
console.log(JSON.stringify({ ...counts, ...stats }));
