// Way 332241962, Mt Eden / Eden Terrace: a c.1930s plastered-concrete commercial block in the stripped Deco manner. A
// polished-andesite plinth, a granite-faced shopfront at ground, two storeys of cream plaster with quartz piers and
// steel-framed glass bays above, and a three-storey core on a two-storey ring (the lidar's 10 to 12 roofs), with a
// coping at each roof edge and HVAC plant on the core roof. Some bays glow warm at dusk. Shell only: floor slabs at
// y 4, 8 and 12, no interiors (air behind the glass).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241962.cells.json", "utf8"));
const g = new Voxels([35, 16, 39]);

const byXZ = new Map(cells.map(([x, z, gr, ro]) => [`${x},${z}`, { gr, ro }]));
const inFoot = (x, z) => byXZ.has(`${x},${z}`);
// Lidar roofs smoothed into two tiers: 12 (three storeys, the core) where the roof reads 11 or more, else 8 (two storeys,
// the ring). The value is the last solid row: the core's roof deck is row 12 (top at 13 blocks), the ring's is row 8.
const top = (x, z) => (byXZ.get(`${x},${z}`).ro >= 11 ? 12 : 8);
const core = (x, z) => top(x, z) === 12;

// A cell's face is skin where a neighbour is outside the footprint or stands lower than this row.
const DIRS = [[-1, 0, "ew"], [1, 0, "ew"], [0, -1, "ns"], [0, 1, "ns"]];
function exposed(x, z, y) {
  for (const [dx, dz, axis] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inFoot(nx, nz) || top(nx, nz) < y) return { axis, dx, dz };
  }
  return null;
}

// Facade by row: plinth; shopfront (granite piers, dark oak mullions, glass bays, a granite fascia); upper storeys with
// quartz sills and lintels round a window row of glass, quartz piers and grey-concrete frames. k runs along the face.
const litWindow = (x, y, z) => ((x * 31 + y * 17 + z * 13) % 14) === 0;
function facade(x, y, z, axis) {
  const k = axis === "ew" ? z : x;
  if (y <= 2) {
    if (k % 4 === 0) return "polished_granite";
    if (k % 4 === 2) return "dark_oak_planks";
    if (y === 2 && k % 8 === 5) return "glowstone";
    return "glass";
  }
  if (y === 3) return "polished_granite";
  if (y % 4 !== 2) return "smooth_quartz";                       // sill and lintel courses
  if (k % 4 === 0) return "quartz_pillar";
  if (k % 4 === 2) return "gray_concrete";
  return litWindow(x, y, z) ? "glowstone" : "light_blue_stained_glass";
}

// The front: a ground-floor door on the south-most street face near the middle of the footprint.
let door = null;
for (const [key] of byXZ) {
  const [x, z] = key.split(",").map(Number);
  const f = exposed(x, z, 1);
  if (!f || f.axis !== "ns" || f.dz !== 1) continue;
  if (!door || z > door.z || (z === door.z && Math.abs(x - 17) < Math.abs(door.x - 17))) door = { x, z };
}

for (const key of byXZ.keys()) {
  const [x, z] = key.split(",").map(Number);
  const isCore = core(x, z);

  // plinth and floors: solid under every footprint cell, so no slab hangs over air at its edge
  g.set(x, 0, z, "polished_andesite");
  g.set(x, 4, z, "smooth_stone");
  g.set(x, 8, z, isCore ? "smooth_stone" : "light_gray_concrete");   // core floor; ring roof terrace

  // walls on the exposed faces of each storey
  const rows = isCore ? [1, 2, 3, 5, 6, 7, 9, 10, 11] : [1, 2, 3, 5, 6, 7];
  for (const y of rows) {
    const f = exposed(x, z, y);
    if (f) g.set(x, y, z, facade(x, y, z, f.axis));
  }

  if (isCore) {
    g.set(x, 12, z, "light_gray_concrete");                        // roof membrane
    if (exposed(x, z, 12)) g.set(x, 12, z, "smooth_stone");        // coping where the roof meets air
  } else {
    // parapet on the ring's outer edge
    if (DIRS.some(([dx, dz]) => !inFoot(x + dx, z + dz))) g.set(x, 9, z, "smooth_stone");
  }
}

// The entrance: dark oak door under the granite fascia.
if (door) {
  const { x, z } = door;
  g.set(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof plant: an HVAC pair (iron blocks) and a stair housing, on core roof cells whose four neighbours are core too.
const coreInner = (x, z) => inFoot(x, z) && core(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inFoot(x + dx, z + dz) && core(x + dx, z + dz));
const square = (x, z, n) => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!coreInner(x + i, z + j)) return false; return true; };
const cx = 17, cz = 19;
let hvac = null, stair = null;
for (let d = 0; d < 20 && (!hvac || !stair); d++) {
  for (let x = cx - d; x <= cx + d && (!hvac || !stair); x++) for (let z = cz - d; z <= cz + d; z++) {
    if (!hvac && square(x, z, 2)) { hvac = { x, z }; }
    else if (!stair && hvac && square(x, z, 2) && (Math.abs(x - hvac.x) > 2 || Math.abs(z - hvac.z) > 2)) { stair = { x, z }; }
  }
}
if (hvac) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.set(hvac.x + i, 13, hvac.z + j, "iron_block");
if (stair) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
  g.set(stair.x + i, 13, stair.z + j, "stone_bricks");
  g.set(stair.x + i, 14, stair.z + j, "stone_bricks");
}
if (stair) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.set(stair.x + i, 15, stair.z + j, "smooth_stone_slab", { type: "bottom" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241962.nbt");
console.log(`way_332241962: ${g.count()} blocks, door ${door ? `${door.x},${door.z}` : "none"}, hvac ${hvac ? `${hvac.x},${hvac.z}` : "none"}, stair ${stair ? `${stair.x},${stair.z}` : "none"}`);
