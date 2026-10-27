// Way 291095565: a two-storey brick commercial block of the 1920s-30s on Auckland's volcanic slopes, 24 x 32 blocks.
// Footprint from the lidar cells: the ground is the floor datum (a foundation of stone up to it), the roof is the
// smoothed lidar height (3x3 mode, twice), so the downhill side shows its extra storey. Hollow: a perimeter wall one
// block thick, air inside, a floor slab every four blocks, a roof deck with a stone cornice and parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const CELLS = `${DIR}/way_291095565.cells.json`;
const OUT = `${DIR}/way_291095565.nbt`;
const W = 24, H = 22, D = 32;

// --- 1. footprint: lidar ground and roof smoothed into flat tiers ---
const raw = new Map();
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) raw.set(`${x},${z}`, { g, r });

// the mode of each cell's 3x3 neighbourhood (footprint cells only); ties go to the higher value
function modeOver(val) {
  const out = new Map();
  for (const key of val.keys()) {
    const [x, z] = key.split(",").map(Number), n = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const v = val.get(`${x + dx},${z + dz}`); if (v !== undefined) n.set(v, (n.get(v) || 0) + 1);
    }
    let best = 0, count = -1;
    for (const [v, k] of n) if (k > count || (k === count && v > best)) { best = v; count = k; }
    out.set(key, best);
  }
  return out;
}
const G1 = modeOver(new Map([...raw].map(([k, c]) => [k, c.g])));
const R1 = modeOver(modeOver(new Map([...raw].map(([k, c]) => [k, c.r]))));

// each cell: G = its ground (floor datum), R = its roof (absolute y of the roof deck's top, at least 5 above G)
const cells = new Map();
for (const key of raw.keys()) {
  const [x, z] = key.split(",").map(Number), G = G1.get(key);
  cells.set(key, { x, z, G, R: Math.max(R1.get(key), G + 5) });
}
const at = (x, z) => cells.get(`${x},${z}`);
const SIDES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// a side is exposed to the outside (no neighbour), or stands against a lower neighbour roof (a setback wall)
function exposure(c) {
  const ext = [], step = {};
  for (const [d, [dx, dz]] of Object.entries(SIDES)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) ext.push(d);
    else if (n.R < c.R) step[d] = n.R;   // the setback wall starts on a slab at the neighbour's deck level (n.R - 1)
  }
  return { ext, step };
}
const isWallRow = (e, y) => e.ext.length > 0 || Object.values(e.step).some(s => y >= s);
const isWallCell = (c) => { const e = exposure(c); return e.ext.length > 0 || Object.keys(e.step).length > 0; };

// --- 2. the plan: every block by position, so the lamps and the support check read it back ---
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const get = (x, y, z) => plan.get(`${x},${y},${z}`);
const FACE_ORDER = ["N", "S", "E", "W"];
const windows = [];

for (const c of cells.values()) {
  const e = exposure(c), wallAny = isWallCell(c);
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < c.G; y++) put(c.x, y, c.z, "stone_bricks");

  // a floor every storey (four blocks): the ground, then a slab each 4 up to the parapet line
  const floors = [c.G];
  for (let s = c.G + 4; s <= c.R - 2; s += 4) floors.push(s);

  // the deck level of each lower neighbour: a slab under the setback wall that stands on it
  const decks = Object.values(e.step).map(s => s - 1);
  for (let y = c.G; y <= c.R - 2; y++) {
    if (!isWallRow(e, y)) { if (floors.includes(y) || decks.includes(y)) put(c.x, y, c.z, "smooth_stone"); continue; }   // interior floor slab (the ground floor too, so its lamps stand on it)
    const f = floors.filter(v => v <= y).pop(), o = y - f;
    const face = FACE_ORDER.find(d => e.ext.includes(d));
    if (o === 0 || o === 3) { put(c.x, y, c.z, "stone_bricks"); continue; }     // string course and window head
    if (!face) { put(c.x, y, c.z, "bricks"); continue; }                        // a setback wall, no windows
    const u = face === "N" || face === "S" ? c.x : c.z;
    const shop = f === c.G;                                                     // the ground storey is shopfront glass
    if (shop ? u % 4 !== 0 : (u % 4 === 1 || u % 4 === 2)) {
      const along = face === "N" || face === "S" ? "east_west" : "north_south";
      const state = along === "east_west"
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(c.x, y, c.z, "glass_pane", state);
      windows.push({ x: c.x, y, z: c.z, face, u, lamp: o === 1 });
    } else put(c.x, y, c.z, "bricks");                                          // the piers between windows
  }

  // the roof: a cornice and parapet on the walls, the bare roof deck elsewhere
  if (wallAny) { put(c.x, c.R - 1, c.z, "smooth_quartz"); put(c.x, c.R, c.z, "stone_bricks"); }
  else put(c.x, c.R - 1, c.z, "gray_concrete");
}

// the entrance: a door in the north front, centred on its face, framed in stone with the head course above
const north = [...cells.values()].filter(c => exposure(c).ext.includes("N")).sort((a, b) => a.x - b.x);
const door = north[Math.floor(north.length / 2)];
const dy = door.G + 1;
for (const dx of [-1, 1]) for (const y of [dy, dy + 1]) if (get(door.x + dx, y, door.z)) put(door.x + dx, y, door.z, "stone_bricks");
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(door.x, dy, door.z, "dark_oak_door", doorState("lower"));
put(door.x, dy + 1, door.z, "dark_oak_door", doorState("upper"));

// warm light: glowstone standing inside, behind some of the glass (air in front of the pane, floor under it)
const IN = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
let lamps = 0;
for (const w of windows) {
  if (!w.lamp || (w.u + w.y) % 3 !== 0 || get(w.x, w.y, w.z)?.block !== "glass_pane") continue;
  const [dx, dz] = IN[w.face], ix = w.x + dx, iz = w.z + dz;
  if (!cells.has(`${ix},${iz}`) || get(ix, w.y, iz) || !get(ix, w.y - 1, iz)) continue;
  put(ix, w.y, iz, "glowstone"); lamps++;
}

// roof equipment: a few plant boxes on the bare deck, clear of the walls
for (const c of cells.values()) {
  if (isWallCell(c) || (c.x * 5 + c.z * 3) % 13 !== 0) continue;
  const clear = Object.values(SIDES).every(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && !isWallCell(n); });
  if (!clear) continue;
  put(c.x, c.R, c.z, "light_gray_concrete");
  put(c.x, c.R + 1, c.z, "light_gray_concrete");
}

// --- 3. write the volume, and check nothing floats (interior slabs and the deck span rooms on their walls) ---
const g = new Voxels([W, H, D]);
for (const [key, { block, state }] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
let unsupported = 0;
for (const [key, { block }] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  if (y === 0 || block === "smooth_stone" || block === "gray_concrete") continue;
  if (!get(x, y - 1, z)) { unsupported++; if (process.env.DEBUG_UNSUP) console.log("unsupported", block, x, y, z); }
}
const saved = g.save(OUT);
console.log(`footprint ${cells.size} cells, ${plan.size} placed, ${lamps} lamps, ${unsupported} unsupported (non-span), saved ${saved.blocks} blocks, ${saved.palette} palette`);
