// Way 292861401, Auckland (Eden Terrace / Mt Eden side of the CBD): a 40 x 21 block footprint with a 1970s-80s
// concrete office block read from the lidar roof: a six-storey slab (roof 26), an eight-storey west wing (roof 32),
// a three-storey east wing (roof 12) and a stepped tower at the east tip reaching 40. Basalt plinth (Auckland's
// volcanic stone), white precast concrete piers, light-grey storey bands, tinted glass in recessed bays with an air
// gap behind, a recessed entrance with a soffit, a cornice and cap on the parapet, plant boxes on the roofs and an
// aviation lamp on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861401.cells.json`, "utf8"));   // [x, z, ground, roof]

const ID = {
  base: "polished_andesite",     // plinth and foundation
  body: "white_concrete",        // precast piers and the solid mass
  band: "light_gray_concrete",   // storey lines and head bands
  glass: "light_blue_stained_glass_pane",
  cornice: "stone_bricks",
  cap: "stone_brick_slab",
  roof: "gray_concrete",
  plant: "iron_block",
  lamp: "glowstone",
};

// Lidar roof -> clean tiers. A 3x3 median of the roof removes the noise; the tower and its setbacks are placed on the
// east tip explicitly, because the lidar's 40s there are a three-cell spike that a median would flatten.
const raw = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { x, z, gr, roof }]));
const rawAt = (x, z) => raw.get(`${x},${z}`);
function smoothRoof(x, z) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = rawAt(x + dx, z + dz); if (c) v.push(c.roof); }
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
}
function tierOf(x, z) {
  const s = smoothRoof(x, z);
  let T = s >= 28 ? 32 : s >= 20 ? 26 : 12;
  if (x >= 33 && z >= 11 && z <= 17) T = Math.max(T, 26);   // podium under the tower
  if (x >= 35 && z >= 12 && z <= 17) T = Math.max(T, 32);   // first setback
  if (x >= 36 && z >= 13 && z <= 16) T = 40;                // the tower
  return T;
}

const C = new Map();
for (const c of raw.values()) C.set(`${c.x},${c.z}`, { ...c, T: tierOf(c.x, c.z) });
const cell = (x, z) => C.get(`${x},${z}`);

// N/S faces run along x, W/E faces run along z. dx/dz points out of the building.
const DIRS = [
  { k: "N", dx: 0, dz: -1, along: "x", facing: "north" },
  { k: "S", dx: 0, dz: 1, along: "x", facing: "south" },
  { k: "W", dx: -1, dz: 0, along: "z", facing: "west" },
  { k: "E", dx: 1, dz: 0, along: "z", facing: "east" },
];
const interiorCell = (x, z) => DIRS.every((e) => cell(x + e.dx, z + e.dz));

// Each cell's first exposed face: outside the footprint, or against a neighbour whose tier is lower (a setback).
for (const c of C.values()) {
  c.bound = DIRS.some((d) => !cell(c.x + d.dx, c.z + d.dz));
  c.face = DIRS.find((d) => { const nb = cell(c.x + d.dx, c.z + d.dz); return !nb || nb.T < c.T; }) ?? null;
  c.wallFrom = c.face ? (cell(c.x + c.face.dx, c.z + c.face.dz)?.T ?? 0) : c.T;
}

const g = new Voxels([40, 53, 21]);

// 1. Solid mass from y 0 to the tier, with the plinth below grade. Nothing floats: every column is solid from the ground.
for (const c of C.values()) for (let y = 0; y < c.T; y++) g.set(c.x, y, c.z, y < c.gr || y === 0 ? ID.base : ID.body);

// 2. The entrance: the middle of the north-facing bay cells, with two shopfront bays either side and a soffit above.
const northBound = [...C.values()].filter((c) => c.bound && c.face?.k === "N").sort((a, b) => a.x - b.x);
const doorX = northBound[northBound.length >> 1].x;

// 3. Facades. Storeys are 4 high: row 0 a storey line, rows 1-2 the glazing, row 3 a head band. Piers every third
// cell above the ground floor; glass sits in the outer cell with a one-cell air gap behind it in the cell inside.
// Only glass, bands, the door and the soffit are written here; the solid mass already holds everything else.
const stats = { glass: 0, glow: 0, doors: 0 };
for (const c of C.values()) {
  const d = c.face;
  if (!d) continue;
  const innerX = c.x - d.dx, innerZ = c.z - d.dz;
  const inner = cell(innerX, innerZ);
  const canCarve = inner && interiorCell(innerX, innerZ);
  const u = d.along === "x" ? c.x : c.z;
  const top = c.T - 3;                           // rows T-2 and T-1 are the cornice and cap (or the membrane)
  const entranceBay = c.bound && d.k === "N" && Math.abs(c.x - doorX) <= 1;
  for (let y = Math.max(c.gr, c.wallFrom, 1); y <= top; y++) {
    const r = y % 4, k = (y - r) / 4;
    if (r === 0 || r === 3) {
      if (entranceBay && k === 0 && r === 3) g.set(c.x, y, c.z, "stone_brick_slab", { type: "top" });  // soffit over the entrance
      else g.set(c.x, y, c.z, ID.band);
      continue;
    }
    if (entranceBay && k === 0 && c.x === doorX) {
      g.set(c.x, y, c.z, "iron_door", { facing: d.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      stats.doors += y === 1 ? 1 : 0;
      if (canCarve) g.setCellAt(g.at(inner.x, y, inner.z), 0);
      continue;
    }
    if (k > 0 && u % 3 === 0) continue;          // pier: the solid body stays
    if (!canCarve) continue;                     // thin edge with nothing behind: stays solid
    g.set(c.x, y, c.z, ID.glass, d.along === "x"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    g.setCellAt(g.at(inner.x, y, inner.z), 0);   // the air gap behind the glass
    stats.glass++;
    if (r === 1 && (u * 5 + k * 3 + c.z) % 7 === 0) { g.set(inner.x, y, inner.z, ID.lamp); stats.glow++; }   // a lit room
  }
}

// 4. Parapets and roofs: the cornice and cap on the outside edge, a grey membrane on every other top.
for (const c of C.values()) {
  if (c.bound) {
    g.set(c.x, c.T - 2, c.z, ID.cornice);
    g.set(c.x, c.T - 1, c.z, ID.cap, { type: "top" });
  } else {
    g.set(c.x, c.T - 1, c.z, ID.roof);
  }
}

// 5. Roof plant on the two big roofs, an overrun and an aviation lamp on the tower.
for (const c of C.values()) {
  if (c.bound || !interiorCell(c.x, c.z)) continue;
  if ((c.T === 26 || c.T === 32) && c.x % 6 === 2 && c.z % 5 === 2) {
    g.set(c.x, c.T, c.z, ID.plant);
    g.set(c.x, c.T + 1, c.z, ID.plant);
  }
}
for (let x = 37; x <= 38; x++) for (let z = 14; z <= 15; z++) {
  const c = cell(x, z);
  if (!c || c.T !== 40) continue;
  for (let y = 40; y <= 42; y++) g.set(x, y, z, ID.band);
}
if (cell(37, 14)?.T === 40) g.set(37, 43, 14, "redstone_lamp", { lit: "true" });

const out = g.save(`${DIR}/way_292861401.nbt`);
console.log(`way_292861401: ${C.size} cells, ${out.blocks} blocks, palette ${out.palette}; glass ${stats.glass}, lit ${stats.glow}, doors ${stats.doors}`);
