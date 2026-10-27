// Fiore Hobson 2, Auckland (way 260083816): a 12-storey concrete-frame office block on a stone plinth, the CBD's 1970s-80s
// precast-and-tinted-glass commercial type. The lidar roof is 50 blocks above the lowest ground on 643 of 649 cells (the five
// low edge cells are noise), so the massing is one flat tier to y 50 (a parapet and cap on top of a roof deck at 47), with
// a plant room on the roof. Storeys sit on a 4-block grid from y 8 (a 6-block ground-floor shopfront and a fascia at y 7):
// white bands at each floor line, a light-grey spandrel under each window ribbon, blue tinted panes in white piers every 3
// blocks, clear glass in the shopfront, a dark-oak-door entrance on the south face. The shell is one block thick with an air
// gap behind the glass, a floor slab per storey, and glowstone behind some panes. Foundation fills y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260083816.cells.json", "utf8"));
const W = 33, D = 37, H = 63;
const ROOF = 50;                 // the flat tier: the lidar's roof height on the body, smoothed
const DECK = 47, GROUND_TOP = 7, FIRST_FLOOR = 8;
const GROUND = Array.from({ length: W }, () => Array(D).fill(-1));   // lidar ground per cell, -1 = not footprint
for (const [x, z, ground] of cells) GROUND[x][z] = ground;
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && GROUND[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                   // east, west, south, north
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const facing = ([dx, dz]) => (dz > 0 ? "south" : dz < 0 ? "north" : dx > 0 ? "east" : "west");

// The door: the south face's outermost wall cell nearest the middle
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  const out = outward(x, z);
  if (out.length !== 1 || out[0][1] !== 1) continue;
  if (!door || z > door.z || (z === door.z && Math.abs(x - 16) < Math.abs(door.x - 16))) door = { x, z, out: out[0] };
}

// A plant room on the roof: the largest clear rectangle inside the footprint, at least 3 cells in from any wall
let plant = null;
for (let x0 = 3; x0 < W - 3 && !plant; x0++) for (let z0 = 3; z0 < D - 3 && !plant; z0++) {
  const w = 9, d = 7; let ok = true;
  for (let x = x0 - 3; x < x0 + w + 3 && ok; x++) for (let z = z0 - 3; z < z0 + d + 3 && ok; z++) if (!inFp(x, z)) ok = false;
  if (ok) plant = { x0, z0, w, d };
}

const g = new Voxels([W, H, D]);
const names = new Map();                                            // "x,y,z" -> block id, for the pane pass
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); names.set(`${x},${y},${z}`, block); };

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  const ground = GROUND[x][z], out = outward(x, z), wall = out.length > 0, corner = out.length > 1;
  const along = wall && out[0][0] !== 0 ? z : x;                    // the bay coordinate along the wall
  const pier = corner || along % 3 === 0;

  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");    // foundation
  if (!wall) {
    if (ground <= 47) put(x, ground, z, "smooth_stone");            // ground slab
    for (let y = FIRST_FLOOR; y <= 44; y += 4) put(x, y, z, "smooth_stone");   // a floor slab per storey
    put(x, DECK, z, "gray_concrete");                               // roof deck
    continue;
  }
  for (let y = ground; y <= ROOF; y++) {
    let block = null, state;
    if (y === ground) block = "smooth_stone";                       // plinth course
    else if (y <= GROUND_TOP) block = pier ? "white_concrete" : (y === GROUND_TOP ? "light_gray_concrete" : "glass_pane");
    else if (y < DECK) {
      if (y % 4 === 0) block = "white_concrete";                    // floor line
      else if (y % 4 === 3) block = "light_gray_concrete";          // spandrel
      else block = pier ? "white_concrete" : "light_blue_stained_glass_pane";
    }
    else if (y === DECK || y === DECK + 1 || y === DECK + 2) block = "light_gray_concrete";   // roof edge, parapet
    else block = "white_concrete";                                  // cap
    if (block === "glass_pane" || block === "light_blue_stained_glass_pane") state = {};
    if (block) put(x, y, z, block, state);
  }
}

// The entrance: the door in its bay, a lintel band over it, and a glass pane either side
const dx = door.out[0], dz = door.out[1];
const doorState = (half) => ({ facing: facing(door.out), half, hinge: "left", open: "false", powered: "false" });
put(door.x, GROUND[door.x][door.z], door.z, "dark_oak_door", doorState("lower"));
put(door.x, GROUND[door.x][door.z] + 1, door.z, "dark_oak_door", doorState("upper"));
for (const s of [-1, 1]) {
  const x = door.x + (dz !== 0 ? s : 0), z = door.z + (dx !== 0 ? s : 0);
  if (inFp(x, z)) put(x, GROUND[door.x][door.z] + 3, z, "light_gray_concrete");   // lintel band over the bay
}
put(door.x, GROUND[door.x][door.z] + 3, door.z, "light_gray_concrete");

// The rooftop plant room: solid walls to y 50, louvred with iron bars in the wall's upper half, a cap, and a glowstone in it
if (plant) {
  for (let x = plant.x0; x < plant.x0 + plant.w; x++) for (let z = plant.z0; z < plant.z0 + plant.d; z++) {
    const edge = x === plant.x0 || x === plant.x0 + plant.w - 1 || z === plant.z0 || z === plant.z0 + plant.d - 1;
    if (edge) for (let y = DECK + 1; y <= DECK + 2; y++) put(x, y, z, "light_gray_concrete");
    put(x, DECK + 3, z, "light_gray_concrete");
  }
  put(plant.x0 + 1, DECK + 2, plant.z0 + 1, "glowstone");
}

// Glowstone behind some panes: on the room side of a window, one cell in from the glass
let k = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  const out = outward(x, z);
  if (out.length !== 1) continue;
  for (let y = GROUND[x][z] + 1; y < DECK; y++) {
    const block = names.get(`${x},${y},${z}`);
    if (block !== "light_blue_stained_glass_pane" && block !== "glass_pane") continue;
    if ((x * 7 + y * 13 + z * 5) % 11 !== 0) continue;
    const ix = x - out[0][0], iz = z - out[0][1];
    if (!inFp(ix, iz) || outward(ix, iz).length) continue;
    const lit = names.get(`${ix},${y},${iz}`);
    if (lit) continue;
    put(ix, y, iz, "glowstone");
    k++;
  }
}

// Panes join their neighbours: a glass pane connects to any pane or solid block beside it in the wall's plane and the room
const SOLID = (b) => b && !/_(pane|door|slab)$/.test(b);
for (const [key, block] of names) {
  if (!/_pane$/.test(block)) continue;
  const [x, y, z] = key.split(",").map(Number);
  const side = (dx, dz) => { const b = names.get(`${x + dx},${y},${z + dz}`); return !!b && (/_pane$/.test(b) || SOLID(b)); };
  g.set(x, y, z, block, { east: String(side(1, 0)), north: String(side(0, -1)), south: String(side(0, 1)), west: String(side(-1, 0)) });
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260083816.nbt");
console.log(`way_260083816: ${blocks} blocks, ${palette} palette entries, ${k} glowstone windows, door at x${door.x} z${door.z}, plant ${plant ? `${plant.w}x${plant.d}` : "none"}`);
