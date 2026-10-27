// Owen G. Glenn Building (University of Auckland Business School, Symonds St side of the City Campus): a 2010s glazed
// academic block on a stone plinth, pale concrete storey bands and a dark-glass curtain wall, lit at dusk from behind the
// glass. Massing follows the lidar roof per cell, median-smoothed and snapped to 4-block storeys so each tier stands on
// the floor below it; storey lines sit on absolute 4-block rows so neighbouring tiers line up.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23894203.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23894203.nbt";

const X = 124, Y = 65, Z = 160;
const g = new Voxels([X, Y, Z]);

// --- footprint and per-cell massing ---------------------------------------------------------------------------------
const raw = new Map();                                    // "x,z" -> { g, r }
for (const [x, z, ground, roof] of cells) raw.set(`${x},${z}`, { g: ground, r: roof });
const at = (x, z) => raw.get(`${x},${z}`) ?? null;
const inFoot = (x, z) => raw.has(`${x},${z}`);

// a 3x3 median of the lidar roof stops single-cell noise, then the top snaps to a 4-block storey line
const cell = new Map();
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) near.push(n.r); }
  near.sort((a, b) => a - b);
  const rs = near[(near.length - 1) >> 1];
  const B = 4 * Math.floor(c.g / 4);                     // the storey the ground sits in
  const T = Math.max(4 * Math.round((rs - 1) / 4), B + 4); // deck: a storey line, the top floor's slab
  cell.set(key, { x, z, g: c.g, T });
}
const deckOf = (x, z) => { const c = cell.get(`${x},${z}`); return c ? c.T : -Infinity; };

// the cell's side is open at height y when there is no footprint beside it or the neighbour's deck is below y
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const openSides = (x, z, y) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || deckOf(x + dx, z + dz) < y);
const edgeSides = (x, z) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz));

// deterministic pseudo-random in [0, 1) so the same build repeats
const H = (a, b, c) => {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const STONE = "stone";                // the fill under the ground line and the lowest plinth
const SLAB = "light_gray_concrete";   // storey lines, floor slabs and the deck
const PIER = "polished_andesite";     // the plinth course and shopfront piers
const HEAD = "white_concrete";        // the head band over each window row, and the parapet
const MULLION = "gray_concrete";      // window frames
const CAP = "smooth_stone_slab";
const PILLAR = "light_gray_concrete";
const LIGHTS = [];                    // lamps behind the glass, set after the facade so they land in the air gap

// --- the main pass: one column per footprint cell ------------------------------------------------------------------
for (const c of cell.values()) {
  const { x, z, g: ground, T } = c;
  const B = 4 * Math.floor(ground / 4);            // the cell's ground storey base
  const top = T;

  // ground fill up to the lidar ground, then slabs on every storey line from the ground to the deck
  for (let y = 0; y < ground; y++) g.set(x, y, z, STONE);
  for (let y = Math.max(ground, 0); y <= top; y++) {
    const rel = y % 4;
    const open = openSides(x, z, y);
    if (rel === 0) { g.set(x, y, z, SLAB); continue; }  // storey line / floor slab (solid across)
    if (!open.length || y <= ground - 1) continue;
    // exposed face: the side pick is the first open side; bays run along that face
    const [dx, dz] = open[0];
    const alongX = dx !== 0;
    const bay = alongX ? z : x;
    const b = ((bay % 3) + 3) % 3;
    const storey = Math.floor(y / 4);
    const ground_storey = storey === Math.floor(ground / 4);
    const wi = Math.floor(bay / 3);
    const face = (dx + 2) * 5 + (dz + 2);
    if (ground_storey) {
      // shopfront: glazed bays between stone piers, a fascia band at the top, entrances at a few bays
      if (rel === 3) { g.set(x, y, z, SLAB); continue; }
      const door = rel === 1 && b === 1 && H(wi, storey, face) < 0.10 && (y >= ground) && edgeSides(x, z).length > 0;
      if (door) { placeDoor(x, y, z, dx, dz); g.set(x, y + 2, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
      if (b === 0) { g.set(x, y, z, PIER); continue; }
      g.set(x, y, z, H(wi, storey, face) < 0.25 ? "gray_stained_glass" : "light_blue_stained_glass");
      continue;
    }
    if (rel === 3) { g.set(x, y, z, HEAD); continue; }
    if (b === 0) { g.set(x, y, z, MULLION); continue; }
    const glass = H(wi, storey, face) < 0.22 ? "gray_stained_glass" : H(wi, storey, face + 7) < 0.3 ? "cyan_stained_glass" : "light_blue_stained_glass";
    g.set(x, y, z, glass);
    if (rel === 1 && b === 2 && H(wi, storey, face + 3) < 0.14) {
      // a lit room: the lamp stands on the slab inside the air gap, behind this bay
      LIGHTS.push([x - dx, y, z - dz, H(wi, storey, face) < 0.08 ? "glowstone" : "shroomlight", ground]);
    }
  }
  // parapet on the outer edge, with a coping cap; the deck itself is already a solid slab
  if (edgeSides(x, z).length) {
    g.set(x, top + 1, z, HEAD);
    g.set(x, top + 2, z, CAP, { type: "bottom", waterlogged: "false" });
  }
}

// structural pillars on a 6-cell grid for cells well inside the footprint (no pillar in the air gap behind the glass)
for (const c of cell.values()) {
  const { x, z, g: ground, T } = c;
  if (x % 6 !== 0 || z % 6 !== 0) continue;
  let deep = true;
  for (let dz = -2; dz <= 2 && deep; dz++) for (let dx = -2; dx <= 2; dx++) if (!inFoot(x + dx, z + dz)) { deep = false; break; }
  if (!deep) continue;
  for (let y = Math.max(ground, 0); y <= T; y++) if (!openSides(x, z, y).length) g.set(x, y, z, PILLAR);
}

// roof plant: a few boxes on the tallest deck, set in from the parapet and standing on the deck
for (const c of cell.values()) {
  const { x, z, T } = c;
  if (T < 44 || x % 9 < 4 || x % 9 > 6 || z % 9 < 4 || z % 9 > 6) continue;
  let inner = true;
  for (let dz = -3; dz <= 3 && inner; dz++) for (let dx = -3; dx <= 3; dx++) if (!inFoot(x + dx, z + dz)) { inner = false; break; }
  if (!inner) continue;
  g.set(x, T + 1, z, "gray_concrete");
  g.set(x, T + 2, z, "iron_bars");
}

// the lamps, now that the air gap is clear
for (const [x, y, z, block, ground] of LIGHTS) {
  if (!inFoot(x, z) || y < ground) continue;
  if (openSides(x, z, y).length) continue;
  g.set(x, y, z, block);
}

// doors: a dark-oak pair, hinged and facing out along the face the entrance sits on
function placeDoor(x, y, z, dx, dz) {
  const facing = dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north";
  g.set(x, y, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, y + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

const info = g.save(OUT);
console.log(`way_23894203: ${info.blocks} blocks, ${info.palette} palette entries, ${cell.size} cells`);
