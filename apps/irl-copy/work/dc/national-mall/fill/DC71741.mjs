// DC71741: Railroad Retirement Board (Mary Switzer Building), 350 C St SW, Washington DC 20201, as a 1.21.1 module.
// Commercial-office, a 1930s federal block: a limestone-clad (calcite) envelope with stone string courses on every
// storey, a window grid of glass panes between calcite piers, a recessed entrance portico on the south and north
// faces, and a central penthouse on the tower. The lidar roof (3x3 median) is snapped to 3-block storeys, so the massing is
// one storey on the low rear wings and up to five on the tower. Each cell is solid from y 0 up to its ground, then
// its storeys; the shell is a one-cell wall ring, interior floor plates per storey and a roof deck close the rooms,
// and glowstone behind some panes lights the windows. Every tier sits on the one below it, nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71741.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71741.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));

// Outward faces in priority order: a corner cell takes its south, then north, then east, then west face.
const FACES = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] };
const faceOf = (x, z) => Object.keys(FACES).find((f) => !inF(x + FACES[f][0], z + FACES[f][1])) ?? null;
const inward = (x, z, f) => [x - FACES[f][0], z - FACES[f][1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell, snapped to 3-block storeys (min one).
const snap = (h) => Math.max(3, 3 * Math.round(h / 3));
const H = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  H.set(key(c.x, c.z), snap(vals[vals.length >> 1]));
}

// Palette: calcite is the limestone skin, stone bricks the string courses and foundation, glass panes the windows.
const SKIN = "calcite";
const BAND = "stone_bricks";
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";
const ROOF = "stone";
const LAMP = "glowstone";
const DOOR = "iron_door";

const g = new Voxels([70, 20, 24]);

// Entrances: a centred portico on the south face and one on the north face. The door sits in the ring, the cell
// inside it is the vestibule's air, and the storey-1 band is the lintel above.
const DOORS = [
  { x: 35, z: 23, f: "south" },
  { x: 12, z: 0, f: "north" },
];
const doorAt = (x, z) => DOORS.find((d) => d.x === x && d.z === z);

// Panes connect along the facade: a south/north facade pane joins east and west, an east/west facade pane joins north and south.
const paneState = (f) => (f === "south" || f === "north"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Pass 1: envelope, floors and roof, column by column.
for (const c of F.values()) {
  const h = H.get(key(c.x, c.z)), top = h - 1, f = faceOf(c.x, c.z);
  for (let y = 0; y < h; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, BAND); continue; }                // foundation under the cell's ground
    if (f) {                                                           // the shell: skin, bands, glazing
      if (y === top) { g.set(c.x, y, c.z, BAND); continue; }           // cornice course
      if (y % 3 === 0) { g.set(c.x, y, c.z, BAND); continue; }         // storey string course
      const idx = f === "south" || f === "north" ? c.x : c.z;
      if (idx % 3 === 0) { g.set(c.x, y, c.z, SKIN); continue; }       // pier between bays
      if (doorAt(c.x, c.z) && y <= 2) { g.set(c.x, y, c.z, GLASS, paneState(f)); continue; } // filled below
      g.set(c.x, y, c.z, GLASS, paneState(f));
      continue;
    }
    if (y === top) { g.set(c.x, y, c.z, ROOF); continue; }             // roof deck over the rooms
    if (y % 3 === 0) { g.set(c.x, y, c.z, FLOOR); continue; }          // a floor plate per storey
  }
}

// Pass 2: the doors, the lit rooms behind some panes, and the roof plant.
for (const d of DOORS) {
  g.set(d.x, 1, d.z, DOOR, { facing: d.f, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(d.x, 2, d.z, DOOR, { facing: d.f, half: "upper", hinge: "left", open: "false", powered: "false" });
  const [ix, iz] = inward(d.x, d.z, d.f);                              // vestibule air, kept clear of the floor plate
  for (const y of [1, 2]) g.set(ix, y, iz, "air");
}
for (const c of F.values()) {
  const h = H.get(key(c.x, c.z)), f = faceOf(c.x, c.z);
  if (!f || c.g > 1) continue;
  const idx = f === "south" || f === "north" ? c.x : c.z;
  if (idx % 3 === 0 || doorAt(c.x, c.z)) continue;                    // piers and doors stay as they are
  if ((idx + 2 * (c.x + c.z)) % 7 !== 0) continue;                    // about one bay in seven is lit
  const [ix, iz] = inward(c.x, c.z, f);
  if (!inF(ix, iz) || faceOf(ix, iz)) continue;                        // the room behind must be interior
  for (const y of [1, 2]) if (y < h - 1) g.set(ix, y, iz, LAMP);
}

// Roof plant: a penthouse on the tower's roof, on the roof deck.
const PENT = { x0: 42, x1: 47, z0: 3, z1: 7 };
let pent = true;
for (let x = PENT.x0; x <= PENT.x1; x++) for (let z = PENT.z0; z <= PENT.z1; z++) if (!inF(x, z) || H.get(key(x, z)) !== 15) pent = false;
if (pent) {
  for (let x = PENT.x0; x <= PENT.x1; x++) for (let z = PENT.z0; z <= PENT.z1; z++) {
    const edge = x === PENT.x0 || x === PENT.x1 || z === PENT.z0 || z === PENT.z1;
    for (let y = 15; y <= 16; y++) {
      if (edge) g.set(x, y, z, (x + z + y) % 2 ? SKIN : GLASS, { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      else if (y === 15) g.set(x, y, z, "air");
    }
    g.set(x, 17, z, BAND);                                             // penthouse cap
  }
}

const stats = g.save(OUT);
console.log(`DC71741: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
