// Commercial-Office-Large, 1615 M St NW: a 1970s-80s Portland-stone office block on a granite plinth.
// Wings are four storeys (3-block storeys, a 1-block band at each storey line) up to the roof at y 13; the
// central core rises two storeys higher to lidar's 15, its penthouse stepped in two cells from the core edge.
// Each storey is a 2-row window band (ground floor: granite kickplate + shopfront glass), with calcite piers
// every third cell, smooth-quartz spandrel/string courses, a polished-andesite cornice, and a door on the south
// front. No interiors: the glass backs onto air, with a floor slab per storey; a few lights stand behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86702.cells.json`, "utf8"));   // [x, z, ground, roof]

const SZ = [29, 27, 23];
const WING_TOP = 13, CORE_TOP = 15;
const PAL = {
  plinth: "polished_granite", kick: "polished_granite", pier: "calcite", band: "smooth_quartz",
  slab: "smooth_stone", glass: "light_blue_stained_glass_pane", cornice: "polished_andesite",
  deck: "gray_concrete", plant: "light_gray_concrete", cap: "iron_block",
};

const F = new Map();                                       // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof });
const key = (x, z) => `${x},${z}`;
const inF = (x, z) => F.has(key(x, z));
const nb4 = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];

// Lidar roof -> two clean tiers. Cells at 14+ that sit inside the 15-high mass form the core; the rest is the wing.
// A stray lidar 4 (the cell at x1 z12) and 12/13 noise read as wing.
const core = new Set();
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  const tallNb = nb4(x, z).filter(([a, b]) => F.has(key(a, b)) && F.get(key(a, b)).roof >= 15).length;
  if (c.roof >= 15 || (c.roof === 14 && tallNb >= 3)) core.add(k);
}
// Penthouse: the core eroded two cells in from its edge (a setback, not a sheer rise).
const depth = new Map();
let frontier = [];
for (const k of core) {
  const [x, z] = k.split(",").map(Number);
  if (nb4(x, z).some(([a, b]) => !core.has(key(a, b)))) { depth.set(k, 1); frontier.push(k); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const k of frontier) {
    const [x, z] = k.split(",").map(Number);
    for (const [a, b] of nb4(x, z)) {
      const kk = key(a, b);
      if (core.has(kk) && !depth.has(kk)) { depth.set(kk, d + 1); next.push(kk); }
    }
  }
  frontier = next;
}
const penthouse = new Set([...core].filter((k) => (depth.get(k) ?? 0) >= 3));

const footWall = (x, z) => nb4(x, z).some(([a, b]) => !inF(a, b));
const corner = (x, z) => (!inF(x - 1, z) || !inF(x + 1, z)) && (!inF(x, z - 1) || !inF(x, z + 1));
const pierCell = (x, z) => corner(x, z) || (x + z) % 3 === 0;
const doorCells = new Set([key(22, 22)]);                  // the south entrance, under the storey band
const pWall = (x, z) => nb4(x, z).some(([a, b]) => !penthouse.has(key(a, b)));

// What a footprint cell holds at height y (null = air). Walls are the footprint edge below y 13, the penthouse
// edge above; everything else is interior: floor slabs per storey, air between them.
function blockAt(x, z, y) {
  const k = key(x, z);
  const isPH = penthouse.has(k);
  const top = isPH ? CORE_TOP : WING_TOP;
  if (y >= top) return null;
  if (y === 0) return PAL.plinth;
  if (y >= 13) {                                           // penthouse storey, 13 and the cap at 14
    if (!isPH) return null;
    if (y === 14) return pWall(x, z) ? PAL.cornice : PAL.deck;
    if (!pWall(x, z)) return null;
    return pierCell(x, z) ? PAL.pier : PAL.glass;
  }
  if (y === 12) return footWall(x, z) ? PAL.cornice : PAL.deck;   // roof deck; the cornice course on the edge
  if (y === 3 || y === 6 || y === 9) return footWall(x, z) ? PAL.band : PAL.slab;   // storey lines
  if (!footWall(x, z)) return null;                        // interior air behind the glass
  if (doorCells.has(k) && (y === 1 || y === 2)) return { door: y === 1 ? "lower" : "upper" };
  if (pierCell(x, z)) return PAL.pier;
  if (y === 1) return PAL.kick;                            // ground floor kickplate under the shopfront glass
  return PAL.glass;
}

const g = new Voxels(SZ);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };

for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < 15; y++) {
    const b = blockAt(x, z, y);
    if (!b) continue;
    if (b.door) put(x, y, z, "oak_door", { ...DOOR, half: b.door });
    else put(x, y, z, b);
  }
}

// Roof plant on the wing roof (the south wing, clear of the core): a 3 x 3 louvred box with a cap.
for (let x = 19; x <= 21; x++) for (let z = 15; z <= 17; z++) {
  if (inF(x, z) && !core.has(key(x, z))) put(x, 13, z, PAL.plant);
}
put(20, 14, 16, PAL.cap);

// Warm lights behind some windows (on the interior cell next to the glass, in the air gap), and a lantern
// hanging in the lobby behind the entrance.
let lamp = 0;
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!footWall(x, z) || penthouse.has(k) || pierCell(x, z) || doorCells.has(k)) continue;
  for (const y of [2, 5, 8, 11]) {
    if ((x * 5 + z * 3 + y) % 4 !== 0) continue;
    const inner = nb4(x, z).find(([a, b]) => inF(a, b) && !footWall(a, b));
    if (!inner) continue;
    const [ix, iz] = inner;
    if (!blockAt(ix, iz, y)) {
      if (lamp++ % 3 === 0) put(ix, y, iz, "shroomlight");
      else put(ix, y, iz, "glowstone");
    }
  }
}
put(22, 2, 21, "lantern", { hanging: "true", waterlogged: "false" });

// Glass panes connect to the solids beside them in the wall plane (not to the air behind or in front).
const CONN = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 1; y < 15; y++) {
    const cell = g.get(x, y, z);
    if (!cell || !cell.block.endsWith("glass_pane")) continue;
    const state = { waterlogged: "false" };
    for (const [face, [dx, dz]] of Object.entries(CONN)) {
      const n = g.get(x + dx, y, z + dz);
      state[face] = n && n.block !== "minecraft:air" && !n.block.endsWith("air") ? "true" : "false";
    }
    put(x, y, z, cell.block, state);
  }
}

const stats = g.save(`${DIR}/DC86702.nbt`);
console.log(JSON.stringify({ footprint: F.size, core: core.size, penthouse: penthouse.size, ...stats }));
