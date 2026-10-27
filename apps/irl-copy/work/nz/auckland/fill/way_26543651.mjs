// Auckland Hospital Main Building (Park Road, Grafton): a concrete-framed hospital block of the 1970s, the era of the
// city's big public hospital blocks. A tower of nine storeys over a datum at 20 blocks, stepping down through two
// setbacks to a podium on the north lobe. Storeys are 4 blocks: a white concrete slab row (the storey line), then two
// rows of glazing in a frame of concrete piers every 3 cells, and a grey spandrel row. Each footprint cell is one
// column; its walls are its perimeter and any face that steps down to a lower neighbour's roof, and the rest is air
// behind the glass, with a floor slab per storey. The downhill side shows its basement storeys (dark glass) down to its
// ground, with a stone plinth filling the gap to the first slab. The entrance is on the south face at the datum, under
// a lintel, with glowstone behind some panes for the dusk.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_26543651.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_26543651.nbt";
const W = 162, D = 164, H = 75, STOREY = 4, DATUM = 20;

const SLAB = "white_concrete", SPAND = "gray_concrete", GLASS = "light_blue_stained_glass", BASEMENT = "gray_stained_glass";
const CORNICE = "smooth_stone", PLINTH = "stone_bricks", FOUND = "stone", LINTEL = "smooth_stone", PLANT = "light_gray_concrete";
const LIGHT = "glowstone";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const GROUND = Array.from({ length: W }, () => Array(D).fill(-1));
const ROOF = Array.from({ length: W }, () => Array(D).fill(-1));
const S0 = Array.from({ length: W }, () => Array(D).fill(0));    // the lowest slab: the first multiple of 4 at or above the ground
const TOP = Array.from({ length: W }, () => Array(D).fill(0));   // the roof slab row of the cell's tier
for (const [x, z, g, r] of cells) { GROUND[x][z] = g; ROOF[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && GROUND[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Massing: the lidar roof's median over the 5x5 cells around each one, quantised to four flat tiers (a podium on the
// north lobe, two setbacks, the tower). Each tier's roof is a multiple of 4, so every storey stands on the one below.
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const tierTop = (rs) => (rs < 36 ? 24 : rs < 46 ? 40 : rs < 53 ? 48 : 56);
for (const [x, z, g] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(ROOF[x + dx][z + dz]);
  S0[x][z] = Math.ceil(g / STOREY) * STOREY;
  TOP[x][z] = tierTop(median(v));
}

// the faces of a cell at height y that show: a neighbour outside the footprint, or one whose roof is lower than y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || y > TOP[nx][nz]; });

// the entrance: a cell at the datum storey with a face to the south (outward +z), nearest the middle of those faces
const southDoors = cells.filter(([x, z]) => S0[x][z] === DATUM && exposed(x, z, DATUM + 1).some(([dx, dz]) => dz === 1));
const doorPool = southDoors.length ? southDoors : cells.filter(([x, z]) => S0[x][z] === DATUM && exposed(x, z, DATUM + 1).length);
const meanX = doorPool.reduce((s, [x]) => s + x, 0) / doorPool.length;
const [ex, ez] = doorPool.reduce((best, c) => (Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best), doorPool[0]);
const doorDir = exposed(ex, ez, DATUM + 1).find(([dx, dz]) => dz === 1) ?? exposed(ex, ez, DATUM + 1)[0];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const g = new Voxels([W, H, D]);
const lights = [];                                              // [x, y, z, dx, dz] of the panes to light from inside
for (const [x, z, gr] of cells) {
  const s0 = S0[x][z], top = TOP[x][z];
  for (let y = 0; y < s0; y++) g.set(x, y, z, y < gr ? FOUND : PLINTH);     // foundation to the ground, plinth to the first slab
  for (let y = s0; y <= top; y += STOREY) g.set(x, y, z, SLAB);            // a floor slab per storey, and the roof slab
  for (let y = s0 + 1; y <= top + 2; y++) {
    if (y % STOREY === 0) continue;                                       // slab rows are already set
    const out = exposed(x, z, y);
    if (!out.length) continue;                                            // interior: air behind the glass
    if (y > top) { g.set(x, y, z, y === top + 1 ? CORNICE : SLAB); continue; }   // parapet, with a cornice course
    if (out.length >= 2) { g.set(x, y, z, SLAB); continue; }              // a corner: a concrete pier
    const [dx, dz] = out[0];
    const row = y % STOREY;                                               // 1 to 3 within the storey
    const mullion = (dz !== 0 ? x : z) % 3 === 0;
    const lowest = y - row === s0;                                        // the lowest storey: its first row is the base course
    const basement = y < DATUM;
    if (x === ex && z === ez && y >= DATUM + 1 && y <= DATUM + 2) {       // the entrance: a door and its lintel
      g.set(x, y, z, "iron_door", { facing: FACING[`${doorDir[0]},${doorDir[1]}`], half: y === DATUM + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === ex && z === ez && y === DATUM + 3) { g.set(x, y, z, LINTEL); continue; }
    if (lowest && row === 1) { g.set(x, y, z, PLINTH); continue; }        // base course
    if (row === 3) { g.set(x, y, z, mullion ? SLAB : SPAND); continue; }  // spandrel under the window
    if (mullion) { g.set(x, y, z, SLAB); continue; }                      // a concrete pier between the panes
    g.set(x, y, z, basement ? BASEMENT : GLASS);
    if (row === 2 && !basement && (x * 7 + z * 13 + y * 5) % 11 === 0) lights.push([x, y, z, dx, dz]);
  }
}

// rooftop plant on the tower: plant rooms (2 by 2 cells, three high) on the interior of the top roof where the lidar
// shows a penthouse, so the roof reads as equipment rather than a bare slab
for (const [x, z] of cells) {
  const interior = DIRS.every(([dx, dz]) => inside(x + dx, z + dz) && TOP[x + dx][z + dz] >= 56);
  if (TOP[x][z] !== 56 || ROOF[x][z] < 58 || !interior || x % 6 > 1 || z % 6 > 1) continue;
  for (let y = 57; y <= 59; y++) g.set(x, y, z, y === 59 ? CORNICE : PLANT);
}

// warm light behind some panes: a glowstone on the air side of the glass, inside the building
let lit = 0;
for (const [x, y, z, dx, dz] of lights) {
  const ix = x - dx, iz = z - dz;
  if (inside(ix, iz) && g.val(ix, y, iz) === 0) { g.set(ix, y, iz, LIGHT); lit++; }
}

const { blocks, palette } = g.save(OUT);
const top = Math.max(...cells.map(([x, z]) => TOP[x][z]));
console.log(`way_26543651: ${blocks} blocks, palette ${palette}, tower roof ${top}, lit panes ${lit}, entrance (${ex}, ${ez})`);
