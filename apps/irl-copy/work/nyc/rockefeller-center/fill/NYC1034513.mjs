// 11 West 51st Street, 1941 commercial and office building: an 11-storey Moderne block in cream limestone on a
// dark granite base, with a 9-block (three-storey) shopfront bar on the 51st Street frontage (z low = north), a
// two-storey wing and a six-storey setback pair along the north edge, and fire walls (the lidar's 37) on the east and
// west flanks. Each storey is 3 blocks: a smooth-stone band at its floor line, a window row (glass panes between
// piers, every third cell a pier), and a spandrel of limestone. The ground floor is a shopfront with a central
// entrance (dark oak door under a stone hood). The lidar roof is read as clean tiers, not followed cell by cell:
// 34 for the office block, 37 for the flanks, 9/6 for the wings, 18/34 at the north edge. A roof bulkhead stands on
// the main roof. Hollow: outer walls, a floor slab per storey, and air behind the glass. A few panes have glowstone
// just inside them, and two lanterns light the lobby. The open court at the NE corner is paved at ground level.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034513.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 14, Y = 49, Z = 27;

const lidar = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const inFoot = (x, z) => lidar.has(`${x},${z}`);

// Roof tiers (block heights above y 0), smoothed from the lidar. 0 = open court.
const topAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  const L = lidar.get(`${x},${z}`);
  if (x === 0 && z <= 21) return 37;                     // west fire wall
  if (x === 13 && z >= 6 && z <= 21) return 37;          // east fire wall
  if (z === 0) return 9;                                 // three-storey shopfront bar on 51st Street
  if (z <= 4) return L === 0 ? 0 : L >= 8 ? 9 : 6;       // two-storey wing, open court at the NE corner
  if (z === 5) return L === 0 ? 0 : L >= 18 ? 34 : 6;    // office block's north edge, wing bays between
  return 34;                                             // eleven-storey office block
};
const TOP = new Map(cells.map(([x, z]) => [`${x},${z}`, topAt(x, z)]));
const T = (x, z) => TOP.get(`${x},${z}`) ?? 0;           // outside the footprint counts as open ground

// Roof bulkhead (mechanical penthouse) on the main roof, 3 blocks above the 34 roof, stood on the roof cover.
for (let z = 12; z <= 16; z++) for (let x = 4; x <= 7; x++) if (T(x, z) === 34) TOP.set(`${x},${z}`, 37);

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const exposed = (x, y, z) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // on a face along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // on a face along z
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 9 === 0;   // sparse, deterministic warm panes

const g = new Voxels([X, Y, Z]);

for (const [key] of TOP) {
  const [x, z] = key.split(",").map(Number);
  const top = T(x, z);
  if (!top) { g.set(x, 0, z, "smooth_stone"); continue; }     // open court paving

  for (let y = 0; y < top; y++) {
    const faces = exposed(x, y, z);
    const ring = faces.length > 0;

    if (y === top - 1) {                                       // roof cover, cornice and parapet on the outer edge
      if (ring) {
        g.set(x, y, z, "smooth_quartz");
        g.set(x, y + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      } else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!ring) { if (y % 3 === 0) g.set(x, y, z, "smooth_stone"); continue; }   // hollow: a floor slab per storey

    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                 // base course
    if (y % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }                // storey line
    const windowRow = y % 3 === 1 || y === 2;
    if (!windowRow) { g.set(x, y, z, "calcite"); continue; }                       // spandrel

    // Entrance on 51st Street: dark oak door on the central pier, glass beside it on a limestone lintel.
    if (z === 0 && x === 6 && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
      continue;
    }
    if (z === 0 && (x === 5 || x === 7) && y === 2) { g.set(x, y, z, "calcite"); continue; }

    const ns = faces.includes("N") || faces.includes("S");
    if (ns ? x % 3 === 0 : z % 3 === 0) { g.set(x, y, z, "calcite"); continue; }   // pier between bays

    g.set(x, y, z, "glass_pane", ns ? PANE_NS : PANE_EW);
    if (lit(x, y, z)) {                                                             // glowstone just behind the pane
      const [, dx, dz] = DIRS.find(([d]) => faces.includes(d));
      const xi = x - dx, zi = z - dz;
      if (T(xi, zi) > y && exposed(xi, y, zi).length === 0) g.set(xi, y, zi, "glowstone");
    }
  }
}

// Entrance hood over the door, and the lobby lanterns seen through the shopfront.
for (let x = 5; x <= 7; x++) g.set(x, 3, 0, "dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
for (const x of [5, 7]) g.set(x, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

const stats = g.save(`${DIR}/NYC1034513.nbt`);
console.log(JSON.stringify(stats));
