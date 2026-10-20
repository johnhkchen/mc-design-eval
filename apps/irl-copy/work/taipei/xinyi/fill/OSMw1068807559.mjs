import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807559";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Ground levels, normalised so the lowest ground under the footprint is y 0.
const base = Math.min(...cells.map(c => Math.round(c[2])));
const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr) - base);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Roof: highest solid block of the building body is y 10, roof surface at y 11
// (about 11 blocks above the lowest ground). Two storeys of about 5 blocks each.
const ROOF = 10;
const CORNICE = 9;

// Materials: mid-1980s Taipei commercial block: pale smooth quartz tiled walls,
// dark polished andesite trim, tinted glazing, shopfront at street level.
const FOUND = "stone_bricks";
const WALL = "smooth_quartz";
const TRIM = "polished_andesite";
const SHOP_GLASS = "light_blue_stained_glass";
const UP_GLASS = "gray_stained_glass";
const LIGHT = "shroomlight";
const WARM = "glowstone";

// Street entrance: the exterior cell on the lowest-z (north) face nearest the middle.
const exteriorCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => exterior(x, z));
const minZ = Math.min(...exteriorCells.map(([, z]) => z));
const northRow = exteriorCells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = northRow[Math.floor(northRow.length / 2)];
const doorZ = minZ;

// Centre of the footprint for the roof mast (interior cell nearest the centroid).
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let mast = null, best = Infinity;
for (const [x, z] of cells) {
  if (exterior(x, z)) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < best) { best = d; mast = [x, z]; }
}

for (const [x, z] of cells) {
  const f = gOf(x, z);          // ground floor slab level for this cell
  const ext = exterior(x, z);
  const upper = f + 5 <= 8;     // second storey present under the parapet

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < f; y++) g.set(x, y, z, FOUND);

  // Ground-floor slab / base course.
  g.set(x, f, z, TRIM);

  if (!ext) {
    // Interior cells: solid floors and roof deck, no void under the roof.
    for (let y = f + 1; y <= ROOF; y++) g.set(x, y, z, WALL);
    continue;
  }

  // Exterior cells: the facade column.
  const piers = (x + z) % 3 === 0;
  for (let y = f + 1; y <= ROOF; y++) {
    if (y === ROOF) { g.set(x, y, z, WALL); continue; }               // parapet
    if (y === CORNICE) { g.set(x, y, z, TRIM); continue; }            // cornice
    if (y <= f + 3) {                                                 // shopfront band
      if (piers) g.set(x, y, z, WALL);
      else if (y === f + 2 && (x + 2 * z) % 5 === 1) g.set(x, y, z, WARM);
      else g.set(x, y, z, SHOP_GLASS);
      continue;
    }
    if (y === f + 4) { g.set(x, y, z, WALL); continue; }              // lintel
    if (y === f + 5) { g.set(x, y, z, TRIM); continue; }              // storey line
    if (upper && y >= f + 6 && y <= f + 8) {                          // upper windows
      if (piers) g.set(x, y, z, WALL);
      else if ((x * 7 + z * 3 + y) % 11 === 0) g.set(x, y, z, LIGHT);
      else g.set(x, y, z, UP_GLASS);
      continue;
    }
    g.set(x, y, z, WALL);
  }
}

// Entrance: double-height door, hanging lantern under the lintel.
const df = gOf(doorX, doorZ);
g.set(doorX, df + 1, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorX, df + 2, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(doorX, df + 3, doorZ, "lantern", { hanging: "true", waterlogged: "false" });

// Roof equipment: small plant boxes on the roof deck, and a lightning-rod mast.
for (const [x, z] of cells) {
  if (exterior(x, z)) continue;
  if ((x * 5 + z * 3) % 13 === 0 && x > 1 && x < W - 2 && z > 1 && z < D - 2) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}
if (mast) {
  const [mx, mz] = mast;
  for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    g.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
