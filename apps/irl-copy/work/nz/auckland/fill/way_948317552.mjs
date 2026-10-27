// Way 948317552: a 1920s-30s brick commercial block (Karangahape Road / Eden Terrace type). Three storeys on the tall
// core, two on the mid strip, one on the wings, on a basalt (cobble) plinth with a shopfront ground floor, cream
// string courses and lintels, a stone coping, a dark oak entrance with a stair-cut hood, and warm lights behind glass.
// The footprint and its lidar roof/ground come from the cells file: [x, z, ground, roof] per cell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_948317552.cells.json`, "utf8"));
const W = 15, D = 25;

// --- massing: lidar roof smoothed over the 3x3 neighbourhood, snapped to four flat tiers (11 / 9 / 6 / 4) ---
const raw = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) raw[x][z] = { g, r };
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && raw[x][z] !== null;
const tierOf = (s) => (s >= 9.5 ? 11 : s >= 7.5 ? 9 : s >= 5.5 ? 6 : s >= 3.5 ? 4 : Math.round(s));
const C = Array.from({ length: W }, () => Array(D).fill(null));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) { sum += raw[x + dx][z + dz].r; n++; }
  const g = raw[x][z].g, T = tierOf(sum / n);
  C[x][z] = { g, T, top: Math.max(g, T) };            // solid below top; body is g..T-1 when T > g
}
// a cell is solid at height y when it is on the footprint and its column reaches y
const solid = (x, y, z) => inF(x, z) && y < C[x][z].top;
const H = 2 + Math.max(...C.flat().filter(Boolean).map((c) => c.T));

// --- palette ---
const PLINTH = "cobblestone", BASE = "stone_bricks", WALL = "bricks", BAND = "smooth_quartz";
const GLASS = "glass_pane", DECK = "smooth_stone", COPING = "stone_brick_slab", LAMP = "glowstone", LAMP2 = "shroomlight";
const DOOR = "dark_oak_door", HOOD = "dark_oak_stairs", UNIT = "iron_block";

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outwardOf = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !solid(x + dx, y, z + dz)).map(([d]) => d);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glassState = (d) => (d === "north" || d === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// The entrance: the street (north, low z) face, the lowest cell, nearest the middle of its run
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!C[x][z] || C[x][z].T <= C[x][z].g + 3 || !outwardOf(x, C[x][z].g + 1, z).includes("north")) continue;
  const score = C[x][z].g * 100 + Math.abs(x - 7);
  if (!door || score < door.score) door = { x, z, score, g: C[x][z].g };
}

let windowN = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const c = C[x][z]; if (!c) continue;
  // plinth: volcanic cobble from y 0 up to the cell's own ground
  for (let y = 0; y < c.g; y++) put(x, y, z, PLINTH);
  if (c.T <= c.g) continue;                                         // a terrace or lean-to at ground height
  for (let y = c.g; y < c.T; y++) {
    const k = y - c.g, out = outwardOf(x, y, z);
    if (y === c.T - 1) { put(x, y, z, DECK); continue; }           // the roof deck, always solid
    if (out.length === 0) {                                          // interior: a floor slab per storey, air between
      if (k % 4 === 0) put(x, y, z, DECK);
      continue;
    }
    // shell: string course, glass rows, cream lintel band. A cell on a stepped edge exposes two faces: it still takes
    // the window grid on its first face (a whole run of cream quoins read as a blank wall); the pier is cream there.
    const face = out[0], along = face === "north" || face === "south" ? x : z;
    if (k % 4 === 0) { put(x, y, z, BASE); continue; }
    if (k % 4 === 3) { put(x, y, z, BAND); continue; }
    if (along % 3 === 0) { put(x, y, z, out.length >= 2 ? BAND : WALL); continue; }   // a pier between each pair of panes
    put(x, y, z, GLASS, glassState(face));
    windowN++;
    // warm light behind every fourth pane (glowstone on the shopfront, shroomlight above)
    if (windowN % 4 === 0) {
      const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && C[ix][iz].top > y && C[ix][iz].T - 1 > y && (y - C[ix][iz].g) % 4 !== 0)
        put(ix, y, iz, k < 4 ? LAMP : LAMP2);
    }
  }
  // a parapet coping on the roof edge where a neighbour is lower or missing
  const edge = Object.values(DIRS).some(([dx, dz]) => !solid(x + dx, c.T, z + dz));
  if (edge) put(x, c.T, z, COPING, { type: "bottom", waterlogged: "false" });
  // roof plant on the interior of the tall core
  else if (c.T >= 9 && (x * 7 + z * 3) % 9 === 4) put(x, c.T, z, UNIT);
}

// the entrance: a dark oak door on the street face, a stair-cut hood over it, and a lit fanlight of glass above
if (door) {
  const { x, z, g: y0 } = door;
  put(x, y0 + 1, z, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, y0 + 2, z, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let dx = -1; dx <= 1; dx++) {
    const hx = x + dx;
    if (inF(hx, z) && outwardOf(hx, y0 + 3, z).includes("north"))
      put(hx, y0 + 3, z, HOOD, { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
  }
}

const info = g.save(`${DIR}/way_948317552.nbt`);
console.log(JSON.stringify({ size: [W, H, D], ...info, door, windows: windowN }));
