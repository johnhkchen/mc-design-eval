// DC86847: Department of Agriculture Administration Building (the Whitten Building), 1000 Constitution Ave NW, DC 20002,
// as a 1.21.1 module. A 1930s stripped-Classical government block: pale limestone walls on a dark granite-look plinth,
// four-block storeys with a calcite band at each floor line, a flat roof behind a parapet, and setbacks where the lidar
// steps up. The footprint is a long comb: the lidar roof is median-smoothed (3x3 over footprint cells) and snapped to
// three tops (8, 12, 14 blocks above y 0), so the 6-7 block wings read as two storeys and the 12-14 block core as three
// plus an attic course. Every column is solid from y 0 up to its ground (foundation) and then up to its tier, so nothing
// floats. Only the shell carries windows; the interior is air behind the glass except a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86847.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86847.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Palette
const FOUND = "stone_bricks";       // foundation under the grade
const PLINTH = "polished_granite";  // base course at grade
const STONE = "calcite";            // limestone walls, bands, piers, lintels
const GLASS = "glass_pane";
const MULLION = "smooth_quartz";    // window piers between bays
const DECK = "smooth_stone";        // interior floor slab and the roof membrane
const CAP = "calcite";              // the roof edge (cornice)
const PARAPET = "calcite";          // a plain parapet course (stripped Classical: no battlements)
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const UNIT = "iron_block";          // roof plant on the taller tops

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 1-cell gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Three tops: 2 storeys (8), 3 storeys (12), 3 storeys + attic course (14).
const tierOf = (h) => (h <= 7 ? 8 : h <= 11 ? 12 : 14);
const T = new Map([...F.keys()].map((k) => [k, tierOf(smooth.get(k))]));
const tOf = (x, z) => T.get(key(x, z)) ?? 0;

const shell = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));  // touches the outside of the footprint

// Entrances: shell cells on the south (+z) face with grade at or below y 1, spread along the front, on the taller tops.
const frontCells = [];
for (const c of F.values()) {
  if (!inF(c.x, c.z + 1) && c.g <= 1 && tOf(c.x, c.z) >= 8 && c.x >= 6 && c.x <= 91) frontCells.push(c);
}
frontCells.sort((a, b) => a.x - b.x);
const doors = new Map();
for (const i of [0.2, 0.5, 0.8]) {
  const c = frontCells[Math.floor(i * frontCells.length)];
  if (c) doors.set(key(c.x, c.z), c);
}

const g = new Voxels([98, 16, 29]);

for (const c of F.values()) {
  const top = tOf(c.x, c.z);
  const b = shell(c.x, c.z);
  for (let y = 0; y < top; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, FOUND); continue; }            // foundation under the cell's ground
    if (y === top - 1) { g.set(c.x, y, c.z, b ? CAP : DECK); continue; } // roof edge, or roof membrane inside
    const r = y % 4;
    if (!b) { if (r === 0) g.set(c.x, y, c.z, DECK); continue; }     // interior: a floor slab per storey, air between
    if (r === 0) { g.set(c.x, y, c.z, y === 0 ? PLINTH : STONE); continue; } // floor-line band (plinth at grade)
    if (r === 3) { g.set(c.x, y, c.z, STONE); continue; }            // lintel course
    // r = 1 or 2: the window band. Glass in bays, limestone piers every third cell.
    if (c.x % 3 === 0) g.set(c.x, y, c.z, MULLION);
    else g.set(c.x, y, c.z, GLASS);
  }
  if (b && top >= 12) g.set(c.x, top, c.z, PARAPET);                // parapet on the taller tops
  if (!b && top === 14 && c.x % 8 === 4 && c.z % 8 === 4) g.set(c.x, top, c.z, UNIT);  // roof plant on the attic tops
}

// Warm light: some shell windows lit, with a glowstone just inside the glass on the floor slab below it.
for (const c of F.values()) {
  const top = tOf(c.x, c.z);
  if (!shell(c.x, c.z) || (c.x * 7 + c.z * 5) % 11 !== 0) continue;
  for (let y = 1; y < top - 1; y++) {
    const r = y % 4;
    if (r !== 1 && r !== 2) continue;
    if (y < c.g || c.x % 3 === 0) continue;
    const inward = DIRS.find(([dx, dz]) => inF(c.x + dx, c.z + dz) && !shell(c.x + dx, c.z + dz));
    if (!inward) break;
    const [ix, iz] = [c.x + inward[0], c.z + inward[1]];
    if (tOf(ix, iz) > y + 1 && y >= F.get(key(ix, iz)).g) g.set(ix, y, iz, LAMP);
    break;
  }
}

// Entrances: a dark oak door (lower and upper halves) in the south shell, flanked by limestone piers under the lintel.
for (const c of doors.values()) {
  const on = (dx) => inF(c.x + dx, c.z) && tOf(c.x + dx, c.z) > 3;
  for (const dx of [-1, 1]) {
    if (on(dx)) for (const y of [1, 2]) g.set(c.x + dx, y, c.z, MULLION);
  }
  g.set(c.x, 1, c.z, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, 2, c.z, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let dx = -2; dx <= 2; dx++) if (on(dx) && c.g <= 3) g.set(c.x + dx, 3, c.z, STONE);  // the lintel course over the entrance
  g.set(c.x, 3, c.z, STONE);
}

// Glass panes connect to whatever is beside them in the wall plane.
for (const c of F.values()) {
  if (!shell(c.x, c.z)) continue;
  for (let y = 1; y < tOf(c.x, c.z) - 1; y++) {
    const p = g.get(c.x, y, c.z);
    if (!p || p.block !== GLASS) continue;
    const st = {};
    if (g.get(c.x, y, c.z - 1)) st.north = "true";
    if (g.get(c.x, y, c.z + 1)) st.south = "true";
    if (g.get(c.x + 1, y, c.z)) st.east = "true";
    if (g.get(c.x - 1, y, c.z)) st.west = "true";
    g.set(c.x, y, c.z, GLASS, st);
  }
}

console.log(g.save(OUT));
