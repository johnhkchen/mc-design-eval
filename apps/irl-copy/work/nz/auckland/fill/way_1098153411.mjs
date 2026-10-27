// Way 1098153411: a 1920s-30s brick commercial block in the Mt Eden / CBD fringe of Auckland. Lidar roof 18 blocks over
// most of the footprint (about 15 m: four storeys of 4 blocks and a parapet), with lower wings at 12 and 8 on the edges.
// Brick walls on smooth quartz (Oamaru-stone-like) string courses and sills, a stone plinth on each cell's foundation,
// a shopfront storey, a timber door under a dark slab hood, a parapet with a coping, and a small plant room on the roof.
// Each footprint cell is one column: solid foundation up to its ground, floor slabs at each storey, a perimeter wall
// wherever a neighbour does not cover that height, and air between the floors (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1098153411.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1098153411.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([38, 31, 32]);

// lidar roof -> clean flat tiers; never lower than one storey above the cell's own ground
const tierTop = (r) => (r >= 17 ? 18 : r >= 12 ? 12 : r >= 6 ? 8 : 0);
const col = new Map();
for (const [x, z, gr, r] of cells) col.set(`${x},${z}`, { x, z, g: gr, T: Math.max(tierTop(r), gr + 4) });
const cols = [...col.values()];
const c = (x, z) => col.get(`${x},${z}`) ?? null;

const DIRS = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };
// a neighbour covers height y when it is in the footprint and y lies within its column
const open = (x, z, y) => { const n = c(x, z); return !!n && n.g <= y && y < n.T; };
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => !open(x + DIRS[d][0], z + DIRS[d][1], y));
const buriedAny = (x, z, y) => Object.values(DIRS).some(([dx, dz]) => { const n = c(x + dx, z + dz); return !!n && n.g > y; });

// the entrance: the face with the most exposed cells at street level, its middle non-corner cell
const faceCount = { east: 0, west: 0, south: 0, north: 0 };
for (const cl of cols) for (const d of exposed(cl.x, cl.z, cl.g + 1)) faceCount[d]++;
const doorDir = ["south", "north", "east", "west"].reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
const doorAlong = (x, z) => (doorDir === "east" || doorDir === "west" ? z : x);
const doorRun = cols.filter((cl) => { const e = exposed(cl.x, cl.z, cl.g + 1); return e.length === 1 && e[0] === doorDir; })
  .sort((a, b) => doorAlong(a.x, a.z) - doorAlong(b.x, b.z));
const doorCell = doorRun[Math.floor(doorRun.length / 2)];
const doorA = doorAlong(doorCell.x, doorCell.z);
const inDoorBay = (x, z) => Math.abs(doorAlong(x, z) - doorA) <= 1;

// the roof plant room: a 4 x 3 block of the top tier, fully inside the top tier, nearest the footprint's centre
const top = cols.filter((cl) => cl.T === 18);
const mx = cols.reduce((s, cl) => s + cl.x, 0) / cols.length, mz = cols.reduce((s, cl) => s + cl.z, 0) / cols.length;
let plant = null;
for (let x0 = 0; x0 < 38; x0++) for (let z0 = 0; z0 < 32; z0++) {
  let ok = true;
  for (let x = x0 - 1; x <= x0 + 4 && ok; x++) for (let z = z0 - 1; z <= z0 + 3 && ok; z++) { const n = c(x, z); if (!n || n.T !== 18) ok = false; }
  if (!ok) continue;
  const d = Math.hypot(x0 + 1.5 - mx, z0 + 1 - mz);
  if (!plant || d < plant.d) plant = { x0, z0, d };
}

const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const panes = [];

for (const cl of cols) {
  const { x, z, g: gr, T } = cl;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                  // foundation up to the cell's ground
  for (let y = gr; y < T; y++) {
    const ex = exposed(x, z, y);
    const k = Math.floor((y - gr) / 4), o = (y - gr) % 4;
    if (y === T - 2) { put(x, y, z, ex.length ? "bricks" : "stone"); continue; }     // parapet course / roof surface
    if (y === T - 1) { if (ex.length) put(x, y, z, "smooth_quartz"); continue; }     // coping
    if (!ex.length) { if (o === 0) put(x, y, z, "stone"); continue; }               // interior: floor slab, air above
    if (buriedAny(x, z, y)) { put(x, y, z, "stone_bricks"); continue; }             // retaining face against higher ground
    if (o === 0) { put(x, y, z, k === 0 ? "stone_bricks" : "smooth_quartz"); continue; }   // plinth / string course
    if (o === 3) { // sill course in brick (quartz only for the string courses); the door's bay gets a dark slab hood
      const hood = k === 0 && ex.includes(doorDir) && inDoorBay(x, z);
      put(x, y, z, hood ? "dark_oak_slab" : "bricks", hood ? { type: "top", waterlogged: "false" } : undefined);
      continue;
    }
    // rows 1 and 2: the door, the piers, the glazing
    const xFace = ex.some((d) => d === "east" || d === "west"), zFace = ex.some((d) => d === "north" || d === "south");
    const along = xFace ? z : x;
    if (k === 0 && x === doorCell.x && z === doorCell.z) {
      put(x, y, z, "dark_oak_door", { facing: doorDir, half: o === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if ((xFace && zFace) || along % 3 === 0) { put(x, y, z, "bricks"); continue; }   // corners and piers
    put(x, y, z, "glass_pane");
    panes.push([x, y, z]);
    // a warm light behind some panes, on the floor slab, in the air behind the glass
    if (o === 1 && ex.length === 1) {
      const [dx, dz] = DIRS[ex[0]];
      const ix = x - dx, iz = z - dz;
      if (open(ix, iz, y) && !exposed(ix, iz, y).length && (x * 5 + z * 3 + k * 7) % 4 === 0) put(ix, y, iz, "glowstone");
    }
  }
}

// the plant room on the top tier: walls to 18, a cap at 19; air inside
if (plant) {
  for (let x = plant.x0; x < plant.x0 + 4; x++) for (let z = plant.z0; z < plant.z0 + 3; z++) {
    const ring = x === plant.x0 || x === plant.x0 + 3 || z === plant.z0 || z === plant.z0 + 2;
    if (ring) { put(x, 17, z, "bricks"); put(x, 18, z, "bricks"); }
    put(x, 19, z, "smooth_quartz");
  }
}

// glass panes connect to their neighbours, as the game would draw them
for (const [x, y, z] of panes) {
  const conn = (dx, dz) => (g.get(x + dx, y, z + dz) ? "true" : "false");
  const st = { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" };
  put(x, y, z, "glass_pane", st);
}

const stats = g.save(OUT);
console.log(`way_1098153411: ${stats.blocks} blocks, palette ${stats.palette}, door ${doorDir} at (${doorCell.x},${doorCell.z}), plant ${plant ? `at (${plant.x0},${plant.z0})` : "none"}`);
