// 1230 Avenue of the Americas, 1939: a Commercial & Office setback tower in the Art Deco manner. Buff stone piers run up
// every storey on a 3-block module with tinted glass between them and a deep spandrel under each window, a granite base
// course with a shopfront at street level, a double entrance on the west face, and a stepped massing from the lidar with
// a penthouse and copper cap on the tallest core, parapets on every setback edge and a few plant boxes on the lower roofs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1077287.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const X = 66, Z = 55, Y = 89, MAX = 25;                                            // MAX storeys: the 79-80 block core
const idx = (x, z) => z * X + x;
const gr = new Int16Array(X * Z).fill(-1), rf = new Int16Array(X * Z);
for (const [x, z, g0, r] of cells) { gr[idx(x, z)] = g0; rf[idx(x, z)] = r; }
const inFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z && gr[idx(x, z)] >= 0;

// Lidar roof through a 5x5 median (the noise goes), then one storey per 3 blocks: flat tiers.
const nS = new Int16Array(X * Z).fill(-1);                                          // storeys per cell; -1 outside
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFoot(x + dx, z + dz)) v.push(rf[idx(x + dx, z + dz)]);
  v.sort((a, b) => a - b);
  nS[idx(x, z)] = Math.min(MAX, Math.max(0, Math.round((v[v.length >> 1] - 3) / 3)));
}
const N = (x, z) => (inFoot(x, z) ? nS[idx(x, z)] : -1);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, k) => NB.some(([dx, dz]) => N(x + dx, z + dz) <= k);         // outside, or against a lower tier
const isWall = (x, z, k) => inFoot(x, z) && N(x, z) > k && exposed(x, z, k);
const isInterior = (x, z, k) => inFoot(x, z) && N(x, z) > k && !isWall(x, z, k);
const roofRow = (x, z) => 3 + 3 * N(x, z);
const core = new Uint8Array(X * Z);                                                 // the tallest tier, inset 4 cells
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (N(x, z) !== MAX) continue;
  let ok = true;
  for (let dz = -4; dz <= 4 && ok; dz++) for (let dx = -4; dx <= 4 && ok; dx++) if (N(x + dx, z + dz) !== MAX) ok = false;
  core[idx(x, z)] = ok ? 1 : 0;
}
const isCore = (x, z) => x >= 0 && x < X && z >= 0 && z < Z && core[idx(x, z)] === 1;
const pane = (alongZ) => ({ north: String(alongZ), south: String(alongZ), east: String(!alongZ), west: String(!alongZ), waterlogged: "false" });

const g = new Voxels([X, Y, Z]);
let walls = 0, lamps = 0;

// 1. Foundation from y 0 up to each cell's ground, a floor slab every storey, and the roof deck at the top of each column.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const G = gr[idx(x, z)], n = N(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, "polished_granite");
  for (let k = 0; k < n; k++) g.set(x, 3 + 3 * k, z, "stone");
  if (n) g.set(x, roofRow(x, z), z, "smooth_quartz");
}

// 2. Wall storeys: piers on a 3-block module (corners always), glass between, a spandrel under each window, and a
//    granite base course at street level. The west face has the entrance: two iron doors on a granite step at z 28-29.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const n = N(x, z);
  for (let k = 0; k < n; k++) {
    if (!isWall(x, z, k)) continue;
    walls++;
    const y0 = 3 + 3 * k;
    const xf = N(x + 1, z) <= k || N(x - 1, z) <= k, zf = N(x, z + 1) <= k || N(x, z - 1) <= k;
    const pier = (xf && zf) || (zf ? x % 3 === 0 : z % 3 === 0);
    if (k === 0 && x === 0 && (z === 28 || z === 29)) {
      g.set(x, 3, z, "polished_granite_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
      const hinge = z === 28 ? "left" : "right";
      const door = { facing: "west", hinge, open: "false", powered: "false" };
      g.set(x, 4, z, "iron_door", { ...door, half: "lower" });
      g.set(x, 5, z, "iron_door", { ...door, half: "upper" });
      continue;
    }
    g.set(x, y0, z, k === 0 ? "polished_granite" : pier ? "smooth_sandstone" : "deepslate_bricks");
    for (const dy of [1, 2]) {
      if (pier) g.set(x, y0 + dy, z, "smooth_sandstone");
      else g.set(x, y0 + dy, z, "cyan_stained_glass_pane", pane(xf));
    }
    // Warm light in some windows: a lantern on the floor two cells in, leaving one air cell between it and the glass.
    if (!pier && (x * 7 + z * 3 + k * 5) % 6 === 0) {
      const dx = xf ? (N(x - 1, z) <= k ? 1 : -1) : 0, dz = xf ? 0 : (N(x, z - 1) <= k ? 1 : -1);
      const a = [x + dx, z + dz], b = [x + 2 * dx, z + 2 * dz];
      if (isInterior(a[0], a[1], k) && isInterior(b[0], b[1], k)) { g.set(b[0], y0 + 1, b[1], "lantern", { hanging: "false", waterlogged: "false" }); lamps++; }
    }
  }
}

// 3. Roof: a parapet on every setback edge, a penthouse with a copper cap on the core, and small plant boxes on lower roofs.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const n = N(x, z);
  if (!inFoot(x, z) || n < 1 || isCore(x, z)) continue;
  if (exposed(x, z, n - 1)) g.set(x, roofRow(x, z) + 1, z, "smooth_sandstone");
  const even = NB.every(([dx, dz]) => N(x + dx, z + dz) === n);
  if (n >= 6 && even && x % 8 === 5 && z % 6 === 3) {
    g.set(x, roofRow(x, z) + 1, z, "smooth_stone");
    g.set(x, roofRow(x, z) + 2, z, "smooth_stone");
  }
}
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!isCore(x, z)) continue;
  const T = roofRow(x, z);
  const ringE = !isCore(x + 1, z) || !isCore(x - 1, z), ringN = !isCore(x, z + 1) || !isCore(x, z - 1);
  const edge = ringE || ringN;
  if (edge) g.set(x, T + 1, z, "smooth_sandstone");
  if (edge && ringE && ringN) g.set(x, T + 2, z, "smooth_sandstone");                              // corner pier
  else if (edge) g.set(x, T + 2, z, "cyan_stained_glass_pane", pane(ringE));
  g.set(x, T + 3, z, "oxidized_copper");
}

const stats = g.save(`${DIR}/NYC1077287.nbt`);
console.log(`storeys ${[...new Set(nS)].filter((v) => v >= 0).sort((a, b) => a - b).join(",")}  walls ${walls}  lamps ${lamps}  core ${core.reduce((a, b) => a + b, 0)}  blocks ${stats.blocks}  palette ${stats.palette}`);
