// FR245184810: a commercial block on the Ile de la Cite side, built on the lidar footprint. The lidar gives three tiers
// (14 low wing, 24 setback, 29 tower at the west end), snapped to those and read on one absolute storey grid (a string
// course on y % 5 == 0, four window rows between), so every tier stands on the storey below and the setbacks line up.
// The ground floor is a shopfront with a striped awning and a door on each long face; the facade is limestone-coloured
// calcite piers between glass panes, with an air gap and a floor slab per storey. A parapet caps each tier, with
// chimney stacks on the flat roofs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184810.cells.json`, "utf8"));

const W = 35, H = 45, D = 16;
const TIERS = [14, 24, 29];                         // the lidar's roofs, snapped to the three flat tiers
const snap = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));

const raw = new Map();                              // "x,z" -> { g, r } as the lidar gave them
for (const [x, z, g, r] of cells) raw.set(`${x},${z}`, { g, r });
const fp = new Map();                               // "x,z" -> { g, T }
for (const [key, { g, r }] of raw) {                // 3x3 median of the lidar roof, then snap: kills the single-cell spikes
  const [x, z] = key.split(",").map(Number), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = raw.get(`${x + dx},${z + dz}`); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  fp.set(key, { g, T: snap(vals[Math.floor(vals.length / 2)]) });
}
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => (at(x, z)?.T ?? 0);         // no building there: open air
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// Which faces of a cell at height y see air (no building cell beside it that reaches that row).
const exposedDirs = (x, z, y) => NEI.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([n]) => n);

// Doors: the median cell of each long face's street run (the south and north faces at the tier-14 wing).
const doorMap = new Map();
for (const [name, dz] of [["south", 1], ["north", -1]]) {
  const xs = [];
  for (const key of fp.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (at(x, z).T === 14 && topAt(x, z + dz) <= 2) xs.push([x, z]);
  }
  if (!xs.length) continue;
  const z0 = xs[0][1];
  const sameFace = xs.filter(([, z]) => z === z0).map(([x]) => x).sort((a, b) => a - b);
  doorMap.set(`${sameFace[Math.floor(sameFace.length / 2)]},${z0}`, name);
}

// One cell's column at height y: [block, state] or null (air). Rows: y=0 plinth; y%5==0 floor slab / string course;
// y%5 in 1..4 window rows (the ground floor's row 4 is the awning); the top row of each tier is the parapet.
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { T } = c;
  if (y >= T) return null;
  if (y === 0) return ["stone_bricks"];                          // plinth / base course
  const dirs = exposedDirs(x, z, y), ext = dirs.length > 0;
  if (y === T - 1) return ext ? ["stone_bricks"] : ["deepslate_tiles"];   // parapet at the edge, roof covering inside
  if (y % 5 === 0) return ["smooth_sandstone"];                  // floor slab / string course
  if (!ext) return null;                                         // interior air behind the facade
  const dk = `${x},${z}`;
  const front = dirs.includes("north") || dirs.includes("south");
  const along = front ? x : z;
  if (front && doorMap.has(dk)) {
    const facing = dirs.includes("south") ? "south" : "north";
    if (y === 1 || y === 2) return ["dark_oak_door", { facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (front && y === 4) return [Math.floor(along / 2) % 2 === 0 ? "red_concrete" : "white_concrete"];   // awning, 2-block stripes
  if (along % 3 === 0) return ["calcite"];                       // pier between the bays
  const st = front ? { north: "false", south: "false", east: "true", west: "true" }
                   : { north: "true", south: "true", east: "false", west: "false" };
  return ["glass_pane", st];
}

const g = new Voxels([W, H, D]);
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) { const b = cls(x, z, y); if (b) g.set(x, y, z, b[0], b[1]); }
}

// Warm light: a glowstone one cell inside some lit window (the air gap stays everywhere else); the shopfronts glow too.
const OPP = { north: "south", south: "north", west: "east", east: "west" };
let lights = 0;
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number), c = at(x, z);
  for (let y = 2; y < c.T; y++) {
    const row = y % 5;
    if (row < 1 || row > 3 || (x * 31 + z * 17 + y * 7) % 11 !== 0) continue;
    const dirs = exposedDirs(x, z, y); if (!dirs.length) continue;
    const b = cls(x, z, y); if (!b || b[0] !== "glass_pane") continue;
    const [, dx, dz] = NEI.find(([n]) => n === OPP[dirs[0]]);
    const ix = x + dx, iz = z + dz;
    if (at(ix, iz) && cls(ix, iz, y) === null) { g.set(ix, y, iz, "glowstone"); lights++; }
  }
}

// Roof plant: brick chimney stacks on the interior roof of each tier (a stone cap on top).
let chimneys = 0;
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number), { T } = at(x, z);
  if (x % 8 !== 4 || z % 5 !== 2 || exposedDirs(x, z, T - 1).length) continue;
  for (let y = T; y <= T + 2; y++) g.set(x, y, z, "bricks");
  g.set(x, T + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  chimneys++;
}

const out = `${DIR}/FR245184810.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries, ${lights} lit windows, ${chimneys} chimneys`);
