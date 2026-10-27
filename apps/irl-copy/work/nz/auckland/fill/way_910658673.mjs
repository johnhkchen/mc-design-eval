// way 910658673: a three-storey brick commercial block (c.1925-35, Eden Terrace / Mt Eden main-road type).
// Red brick walls on a polished-andesite plinth, cream plaster bands at the floor lines, a dark-timber shopfront
// fascia with the entrance on the north (street) face, window bays between brick piers, a brick parapet
// (a stepped course at the back corner), and a roof plant box. Lidar roof 11 (12 on the back corner) is smoothed to one deck at 10.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658673.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..5, z 0..7

const W = 6, D = 8, H = 25;
const at = new Map(); for (const [x, z, gr, roof] of cells) at.set(`${x},${z}`, { gr, roof });
const inside = (x, z) => at.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((k) => !inside(x + DIRS[k][0], z + DIRS[k][1]));   // faces on the outside
const PLANT = new Set(["2,3", "3,3", "2,4", "3,4"]);   // interior cells under the roof plant box
const DOOR = [3, 0];                                  // north (street) face, lower-left storey

const g = new Voxels([W, H, D]);

// what a footprint cell holds at height y (null = air): storey bands at the floor lines 4 and 7, the deck at 10
function column(x, z, y, gr, roof, ex) {
  if (y < gr) return ["stone_bricks"];                                  // foundation under the lower ground
  if (ex.length === 0) {                                                // interior: floor slabs and the deck, air between
    if (y === gr || y === 4 || y === 7 || y === 10) return ["smooth_stone"];
    if ((y === 11 || y === 12) && PLANT.has(`${x},${z}`)) return ["light_gray_concrete"];
    return null;
  }
  if (y === gr) return ["polished_andesite"];                           // base course
  const front = ex.includes("N");
  if (y === 3) return [front ? "dark_oak_planks" : "smooth_quartz"];    // shopfront fascia / ground-floor head band
  if (y === 4 || y === 7 || y === 10) return ["smooth_quartz"];          // storey lines, cornice
  if (y === 11) return roof === 12 ? ["bricks"] : ["brick_slab", { type: "bottom" }];   // brick parapet, the back corner's full course
  if (y === 12) return roof === 12 ? ["brick_slab", { type: "bottom" }] : null;   // the back corner's extra course
  const gfRow = y > gr && y < 3, upRow = y === 5 || y === 6 || y === 8 || y === 9;
  if (!gfRow && !upRow) return null;
  const face = ex.includes("N") || ex.includes("S") ? (ex.includes("N") ? "N" : "S") : ex[0];
  const u = face === "N" || face === "S" ? x : z;                       // position along the face
  if (u % 3 === 0) return [front && gfRow ? "dark_oak_planks" : "bricks"];   // piers between the bays
  const lit = (x * 7 + z * 3 + y * 5) % 4 === 0;                        // about a quarter of the bays glow
  if (lit) {                                                            // glowstone just behind the glass, if the room is there
    const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && exposed(ix, iz).length === 0) g.set(ix, y, iz, "glowstone");
    return ["yellow_stained_glass"];
  }
  return ["glass"];
}

for (const [x, z, gr, roof] of cells) {
  const ex = exposed(x, z);
  for (let y = 0; y <= 12; y++) {
    const b = column(x, z, y, gr, roof, ex);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// the entrance: a lower and upper door, on the north face under the fascia
const [dx0, dz0] = DOOR;
g.set(dx0, 1, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx0, 2, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658673.nbt");
console.log(JSON.stringify(stats));
