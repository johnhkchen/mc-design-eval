// FR245184459: a residential block of 1900 on the Paris footprint (52 x 77 cells, 1880 built). Haussmann massing: a stone
// plinth, a ground storey, then calcite storeys with a smooth-stone string course at every floor line and glass between
// calcite piers. Where the lidar carries the cell high, a deepslate mansard steps in one cell per row with dormers; the low
// wings are flat stone roofs. The lidar roof is smoothed over each cell's 3x3 neighbourhood and snapped to 3-block tiers.
// Walls are one block thick with an air gap behind the glass (glowstone in some), and every floor slab rests on the wall
// below it. Chimney stacks stand on the flat tops of the deep interior.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184459.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184459.nbt";
const SIZE = [52, 43, 77];

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = new Map([["1,0", "east"], ["-1,0", "west"], ["0,1", "south"], ["0,-1", "north"]]);
const key = (x, z) => `${x},${z}`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(key(x, z), { x, z, g, r });
const at = (x, z) => fp.get(key(x, z));

// Wall top: the lidar roof's median over the 3x3 neighbourhood, snapped to 3-block tiers, at least 3 above the ground.
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
for (const c of fp.values()) {
  const around = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) around.push(n.r); }
  c.top = Math.max(c.g + 3, Math.round(median(around) / 3) * 3);
}

// Distance in cells from the outside edge (1 on any cell with a neighbour outside the footprint): the mansard steps in by it.
const queue = [];
for (const c of fp.values()) if (DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { c.d = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && !n.d) { n.d = c.d + 1; queue.push(n); } }
}

// Storeys from the ground up: a 5-block ground storey, then 4-block floors (at most five walled storeys). What is left
// over becomes a mansard when it is 3 or more; under that the last storey takes it, so the roof is flat.
function storeys(H) {
  const walls = []; let rem = H;
  if (rem >= 5) { walls.push(5); rem -= 5; }
  while (walls.length && walls.length < 5 && rem >= 7) { walls.push(4); rem -= 4; }
  if (!walls.length) return { walls: [H], attic: 0 };
  if (rem >= 3) return { walls, attic: rem };
  walls[walls.length - 1] += rem;
  return { walls, attic: 0 };
}
for (const c of fp.values()) {
  const s = storeys(c.top - c.g);
  c.attic = s.attic;
  c.floors = [];
  let f = c.g;
  for (const h of s.walls) { c.floors.push({ y: f, h }); f += h; }
  c.Ew = f;                   // the walls' top: the mansard (or flat roof) starts here
  c.rs = c.Ew + c.attic;      // the roof's top surface
}

// A facade cell is one with a neighbour outside the footprint, or a neighbour whose walls end below this height.
const exposed = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.Ew <= y; });
const slotOf = (c, y) => { const k = c.floors.findIndex((s) => y >= s.y && y < s.y + s.h); return { ...c.floors[k], k, t: y - c.floors[k].y }; };

// The entrance: the cell on the north edge nearest the middle of the footprint (x 26).
const doorCell = [...fp.values()].filter((c) => !at(c.x, c.z - 1)).sort((a, b) => Math.abs(a.x - 26) - Math.abs(b.x - 26))[0];

// Dormers sit in the mansard's sloping face; each is a glass pane with its inner cell hollowed to air behind it.
const dormers = new Set(), holes = new Set();
for (const c of fp.values()) {
  for (let j = 1; j <= c.attic - 2; j++) {
    if (c.d !== j + 1 || (c.x * 2 + c.z) % 7 !== 0) continue;
    const inward = DIRS.map(([dx, dz]) => at(c.x + dx, c.z + dz)).find((n) => n && n.d === c.d + 1);
    dormers.add(`${c.x},${c.Ew + j},${c.z}`);
    if (inward) holes.add(`${inward.x},${c.Ew + j},${inward.z}`);
  }
}

const g = new Voxels(SIZE);
const glass = [], lamps = [];

function door(y, s, ox) {
  const facing = ox !== 0 ? "east" : "north";
  const st = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  g.set(doorCell.x, y, doorCell.z, "dark_oak_door", st(s.t === 1 ? "lower" : "upper"));
}

function facade(c, y, out) {
  const s = slotOf(c, y);
  const [ox] = out[0];
  if (c === doorCell && s.k === 0 && (s.t === 1 || s.t === 2)) return door(y, s, ox);
  if (c === doorCell && s.k === 0 && s.t === 3) return g.set(c.x, y, c.z, "smooth_stone");     // lintel over the door
  if (s.k === 0 && s.t === 0) return g.set(c.x, y, c.z, "stone_bricks");                       // plinth
  if (s.t === 0 || s.t === s.h - 1) return g.set(c.x, y, c.z, "smooth_stone");                 // string courses, cornice
  if ((c.x + c.z) % 3 !== 0) {
    glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, "glass_pane");
    const inward = at(c.x - out[0][0], c.z - out[0][1]);
    if (s.t === 1 && (c.x * 5 + c.z * 3 + s.k * 7) % 9 === 0 && inward && inward.d === 2 && !exposed(inward, y).length) lamps.push([inward.x, y, inward.z]);
    return;
  }
  g.set(c.x, y, c.z, "calcite");                                                               // pier
}

for (const c of fp.values()) {
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "stone");                                   // foundation
  for (let y = c.g; y < c.Ew; y++) {
    const out = exposed(c, y);
    if (out.length) { facade(c, y, out); continue; }
    if (c.d >= 3) g.set(c.x, y, c.z, "stone");                                                 // solid core
    else if (c.floors.some((s) => s.y === y)) g.set(c.x, y, c.z, "oak_planks");               // floor slab, air gap above
    else if (!c.attic && y === c.Ew - 1) g.set(c.x, y, c.z, "stone_bricks");                  // flat roof deck
  }
  for (let j = 0; j < c.attic; j++) {
    const y = c.Ew + j, k = `${c.x},${y},${c.z}`;
    if (c.d < j + 1 || holes.has(k)) continue;
    if (dormers.has(k)) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, "glass_pane"); continue; }
    g.set(c.x, y, c.z, "cobbled_deepslate");
  }
  if (c.d >= 3 && (c.x * 7 + c.z * 11) % 53 === 0 && (!c.attic || c.d >= c.attic)) {
    for (let y = c.rs; y < c.rs + 3; y++) g.set(c.x, y, c.z, "bricks");                        // chimney stack
  }
}

for (const [x, y, z] of lamps) g.set(x, y, z, "glowstone");

// Panes join the neighbours that are built, as they would in the world.
for (const [x, y, z] of glass) {
  const st = { waterlogged: "false" };
  for (const [dx, dz] of DIRS) st[DIR_NAME.get(`${dx},${dz}`)] = g.get(x + dx, y, z + dz) ? "true" : "false";
  g.set(x, y, z, "glass_pane", st);
}

const { blocks, palette } = g.save(OUT);
console.log(`FR245184459: ${blocks} blocks, ${palette} palette entries, ${glass.length} panes, ${lamps.length} lamps`);
