// 7 East 48 Street: a 1984 Midtown office tower in blue-tinted glass on a granite base. The lidar roof is
// near-flat (162-170 blocks, median-smoothed to 3-block tiers), so the massing is one slab with the lidar's own
// small steps, not invented setbacks. Each storey is 3 blocks: a spandrel (or floor) row, then two glass rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035434.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 40, Z = 36, H = 182;
const ROOF_MIN = 100;                                  // lidar heights under this are open ground (plaza, light well)

const byKey = new Map();
for (const [x, z, ground, roof] of cells) byKey.set(x * 100 + z, { ground, roof });
const cell = (x, z) => byKey.get(x * 100 + z);
const built = (x, z) => { const c = cell(x, z); return !!c && c.roof >= ROOF_MIN; };

// Lidar roof, median of the 3x3 built neighbourhood, rounded to a 3-block storey line.
const topCache = new Map();
function top(x, z) {
  const k = x * 100 + z; if (topCache.has(k)) return topCache.get(k);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (built(x + dx, z + dz)) vals.push(cell(x + dx, z + dz).roof);
  vals.sort((a, b) => a - b);
  const t = 3 * Math.round(vals[vals.length >> 1] / 3);
  topCache.set(k, t); return t;
}

// The directions in which the wall of (x, z) at height y faces outside: off the footprint, open ground, or above/below that neighbour's column.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function exposed(x, z, y) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (!built(nx, nz)) { out.push(d); continue; }
    const n = cell(nx, nz);
    if (y < n.ground || y >= top(nx, nz)) out.push(d);
  }
  return out;
}

// Entrance: the lobby on the street face (the southern edge), centred on the middle of its building row.
let zFront = -1;
for (const [x, z] of cells) if (built(x, z)) zFront = Math.max(zFront, z);
const frontXs = cells.filter(([x, z]) => z === zFront && built(x, z)).map(([x]) => x);
const cx = Math.round(frontXs.reduce((a, b) => a + b, 0) / frontXs.length);
const doorXs = [cx, cx + 1];
const lobbyXs = [cx - 2, cx - 1, cx, cx + 1, cx + 2];

const g = new Voxels([X, H, Z]);
const glassLit = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 100 < 6;   // about one pane in 17 is lit

// Open ground inside the footprint: a paved plaza at y 0.
for (const [x, z, ground, roof] of cells) if (!built(x, z)) g.set(x, 0, z, "smooth_stone");

let blocks = 0;
for (const [x, z] of cells) {
  if (!built(x, z)) continue;
  const { ground } = cell(x, z), t = top(x, z);
  const lobby = z === zFront && lobbyXs.includes(x);
  const door = lobby && doorXs.includes(x);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");                 // foundation under a raised cell
  for (let y = ground; y < t; y++) {
    const ex = exposed(x, z, y);
    const perim = ex.length > 0;
    const northSouth = ex.includes("N") || ex.includes("S");
    const idx = northSouth ? x : z;                                                  // mullions on the facade's own grid
    const mullion = idx % 3 === 0;
    if (lobby && y <= 3) {                                                           // lobby, doors, canopy
      if (door && (y === 0 || y === 1)) {                                            // a two-block door, hinged on its outer edge
        const door_ = { facing: "south", hinge: x === cx ? "left" : "right", open: "false", powered: "false" };
        g.set(x, y, z, "iron_door", { ...door_, half: y === 0 ? "lower" : "upper" });
      }
      else if (y === 0) g.set(x, y, z, "smooth_stone");                              // lobby floor
      else if (y === 3) g.set(x, y, z, "polished_granite");                          // canopy over the entrance
      else if (door && y === 2) g.set(x, y, z, "glass");                             // transom
      else if (!door && y === 2 && (x === cx - 2 || x === cx + 2)) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      // otherwise the vestibule is air
      continue;
    }
    if (perim) {
      if (y >= t - 2) g.set(x, y, z, "polished_granite");                             // cornice and parapet
      else if (y === 0) g.set(x, y, z, "polished_granite");                          // granite plinth
      else if (y < 3) g.set(x, y, z, mullion ? "polished_granite" : "glass");       // shopfront with granite piers
      else if (y % 3 === 0) g.set(x, y, z, "gray_concrete");                         // spandrel and floor line
      else if (mullion) g.set(x, y, z, "iron_block");
      else if (glassLit(x, y, z)) g.set(x, y, z, "glowstone");                       // a lit office behind the glass
      else g.set(x, y, z, "light_blue_stained_glass");
    } else {
      if (y === t - 1) g.set(x, y, z, "gray_concrete");                              // roof
      else if (y % 3 === 0 || y === t - 2 || y === ground) g.set(x, y, z, "smooth_stone"); // floor slab per storey
      // else air: no interiors
    }
  }
}

const res = g.save(`${DIR}/NYC1035434.nbt`);
console.log(JSON.stringify({ front: zFront, cx, ...res, footprint: cells.length }));
