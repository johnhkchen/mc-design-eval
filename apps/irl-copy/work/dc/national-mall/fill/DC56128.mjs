// 701 Pennsylvania Ave NW, the Naval Heritage Center (Commercial-Office-Large), Penn Quarter. Read from the lidar record:
// a 1980s-style office in pale limestone-tone concrete over a dark granite plinth, with blue-tinted glass in punched
// window bays. Five storeys of 3 blocks on a 4-block ground storey (shopfronts, granite belt course), a 13-block low ring
// on the street edges, a 16-block band, a 17-block main body and a 19-block centre bar, stepping back as it rises.
// Lidar roofs are median-smoothed over each cell's 3x3 footprint neighbours and snapped to five flat tiers. Mechanical
// units stand on the 17-block roof. Solid massing from y 0 to each tier; the walls are 2 cells thick, with an air pocket
// behind each window (some with glowstone) and a solid floor slab across every storey, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC56128.cells.json`, "utf8"));
const X = 28, Y = 20, Z = 30;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const has = (x, z) => raw.has(key(x, z));
const snap = (s) => (s <= 13 ? 13 : s <= 15 ? 14 : s === 16 ? 16 : s <= 18 ? 17 : 19);

// Per cell: ground g and a smoothed, snapped roof tier R (the column is solid from y 0 up to R).
const cell = new Map();
for (const [x, z, g] of cells) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) v.push(raw.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  cell.set(key(x, z), { g, R: snap(v[v.length >> 1]) });
}
const tierAt = (x, z) => cell.get(key(x, z))?.R ?? -1;

// Solid massing. y < 0 is ground (solid); outside the box is air.
const solidAt = (x, y, z) => {
  if (y < 0) return true;
  if (x < 0 || x >= X || z < 0 || z >= Z || y >= Y) return false;
  const c = cell.get(key(x, z));
  return !!c && y < c.R;
};
const id = (x, y, z) => (z * Y + y) * X + x;
const HORIZ = [[0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0]];   // outward normals, z faces first (corners take z)
const SIX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

// Shell depth: 1 = touches air, 2 = behind that, and so on (6-connected through solid).
const dist = new Int16Array(X * Y * Z).fill(-1);
let queue = [];
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  if (!solidAt(x, y, z)) continue;
  if (SIX.some(([dx, dy, dz]) => !solidAt(x + dx, y + dy, z + dz))) { dist[id(x, y, z)] = 1; queue.push([x, y, z]); }
}
for (let q = 0; q < queue.length; q++) {
  const [x, y, z] = queue[q], d = dist[id(x, y, z)];
  for (const [dx, dy, dz] of SIX) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z || !solidAt(nx, ny, nz)) continue;
    if (dist[id(nx, ny, nz)] < 0) { dist[id(nx, ny, nz)] = d + 1; queue.push([nx, ny, nz]); }
  }
}
const depth = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? 0 : dist[id(x, y, z)]);

// Facade rules. Axis of a wall face: z faces run along x, x faces run along z. Piers every 3rd block.
const GLASS = (n) => ({ glass: true, n, b: "light_blue_stained_glass_pane",
  st: n[2] !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                 : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } });
const B = (b, st) => ({ b, st });
const granite = B("polished_granite");

function skin(x, y, z, R, n) {
  if (y === R - 1) return granite;                       // parapet cap on the outside edge
  // Street-front entrance: two-wide double door on the z=0 face, lanterns either side.
  if (z === 0 && n[2] === -1 && (x === 13 || x === 14) && (y === 1 || y === 2)) {
    return B("dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 13 ? "left" : "right", open: "false", powered: "false" });
  }
  if (z === 0 && n[2] === -1 && (x === 12 || x === 15) && y === 2) return B("lantern", { hanging: "false", waterlogged: "false" });
  const s = n[2] !== 0 ? x : z;                          // position along the wall
  const pier = s % 3 === 0;
  if (y === 0) return granite;                           // plinth
  if (y <= 2) return pier ? granite : GLASS(n);          // ground storey shopfront
  if (y === 3) return granite;                           // belt course over shopfronts
  const b0 = 4 + 3 * Math.floor((y - 4) / 3);            // upper storey: spandrel, two rows of window
  if (y === b0) return B("light_gray_concrete");
  return pier ? B("white_concrete") : GLASS(n);
}

// Classify every shell voxel; a column's interior is stone, and its top is roof membrane.
const out = new Map();                                   // "x,y,z" -> spec
const k3 = (x, y, z) => `${x},${y},${z}`;
for (const [kk, { R }] of cell) {
  const [x, z] = kk.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    const d = depth(x, y, z);
    const n = HORIZ.find(([dx, , dz]) => !solidAt(x + dx, y, z + dz));
    if (d === 1 && n) out.set(k3(x, y, z), skin(x, y, z, R, n));
    else if (d === 1 && y === R - 1) out.set(k3(x, y, z), B("gray_concrete"));   // roof membrane
    else out.set(k3(x, y, z), B("stone"));                                       // core and floor slabs
  }
}

// Air pockets: the cell behind each window is air (or a glowstone lamp), with the solid core behind it.
const pocketCells = new Set();
for (const [kk, s] of out) {
  if (!s.glass) continue;
  const [x, y, z] = kk.split(",").map(Number);
  const ix = x - s.n[0], iz = z - s.n[2];
  if (depth(ix, y, iz) === 2) pocketCells.add(k3(ix, y, iz));
}
// A lamp stands on solid: only the lowest cell of a pocket, with stone under it, takes a glowstone.
const pockets = new Map();
for (const p of pocketCells) {
  const [x, y, z] = p.split(",").map(Number);
  const below = k3(x, y - 1, z);
  const lit = (x * 7 + y * 5 + z * 3) % 9 === 0 && out.has(below) && !pocketCells.has(below);
  pockets.set(p, lit ? "glowstone" : null);
}

// Write the walls.
const g = new Voxels([X, Y, Z]);
for (const [kk, s] of out) {
  const [x, y, z] = kk.split(",").map(Number);
  if (pockets.has(kk)) { const lamp = pockets.get(kk); if (lamp) g.set(x, y, z, lamp); continue; }   // air unless lit
  g.set(x, y, z, s.b, s.st);
}

// Mechanical units on the 17-block roof: a 2x2 concrete pad with a plant box on top, only where all four stand on 17+ columns.
for (const [kk, { R }] of cell) {
  if (R !== 17) continue;
  const [x, z] = kk.split(",").map(Number);
  if (x % 6 !== 3 || z % 6 !== 3) continue;
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]];
  if (!quad.every(([dx, dz]) => tierAt(x + dx, z + dz) >= 17)) continue;
  for (const [dx, dz] of quad) g.set(x + dx, 17, z + dz, "light_gray_concrete");
  g.set(x, 18, z, "iron_block");
}

// Check: every block has something under it, except the ceilings of sealed window pockets (floor slabs and the roof
// membrane over an air gap, held up by the walls around it).
let floating = 0, ceilings = 0;
for (let z = 0; z < Z; z++) for (let y = 1; y < Y; y++) for (let x = 0; x < X; x++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  if (pockets.has(k3(x, y - 1, z))) ceilings++; else floating++;
}
const r = g.save(`${dir}/DC56128.nbt`);
console.log(`DC56128: ${r.blocks} blocks, palette ${r.palette}, pocket ceilings ${ceilings}, floating ${floating}`);
