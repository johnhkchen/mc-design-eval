import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Norfolk House: a 1960s-70s concrete-framed office block. Storeys are 4 blocks on one global grid (floor slabs at
// y = 6, 10, ... 26); the lidar roof gives three tiers, a 5-storey wing (22), a 6-storey podium (26) and a 7th-storey
// core (28) that steps in one cell from the podium. Each storey is a white floor band over three rows of glazing
// between light concrete piers and grey mullions. Foundation fills under each cell's ground; the shell is one cell thick
// with air behind the glass; the entrance is a glazed bay with an iron door and a canopy band over it.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293127444.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293127444.nbt";

const W = 39, H = 41, D = 27;
const FLOORS = new Set([6, 10, 14, 18, 22, 26]);            // floor-slab rows (the white band at each storey's foot)
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

// --- footprint and massing --------------------------------------------------------------------------------------
const at = new Map();
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) at.set(key(x, z), { x, z, g, r, tier: 0 });
const cellAt = (x, z) => at.get(key(x, z));

// roof: 3x3 median of the lidar roof heights (lidar noise out), then three flat tiers
for (const c of at.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cellAt(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  const s = vals[vals.length >> 1];
  c.tier = s >= 27 ? 28 : s >= 24 ? 26 : 22;
}
// the core steps in one cell from the podium around it
const stepIn = [...at.values()].filter((c) => c.tier === 28 &&
  NB4.some(([dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return n && n.tier < 28; }));
for (const c of stepIn) c.tier = 26;

// a wall cell: on the footprint edge, or beside a lower roof that leaves it open to the sky
const shell = (x, y, z) => {
  const c = cellAt(x, z); if (!c || y < c.g || y >= c.tier) return false;
  return NB4.some(([dx, dz]) => { const n = cellAt(x + dx, z + dz); return !n || y >= n.tier; });
};

// --- entrance: the outward face with the most edge cells, its middle cell takes the door ------------------------
const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
let face = null;
for (const [name, [dx, dz]] of Object.entries(FACES)) {
  const run = [...at.values()].filter((c) => !cellAt(c.x + dx, c.z + dz) && c.tier > 0);
  if (!face || run.length > face.run.length) face = { name, dx, dz, run };
}
const tOf = (c) => (face.dx === 0 ? c.x : c.z);
face.run.sort((a, b) => tOf(a) - tOf(b));
const door = face.run[face.run.length >> 1];
const doorBay = new Set(face.run.filter((c) => Math.abs(tOf(c) - tOf(door)) <= 1).map((c) => key(c.x, c.z)));
const inward = [-face.dx, -face.dz];                            // the interior cell behind the door
const outwardName = face.name;

// --- build ------------------------------------------------------------------------------------------------------
const v = new Voxels([W, H, D]);
const lights = [];

for (const c of at.values()) {
  const { x, z, g, tier: R } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");        // foundation: fill up to the ground
  v.set(x, g, z, "polished_andesite");                              // base course / ground floor slab
  for (let y = g + 1; y <= R - 2; y++) {
    if (FLOORS.has(y)) { v.set(x, y, z, "white_concrete"); continue; }   // floor band
    if (!shell(x, y, z)) continue;                                   // interior: air behind the glass
    const isDoorCell = key(x, z) === key(door.x, door.z);
    if (isDoorCell && (y === door.g + 1 || y === door.g + 2)) {
      v.set(x, y, z, "iron_door", { facing: outwardName, half: y === door.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (doorBay.has(key(x, z)) && y === door.g + 3) { v.set(x, y, z, "stone_bricks"); continue; }   // canopy band
    const m = (x + z) % 4;
    if (m === 0) { v.set(x, y, z, "light_gray_concrete"); continue; }     // concrete pier
    if (m === 3) { v.set(x, y, z, "gray_concrete"); continue; }           // mullion
    v.set(x, y, z, "cyan_stained_glass");
    if (m === 1 && (x * 7 + z * 13 + y * 5) % 9 === 0) lights.push([x, y, z]);
  }
  v.set(x, R - 1, z, shell(x, R - 1, z) ? "white_concrete" : "stone");   // cornice on the edge, roof membrane inside
}

// warm light behind a few windows, and in the lobby behind the door
for (const [x, y, z] of lights) {
  const n = NB4.map(([dx, dz]) => cellAt(x + dx, z + dz)).find((q) => q && !shell(q.x, y, q.z));
  if (n) v.set(n.x, y, n.z, "glowstone");
}
v.set(door.x + inward[0], door.g + 2, door.z + inward[1], "glowstone");

// roof plant: 2x2 boxes on the podium roof, clear of the edge and the core
for (const c of at.values()) {
  const cells = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => cellAt(c.x + dx, c.z + dz));
  if (!cells.every((q) => q && q.tier === 26 && !shell(q.x, 25, q.z))) continue;
  if ((c.x * 5 + c.z * 3) % 9 !== 0) continue;
  for (const q of cells) for (let y = 26; y <= 27; y++) v.set(q.x, y, q.z, "light_gray_concrete");
}

// the mast on the core roof (its top at y 28 is the lidar height)
const core = [...at.values()].filter((c) => c.tier === 28 && !shell(c.x, 28, c.z));
if (core.length) {
  const cx = core.reduce((s, c) => s + c.x, 0) / core.length, cz = core.reduce((s, c) => s + c.z, 0) / core.length;
  const best = core.reduce((b, c) => ((c.x - cx) ** 2 + (c.z - cz) ** 2 < (b.x - cx) ** 2 + (b.z - cz) ** 2 ? c : b));
  v.set(best.x, 28, best.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  v.set(best.x, 29, best.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const info = v.save(OUT);
console.log(JSON.stringify({ tiers: [22, 26, 28].map((t) => [...at.values()].filter((c) => c.tier === t).length), face: outwardName, door: [door.x, door.z], ...info }));
