// FR245184532: a six-storey residential block of about 1800 on the lidar footprint, in cream limestone (calcite) on a stone
// base, with a flat terrace roof behind a stone parapet, chimneys, and two lower wings. Storeys are 4 blocks (a 3 m storey
// at 1.4 blocks a metre), so six storeys reach y = 24, the lidar's top over the main body; the lidar's 24 wins over the
// brief's ~28 (that would be a mansard the lidar does not show). Storey lines fall on y = 0 mod 4 (a string course or the base),
// lintels on y = 3 mod 4. The roof tiers snap to 16 / 20 / 24 so the wings and the main block read as clean setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184532.cells.json`, "utf8"));

const W = 21, H = 40, D = 34;
const TIERS = [16, 20, 24];
const MAIN = 24;

const fp = new Map();                                // "x,z" -> { g, lidar, T }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => at(x, z)?.T ?? 0;           // 0 where there is no building: a missing neighbour is open air
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Smooth the lidar: 3x3 median, then snap to the nearest tier (ties go up, so the main body keeps its full height).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) || (Math.abs(t - med) === Math.abs(best - med) && t > best) ? t : best));
}

// Which faces of a cell at height y face air (no building cell beside it that reaches that row).
const exposedDirs = (x, z, y) => NEI.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([n]) => n);

// Street-side door: on the long (z) faces of the main body, the row of boundary cells with the most ground-level
// candidates, centred on that run. Only cells whose foundation is at most one block (so the door's feet sit on solid).
const doorMap = new Map(), bayMap = new Map(), lanternMap = new Map();
{
  const best = { n: 0, cells: [], name: "south" };
  for (const [name, dz] of [["south", 1], ["north", -1]]) {
    const byZ = new Map();
    for (const key of fp.keys()) {
      const [x, z] = key.split(",").map(Number), c = at(x, z);
      if (c.T === MAIN && c.g <= 1 && !at(x, z + dz)) {
        if (!byZ.has(z)) byZ.set(z, []);
        byZ.get(z).push(x);
      }
    }
    for (const [z, xs] of byZ) if (xs.length > best.n) { best.n = xs.length; best.cells = xs.sort((a, b) => a - b).map((x) => [x, z]); best.name = name; }
  }
  if (best.cells.length) {
    const [x0, z0] = best.cells[Math.floor(best.cells.length / 2)];
    doorMap.set(`${x0},${z0}`, best.name);
    for (const dx of [-1, 0, 1]) bayMap.set(`${x0 + dx},${z0}`, best.name);
    for (const dx of [-2, 2]) if (at(x0 + dx, z0)) lanternMap.set(`${x0 + dx},${z0}`, best.name);
  }
}

// Classify one cell at height y: [block, state] or null (air).
//   y < ground: a stone foundation (solid from 0 up to the cell's ground, so nothing floats on the slope).
//   y = top-1: the roof cap (stone parapet at the edge, deepslate tiles inside).
//   interior: a floor slab on each storey line and air between (no interiors; the air gap sits behind the glass).
//   facade: base course, string courses on y = 0 mod 4, windows in the two rows between, lintels on y = 3 mod 4.
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { g, T } = c;
  if (y >= T) return null;
  if (y < g) return ["stone_bricks"];
  const dirs = exposedDirs(x, z, y), ext = dirs.length > 0;
  if (y === T - 1) return ext ? ["stone_bricks"] : ["deepslate_tiles"];   // a parapet at the edge
  if (!ext) return y % 4 === 0 ? ["smooth_stone"] : null;     // floor slab per storey, air between
  const dk = `${x},${z}`;
  if (y === 0) return ["stone_bricks"];                        // base course
  if (y % 4 === 0) return ["smooth_stone"];                    // storey string course
  if (y === 3 && bayMap.has(dk)) return ["chiseled_stone_bricks"];
  if (y === 3 && lanternMap.has(dk)) return ["lantern", { hanging: "true", waterlogged: "false" }];
  if ((y === 1 || y === 2) && doorMap.has(dk)) {
    return ["dark_oak_door", { facing: doorMap.get(dk), half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y % 4 === 3) return ["calcite"];                         // lintel
  // windows: a pier every third cell along the face (calcite), glass panes elsewhere; the first floor has a rail in front
  const onZ = dirs.includes("north") || dirs.includes("south");
  if ((onZ ? x : z) % 3 === 0) return ["calcite"];
  if (y === 5 && y < T - 1) return ["iron_bars", onZ ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" }];
  const st = onZ ? { north: "false", south: "false", east: "true", west: "true" }
                 : { north: "true", south: "true", east: "false", west: "false" };
  return ["glass_pane", st];
}

const g = new Voxels([W, H, D]);
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) { const b = cls(x, z, y); if (b) g.set(x, y, z, b[0], b[1]); }
}

// Warm light behind some upper-floor glass: a glowstone one cell inside the pane (the air gap stays everywhere else).
let lights = 0;
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number), c = at(x, z);
  for (let y = 5; y < c.T - 1; y += 1) {
    if (y % 4 !== 2 || (x * 31 + z * 17 + y * 7) % 11 !== 0) continue;
    const dirs = exposedDirs(x, z, y); if (!dirs.length) continue;
    const b = cls(x, z, y); if (!b || b[0] !== "glass_pane") continue;
    const [, dx, dz] = NEI.find(([n]) => n === OPP[dirs[0]]);
    const ix = x + dx, iz = z + dz;
    if (at(ix, iz) && cls(ix, iz, y) === null) { g.set(ix, y, iz, "glowstone"); lights++; }
  }
}

// Roof plant on the main terrace: brick chimney stacks well inside the parapet.
let chimneys = 0;
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number), c = at(x, z);
  if (c.T !== MAIN || x % 7 !== 5 || z % 9 !== 4) continue;
  if (exposedDirs(x, z, MAIN - 1).length) continue;
  for (let y = MAIN; y <= MAIN + 2; y++) g.set(x, y, z, "bricks");
  g.set(x, MAIN + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  chimneys++;
}

const out = `${DIR}/FR245184532.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries, ${lights} lit windows, ${chimneys} chimneys, door ${[...doorMap.keys()].join(" ")}`);
