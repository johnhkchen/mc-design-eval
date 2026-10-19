// 603 Fifth Avenue, a 1930 mixed residential and commercial block: 27 x 6 blocks, about 22 blocks (20 m) to the roof, so seven
// storeys on a 4-block commercial ground floor. Art Deco limestone on a granite base: cream piers every third column and
// smooth-quartz spandrels on each storey line, a dark andesite cornice, black-glass shopfronts, and a bronze-grey door
// under a canopy at x 9-12 on the street side (z 5). The lowest ground is 0 under every cell, so the foundation is empty.
// The lidar is read as four flat tiers, not followed cell by cell: 22 blocks along the north street wall (z 0-1), 19 on
// the flanks, 16 in the middle, 10 for a low shed on the south side at x 18-20. Glass sits in the outer skin with a
// one-block air gap behind it wherever the cell behind is interior; the core is solid (no interiors). A penthouse stands
// on the street tier, a mechanical box on a flank, and a lightning rod on top. Some windows are lit by glowstone behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035450.cells.json`, "utf8"));
const X = 27, Y = 34, Z = 6;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Flat tiers from the lidar: 0 = no building (a light well), 10 / 16 / 19 / 22 blocks.
const tierTop = (L) => (L <= 0 ? 0 : L >= 20 ? 22 : L >= 17 ? 19 : L >= 12 ? 16 : 10);
const roofAt = (x, z) => (inFoot(x, z) ? tierTop(lidar(x, z)) : 0);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // N = low z (uptown), the street side of the north wall
const ORDER = ["N", "S", "W", "E"];
// A cell is open at height y when it is outside the footprint, unbuilt, or its tier is at or below y.
const open = (x, y, z) => !inFoot(x, z) || roofAt(x, z) <= y;
const exposed = (x, y, z) => ORDER.filter((d) => { const [dx, dz] = DIRS[d]; return open(x + dx, y, z + dz); });

const M = {
  foundation: "stone_bricks", core: "stone", base: "polished_granite", pier: "calcite", spandrel: "smooth_quartz",
  cornice: "polished_andesite", roof: "smooth_stone", shop: "black_stained_glass_pane", glass: "light_blue_stained_glass_pane",
  fascia: "smooth_quartz", canopy: "black_concrete", door: "iron_door", penthouse: "stone_bricks", rod: "lightning_rod",
};
const pane = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
// Piers every third column on the long faces (N, S), and at the two ends; on the short faces only at the corners.
const isPier = (x, z, d) => (d === "N" || d === "S" ? x % 3 === 0 || x === 0 || x === X - 1 : z === 0 || z === Z - 1);
const ENTRANCE_X = 10, CANOPY = [9, 12];

const grid = new Map();   // "x,y,z" -> { block, state }; anything not in the map is air
const put = (x, y, z, block, state) => grid.set(`${x},${y},${z}`, { block, state });
const windows = [];       // { x, y, z, d, shop } so the air gap behind each pane can be cut after the mass is set

for (const [key, { ground }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const T = roofAt(x, z);
  if (!T) { put(x, 0, z, M.roof); continue; }                  // light well: paving at the ground
  for (let y = 0; y < ground; y++) put(x, y, z, M.foundation);
  for (let y = ground; y < T; y++) {
    const faces = exposed(x, y, z);
    if (y === T - 1) { put(x, y, z, faces.length ? M.cornice : M.roof); continue; }   // parapet on the edge, roof inside
    if (!faces.length) { put(x, y, z, M.core); continue; }
    const d = faces[0];
    if (d === "S" && z === Z - 1 && y === 3 && x >= CANOPY[0] && x <= CANOPY[1]) { put(x, y, z, M.canopy); continue; }
    if (d === "S" && z === Z - 1 && x === ENTRANCE_X && (y === 1 || y === 2)) {
      put(x, y, z, M.door, { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 0) { put(x, y, z, M.base); continue; }
    if (y <= 2) {
      if (isPier(x, z, d)) put(x, y, z, M.base);
      else { put(x, y, z, M.shop, pane(d)); windows.push({ x, y, z, d, shop: true }); }
      continue;
    }
    if (y === 3) { put(x, y, z, M.fascia); continue; }
    if ((y - 4) % 3 === 0) { put(x, y, z, M.spandrel); continue; }   // floor line, one per storey
    if (isPier(x, z, d)) put(x, y, z, M.pier);
    else { put(x, y, z, M.glass, pane(d)); windows.push({ x, y, z, d, shop: false }); }
  }
}

// Behind the glass: an air gap where the cell behind is interior (no exposure of its own), glowstone in some.
// Upper windows are set back one block into the skin, so the piers and spandrels stand proud of the reveals; shopfronts stay flush.
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;
const clean = (x, y, z) => inFoot(x, z) && roofAt(x, z) > y && !exposed(x, y, z).length;
for (const w of windows) {
  const [dx, dz] = DIRS[w.d];
  const ix = w.x - dx, iz = w.z - dz;
  const jx = ix - dx, jz = iz - dz;
  if (!w.shop && clean(ix, w.y, iz)) {
    grid.delete(`${w.x},${w.y},${w.z}`);                  // the reveal is open air
    put(ix, w.y, iz, M.glass, pane(w.d));                 // the pane sits one block in
    if (clean(jx, w.y, jz)) { if (lit(jx, w.y, jz)) put(jx, w.y, jz, "glowstone"); else grid.delete(`${jx},${w.y},${jz}`); }
    continue;
  }
  if (!clean(ix, w.y, iz)) continue;
  if (lit(ix, w.y, iz)) put(ix, w.y, iz, "glowstone");
  else grid.delete(`${ix},${w.y},${iz}`);
}
// Entrance: the door opens onto air inside.
for (const y of [1, 2]) grid.delete(`${ENTRANCE_X},${y},${Z - 2}`);

// Roof equipment: a penthouse on the street tier, a mechanical box on a flank, a lightning rod on the penthouse.
for (let x = 5; x <= 9; x++) for (let y = 22; y <= 23; y++) put(x, y, 1, M.penthouse);
for (let x = 23; x <= 25; x++) for (let y = 19; y <= 20; y++) put(x, y, 3, M.penthouse);
put(7, 24, 1, M.rod, { facing: "up", powered: "false", waterlogged: "false" });

const g = new Voxels([X, Y, Z]);
for (const [k, { block, state }] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/NYC1035450.nbt`);
console.log(`NYC1035450.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
