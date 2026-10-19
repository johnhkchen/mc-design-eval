// 3550 West Pacific Av (Miscellaneous / Mixed-Use), Presidio Tunnel Tops.
// Read from the record: roof about 8 blocks above the lowest ground, footprint 14 x 24, all cells on one level (ground 0).
// That is a 1920s-era stucco mixed-use block of three storeys: a shopfront ground floor (dark wood piers, glass, a sign
// band, green awnings over the doors) on the street side, cream stucco piers between clear sash windows above, a quartz
// storey line at the second floor, a single row of attic windows under a red-tile cornice, and two HVAC boxes on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const OUT = `${DIR}/201006.0005341.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/201006.0005341.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [14, 9, 24];
const CORNICE = 7;         // red-tile cornice; the roof deck sits under it at y 7 (top face of the cornice is 8 above the ground)
const BELT = 5;            // quartz storey line between the second floor and the attic
const SIGN = 2;            // dark wood sign band over the shopfront
const CANOPY = 3;          // green awning over each entrance
const EQUIP = 8;           // HVAC boxes on the roof
const FLOORS = [0, 3, 5];  // interior floor slabs (ground, second, attic)

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

// One entrance per street facade every 10 blocks, a 3-wide awning over each.
const doorKeys = new Set();
const canopyKeys = new Set();
for (const [x, z] of cells) {
  if (!shell(x, z)) continue;
  const { n, commercial, along } = facadeOf(x, z);
  if (!commercial || along % 10 !== 5) continue;
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
    // Interior: floor slabs, the roof deck, and air between (the air is the gap behind the glass).
    for (const y of FLOORS) if (y >= gr) g.set(x, y, z, "smooth_stone");
    g.set(x, CORNICE, z, "smooth_stone");
    continue;
  }

  const { n, commercial, along } = facadeOf(x, z);
  const fk = key(...n);
  const isDoor = commercial && doorKeys.has(`${fk}:${along}`);
  const isCanopy = commercial && canopyKeys.has(`${fk}:${along}`);
  const pier = along % 4 === 0 || along % 4 === 3;      // stucco piers, two window columns between them
  const door = DIRS[fk];
  const glass = (y) => {
    g.set(x, y, z, "glass_pane", glassState(n)); counts.glass++;
    // Some windows are lit: a glowstone in the air gap behind the pane (never in a floor slab).
    const ix = x - n[0], iz = z - n[1];
    if (inside(ix, iz) && !shell(ix, iz) && [1, 2, 4, 6].includes(y) && (along * 3 + y) % 7 === 0) {
      g.set(ix, y, iz, "glowstone"); counts.lights++;
    }
  };
  const wall = (y, block) => { g.set(x, y, z, block); counts.walls++; };
  const door2 = (y) => {
    const half = y === 1 ? "lower" : "upper";
    g.set(x, y, z, "dark_oak_door", { facing: door, half, hinge: "left", open: "false", powered: "false" }); counts.doors++;
  };

  for (let y = gr; y <= CORNICE; y++) {
    if (y === CORNICE) { wall(y, "red_terracotta"); continue; }                  // red-tile cornice
    if (y === BELT) { wall(y, "smooth_quartz"); continue; }                      // quartz storey line
    if (y === 0) { wall(y, "stone_bricks"); continue; }                          // base course
    if (isDoor && (y === 1 || y === 2)) { door2(y); continue; }
    if (isCanopy && y === CANOPY) { wall(y, "green_wool"); continue; }           // awning over the entrance
    if (y <= 2 && commercial) {
      if (y === SIGN) { wall(y, "dark_oak_planks"); continue; }                  // shop sign band
      if (pier) { wall(y, "dark_oak_log"); continue; }                           // dark wood shopfront piers
      glass(y); continue;
    }
    // Cream stucco piers and clear sash windows above the shopfront line.
    if (pier) { wall(y, "white_terracotta"); continue; }
    glass(y);
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
for (const [tx, tz] of [[4, 17], [10, 9]]) {
  const p = nearest2x2(tx, tz);
  if (!p) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(p[0] + dx, EQUIP, p[1] + dz, "light_gray_concrete");
}

const stats = g.save(OUT);
console.log(JSON.stringify({ ...counts, ...stats }));
