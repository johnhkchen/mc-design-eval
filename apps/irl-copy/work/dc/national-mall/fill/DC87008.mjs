// DC87008: Pan American Union (Organization of American States), 201 17th St NW, DC 20003, as a 1.21.1 module.
// Reading of the record: a civic Beaux-Arts block of 1910-11 in white marble (calcite here), a granite base course and
// smooth-stone string and cornice courses, with glazed bays between piers. The lidar roof (median-smoothed over the
// footprint) snaps to three massing tiers: a one-storey hall with a cornice (top at y 6), a two-storey wing (top at y 8),
// and the taller western pavilion (top at y 11) that the lidar shows on the street-facing side. Storeys are 4 blocks
// (3 of room + 1 course), so the two-storey wings and the pavilion read as storeys at 0.42 blocks per metre.
// Every column is solid from y 0 to its tier (foundation below the cell's ground), the interior is air behind the glass
// with a floor slab per storey and a roof membrane under each cap, so nothing floats. The double entrance is on the west
// face of the pavilion (z 11-12), with a stone step at the threshold.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87008.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87008.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const shell = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Massing tiers: the absolute y of each cell's top (its parapet or roof cap).
const tier = (h) => (h <= 7 ? 6 : h <= 9 ? 8 : 11);

// Palette: calcite body and piers, smooth-quartz string and cornice courses, granite base, stone-brick foundation.
const BODY = "calcite";
const STRING = "smooth_quartz";
const BASE = "polished_granite";
const FOUNDATION = "stone_bricks";
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";
const CAP = "stone_bricks";
const PARAPET = "stone_brick_wall";
const DOOR = "dark_oak_door";
const STEP = "stone_brick_stairs";
const LAMP = "glowstone";
const UNIT = "light_gray_concrete";

const g = new Voxels([24, 23, 22]);

// Facade rhythm: a pier every 3 cells along each face (corners always piers); the others carry a pane.
const faceOf = (x, z) => ({
  xFace: !inF(x, z - 1) || !inF(x, z + 1),   // north or south face: runs along x
  zFace: !inF(x - 1, z) || !inF(x + 1, z),   // west or east face: runs along z
});
const pierAt = (x, z) => {
  const { xFace, zFace } = faceOf(x, z);
  return (xFace && zFace) || (xFace ? x % 3 === 0 : z % 3 === 0);
};

// West entrance: a double door in the pavilion's west face, a stone step at the threshold (facing west: low side outside).
const DOORS = new Map([[key(0, 11), { z: 11, hinge: "left" }], [key(0, 12), { z: 12, hinge: "right" }]]);

for (const c of F.values()) {
  const { x, z } = c;
  const { g: ground } = c;
  const T = tier(smooth.get(key(x, z)));
  const b = shell(x, z);
  const { xFace, zFace } = faceOf(x, z);
  const door = DOORS.get(key(x, z));

  for (let y = 0; y < T; y++) {
    if (y < ground) { g.set(x, y, z, FOUNDATION); continue; }   // solid below the cell's ground
    if (!b) {                                                    // interior: air behind the glass, a slab per storey
      if (y === ground || y === 4 || y === 8 || y === T - 1) g.set(x, y, z, FLOOR);
      continue;
    }
    if (y === ground) { g.set(x, y, z, BASE); continue; }        // granite base course on the ground
    if (door && y === ground + 0) { g.set(x, y, z, STEP, { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" }); continue; }
    if (door && (y === ground + 1 || y === ground + 2)) {
      g.set(x, y, z, DOOR, { facing: "west", half: y === ground + 1 ? "lower" : "upper", hinge: door.hinge, open: "false", powered: "false" });
      continue;
    }
    if (y === T - 1) { g.set(x, y, z, STRING); continue; }        // cornice course under the parapet
    if (y % 4 === 0) { g.set(x, y, z, STRING); continue; }        // storey string course at y 4 and 8
    // window rows (y % 4 = 1, 2, 3): piers in calcite, panes between them, a few warm windows after hours
    if (pierAt(x, z)) { g.set(x, y, z, BODY); continue; }
    if (y < 8 && (x * 7 + z * 5 + y) % 19 === 0) { g.set(x, y, z, LAMP); continue; }   // a few warm windows, not a rash
    g.set(x, y, z, GLASS, xFace && !zFace
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
  }

  // Top of each cell: a parapet on the outer ring, a flat cap inside. The pavilion's cap carries roof units.
  if (T > ground) {
    g.set(x, T, z, b ? PARAPET : CAP);
    if (!b && T === 11 && x % 5 === 2 && z % 4 === 1) g.set(x, T + 1, z, UNIT);
  }
}

const stats = g.save(OUT);
console.log(`DC87008: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
