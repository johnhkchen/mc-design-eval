// Bridgeside: a six-storey 1960s-70s concrete office block with a glazed crown and a lower wing, on a Mt Eden-side
// slope. Massing from the lidar roof, snapped to storey lines (datum y 3, storeys 4 blocks, so tops sit at 7, 11, 15,
// 20, 24, 28; the core's 30 keeps its two blocks as a glazed crown). Columns are solid from the foundation up, so nothing
// floats; the downhill cells carry a 3-block plinth. Facades: piers and floor bands in white concrete, glass in between,
// and every glass pane has a one-block air gap behind it (sealed, floored by the next band) with a warm light in some.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170798658.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..43, z 0..35

const TIERS = [7, 11, 15, 20, 24, 28, 30];                                    // storey-line tops; 30 is the tower core
const snap = (r) => TIERS.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));
const DATUM = 3, STOREY = 4;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                             // east, west, south, north (+z is south)
const key = (x, z) => `${x},${z}`, key3 = (x, y, z) => `${x},${y},${z}`;

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { g, fTop: Math.max(g, DATUM), top: snap(r) });
const topOf = (x, z) => cell.get(key(x, z))?.top ?? 0;                       // 0 outside the footprint: open to the air
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) <= y);
const windowRow = (y) => y >= DATUM && [1, 2].includes((y - DATUM) % STOREY);
const bandRow = (y) => y >= DATUM && (y - DATUM) % STOREY === 0;
// piers on a 3-block module (global coordinates keep the bays lined up); corners are always piers
const isPier = (x, z, ex) => ex.length !== 1 || (ex[0][0] !== 0 ? z % 3 === 0 : x % 3 === 0);

// 1. glazing: one pane per window-row voxel on a single exposed face, with its inward neighbour a sealed air pocket
const glass = new Set(), air = new Map();
for (const [kk, c] of cell) {
  const [x, z] = kk.split(",").map(Number);
  for (let y = DATUM; y < c.top - 1; y++) {                                  // the top layer is parapet, never glass
    if (!windowRow(y)) continue;
    const ex = exposed(x, y, z);
    if (isPier(x, z, ex)) continue;
    const [dx, dz] = ex[0], ax = x - dx, az = z - dz;
    const inner = cell.get(key(ax, az));
    if (!inner || inner.top <= y || exposed(ax, y, az).length) continue;    // a hole would open to the air: keep it solid
    glass.add(key3(x, y, z)); air.set(key3(ax, y, az), { x: ax, y, z: az });
  }
}

// 2. one entrance on the north face: a pair of iron doors in the window row of the ground storey, the pocket behind them open
const north = [...cell].map(([kk, c]) => [...kk.split(",").map(Number), c]).filter(([x, z]) => {
  const ex = exposed(x, 4, z);
  return ex.length === 1 && ex[0][1] === -1 && glass.has(key3(x, 4, z)) && glass.has(key3(x, 5, z));
});
north.sort((a, b) => a[0] - b[0]);
const door = north[Math.floor(north.length / 2)];
const doorSet = new Set();
if (door) {
  const [dx0, dz0] = [door[0], door[1]];
  for (const y of [4, 5]) { glass.delete(key3(dx0, y, dz0)); doorSet.add(key3(dx0, y, dz0)); air.set(key3(dx0, y, dz0 + 1), { x: dx0, y, z: dz0 + 1, plain: true }); }
}

// 3. the roof: a 3x3 plant room (2 high) on the widest flat part of the main roof, two of them
const plant = new Set(), plantAt = [];
const flatAt = (x, z) => [-3, -2, -1, 0, 1, 2, 3].every((i) => [-3, -2, -1, 0, 1, 2, 3].every((j) => topOf(x + i, z + j) === 28));
for (const kk of [...cell.keys()]) {
  const [x, z] = kk.split(",").map(Number);
  if (!flatAt(x, z) || plantAt.some(([px, pz]) => Math.abs(px - x) < 9 || Math.abs(pz - z) < 9)) continue;
  plantAt.push([x, z]);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const y of [28, 29]) plant.add(key3(x + i, y, z + j));
  if (plantAt.length === 2) break;
}

// 4. what each voxel is
const WARM = (x, y, z) => (bandRow(y) ? null : (x + z) % 4 === 0 && (y - DATUM) % STOREY === 1 ? "lantern"
  : (x * 2 + z) % 5 === 0 && (y - DATUM) % STOREY === 2 ? "glowstone" : null);
function spec(x, y, z) {
  const c = cell.get(key(x, z)), k = key3(x, y, z);
  if (plant.has(k)) return [y === 29 ? "smooth_stone" : "light_gray_concrete"];
  if (!c || y >= c.top) return null;
  if (y < c.fTop) return ["stone_bricks"];
  if (air.has(k)) {
    const a = air.get(k);
    const w = a.plain ? null : WARM(x, y, z);
    if (w === "lantern") return ["lantern", { hanging: "false" }];
    if (w) return [w];
    return null;                                                             // air behind glass
  }
  if (doorSet.has(k)) return ["iron_door", { facing: "north", half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  const ex = exposed(x, y, z);
  if (y === c.top - 1) return ex.length ? ["white_concrete"] : ["smooth_stone"];   // parapet, or the roof membrane
  if (ex.length === 0) return ["light_gray_concrete"];                       // interior: solid, the floors are its bands
  if (y === DATUM) return ["polished_andesite"];                             // the base course
  if (bandRow(y)) return ["white_concrete"];                                 // floor line
  if (windowRow(y)) return glass.has(k) ? ["light_blue_stained_glass"] : ["white_concrete"];   // glass or pier
  return ["light_gray_concrete"];                                            // spandrel
}

// 5. place it
const g = new Voxels([44, 43, 36]);
let placed = 0;
for (const [kk, c] of cell) {
  const [x, z] = kk.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    const s = spec(x, y, z); if (!s) continue;
    g.set(x, y, z, s[0], s[1]); placed++;
  }
}
for (const k of plant) { const [x, y, z] = k.split(",").map(Number); const s = spec(x, y, z); if (s) g.set(x, y, z, s[0], s[1]); }
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170798658.nbt");
console.log(`Bridgeside: ${cells.length} cells, ${placed} voxels, ${out.blocks} blocks, ${out.palette} palette; door ${door ? door.slice(0, 2) : "none"}; plant rooms ${plantAt.length}`);
