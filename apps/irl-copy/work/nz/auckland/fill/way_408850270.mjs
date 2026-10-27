// Fonterra: a ten-storey concrete-frame office block of the 1960s-70s on a three-storey podium, with a five-storey and an
// eight-storey wing stepping down from the tower. Massing from the lidar roof, snapped to flat tiers (12, 20, 32, 40, and a
// 2-block parapet with a plant room to the 42 the lidar reads). Every column is solid from y 0 up to its tier, so nothing
// floats and the setbacks stand on the tiers below. Facades: white piers every 4 blocks, light-grey floor lines every 4
// blocks, a polished base course, and glass bays between the piers. Every glass pane has a sealed one-block air pocket
// behind it (floored and roofed by the solid storey lines), and some pockets hold a warm glowstone or shroomlight.
// The ground storey is a shopfront with an iron-door entrance under a canopy on two posts.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_408850270.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_408850270.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..78, z 0..78

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];          // east, west, south, north (+z is south)
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const TOWER = 40, CROWN = 42;
const TIER = (r) => (r <= 16 ? 12 : r <= 32 ? 20 : r <= 36 ? 32 : TOWER);   // lidar roof -> flat tier top
const PIER = 4, FLOOR = 4;
const key = (x, z) => `${x},${z}`, key3 = (x, y, z) => `${x},${y},${z}`;

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { g, top: TIER(r) });
const topOf = (x, z) => cell.get(key(x, z))?.top ?? 0;                       // 0 outside the footprint: open to the air
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) <= y);

// the plan: key -> { block, state } for a solid, or null for an air pocket (left out of the file)
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(key3(x, y, z), { block, state });
const air = (x, y, z) => plan.set(key3(x, y, z), null);

// 1. solid massing with the facade skin: base course, floor lines, piers, spandrels; glass is placed in pass 2
const isPier = (x, z, ex) => ex.length !== 1 || (ex[0][0] !== 0 ? z % PIER === 0 : x % PIER === 0);
const windowRow = (y) => y >= 1 && [1, 2].includes(y % FLOOR);
for (const [kk, c] of cell) {
  const [x, z] = kk.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) { put(x, y, z, "light_gray_concrete"); continue; }        // core
    if (y === 0) { put(x, y, z, "polished_andesite"); continue; }             // base course
    if (y % FLOOR === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // floor line
    put(x, y, z, "white_concrete");                                           // pier, spandrel, or a bay to glaze
  }
}

// 2. glazing: a window bay on a single exposed face, its inner neighbour a sealed air pocket (never an exposed cell)
const pockets = [];
for (const [kk, c] of cell) {
  const [x, z] = kk.split(",").map(Number);
  for (let y = 1; y < c.top; y++) {
    if (!windowRow(y)) continue;
    const ex = exposed(x, y, z);
    if (!ex.length || isPier(x, z, ex)) continue;
    const [dx, dz] = ex[0], ax = x - dx, az = z - dz;
    if (topOf(ax, az) <= y || exposed(ax, y, az).length) continue;           // a hole would open to the air: keep it solid
    put(x, y, z, "light_blue_stained_glass");
    air(ax, y, az);
    pockets.push({ x: ax, y, z: az, i: pockets.length });
  }
}

// 3. the entrance: an iron door pair on the ground storey's south-facing shopfront, nearest the middle of the face
const southBays = [];
for (const [kk, c] of cell) {
  const [x, z] = kk.split(",").map(Number);
  const ex = exposed(x, 1, z);
  if (ex.length === 1 && ex[0][1] === 1 && plan.get(key3(x, 1, z))?.block === "light_blue_stained_glass") southBays.push([x, z, ex[0]]);
}
southBays.sort((a, b) => a[0] - b[0]);
const pick = southBays.length ? southBays[Math.floor(southBays.length / 2)] : null;
let doorway = null;
if (pick) {
  const [x, z, [dx, dz]] = pick;
  const ax = x - dx, az = z - dz;
  doorway = { x, z, dx, dz };
  for (const y of [1, 2]) {
    put(x, y, z, "iron_door", { facing: FACING[`${-dx},${-dz}`], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    air(ax, y, az);
  }
  // a canopy at the spandrel row, two blocks out, on two posts that stand on the ground outside the wall
  const [lx, lz] = dx !== 0 ? [0, 1] : [1, 0];
  for (let k = 1; k <= 2; k++) for (let l = -1; l <= 1; l++) put(x + dx * k + lx * l, 3, z + dz * k + lz * l, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  for (const l of [-1, 1]) for (let y = 0; y <= 2; y++) put(x + dx * 2 + lx * l, y, z + dz * 2 + lz * l, "white_concrete");
}

// 4. warm lights behind some glass: glowstone and shroomlight in the pockets (sealed, so nothing is lit from outside)
for (const p of pockets) {
  if (doorway && p.x === doorway.x - doorway.dx && p.z === doorway.z - doorway.dz) continue;
  if (p.i % 7 === 0) put(p.x, 1, p.z, "glowstone");
  else if (p.i % 7 === 3) put(p.x, 2, p.z, "shroomlight");
}

// 5. the roof: an edge gets a cornice (one block) or, on the tower, a 2-block parapet; the inner roof is paved
for (const [kk, c] of cell) {
  const [x, z] = kk.split(",").map(Number);
  const T = c.top;
  const edge = DIRS.some(([dx, dz]) => topOf(x + dx, z + dz) < T);
  if (edge) {
    put(x, T, z, "light_gray_concrete");
    if (T === TOWER) put(x, T + 1, z, "white_concrete");
  } else {
    put(x, T - 1, z, "smooth_stone");
  }
}

// a plant room on the tower roof: a 15 x 9 walled box with a flat cap at the crown height, its interior open
const tower = [...cell].filter(([, c]) => c.top === TOWER).map(([kk]) => kk.split(",").map(Number));
const cx = Math.round(tower.reduce((s, [x]) => s + x, 0) / tower.length);
const cz = Math.round(tower.reduce((s, [, z]) => s + z, 0) / tower.length);
const HX = 7, HZ = 4, M = 2;                                                  // half-sizes, and the margin the box keeps from the edge
const inTower = (x, z) => topOf(x, z) === TOWER;
let plantOk = true;
for (let x = cx - HX - M; x <= cx + HX + M; x++) for (let z = cz - HZ - M; z <= cz + HZ + M; z++) if (!inTower(x, z)) plantOk = false;
if (plantOk) {
  for (let x = cx - HX; x <= cx + HX; x++) for (let z = cz - HZ; z <= cz + HZ; z++) {
    const ring = x === cx - HX || x === cx + HX || z === cz - HZ || z === cz + HZ;
    if (ring) put(x, TOWER, z, "light_gray_concrete"); else air(x, TOWER, z);  // one-block walls, roofed at 41 so the crown reads 42
    put(x, TOWER + 1, z, "smooth_stone");
  }
}

// 6. write the volume: 79 x 54 x 79, air where the plan says air
const g = new Voxels([79, 54, 79]);
let solids = 0;
for (const [kk, v] of plan) {
  if (!v) continue;
  const [x, y, z] = kk.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
  solids++;
}
const { blocks, palette } = g.save(OUT);
const tops = {};
for (const [, c] of cell) tops[c.top] = (tops[c.top] || 0) + 1;
console.log(JSON.stringify({ footprint: cell.size, tops, pockets: pockets.length, doorway: !!doorway, plant: plantOk, blocks, palette, solids }));
