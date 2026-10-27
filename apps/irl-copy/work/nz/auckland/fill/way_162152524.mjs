// Way 162152524, Auckland: a 1970s-80s concrete office block on Eden Terrace's slope. Three storeys of precast
// panels over a stone base, a 4-storey core rising 3 blocks above the wings (the lidar's 19 and 22), a parapet
// band, tinted glazing between white piers, a shopfront ground floor with a recessed door on the high (south) side,
// and a plinth that shows its extra storeys on the low (north) side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152524.cells.json", "utf8"));

const SX = 53, SY = 35, SZ = 31;
const FLOOR = 5;               // ground-floor slab, above the highest ground under the footprint (5)
const STOREY = 4;
const WING = 19, CORE = 22;    // the lidar's roof tiers: 18-19 wings, 20-22 core (smoothed to two flat tiers)

const PLINTH = "stone_bricks", BASE = "stone_bricks", BAND = "gray_concrete", WALL = "light_gray_concrete";
const PIER = "white_concrete", GLASS = "light_blue_stained_glass", CAP = "smooth_stone", SLAB = "smooth_stone";
const CORNICE = "smooth_stone", FASCIA = "gray_concrete", PLANT = "gray_concrete";
const DOOR = "dark_oak_door";

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];       // +x, -x, +z (south), -z (north)
const k = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, g, raw] of cells) cell.set(k(x, z), { x, z, g, raw });
const at = (x, z) => cell.get(k(x, z));

// Smooth the lidar: a cell is core when most footprint cells around it (its 3x3) read 20+ on the raw roof, then
// a second majority pass over those flags drops one-cell spines and notches so each tier's edge runs straight.
const around = (c, fn) => {
  let n = 0, hi = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = at(c.x + dx, c.z + dz); if (!o) continue;
    n++; if (fn(o)) hi++;
  }
  return hi * 2 > n;
};
for (const c of cell.values()) c.core1 = around(c, o => o.raw >= 20);
for (const c of cell.values()) c.R = around(c, o => o.core1) ? CORE : WING;
// Walls stand on the outer edge and on the faces a taller tier rises above; the rest is shell with floor slabs.
for (const c of cell.values()) {
  c.out = DIRS.filter(([dx, dz]) => { const o = at(c.x + dx, c.z + dz); return !o || o.R < c.R; });
  c.wall = c.out.length > 0;
  // every third cell along each face is a pier, measured on that face's own axis (a stepped edge is then not all piers)
  c.pier = c.out.some(([dx, dz]) => (dx !== 0 ? c.z : c.x) % 3 === 0);
}

// The entrance: the south face, at street level (ground 5), nearest the middle of that run.
const south = [...cell.values()].filter(c => c.wall && c.g === 5 && c.out.some(([dx, dz]) => dx === 0 && dz === 1));
const midX = south.map(c => c.x).sort((a, b) => a - b)[south.length >> 1];
const door = south.reduce((best, c) => (!best || Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best), null);

const g = new Voxels([SX, SY, SZ]);
const isFloor = y => y >= FLOOR && (y - FLOOR) % STOREY === 0;

for (const c of cell.values()) {
  const { x, z, R } = c;
  for (let y = 0; y < R; y++) {
    if (y < FLOOR) { g.set(x, y, z, PLINTH); continue; }
    if (y === R - 1) { g.set(x, y, z, CAP); continue; }          // roof: the top layer of every tier
    if (!c.wall) { if (isFloor(y)) g.set(x, y, z, SLAB); continue; }   // shell interior: air, with a slab per storey
    const b = FLOOR + Math.floor((y - FLOOR) / STOREY) * STOREY, dy = y - b;
    if (c.pier) { g.set(x, y, z, PIER); continue; }
    if (dy === 0) { g.set(x, y, z, b === FLOOR ? BASE : (b === 17 && R === WING ? CORNICE : BAND)); continue; }
    if (b === FLOOR) { if (dy === 1 || dy === 2) g.set(x, y, z, GLASS); else g.set(x, y, z, FASCIA); continue; }
    if (dy === 1 || dy === 2) { g.set(x, y, z, GLASS); continue; }
    g.set(x, y, z, WALL);
  }
  // Downhill basement: the plinth shows as an extra storey, with a few windows above grade.
  for (let y = 2; y <= 3; y++) if (c.wall && c.g <= y - 1 && !c.pier) g.set(x, y, z, GLASS);
}

// Shroomlights and glowstone just inside some windows (the air gap behind the glass).
for (const c of cell.values()) {
  if (!c.wall || c.pier || c.out.length === 0) continue;
  const [dx, dz] = c.out[0];
  const inside = at(c.x - dx, c.z - dz);
  if (!inside || inside.wall) continue;
  for (const y of [FLOOR + 2, FLOOR + 6, FLOOR + 10, FLOOR + 14]) {
    if (y >= c.R - 1 || y >= inside.R - 1) continue;
    const pick = (c.x * 7 + c.z * 3 + y) % 9;
    if (pick === 0) g.set(inside.x, y, inside.z, "shroomlight");
    else if (pick === 4) g.set(inside.x, y, inside.z, "glowstone");
  }
}

// Plant boxes on the wing roofs, flush with the cap (roof equipment without lifting the roof above the lidar).
for (const c of cell.values()) {
  if (c.wall || c.R !== WING) continue;
  if ((c.x % 9) >= 3 && (c.x % 9) <= 4 && (c.z % 7) >= 2 && (c.z % 7) <= 3) g.set(c.x, WING - 1, c.z, PLANT);
}

// The entrance: a dark oak door on the south face, sidelights either side, a stone canopy band and a hanging lantern.
if (door) {
  const { x, z } = door;
  g.set(x, FLOOR, z, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, FLOOR + 1, z, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, FLOOR + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  g.set(x, FLOOR + 3, z, FASCIA);
  for (const dx of [-1, 1]) {
    const o = at(x + dx, z); if (!o || !o.wall) continue;
    g.set(x + dx, FLOOR + 3, z, "stone_bricks");
    g.set(x + dx, FLOOR, z, BASE);
  }
  g.set(x, FLOOR + 3, z, "stone_bricks");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152524.nbt");
console.log(`way_162152524: ${cell.size} footprint cells, core ${[...cell.values()].filter(c => c.R === CORE).length}, door at x${door?.x} z${door?.z}, ${stats.blocks} blocks, palette ${stats.palette}`);
