// "Brooklyn": an eight-storey 1970s reinforced-concrete apartment block on a volcanic-stone plinth (Mt Eden / Eden
// Terrace). Lidar roof 31-35 blocks above the lowest ground: massing snaps to three tiers (28 wing, 32 mass, 36 core),
// each a whole number of 4-block storeys, so every floor slab sits on the wall below and every roof sits on the storey below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588403.cells.json", "utf8"));
const X = 35, Z = 32, Y = 48;

// footprint: ground g and lidar roof r per cell
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const inFp = (x, z) => fp.has(`${x},${z}`);
const rawRoof = (x, z) => fp.get(`${x},${z}`).r;

// 3x3 median over the footprint knocks out the lidar spikes at the edges (7, 9, 12, 19 ...)
const medRoof = new Map();
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) vals.push(rawRoof(x + dx, z + dz));
  vals.sort((a, b) => a - b);
  medRoof.set(key, vals[vals.length >> 1]);
}
// three tiers, each a whole number of 4-block storeys (28 = 7, 32 = 8, 36 = 9)
const tierOf = (r) => (r >= 34 ? 36 : r >= 30 ? 32 : 28);
const R = (x, z) => tierOf(medRoof.get(`${x},${z}`));

// the outward sides of a cell: a neighbour outside the footprint, or a lower tier that is air at that height
const exposedAt = (x, z, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFp(x + dx, z + dz) || R(x + dx, z + dz) <= y);
const isFacade = (x, z, y) => inFp(x, z) && y < R(x, z) && exposedAt(x, z, y);

const g = new Voxels([X, Y, Z]);
const PLINTH = "polished_andesite", WALL = "light_gray_concrete", BAND = "white_concrete", ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";

// facade-plane direction of a cell's exterior face (the side it is exposed on), and the inward step
function outward(x, z, y) {
  if (!inFp(x, z - 1) || R(x, z - 1) <= y) return { dx: 0, dz: -1 };
  if (!inFp(x, z + 1) || R(x, z + 1) <= y) return { dx: 0, dz: 1 };
  if (!inFp(x - 1, z) || R(x - 1, z) <= y) return { dx: -1, dz: 0 };
  return { dx: 1, dz: 0 };
}

// the lobby: a street-level entrance on the north face (z 0), a carved hall behind it, a canopy over the door
const LOBBY = (x, y, z) => x >= 25 && x <= 27 && z <= 2 && y >= 1 && y <= 2 && !(z === 0 && x !== 26);

for (const [key, { g: gr }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const r = R(x, z);
  // foundation and plinth: solid from y 0 up through the cell's ground to the storey-1 floor (y 4)
  for (let y = 0; y < 4; y++) g.set(x, y, z, PLINTH);
  // storeys: slab at 4k (k>=1), two glass rows, a head band at 4k+3; the top storey's head is the roof cover
  for (let y = 4; y < r; y++) {
    const facade = isFacade(x, z, y);
    const k = Math.floor(y / 4), row = y % 4;
    if (row === 0) { g.set(x, y, z, facade ? BAND : WALL); continue; }   // slab / string course
    if (row === 3) { if (facade) g.set(x, y, z, BAND); continue; }     // head band; the roof cover is laid below
    if (!facade) continue;                                             // interior air, behind the glass
    const { dx, dz } = outward(x, z, y);
    const along = dx ? z : x;
    const pier = along % 3 === 0;                                      // a pier every third cell along the facade
    if (pier) g.set(x, y, z, WALL);
    else g.set(x, y, z, GLASS, { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
    // a warm light behind some panes (glowstone set into the room just inside the glass)
    if (!pier && row === 1 && (x * 7 + y * 3 + z * 5) % 9 === 0) {
      const ix = x + (dx ? -dx : 0), iz = z + (dz ? -dz : 0);
      if (inFp(ix, iz) && !isFacade(ix, iz, y)) g.set(ix, y, iz, "glowstone");
    }
  }
  // roof cover (not a storey head, so it sits on the storey below)
  g.set(x, r - 1, z, ROOF);
  // parapet on the perimeter
  if (exposedAt(x, z, r)) g.set(x, r, z, BAND);
}

// the head band of the top storey is the roof cover: put back the facade band on the parapet course
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  const r = R(x, z);
  if (isFacade(x, z, r - 1)) g.set(x, r - 1, z, BAND);
}

// roof plant: 2x2 units with a parapet-height block on interior roof cells, a tower-core crown on the 36 tier
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  const r = R(x, z);
  const interior = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inFp(x + dx, z + dz) && R(x + dx, z + dz) === r);
  if (!interior) continue;
  if (x % 8 === 4 && z % 8 === 4) { g.set(x, r, z, WALL); g.set(x, r + 1, z, WALL); }
  if (x % 8 === 5 && z % 8 === 4) { g.set(x, r, z, WALL); }
}
// lift overrun on the tall core: a lit crown band around it
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (R(x, z) === 36 && x >= 12 && x <= 14 && z >= 16 && z <= 18) {
    for (let y = 36; y <= 38; y++) g.set(x, y, z, y === 38 ? BAND : WALL);
  }
}

// entrance: iron door on the north face, lobby carved out of the plinth, a canopy band over the door
for (let x = 25; x <= 27; x++) for (let z = 0; z <= 2; z++) for (let y = 1; y <= 2; y++) if (LOBBY(x, y, z)) g.set(x, y, z, "air");
g.set(26, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(26, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 24; x <= 28; x++) for (let z = 0; z <= 1; z++) g.set(x, 3, z, BAND);
for (let x = 24; x <= 28; x++) g.set(x, 4, 0, "polished_andesite_slab", { type: "top", waterlogged: "false" });

const meta = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588403.nbt");
console.log(JSON.stringify(meta));
