// 51 Albert Street, Auckland CBD, as a 1990s-2000s office tower: a dark-blue glass curtain wall with pale
// spandrels and dark mullions over a black volcanic-stone podium, stepping in as it rises (the lidar's
// 164 / 168 / 172 tiers), lower wings at 16 and 28. Built only on the footprint: per cell, foundation to the
// cell's ground, the ground-floor shopfront, then 4-block storeys on one global grid; the lidar roof is
// quantised to those tiers so every floor and setback stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_839991755.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 48, D = 30, H = 184;
const FOUNDATION = "polished_blackstone";
const BASE = "polished_blackstone_bricks";     // podium, base course, ground lintel, parapets
const GLASS = "light_blue_stained_glass";
const MULLION = "gray_concrete";
const SPANDREL = "light_gray_concrete";        // storey lines, floor slabs, columns
const ROOF = "gray_concrete";
const LIGHT = "glowstone";
const STOREY0 = 8;                              // first floor line above the shopfront
const SHOP_TOP = 7;                             // ground-floor lintel row

// lidar roof -> flat tier: 16 and 28 are the wings, 164 / 168 / 172 the setbacks of the tower
const tierOf = (r) => (r <= 18 ? 16 : r <= 30 || r <= 162 ? 28 : r <= 165 ? 164 : r <= 168 ? 168 : 172);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k2 = (x, z) => x * 1000 + z;
const cellMap = new Map();
for (const [x, z, g, r] of cells) cellMap.set(k2(x, z), { g, t: tierOf(r) });
const at = (x, z) => cellMap.get(k2(x, z));
const isSlabRow = (y) => y >= STOREY0 && (y - STOREY0) % 4 === 0;
const isColumn = (x, z) => x % 4 === 2 && z % 4 === 2;

// the outward direction of an envelope cell at height y (a neighbour outside the footprint, or a lower roof)
function outward(x, z, y) {
  for (const [dx, dz] of DIRS) {
    const n = at(x + dx, z + dz);
    if (!n) return [dx, dz];
    if (n.g > y) continue;                       // the neighbour's foundation is solid there
    if (n.t <= y) return [dx, dz];
  }
  return null;
}
const glassRow = (y, g) => (y >= STOREY0 ? !isSlabRow(y) : y > g && y < SHOP_TOP);
const windowLit = (x, z, y) => (x * 3 + z * 5 + y) % 11 === 0;

// the entrance: a ground-level envelope cell on the west or north face, mid-run
const doorCands = [];
for (const [x, z, g] of cells) if (outward(x, z, g + 1) && g + 1 < SHOP_TOP) {
  const o = outward(x, z, g + 1);
  if (o[0] === -1 || o[1] === -1) doorCands.push({ x, z, g, o });
}
doorCands.sort((a, b) => a.z - b.z);
const door = doorCands[Math.floor(doorCands.length / 2)] ?? null;

// window lights behind the glass: the cell just inside a lit window
const lit = new Set();
for (const [x, z, , ] of cells) {
  const c = at(x, z);
  for (let y = c.g; y < c.t - 2; y++) {
    const o = outward(x, z, y);
    if (!o || !glassRow(y, c.g) || !windowLit(x, z, y)) continue;
    const ix = x - o[0], iz = z - o[1];
    if (at(ix, iz)) lit.add(`${ix},${y},${iz}`);
  }
}

const v = new Voxels([W, H, D]);
let counts = { glass: 0, lit: 0, door: 0 };
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = at(x, z);
  for (let y = 0; y < c.g; y++) v.set(x, y, z, FOUNDATION);
  for (let y = c.g; y < c.t; y++) {
    const o = outward(x, z, y);
    if (y >= c.t - 2 && o) { v.set(x, y, z, SPANDREL); continue; }   // cornice band, pale against the glass
    if (y === c.t - 1) { v.set(x, y, z, ROOF); continue; }
    if (door && x === door.x && z === door.z && (y === c.g + 1 || y === c.g + 2)) {
      v.set(x, y, z, "dark_oak_door", { facing: door.o[0] === -1 ? "west" : "north", half: y === c.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      counts.door++; continue;
    }
    if (door && y === c.g + 3 && Math.abs(x - door.x) <= 1 && z === door.z) { v.set(x, y, z, BASE); continue; }   // canopy band over the entrance
    if (o) {
      if (y < STOREY0 && (y === c.g || y === SHOP_TOP)) v.set(x, y, z, BASE);
      else if (isSlabRow(y)) v.set(x, y, z, SPANDREL);
      else if (y < STOREY0 && !glassRow(y, c.g)) v.set(x, y, z, BASE);
      else if ((x + z) % 3 === 0) v.set(x, y, z, MULLION);
      else { v.set(x, y, z, GLASS); counts.glass++; }
      continue;
    }
    if (isSlabRow(y) || (isColumn(x, z) && y >= c.g)) { v.set(x, y, z, SPANDREL); continue; }
    if (lit.has(`${x},${y},${z}`)) { v.set(x, y, z, LIGHT); counts.lit++; }
  }
}

// roof plant on the top tier, standing on the roof; lanterns on its corners
for (let z = 9; z <= 12; z++) for (let x = 14; x <= 19; x++) {
  const c = at(x, z);
  if (!c || c.t !== 172) continue;
  for (let y = 172; y <= 174; y++) v.set(x, y, z, SPANDREL);
}
for (const [x, z] of [[14, 9], [19, 9], [14, 12], [19, 12]]) if (at(x, z)?.t === 172) v.set(x, 175, z, "lantern", { hanging: "false", waterlogged: "false" });

const out = `${DIR}/way_839991755.nbt`;
const res = v.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, palette ${res.palette}`, counts);
