// DC64454: a 1970s Brutalist-modern office block (500 5th St NW, Commercial-Office-Large), read from the lidar record.
// A five-tier massing: a 19-block core on the north-centre (the lobby axis) with a 2-block penthouse on its roof, an
// 18-block main deck around it, 17-block edge wings, and 13- and 9-block low wings on the east and west flanks. Lidar roofs
// are median-smoothed over 3x3 and snapped to 4-block storey lines, so every tier is four storeys or fewer and sits on
// the one below.
//
// Pale precast spandrels and white concrete piers in a grid, light-blue glazing in each bay, a polished-granite base
// course, a cornice band and a parapet slab on top of the taller tiers. Ground-floor bays are the shopfront; one
// dark-oak entrance sits centred on the north face under a stone hood. Interior cells one step behind a glazed bay are
// air at the glass rows, with a floor slab and ceiling per storey, and a lantern or glowstone standing on the floor in
// some rooms. Deeper cells are solid. Roof plant (iron blocks) sits on the lower decks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64454.cells.json`, "utf8"));
const W = 25, D = 32, H = 31;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => raw.has(key(x, z));
const FACES = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];

// Lidar roof: median of the 3x3 neighbourhood (kills single-cell noise), then snapped to a storey-line tier.
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(raw.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const r = v[v.length >> 1];
  return r >= 19 ? 19 : r >= 18 ? 18 : r >= 16 ? 17 : r >= 10 ? 13 : r >= 7 ? 9 : 5;
};

// Facade faces of a cell (sides with no footprint cell beside them), piers on every third cell of a face, corners
// always piers. The north entrance sits on the core's axis.
const faces = (x, z) => FACES.filter(([dx, dz]) => !inside(x + dx, z + dz)).map(([, , f]) => f);
const DOOR = { x: 18, z: 0 };
// Step faces: an interior cell that rises above a lower tier next to it shows that tier's roof as a wall above the lower
// deck, so it takes the same bay pattern as the outside walls (solid behind, no interior air).
const info = new Map();
for (const [x, z, g] of cells) {
  const fs = faces(x, z);
  const face = fs.length > 0;
  const T = tierOf(x, z);
  let step = null;
  if (!face) for (const [dx, dz, f] of FACES) {
    const n = inside(x + dx, z + dz) ? tierOf(x + dx, z + dz) : null;
    if (n !== null && n < T && (step === null || n > step.from)) step = { from: n, dir: f };
  }
  const dirs = face ? fs : step ? [step.dir] : [];
  const wallFrom = face ? 0 : step ? step.from : Infinity;
  const pier = dirs.length > 0 && (dirs.length > 1 || (dirs[0] === "N" || dirs[0] === "S" ? x % 3 === 0 : z % 3 === 0));
  const door = x === DOOR.x && z === DOOR.z;
  info.set(key(x, z), { x, z, G: g, T, face, pier, door, wallFrom, dirs });
}
const at = (x, z) => info.get(key(x, z));
// A bay is an open facade cell (glazed, not a pier, not the door); a room is an interior cell one step behind one.
const open = (x, z) => { const c = at(x, z); return !!c && c.face && !c.pier; };
for (const c of info.values()) c.room = !c.face && FACES.some(([dx, dz]) => open(c.x + dx, c.z + dz));
// Penthouse: core cells (T 19) at least two cells in from any lower neighbour.
const core = (x, z) => at(x, z)?.T === 19;
const penthouse = (x, z) => { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!core(x + dx, z + dz)) return false; return true; };

const FOUND = "polished_granite", SPANDREL = "light_gray_concrete", PIER_MAT = "white_concrete";
const GLASS = "light_blue_stained_glass_pane", CORNICE = "polished_andesite", INTERIOR = "light_gray_concrete";
const PARAPET = ["smooth_stone_slab", { type: "top", waterlogged: "false" }];
const PENT = "smooth_quartz", PLANT = "iron_block";
const HOOD = "polished_andesite";
const door = (half) => ["dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];

// Storey s spans y = b .. b+3 with b = 1 + 4s: sill, two glass rows, head spandrel. Ground floor sill is the base course.
const storeyBase = (y) => 1 + 4 * Math.floor((y - 1) / 4);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
const LAMP = (x, y, z) => { const h = hash(x, y, z) % 24; return h === 0 ? ["lantern", { hanging: "false", waterlogged: "false" }] : h === 1 ? ["glowstone"] : null; };

// Block for one cell at height y: [id, state?] or null for air.
const blockAt = (x, z, y) => {
  const c = at(x, z), { G, T, face, pier, door: isDoor, room, wallFrom } = c;
  const wall = y >= wallFrom;                                                  // outside wall, or a step face above a lower tier
  if (y < Math.max(G, 1)) return [FOUND];                                     // foundation: nothing floats on a slope
  if (penthouse(x, z) && T === 19 && (y === 19 || y === 20)) return [PENT];   // roof equipment on the core
  if (y >= T) return (!face && T < 19 && x % 4 === 2 && z % 4 === 2 && y === T) ? [PLANT] : null;
  if (y === T - 1) return wall ? PARAPET : [INTERIOR];                         // parapet slab or roof deck
  if (wall) {
    if (z === 0 && y === 4 && x >= 16 && x <= 20) return [HOOD];              // entrance hood
    if (isDoor) { if (y === 1) return door("lower"); if (y === 2) return door("upper"); if (y === 3) return [GLASS]; }
    if (pier) return [PIER_MAT];
    if (y === T - 2 && T >= 18) return [CORNICE];                             // cornice band on the taller tiers
    const b = storeyBase(y), rel = y - b;
    if (rel === 0 && b === 1) return [FOUND];                                 // shopfront base course
    if (rel === 1 || rel === 2) return [GLASS];
    return [SPANDREL];
  }
  const b = storeyBase(y), rel = y - b;
  if (room && (rel === 1 || rel === 2)) return rel === 1 ? LAMP(x, y, z) : null;   // air behind the glass
  return [INTERIOR];
};

const g = new Voxels([W, H, D]);
for (const [x, z] of cells) for (let y = 0; y < H; y++) {
  const b = blockAt(x, z, y);
  if (b) g.set(x, y, z, b[0], b[1]);
}
const out = g.save(`${DIR}/DC64454.nbt`);
console.log(`DC64454.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
