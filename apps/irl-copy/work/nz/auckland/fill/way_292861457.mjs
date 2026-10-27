// way 292861457: a 1970s-80s concrete-frame office block in the Auckland CBD fringe (Eden Terrace / Newton edge).
// Record: 48 x 41 footprint, roof 27 blocks (~22 m) at the core, 22 at the wings, 24 at the setback ring. Pale
// precast concrete piers and string courses, tinted blue glazing in ribbon bands, a dark stone plinth, a recessed
// entrance bay with a lintel canopy on the uphill face, and roof plant on the wings and the lift overrun on the core.
// Hollow: each storey is a floor slab with an air gap behind the glass (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861457.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861457.nbt";

const X = 48, Z = 41, Y = 40;
const DATUM = 4;                       // ground-floor slab line; the lower band below it is the downhill extra storey
const STEP = 4;                        // storey height in blocks (~3.3 m)

// materials
const PLINTH = "stone_bricks", SLAB = "white_concrete", WALL = "light_gray_concrete", PIER = "white_concrete";
const SPAND = "gray_concrete", GLASS = "light_blue_stained_glass", LOGLASS = "gray_stained_glass";
const SHOP = "cyan_stained_glass", CAP = "smooth_stone", WARM = "glowstone";

// the lidar roof, snapped to three clean tiers (core 27, setback ring 24, wings 22); the low stray cells get a storey
function snapRoof(r, g) {
  if (r >= 26) return 27;
  if (r >= 24) return 24;
  if (r >= 20) return 22;
  return Math.max(g + STEP, 8);
}

const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, R: snapRoof(r, g) });
const col = (x, z) => foot.get(`${x},${z}`);
const has = (x, y, z) => { const c = col(x, z); return !!c && y >= c.g && y < c.R; };

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, b, st) => { if (y >= 0 && y < Y) g.set(x, y, z, b, st); };
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north, south, west, east (z-, z+, x-, x+)

// the face a cell shows at height y: the first direction whose neighbour does not reach that height
function faceAt(x, y, z) {
  for (const [dx, dz] of DIRS) if (!has(x + dx, y, z + dz)) return [dx, dz];
  return null;
}
// storey band of height y: lower band below the datum; above it, 4-block storeys starting at the datum
function bandOf(y) { return y < DATUM ? 0 : DATUM + STEP * Math.floor((y - DATUM) / STEP); }

// 1. the body: foundation, floor slabs, roof caps, facade pattern, air elsewhere
const facadeCells = [];
for (const [x, z, gr] of cells) {
  const { g: ground, R } = col(x, z);
  for (let y = 0; y < R; y++) {
    if (y < ground) { put(x, y, z, PLINTH); continue; }        // foundation to the lidar ground
    if (y === R - 1) { put(x, y, z, CAP); continue; }           // roof surface, solid
    const lo = bandOf(y), off = y - lo;
    const face = faceAt(x, y, z);
    if (lo > 0 && off === 0) { put(x, y, z, SLAB); continue; }  // floor slab (interior and facade)
    if (lo === 0 && off === 0) { put(x, y, z, PLINTH); continue; }
    if (!face) continue;                                         // interior: air behind the glass
    facadeCells.push({ x, y, z, face, lo, off, R });
  }
}

// 2. facade: window grid on each face. Piers every third bay along the face; glazing ribbons between.
// The shopfront band (the datum storey) is cyan glass with stone piers; the lower band is dark glass in a plinth.
for (const f of facadeCells) {
  const { x, y, z, face, lo, off, R } = f;
  const pier = (x + z) % 3 === 0;                     // piers every third cell on every face, so a corner keeps one rhythm
  const top = Math.min(lo + STEP, R);
  if (off === STEP - 1 || y === top - 1) {            // head spandrel of each storey
    put(x, y, z, lo === DATUM ? PIER : SPAND); continue;
  }
  if (lo === 0) {                                     // the downhill extra storey: plinth piers, dark basement glazing
    put(x, y, z, pier ? PLINTH : LOGLASS); continue;
  }
  if (lo === DATUM) {                                 // shopfront
    put(x, y, z, pier ? PLINTH : SHOP); continue;
  }
  put(x, y, z, pier ? PIER : GLASS);
}

// 3. support: a facade block may not hang over air (fill the wall down to what stands under it)
for (const f of facadeCells) {
  if (f.y > 0 && g.val(f.x, f.y - 1, f.z) === 0 && has(f.x, f.y - 1, f.z)) put(f.x, f.y - 1, f.z, SPAND);
}

// 4. the entrance: the uphill face's ground-level bay, a recessed door with a lintel canopy and a hanging lantern
let door = null;
for (const f of facadeCells) {
  if (f.lo !== DATUM || f.off !== 1) continue;
  const c = col(f.x, f.z);
  if (c.g !== DATUM) continue;                        // a level entrance: the datum sits on the ground
  const [dx, dz] = f.face;
  if (dx !== 0) continue;                             // a north/south face
  const dist = Math.abs(f.x - X / 2);
  if (!door || dist < door.dist) door = { ...f, dist, dz };
}
if (door) {
  const { x, z, dz } = door;
  const facing = dz < 0 ? "north" : "south";
  put(x, 4, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 5, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dxp of [-1, 0, 1]) put(x + dxp, 7, z, CAP);       // lintel canopy over the entrance bay
  for (const dxp of [-1, 1]) put(x + dxp, 4, z, PLINTH);       // door reveals
  put(x, 6, z, "lantern", { hanging: "true" });
}

// 5. warm light: glowstone standing inside behind some ribbon windows, on the storey's floor slab
let n = 0, glow = 0;
for (const f of facadeCells) {
  if (f.off !== 1 || f.lo === 0 || f.lo === DATUM) continue;
  if (f.y > f.R - 3) continue;
  const [dx, dz] = f.face;
  const inward = [f.x - dx, f.z - dz];
  if (!col(inward[0], inward[1])) continue;
  if (g.val(inward[0], f.y, inward[1]) !== 0) continue;
  if ((n++ + f.lo / STEP) % 4 !== 0) continue;
  put(inward[0], f.y, inward[1], WARM); glow++;
}

// 6. roof plant: two air-handling boxes on the wing roofs, a lift overrun and a lantern rail on the core
const plant = [[15, 14], [28, 33], [33, 9]];
for (const [px, pz] of plant) {
  const ok = [0, 1].every((a) => [0, 1].every((b) => { const c = col(px + a, pz + b); return c && c.R === 22; }));
  if (!ok) continue;
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
    put(px + a, 22, pz + b, WALL); put(px + a, 23, pz + b, WALL);
  }
  put(px, 24, pz, "iron_block");
}
// lift overrun: the core's centre column, two blocks above the cap, with a lit ceiling band
const core = cells.filter(([x, z, , r]) => snapRoof(r, 0) === 27);
const cx = Math.round(core.reduce((s, c) => s + c[0], 0) / core.length);
const cz = Math.round(core.reduce((s, c) => s + c[1], 0) / core.length);
for (let a = -1; a <= 0; a++) for (let b = -1; b <= 0; b++) {
  const c = col(cx + a, cz + b);
  if (!c || c.R !== 27) continue;
  put(cx + a, 27, cz + b, WALL); put(cx + a, 28, cz + b, WALL);
  put(cx + a, 29, cz + b, CAP);
}

const stats = g.save(OUT);
console.log(JSON.stringify({ file: OUT, ...stats, entrance: door ? { x: door.x, z: door.z, facing: door.dz < 0 ? "north" : "south" } : null, glow, core: [cx, cz] }));
