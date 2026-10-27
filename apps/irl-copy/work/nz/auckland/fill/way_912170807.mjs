// Mt Eden / Eden Terrace, Auckland: a three-storey plastered-brick shop-and-flat block of the 1910s-20s (the Edwardian
// commercial type that lines the old Eden Terrace and Mt Eden Road frontages). A stone plinth, a shopfront with a
// timber bulkhead and a door on the street face, windows in dark timber frames, a stone string course at each floor,
// a stone parapet with a cap, a plant box and a chimney on the roof. Solid massing: every window has an air pocket
// and a floor behind its glass, a few hold a glowstone or lantern.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_912170807.cells.json`, "utf8"));
const W = 8, D = 10, H = 24;

// lidar per footprint cell: ground (foundation top) and roof (height above y 0); roof 0 = no building in that cell
const ground = Array.from({ length: W }, () => Array(D).fill(0));
const roof = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const bld = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roof[x][z] > 0;
const interior = (x, z) => bld(x - 1, z) && bld(x + 1, z) && bld(x, z - 1) && bld(x, z + 1);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const OUTWARD = { N: "north", S: "south", E: "east", W: "west" };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !bld(x + DIRS[d][0], z + DIRS[d][1]));

// the street face is the one with the most exposed wall cells
const count = { N: 0, S: 0, E: 0, W: 0 };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (bld(x, z)) for (const d of exposed(x, z)) count[d]++;
const front = Object.keys(count).reduce((a, b) => (count[b] > count[a] ? b : a));

// the door sits at the middle of the street face's main-massing cells
const alongFront = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++)
  if (roof[x][z] === 11 && exposed(x, z).includes(front)) alongFront.push([front === "N" || front === "S" ? x : z, x, z]);
alongFront.sort((a, b) => a[0] - b[0]);
const [, doorX, doorZ] = alongFront[Math.floor(alongFront.length / 2)];

// every block by cell, air as null so later passes can clear pockets
const put = new Map();
const setAt = (x, y, z, block, state) => put.set(`${x},${y},${z}`, { block, state });
const airAt = (x, y, z) => put.set(`${x},${y},${z}`, null);
const pockets = [];  // [x, y, z] air carved behind each window and the door, after the massing is solid
const lights = [];   // [x, y, z, k] a glowstone or lantern in a window's pocket

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const r = roof[x][z];
  if (r <= 0) continue;
  const ex = exposed(x, z), face = ex.length === 1 ? ex[0] : null;
  const i = face === "N" || face === "S" ? x : z;     // position along the face
  const [dx, dz] = face ? DIRS[face] : [0, 0];
  const inX = x - dx, inZ = z - dz;                  // the cell just inside this face
  const isDoor = face === front && x === doorX && z === doorZ;
  for (let y = 0; y < r; y++) {
    let block = "white_concrete", state;
    if (y === 0) block = "stone_bricks";                         // plinth / foundation top
    else if (ex.length && r < 11) block = "smooth_stone";        // lower wing: a plain cap course
    else if (isDoor && y <= 2) {                                 // entrance: lower and upper door halves
      block = "dark_oak_door";
      state = { facing: OUTWARD[front], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    else if (isDoor && y === 3) block = "dark_oak_planks";       // door head
    else if (ex.length && y === 1) block = face === front ? "dark_oak_planks" : "smooth_stone";   // bulkhead / sill
    else if (ex.length && (y === 4 || y === 7 || y === 10)) block = "smooth_stone";                // string courses
    else if (ex.length > 1) block = "white_concrete";                                              // corner piers
    else if (ex.length && face === front && y <= 3) block = i % 3 === 0 ? "dark_oak_planks" : "glass_pane";  // shopfront
    else if (ex.length && [2, 3, 5, 6, 8, 9].includes(y)) {      // upper window rows: frame, two-wide glass, pier
      const m = i % 4;
      block = m === 0 ? "dark_oak_planks" : m === 3 ? "white_concrete" : "glass_pane";
    }
    setAt(x, y, z, block, state);
    if (ex.length === 1 && interior(inX, inZ)) {
      if (block === "glass_pane") {
        pockets.push([inX, y, inZ]);                              // air gap behind the glass
        if ([2, 5, 8].includes(y)) lights.push([inX, y, inZ, (x * 5 + z * 3 + y + i) % 3]);
      }
      if (isDoor && (y === 1 || y === 2)) pockets.push([inX, y, inZ]);   // doorway behind the door
    }
  }
  // parapet and cap over the street-level walls of the main massing
  if (ex.length && r === 11) {
    setAt(x, 11, z, "smooth_stone");
    setAt(x, 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

for (const [x, y, z] of pockets) airAt(x, y, z);

// warm lights in some window pockets: glowstone, or a lantern standing on the pocket floor
for (const [x, y, z, k] of lights) {
  if (k === 0) setAt(x, y, z, "glowstone");
  else if (k === 1) setAt(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof plant: a 2x2 box and a chimney stack on the flat roof, over interior cells only
let plant = null;
for (let x = 0; x < W - 1 && !plant; x++) for (let z = 0; z < D - 1 && !plant; z++) {
  const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (sq.every(([a, b]) => roof[a][b] === 11 && interior(a, b))) plant = sq;
}
if (plant) for (const [x, z] of plant) {
  setAt(x, 11, z, "stone_bricks"); setAt(x, 12, z, "stone_bricks");
  setAt(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
const chimney = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++)
  if (roof[x][z] === 11 && interior(x, z) && !(plant ?? []).some(([a, b]) => a === x && b === z)) chimney.push([x, z]);
const stack = chimney.find(([x, z]) => (x + z) % 3 === 1) ?? chimney[0];
if (stack) {
  const [x, z] = stack;
  setAt(x, 11, z, "bricks"); setAt(x, 12, z, "bricks");
  setAt(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// window panes join their neighbours along the wall: connect to any non-light block beside them
const at = (x, y, z) => put.get(`${x},${y},${z}`)?.block ?? null;
for (const k of [...put.keys()]) {
  const e = put.get(k);
  if (!e || e.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const conn = (ax, az) => { const b = at(x + ax, y, z + az); return b !== null && b !== "lantern" && b !== "glowstone"; };
  e.state = { north: String(conn(0, -1)), south: String(conn(0, 1)), east: String(conn(1, 0)), west: String(conn(-1, 0)), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, e] of put) {
  if (!e) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, e.block, e.state);
}
const out = g.save(`${DIR}/way_912170807.nbt`);
console.log(`front ${front}, door (${doorX},${doorZ}), ${out.blocks} blocks, ${out.palette} palette entries`);
