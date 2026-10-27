// Nesuto, Auckland (way 293020958): a 1980s glass-and-precast office tower, 14 storeys over a 3-storey stone podium on the
// sloping site (podium solid from y 0 to the floor line at 12, so the downhill side shows three storeys of stone). Lidar roof
// heights are 3x3-averaged: the body roof sits at 69 with a 1-block parapet ring at 70 (the lidar's 70 edge), a setback
// penthouse ring at 71-72 and a crown at 73 over the central core. Facade: a 4-block storey rhythm (white floor band, three
// rows of blue glass between light-grey piers every fourth cell and at corners), dark-oak entrance on the west face with a
// stone step, glowstone behind a scatter of panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020958.cells.json", "utf8"));
const W = 33, D = 29, H = 86;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation top), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// 3x3 mean of the lidar roof over footprint cells: irons out the 69/70 speckle and the 1 m DSM noise
const S = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) { sum += R[x + dx][z + dz]; n++; }
  S[x][z] = sum / n;
}

const F0 = 12;            // floor line of the first storey (above the highest ground, 11)
const ROOF = 68;          // body roof slab (top surface 69)
const isCore = (x, z) => inside(x, z) && S[x][z] >= 71;
const isCrown = (x, z) => isCore(x, z) && S[x][z] >= 72.5;
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const outward = (x, z, d, test) => { const [dx, dz] = DIRS[d]; return !test(x + dx, z + dz); };
const edge = (x, z) => Object.keys(DIRS).some((d) => outward(x, z, d, inside));
const top = (x, z) => (!isCore(x, z) ? (edge(x, z) ? 69 : ROOF) : isCrown(x, z) ? 72 : 71);

// the faces where a cell's wall is exterior at height y: footprint edge below the penthouse; a core's own faces above it
const faces = (x, z, y) => Object.keys(DIRS).filter((d) => outward(x, z, d, y >= 69 && isCore(x, z) ? (a, b) => inside(a, b) && isCore(a, b) : inside));

// a pier at every fourth cell along a wall, and at every corner: ribbons of glass between them read from the air
const isPier = (x, z, f) => f.length >= 2 || (f.some((d) => d === "W" || d === "E") ? z % 4 === 0 : x % 4 === 0);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const B = new Map();   // "x,y,z" -> { b, s }
const put = (x, y, z, b, s) => B.set(`${x},${y},${z}`, { b, s });
const at = (x, y, z) => B.get(`${x},${y},${z}`);

// the entrance: a west-face cell on the uphill edge (ground 11, the highest), off the pier lines
let ENTRY = null;
for (let z = 0; z < D; z++) if (inside(0, z) && G[0][z] === 11 && z % 3 !== 0 && z > 14 && z < 24) { ENTRY = z; break; }
if (ENTRY === null) throw new Error("no entrance cell on the west face");

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const e = edge(x, z), t = top(x, z);
  // podium: solid stone from y 0 to the floor line (the ground is at most 11, so the foundation and the downhill storeys are one)
  for (let y = 0; y < F0; y++) {
    const b = !e ? "stone" : y === 4 || y === 8 ? "chiseled_stone_bricks" : "stone_bricks";
    put(x, y, z, b);
  }
  for (let y = F0; y <= t; y++) {
    const f = faces(x, z, y);
    if (y === t) { put(x, y, z, f.length ? "white_concrete" : "smooth_stone"); continue; }   // roof cap / parapet / roof surface
    if (y <= ROOF && (y - F0) % 4 === 0) { put(x, y, z, f.length ? "white_concrete" : y === ROOF ? "smooth_stone" : "light_gray_concrete"); continue; }   // floor line
    if (!f.length) continue;                                                                    // air gap inside
    if (isPier(x, z, f)) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, y > ROOF ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane", { waterlogged: "false" });
  }
}

// the entrance: a stone step up from the street to the floor line, a dark-oak door, a lintel over it
const ez = ENTRY;
put(0, 11, ez, "stone_brick_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
put(0, 12, ez, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(0, 13, ez, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dz = -1; dz <= 1; dz++) put(0, 14, ez + dz, "polished_andesite");

// warm light behind a scatter of panes: glowstone just inside the glass (a glazed storey row), shroomlight in the penthouse
for (const [key, v] of [...B.entries()]) {
  if (v.b !== "light_blue_stained_glass_pane" && v.b !== "gray_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  if ((y - F0) % 4 !== 2 && y <= ROOF) continue;
  if (hash(x, y, z) % 11 !== 0) continue;
  const f = faces(x, z, y); if (!f.length) continue;
  const [ix, iz] = [x - DIRS[f[0]][0], z - DIRS[f[0]][1]];
  if (!inside(ix, iz) || at(ix, y, iz)) continue;
  put(ix, y, iz, y > ROOF ? "shroomlight" : "glowstone");
}

// roof plant: two light-grey plant boxes one block high, on the body roof away from the core and the parapet
const roofFree = (x, z) => inside(x, z) && !isCore(x, z) && !edge(x, z) && !edge(x - 1, z) && !edge(x + 1, z) && !edge(x, z - 1) && !edge(x, z + 1);
const plant = [];
for (let x = 0; x < W - 2 && plant.length < 2; x++) for (let z = 0; z < D - 1 && plant.length < 2; z++) {
  if (plant.length === 1 && Math.abs(x - plant[0][0]) < 8) continue;
  if ([0, 1, 2].every((dx) => [0, 1].every((dz) => roofFree(x + dx, z + dz)))) plant.push([x, z]);
}
for (const [px, pz] of plant) for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) put(px + dx, ROOF + 1, pz + dz, "light_gray_concrete");

// glass panes connect to the wall-plane neighbours (panes, piers, bands, stone), not to glowstone or air
const PANE = new Set(["light_blue_stained_glass_pane", "gray_stained_glass_pane"]);
const WALL = new Set(["white_concrete", "light_gray_concrete", "smooth_stone", "stone_bricks", "chiseled_stone_bricks", "polished_andesite", "stone"]);
const joins = (x, y, z) => { const v = at(x, y, z); return !!v && (PANE.has(v.b) || WALL.has(v.b)); };
for (const [key, v] of B) {
  if (!PANE.has(v.b)) continue;
  const [x, y, z] = key.split(",").map(Number);
  v.s = { north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)), east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [key, v] of B) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, v.b, v.s); }

// check: every block stands on something (below it, or on a neighbour in its own course)
let floating = 0;
for (const [key, v] of B) {
  const [x, y, z] = key.split(",").map(Number);
  if (y === 0) continue;
  const under = at(x, y - 1, z);
  const side = [at(x - 1, y, z), at(x + 1, y, z), at(x, y, z - 1), at(x, y, z + 1)].some(Boolean);
  if (!under && !side) floating++;
}
const top_y = Math.max(...[...B.keys()].map((k) => Number(k.split(",")[1])));
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020958.nbt");
console.log(`nesuto: ${out.blocks} blocks, ${out.palette} palette entries, top y ${top_y}, core ${[...Array(W * D)].filter((_, i) => isCore(i % W, Math.floor(i / W))).length} cells, crown ${[...Array(W * D)].filter((_, i) => isCrown(i % W, Math.floor(i / W))).length}, entrance z ${ez}, plant boxes ${plant.length}, floating ${floating}`);
