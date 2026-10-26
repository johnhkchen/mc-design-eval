// 1120 20th St NW: a 1960s-70s Modern office tower on a stepped podium. Cream stone (calcite piers, smooth-quartz
// storey lines, stone-brick plinth) with blue-glass window bands and a shopfront lobby on the south face. The lidar
// roofs are snapped to even-row tiers: a 16-block tower core, 15/12-block shoulders, 6 and 4 block low wings and a
// 3-block notch. Each column is solid from y 0 up to its ground, and the shell stands on that foundation, so nothing
// floats. Inside, the shell is one block thick: a floor slab per storey and air behind every window, with a few
// glowstone lamps set just inside the glass. A penthouse with vent grilles sits on the tower roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC59448.cells.json`, "utf8"));

const g = new Voxels([24, 29, 30]);

const key = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, ground, roof] of cells) C.set(key(x, z), { x, z, G: ground, R: roof });
const at = (x, z) => C.get(key(x, z));

// ---- massing: 3x3 median of the lidar roof, snapped to even-row tiers (1-block noise does not make a tier) ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
for (const c of C.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = at(c.x + dx, c.z + dz); if (n) near.push(n.R);
  }
  // the roof surface (top y, exclusive) on an absolute even line, so neighbours on different ground share a tier height
  c.T = Math.max(3, 2 * Math.round((median(near) - 1) / 2));
}
// a side is exposed when the cell beside it is outside the footprint or stands lower (a step in the massing)
for (const c of C.values()) {
  c.exp = {};
  for (const [k, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(c.x + dx, c.z + dz); c.exp[k] = !n || n.T < c.T;
  }
  c.ext = Object.values(c.exp).some(Boolean);
  c.ns = c.exp.N || c.exp.S; c.ew = c.exp.E || c.exp.W;
  // piers on a 3-block rhythm: the north/south faces by x, the east/west faces by z; corners are piers
  c.pier = (c.ns && (c.x % 3 === 0 || c.ew)) || (c.ew && (c.z % 3 === 0 || c.ns));
}

// ---- materials ----
const FOUND = "stone_bricks", PLINTH = "stone_bricks", PIER = "calcite", LINE = "smooth_quartz";
const GLASS = "light_blue_stained_glass", ROOF = "light_gray_concrete", SLAB = "light_gray_concrete";
const LOBBY = "light_blue_stained_glass", CANOPY = "black_concrete";
const LAMP = "shroomlight";

// the entrance: south face, at the middle of the building's width (lowest ground there)
const ENTRY_X = 11, ENTRY_Z = 29;
const entryCell = at(ENTRY_X, ENTRY_Z);

// storeys count from y 1 (the base line, one block above the lowest ground): the plinth, a 3-block ground storey,
// then 2-block upper storeys, a floor line (even y) and a glass row (odd y). r = y - 1
const slabRow = (r) => r <= 0 || (r >= 3 && r % 2 === 1);          // plinth and floor lines
const winRow = (r) => r === 1 || (r >= 4 && r % 2 === 0);          // glass rows (ground shopfront, upper storeys)

for (const c of C.values()) {
  for (let y = 0; y < c.G; y++) g.set(c.x, y, c.z, FOUND);       // foundation: nothing floats on a slope
  for (let y = c.G; y < c.T; y++) {
    const r = y - 1, top = y === c.T - 1;
    if (top) { g.set(c.x, y, c.z, c.ext ? LINE : ROOF); continue; }     // cornice / roof membrane
    if (slabRow(r)) {
      g.set(c.x, y, c.z, c.ext ? (r === 0 ? PLINTH : LINE) : SLAB);       // plinth and storey lines; interior floors
      continue;
    }
    if (!c.ext) continue;                                              // interior air behind the glass
    if (r === 2) { g.set(c.x, y, c.z, PIER); continue; }               // ground-floor header course
    if (winRow(r)) {
      if (c === entryCell || (c.z === ENTRY_Z && Math.abs(c.x - ENTRY_X) <= 2 && r === 1)) {
        g.set(c.x, y, c.z, LOBBY);                                     // lobby glazing
      } else {
        g.set(c.x, y, c.z, c.pier ? PIER : GLASS);
      }
    }
  }
}

// ---- lamps: warm light set just inside some upper-floor windows ----
for (const c of C.values()) {
  if (!c.ext || c.pier || c.z === ENTRY_Z) continue;
  for (let y = 5; y < c.T - 1; y += 2) {
    if ((c.x * 7 + c.z * 5 + y) % 11 !== 0) continue;                  // roughly one window in eleven
    const d = c.exp.N ? [0, 1] : c.exp.S ? [0, -1] : c.exp.W ? [1, 0] : [-1, 0];
    const inner = at(c.x + d[0], c.z + d[1]);
    if (!inner || inner.ext) continue;
    g.set(inner.x, y, inner.z, LAMP);
  }
}

// ---- entrance: a door in the lobby glazing with a dark canopy over it ----
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(ENTRY_X, 1, ENTRY_Z, "dark_oak_door", doorState("lower"));
g.set(ENTRY_X, 2, ENTRY_Z, "dark_oak_door", doorState("upper"));
for (let x = ENTRY_X - 1; x <= ENTRY_X + 1; x++) g.set(x, 3, ENTRY_Z, CANOPY);   // the lintel over the door

// ---- penthouse on the tallest tier: a calcite-ringed plant box with vent grilles ----
const topT = Math.max(...[...C.values()].map((c) => c.T));
for (let z = 12; z <= 16; z++) for (let x = 10; x <= 14; x++) {
  const c = at(x, z);
  if (!c || c.T !== topT || c.ext) continue;
  for (let y = topT; y < topT + 2; y++) {
    const ring = x === 10 || x === 14 || z === 12 || z === 16;
    const vent = y === topT && ring && ((x === 12 && (z === 12 || z === 16)) || (z === 14 && (x === 10 || x === 14)));
    if (vent) g.set(x, y, z, "iron_bars");
    else g.set(x, y, z, ring ? PIER : ROOF);
  }
}

const info = g.save(`${DIR}/DC59448.nbt`);
console.log(`DC59448: ${info.blocks} blocks, ${info.palette} palette entries, top y ${topT}`);
