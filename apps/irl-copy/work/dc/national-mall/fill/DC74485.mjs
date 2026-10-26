// DC74485: a 1930s Federal-style office block of pale limestone on a granite base (the Federal Triangle idiom), set on the
// Mall's north side. Massing from the lidar roof (cells file): a 2-block plinth at the sliver on the west, a 2-storey
// north wing (roof 8-9), the 3-storey main block (roof 12-14) and a 4-storey tower core in the south-middle (roof 15-17).
// Each column is solid from y 0 up to its tier top, so nothing floats and every setback stands on the tier below.
// Storeys run on a 4-row cycle: a base/sill row, two sash rows (glass in calcite piers, air behind), a floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74485.cells.json`, "utf8"));

// lidar roof -> one flat tier top per band (noise smoothed into 4 tiers: 2 plinth, 9 wing, 13 main, 17 tower)
const tierTop = (r) => (r <= 3 ? 2 : r <= 10 ? 9 : r <= 14 ? 13 : 17);
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, T: tierTop(r) });
const at = (x, z) => foot.get(`${x},${z}`);
const built = (x, z, y) => { const c = at(x, z); return !!c && y < c.T; };
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
// the faces at height y with no building behind them (outside the footprint, or the neighbour is lower)
const exteriorDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !built(x + dx, z + dz, y));

const WALL = "calcite", TRIM = "smooth_quartz", BASE = "polished_granite", FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
// entrances: the main door on the north wing, a second on the east face of the east wing
const DOORS = [{ x: 3, z: 0, facing: "north" }, { x: 19, z: 16, facing: "east" }];
const doorAt = (x, z) => DOORS.find((d) => d.x === x && d.z === z);
// a pane runs along its face: connected east-west on north/south faces, north-south on east/west faces
const pane = (dx) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const g = new Voxels([20, 29, 22]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (const [key, { g: ground, T }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const door = doorAt(x, z);
  for (let y = 0; y < T; y++) {
    if (y === 0 || y < ground) { put(x, y, z, FOUND); continue; }                    // foundation up to the lidar ground
    if (door && (y === 1 || y === 2)) {                                              // door, lower and upper halves
      put(x, y, z, "iron_door", { facing: door.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (door && y === 3) { put(x, y, z, TRIM); continue; }                           // lintel over the door (the canopy)
    if (y === T - 1) { put(x, y, z, T === 2 ? BASE : TRIM); continue; }              // roof edge / cornice
    const r = (y - 1) % 4;                                                           // 0 base or sill, 1-2 sash, 3 floor slab
    if (r === 3) { put(x, y, z, TRIM); continue; }                                    // floor slab / string course, every cell
    if (r === 0) {
      if (y === 1) { put(x, y, z, BASE); continue; }                                  // granite base course
      if (exteriorDirs(x, z, y).length) put(x, y, z, TRIM);                           // sill band on the face; air inside
      continue;
    }
    const ext = exteriorDirs(x, z, y);                                               // sash rows
    if (!ext.length) continue;                                                       // interior: air behind the glass
    if (ext.length > 1) { put(x, y, z, WALL); continue; }                            // corner pier
    const [dx, dz] = ext[0];
    const t = dx !== 0 ? z : x;                                                      // position along the face
    if (t % 3 === 0) put(x, y, z, WALL);                                             // piers between the bays
    else put(x, y, z, GLASS, pane(dx));
  }
}

// warm light: a lantern on the floor of a room, just inside a lit window (some bays only)
for (const [key, { T }] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 5; y < T; y += 4) {                                                   // the sill row of storeys 2+
    if (exteriorDirs(x, z, y).length) continue;                                       // interior cells only
    const behindGlass = DIRS.some(([dx, dz]) => built(x + dx, z + dz, y + 1) && exteriorDirs(x + dx, z + dz, y + 1).length);
    if (behindGlass && (x * 7 + z * 3 + y) % 5 === 0) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// roof equipment: a 2 x 2 penthouse on the main block's roof, and a plant box on the north wing
for (const [x, z] of [[11, 15], [12, 15], [11, 16], [12, 16]]) { put(x, 13, z, WALL); put(x, 14, z, TRIM); }
for (const [x, z] of [[3, 1], [4, 1], [3, 2], [4, 2]]) { put(x, 9, z, FOUND); put(x, 10, z, TRIM); }

const report = g.save(`${DIR}/DC74485.nbt`);
console.log(`DC74485.nbt: ${report.blocks} blocks, ${report.palette} palette entries`);
