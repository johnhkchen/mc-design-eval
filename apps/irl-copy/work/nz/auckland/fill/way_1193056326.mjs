import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 1193056326: an Auckland CBD-edge office block, 1960s-70s: a concrete frame with ribbon glazing in tinted blue
// glass, a volcanic basalt plinth (polished andesite) and stone foundations, a stepped east tower on a four-storey
// podium. Storey lines sit at absolute y = 4k so floors line up across the building; each footprint cell is a column
// from its own ground (foundation below) to its tier top, so every tier stands on the one below. Interiors are air
// behind a one-block shell, with a floor slab per storey.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1193056326.cells.json", "utf8"));
const g = new Voxels([24, 45, 38]);

// the lidar roof, quantised into flat tiers: podium 16 (four storeys), wing 18 (a two-block plant band), tower 24 and 32
const tierOf = (r) => (r <= 16 ? 16 : r <= 18 ? 18 : r <= 27 ? 24 : 32);
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(`${x},${z}`, { ground, roof, tier: tierOf(roof) });
// one majority pass over each 3x3 patch sheds the one- and two-cell slivers the lidar leaves along the east edge
// (they read as chimneys); the tower core (roof 28+) is kept as lidar gives it, it is the building's one tall element
const mode = (x, z) => {
  const n = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(`${x + dx},${z + dz}`); if (c) n.set(c.tier, (n.get(c.tier) || 0) + 1);
  }
  const best = [...n].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  return best;
};
const at = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  at.set(k, { ground: c.ground, top: c.roof >= 28 ? 32 : mode(x, z) });
}
const cellAt = (x, z) => at.get(`${x},${z}`);
const DIRS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };

// the sides of a cell whose wall at height y faces open air: the neighbour is outside the footprint or its roof is below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; const n = cellAt(x + dx, z + dz);
  return !n || n.top <= y;
});

const CONC = "light_gray_concrete", SPAND = "white_concrete", BASE = "polished_andesite", FOUND = "stone_bricks";
const PANE = "light_blue_stained_glass_pane";
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// a wall's pier falls every third bay along the run; corners are always piers
const runs = (ex) => ({ alongX: ex.includes("north") || ex.includes("south"), alongZ: ex.includes("west") || ex.includes("east") });
const isPier = (x, z, ex) => { const { alongX, alongZ } = runs(ex); return (alongX && alongZ) || (alongX ? x : z) % 3 === 0; };

// what a footprint column is at height y: foundation, base course, slab, cornice or deck, ribbon glazing, or air
function blockAt(x, z, y) {
  const c = cellAt(x, z);
  if (y < 0 || y >= c.top) return null;
  if (y < c.ground) return { block: FOUND };
  const ex = exposed(x, z, y), outside = ex.length > 0;
  if (y === c.ground || y === c.top - 1) return { block: outside ? BASE : CONC };   // base course / cornice, interior slab / deck
  if (y % 4 === 0) return { block: CONC };                                         // storey slab
  if (!outside) return null;                                                       // air behind the glass
  const s = y % 4;
  const glassRow = s === 2 || (s === 1 && y < 4) || (s === 3 && y >= 4);           // ground storey: shopfront glass at 1-2, transom at 3
  if (!glassRow) return { block: SPAND };
  if (isPier(x, z, ex)) return { block: CONC };
  const { alongX } = runs(ex);
  return { block: PANE, state: alongX ? PANE_X : PANE_Z };
}

for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    const b = blockAt(x, z, y);
    if (b) g.set(x, y, z, b.block, b.state);
  }
}

// entrance: a ground-storey bay on the street side at the lowest ground, not a pier or a corner
let door = null;
for (const [k, c] of at) {
  if (c.ground !== 0) continue;
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z, 1), { alongX, alongZ } = runs(ex);
  if (!ex.length || (alongX && alongZ) || isPier(x, z, ex)) continue;
  door = { x, z, face: ex[0], alongX };
  break;
}
if (door) {
  const { x, z, face, alongX } = door;
  g.set(x, 1, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  // the lintel band over the door and the bays either side of it
  for (const d of [-1, 0, 1]) {
    const dx = alongX ? d : 0, dz = alongX ? 0 : d, n = cellAt(x + dx, z + dz);
    if (n) g.set(x + dx, 3, z + dz, BASE);
  }
}

// warm light behind some of the glass: glowstone or shroomlight in the air cell just inside the pane
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.ground + 1; y < c.top - 1; y++) {
    const p = g.get(x, y, z);
    if (!p || p.block !== PANE) continue;
    if ((x * 31 + z * 17 + y * 7) % 7 !== 0) continue;
    const out = Object.keys(DIRS).find((d) => exposed(x, z, y).includes(d));
    const [dx, dz] = DIRS[out], ix = x - dx, iz = z - dz, inner = cellAt(ix, iz);
    if (!inner || y < inner.ground || y >= inner.top - 1 || y % 4 === 0 || g.get(ix, y, iz)) continue;
    g.set(ix, y, iz, (x + z + y) % 3 === 0 ? "shroomlight" : "glowstone");
  }
}

// roof plant: a two-block plant room on a 3x3 patch of podium roof that no tower or wing stands beside
let plant = null;
for (const [k, c] of at) {
  if (c.top !== 16) continue;
  const [x, z] = k.split(",").map(Number);
  const patch = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) patch.push(cellAt(x + dx, z + dz));
  if (patch.every((n) => n && n.top === 16 && n.ground <= 2)) { plant = { x, z }; break; }
}
if (plant) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    g.set(plant.x + dx, 16, plant.z + dz, CONC);
    g.set(plant.x + dx, 17, plant.z + dz, BASE);
  }
}

// the tower crown: lightning rods on the tallest cell's roof
const crown = [...at].find(([, c]) => c.top === 32);
if (crown) {
  const [x, z] = crown[0].split(",").map(Number);
  for (let y = 32; y <= 34; y++) g.set(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1193056326.nbt"));
