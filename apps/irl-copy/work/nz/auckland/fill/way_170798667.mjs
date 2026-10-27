// Mt Eden / Eden Terrace: a 1970s four-storey concrete office block with an attic parapet, on a sloping site. The lidar
// roof is 18-19 blocks absolute across the footprint (one 15 cell is noise), so the massing is one flat tier at 19:
// every cell is solid from y 0 (foundation stone up to its ground, then the frame), so nothing floats. Storey lines sit
// on a global datum of 4 (bands at y = 0, 4, 8, 12, 16), so the uphill cells (ground 8) and the downhill ones (ground 0)
// share one set of floor lines. Facades: a white-concrete frame (piers every 3 blocks, floor slabs) with tinted glass
// between, a polished-andesite plinth at each cell's own grade, and every pane has a sealed one-block air pocket behind
// it, with a warm lantern or glowstone in some. Entrance: a recessed iron door on the lowest north face, with a stone
// surround and a flush lintel. Roof: a parapet on the perimeter, a central plant room on a 19 roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170798667.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..44, z 0..40

const TOP = 19;                                                                // the flat lidar tier (roof 18-19 absolute)
const STOREY = 4;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                             // east, west, south, north (+z is south)
const key = (x, z) => `${x},${z}`, key3 = (x, y, z) => `${x},${y},${z}`;

const cell = new Map();
for (const [x, z, g] of cells) cell.set(key(x, z), { g: Math.min(g, TOP - 2) });
const inside = (x, z) => cell.has(key(x, z));
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const isWindowRow = (y) => y >= 1 && [1, 2].includes(y % STOREY);
const isBandRow = (y) => y >= STOREY && y % STOREY === 0;
const isSpandrelRow = (y) => y % STOREY === 3;
// the facade of a boundary cell is its first exposed face (the footprint is a stair of one-cell steps, so most edge
// cells touch two outside cells; taking the corner for them would leave the walls as bare pier stacks). Piers sit on a
// 3-block module (global coordinates keep the bays lined up), so a pier is a column on that module.
const faceOf = (x, z) => exposed(x, z)[0];
const isPier = (x, z, f) => (f[0] !== 0 ? z % 3 === 0 : x % 3 === 0);

// 1. glazing: one pane per window-row voxel on the facade, with a sealed one-block air pocket behind it where the
// footprint allows one (on a one-cell step the cell behind is open to the air, so that pane sits on solid instead)
const glass = new Set(), air = new Map();
for (const [kk, c] of cell) {
  const [x, z] = kk.split(",").map(Number);
  const f = faceOf(x, z); if (!f) continue;
  const [dx, dz] = f, ax = x - dx, az = z - dz;
  const sealed = inside(ax, az) && !exposed(ax, az).length;
  for (let y = c.g; y < TOP - 1; y++) {
    if (!isWindowRow(y) || isPier(x, z, f)) continue;
    glass.add(key3(x, y, z));
    if (sealed) air.set(key3(ax, y, az), { x: ax, y, z: az });
  }
}

// 2. one entrance: the lowest-grade north face cell, middle of the run; the door is recessed into the air pocket
const north = [...cell].map(([kk, c]) => ({ x: +kk.split(",")[0], z: +kk.split(",")[1], g: c.g }))
  .filter((p) => { const ex = exposed(p.x, p.z); return ex.length === 1 && ex[0][1] === -1; });
const minG = Math.min(...north.map((p) => p.g));
const run = north.filter((p) => p.g === minG).sort((a, b) => a.x - b.x);
const door = run[Math.floor(run.length / 2)];
const doorSet = new Set(), surround = new Set();
if (door) {
  const { x: dx0, z: dz0, g } = door;
  for (const y of [g + 1, g + 2]) {
    glass.delete(key3(dx0, y, dz0)); doorSet.add(key3(dx0, y, dz0));
    air.set(key3(dx0, y, dz0 + 1), { x: dx0, y, z: dz0 + 1, plain: true });   // the recess behind the door
  }
  for (const x of [dx0 - 1, dx0 + 1]) for (const y of [g + 1, g + 2]) surround.add(key3(x, y, dz0));   // stone jambs
  for (const x of [dx0 - 1, dx0, dx0 + 1]) surround.add(key3(x, g + 3, dz0));                            // flush lintel course
}

// 3. the roof: a central plant room (5 x 5, two high, screen above) on the most interior roof, clear of the parapet
const plant = new Set();
const deep = (x, z, m) => { for (let i = -m; i <= m; i++) for (let j = -m; j <= m; j++) if (!inside(x + i, z + j)) return false; return true; };
let best = null;
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
for (const kk of cell.keys()) {
  const [x, z] = kk.split(",").map(Number);
  if (!deep(x, z, 4)) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
    for (const y of [TOP, TOP + 1]) plant.add(key3(best.x + i, y, best.z + j));
    plant.add(key3(best.x + i, TOP + 2, best.z + j));                         // roof cap of the plant room
  }
}

// 4. what each voxel is
const WARM = (x, y, z) => ((x + z) % 4 === 0 && y % STOREY === 1 ? "lantern"
  : (2 * x + z) % 5 === 0 && y % STOREY === 2 ? "glowstone" : null);
function spec(x, y, z) {
  const c = cell.get(key(x, z)), k = key3(x, y, z);
  if (plant.has(k)) {
    if (y === TOP + 2) return ["smooth_stone"];
    return ["light_gray_concrete"];
  }
  if (!c || y >= TOP) return null;
  if (y < c.g) return ["stone_bricks"];                                        // foundation, below the cell's grade
  if (air.has(k)) {
    const a = air.get(k);
    const w = a.plain ? null : WARM(x, y, z);
    if (w === "lantern") return ["lantern", { hanging: "false" }];
    if (w) return [w];
    return null;                                                               // air behind glass or in the door recess
  }
  if (doorSet.has(k)) return ["iron_door", { facing: "north", half: y === door.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  if (surround.has(k)) return y === door.g + 3 ? ["white_concrete"] : ["polished_andesite"];
  const ex = exposed(x, z);
  if (y === TOP - 1) return ex.length ? ["white_concrete"] : ["smooth_stone"];  // parapet cap, or the roof membrane
  if (ex.length === 0) return ["light_gray_concrete"];                         // interior: solid, the floors are its bands
  if (y === c.g) return ["polished_andesite"];                                 // the base course at each cell's grade
  if (isBandRow(y)) return ["white_concrete"];                                 // floor slab edge
  if (isWindowRow(y)) return glass.has(k) ? ["cyan_stained_glass"] : ["white_concrete"];   // glass, or a pier
  if (isSpandrelRow(y)) return isPier(x, z, faceOf(x, z)) ? ["white_concrete"] : ["light_gray_concrete"];
  return ["light_gray_concrete"];
}

// 5. place it
const g = new Voxels([45, 32, 41]);
let placed = 0;
for (const [kk, c] of cell) {
  const [x, z] = kk.split(",").map(Number);
  for (let y = 0; y < TOP; y++) {
    const s = spec(x, y, z); if (!s) continue;
    g.set(x, y, z, s[0], s[1]); placed++;
  }
}
for (const k of plant) { const [x, y, z] = k.split(",").map(Number); const s = spec(x, y, z); if (s) g.set(x, y, z, s[0], s[1]); }
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170798667.nbt");
console.log(`Auckland Mt Eden block: ${cells.length} cells, ${placed} voxels, ${out.blocks} blocks, ${out.palette} palette; door ${door ? [door.x, door.z] : "none"}; plant room ${best ? [best.x, best.z] : "none"}`);
