// DC87007: Commercial-Office-Large, 101 Constitution Ave NW, DC 20001, as a 1.21.1 module.
// Reading of the record: a stripped-classical limestone office block of the 1930s-50s (calcite-faced piers, glazed
// bays, stone string and head courses, a granite plinth, a parapet), the Federal-era commercial stock of the Triangle.
// The lidar roof (median-smoothed over the footprint) snaps to four storey tiers of 4 blocks (3 of room + 1 course):
// 1, 2, 3 and 4 storeys, so the taller core rises above the stepped wings and the roof plant stands on the top tier.
// Every shell column is solid from y 0 to its tier; the interior is air behind the glass with one floor slab per storey,
// each slab resting on the shell all round, so nothing floats. The street front is the north face (z 0), the long run.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87007.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87007.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const shell = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 0-roof gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Storey tiers: 4, 8, 12 or 16 blocks above y 0 (4-block storeys, the same module as the district's other offices).
const tier = (h) => (h <= 5 ? 4 : h <= 9 ? 8 : h <= 13 ? 12 : 16);

// Palette: calcite piers and body, stone brick courses, granite plinth, glass panes, smooth stone slabs inside.
const PIER = "calcite";
const COURSE = "stone_bricks";
const PLINTH = "polished_granite";
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";
const PARAPET = "stone_brick_wall";
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const UNIT = "light_gray_concrete";

const g = new Voxels([42, 17, 35]);

// Facade rhythm: a pier every 3 cells along each face (corners always piers), the other two carry a pane.
const faceOf = (x, z) => ({
  xFace: !inF(x, z - 1) || !inF(x, z + 1),   // north or south face: runs along x
  zFace: !inF(x - 1, z) || !inF(x + 1, z),   // west or east face: runs along z
});
const pierAt = (x, z) => {
  const { xFace, zFace } = faceOf(x, z);
  return (xFace && zFace) || (xFace ? x % 3 === 0 : z % 3 === 0);
};

// Street entrance: a double door in the north face, flanked by the piers at x 30 and 33.
const DOORS = new Map([[key(31, 0), { x: 31, hinge: "left" }], [key(32, 0), { x: 32, hinge: "right" }]]);

for (const c of F.values()) {
  const { x, z } = c;
  const T = tier(smooth.get(key(x, z)));
  const b = shell(x, z);
  const { xFace, zFace } = faceOf(x, z);
  for (let y = 0; y < T; y++) {
    const k = Math.floor(y / 4), r = y % 4;
    if (!b) {                                         // interior: air behind the glass, a floor slab per storey, the roof membrane
      if (r === 0 || y === T - 1) g.set(x, y, z, FLOOR);
      continue;
    }
    if (y === 0) { g.set(x, y, z, PLINTH); continue; }  // plinth course on the ground
    if (r === 0 || r === 3) { g.set(x, y, z, COURSE); continue; }  // string course over each floor line, head course under each roof line
    // r = 1, 2: the window band. Piers in calcite; panes between them, connected along the face they stand on.
    if (pierAt(x, z)) { g.set(x, y, z, PIER); continue; }
    const d = DOORS.get(key(x, z));
    if (d && y <= 2) {
      g.set(x, y, z, DOOR, { facing: "north", half: y === 1 ? "lower" : "upper", hinge: d.hinge, open: "false", powered: "false" });
      continue;
    }
    if (d) { g.set(x, y, z, COURSE); continue; }
    const lit = k >= 1 && (x * 7 + z * 5 + k) % 11 === 0;   // a few warm offices after hours
    if (lit) { g.set(x, y, z, LAMP); continue; }
    g.set(x, y, z, GLASS, xFace && !zFace
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
  }
  // Parapet on the roof edge of the taller tiers; a single-storey wing keeps its cornice course only.
  if (b && T >= 8) g.set(x, T, z, PARAPET);
  // Roof plant on the top tier, set back from the edge: small units standing on the roof membrane.
  if (!b && T === 16 && x % 5 === 2 && z % 4 === 1) g.set(x, T, z, UNIT);
}

const stats = g.save(OUT);
console.log(`DC87007: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
