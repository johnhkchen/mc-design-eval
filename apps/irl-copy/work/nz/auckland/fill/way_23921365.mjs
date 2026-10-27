// Starship Children's Hospital (way 23921365): a pale precast-concrete frame with a glazed curtain-wall skin, built
// from the lidar footprint. Roofs are smoothed to flat tiers (4-block storeys, median over a 7x7 window), the
// footprint is solid to each cell's ground, walls are the shell (outer edge plus any face that rises above a lower
// neighbour, so setbacks stand on their own column), and the interior is air with a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23921365.cells.json", "utf8"));
const W = 178, H = 62, D = 91;
const STONE = "stone_bricks", BODY = "white_concrete", PIER = "light_gray_concrete", GLASS = "light_blue_stained_glass";
const CAP = "gray_concrete", FLOOR = "light_gray_concrete", LAMP = ["glowstone", "shroomlight"];

const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => foot.get(`${x},${z}`);
const NB = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// roof tiers: the lidar's roof median-smoothed over 7x7, then to whole 4-block storeys (absolute), at least 2 storeys above ground
for (const c of foot.values()) {
  const vals = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  c.T = Math.min(52, Math.max(c.g + 8, 4 * Math.round(median(vals) / 4)));
}
// a sliver of two or three cells cannot hold a tower: it stands at most one storey above its neighbours
for (const c of foot.values()) {
  const nb = NB(c.x, c.z).map(([a, b]) => at(a, b)).filter(Boolean);
  if (nb.length <= 2) c.T = Math.min(c.T, Math.max(c.g + 8, Math.max(...nb.map((n) => n.T)) + 4));
}
// shell: the outer edge, and any face that stands above a lower neighbour (a setback's wall)
for (const c of foot.values()) c.shell = NB(c.x, c.z).some(([a, b]) => !at(a, b) || at(a, b).T < c.T);

const v = new Voxels([W, H, D]);

// Walls: one wall of blocks per shell column; glass rows 1-2 of each 4-block storey, pale piers every 4 along the face
function wall(c, y) {
  const xFace = !at(c.x + 1, c.z) || !at(c.x - 1, c.z) || at(c.x + 1, c.z).T < c.T || at(c.x - 1, c.z).T < c.T;
  const along = xFace ? c.z : c.x;
  const r = y % 4;
  let b = BODY;
  if (y === c.g) b = STONE;                                    // base course
  else if (r === 0 || r === 3) b = r === 0 ? BODY : PIER;      // spandrel, then a pier band
  else b = along % 4 === 0 ? PIER : GLASS;                     // mullions and glazing
  v.set(c.x, y, c.z, b);
}

for (const c of foot.values()) {
  // foundation: solid from y 0 to the ground
  for (let y = 0; y < c.g; y++) v.set(c.x, y, c.z, STONE);
  for (let y = c.g; y < c.T; y++) {
    if (c.shell) wall(c, y);
    else if (y % 4 === 0 && y > c.g) v.set(c.x, y, c.z, FLOOR);  // a slab per storey inside
  }
  v.set(c.x, c.T, c.z, CAP);                                    // roof covering on every cell
  if (c.shell) v.set(c.x, c.T + 1, c.z, BODY);                   // parapet
}

// Warm lights: some glazed cells light the room just behind them
for (const c of foot.values()) {
  if (!c.shell) continue;
  let inn = null;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ox = c.x + dx, oz = c.z + dz;
    if (!at(ox, oz)) inn = [c.x - dx, c.z - dz];          // outward neighbour missing: the room is the opposite way
  }
  if (!inn || !at(inn[0], inn[1]) || at(inn[0], inn[1]).shell) continue;
  for (let y = c.g + 1; y < c.T; y++) {
    if (y % 4 === 0 || y % 4 === 3) continue;
    if (((c.x * 31 + c.z * 17 + y * 7) % 11) !== 0) continue;
    v.set(inn[0], y, inn[1], LAMP[(c.x + c.z) & 1]);
  }
}

// Entrance on the south (+z) edge: a glazed bay four wide with two doors, under a lintel
{
  const south = [...foot.values()].filter((c) => c.shell && !at(c.x, c.z + 1));
  const zTop = Math.max(...south.map((c) => c.z));
  const row = south.filter((c) => c.z >= zTop - 1).map((c) => c.x).sort((a, b) => a - b);
  const xc = row[row.length >> 1];
  for (let x = xc - 1; x <= xc + 2; x++) {
    const c = at(x, zTop);
    if (!c) continue;
    for (let y = c.g + 1; y <= c.g + 3; y++) v.set(x, y, zTop, GLASS);
    if (x === xc || x === xc + 1) {
      v.set(x, c.g + 1, zTop, "iron_door", { facing: "south", half: "lower", hinge: x === xc ? "left" : "right", open: "false", powered: "false" });
      v.set(x, c.g + 2, zTop, "iron_door", { facing: "south", half: "upper", hinge: x === xc ? "left" : "right", open: "false", powered: "false" });
    }
  }
}

// Roof: a helipad on the largest flat square of the lowest tier, and plant boxes on the tower
function square(T, n) {
  for (const c of foot.values()) {
    let ok = true;
    for (let dx = 0; dx < n && ok; dx++) for (let dz = 0; dz < n && ok; dz++) {
      const q = at(c.x + dx, c.z + dz); if (!q || q.T !== T || q.shell) ok = false;
    }
    if (ok) return c;
  }
  return null;
}
const tiers = [...new Set([...foot.values()].map((c) => c.T))].sort((a, b) => a - b);
for (const T of tiers) {
  const p = T === tiers[0] ? square(T, 9) : null;
  if (!p) continue;
  for (let dx = 0; dx < 9; dx++) for (let dz = 0; dz < 9; dz++) {
    const edge = dx === 0 || dz === 0 || dx === 8 || dz === 8;
    const bar = dz === 4 && dx >= 2 && dx <= 6, stem = (dx === 2 || dx === 6) && dz >= 2 && dz <= 6;
    v.set(p.x + dx, T, p.z + dz, edge ? "yellow_concrete" : bar || stem ? "red_concrete" : "white_concrete");
  }
  break;
}
const top = tiers[tiers.length - 1];
let plant = null;
for (const c of foot.values()) {
  if (c.T !== top || c.shell) continue;
  let ok = true;
  for (let dx = 0; dx < 3 && ok; dx++) for (let dz = 0; dz < 3 && ok; dz++) { const q = at(c.x + dx, c.z + dz); if (!q || q.T !== top || q.shell) ok = false; }
  if (ok) { plant = c; break; }
}
if (plant) for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) v.set(plant.x + dx, top, plant.z + dz, CAP), v.set(plant.x + dx, top + 1, plant.z + dz, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23921365.nbt";
const info = v.save(out);
console.log("tiers", tiers.join(","), "blocks", info.blocks, "palette", info.palette);
