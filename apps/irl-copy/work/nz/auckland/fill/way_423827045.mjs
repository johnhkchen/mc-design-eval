import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// The Orange: a late-1970s office block on the Eden Terrace side of the CBD. White precast frame with tinted-glass
// window bands and orange terracotta belts and cornices, a shopfront ground storey and a recessed entrance on the west.
// The lidar roof heights are quantised into flat tiers, a 30-block tower over setbacks at 25 and 17 and a 13-block
// podium; anything under 10 is a sunken court with no building above its ground. Solid core with an air pocket behind
// each window (the floor slab under every storey), so nothing floats.

const ROOT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const ID = "way_423827045";
const cells = JSON.parse(readFileSync(`${ROOT}/${ID}.cells.json`, "utf8"));

const vox = new Voxels([44, 43, 83]);

const SLABS = [13, 17, 21, 25];   // floor slabs above the ground storey (ground storey is 5 tall, upper storeys 4)
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const key = (x, z) => x + "," + z;

const tierTop = (roof) => (roof < 10 ? 0 : roof >= 27 ? 30 : roof >= 23 ? 25 : roof >= 14 ? 17 : 13);

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, ground, top: tierTop(roof), pocket: false, door: false });
const at = (x, z) => cell.get(key(x, z));
const topAt = (x, z) => at(x, z)?.top ?? 0;

for (const c of cell.values()) {
  c.exposed = c.top ? Object.keys(DIRS).filter((d) => topAt(c.x + DIRS[d][0], c.z + DIRS[d][1]) < c.top) : [];
  c.facade = c.exposed.length > 0;
}

// a facade cell is a pier (white concrete column) at a corner or every third block along its face; else a window bay
const isPier = (c) => {
  const axes = new Set(c.exposed.map((d) => (d === "W" || d === "E" ? "x" : "z")));
  if (axes.size > 1) return true;
  return c.exposed.some((d) => (d === "W" || d === "E" ? c.z : c.x) % 3 === 0);
};

// the entrance: a west-facing facade cell with interior behind it, the middle one of the west face
const westDoors = [...cell.values()]
  .filter((c) => c.facade && c.exposed.length === 1 && c.exposed[0] === "W" && topAt(c.x + 1, c.z) === c.top && !at(c.x + 1, c.z).facade)
  .sort((a, b) => a.z - b.z);
const door = westDoors[Math.floor(westDoors.length / 2)];
door.door = true;

// the air pocket behind each window: the interior cell just inside a window bay, same tier, not a facade
for (const c of cell.values()) {
  if (!c.facade) continue;
  for (const d of c.exposed) {
    if (isPier(c) && !c.door) continue;
    const n = at(c.x - DIRS[d][0], c.z - DIRS[d][1]);
    if (n && n.top === c.top && !n.facade) n.pocket = true;
  }
}

// rows of air inside a pocket: the ground storey's windows (above the plinth, under the fascia), and each upper storey's
// two window rows (the slab below and the ceiling above are solid)
function pocketAt(c, y) {
  if (!c.pocket) return false;
  if (y > c.ground && y <= 10) return true;
  const b = SLABS.filter((s) => s < y).pop();
  return b !== undefined && (y - b === 1 || y - b === 2) && b + 3 < c.top;
}

// the facade's block at a row above its plinth: belts at each floor, windows in bays, piers between
function facadeBlock(c, y) {
  if (y < 13) {
    if (y === 11) return ["orange_terracotta"];
    if (y === 12) return ["white_concrete"];
    return isPier(c) ? ["white_concrete"] : ["glass"];
  }
  if (SLABS.includes(y)) return ["orange_terracotta"];
  const b = SLABS.filter((s) => s < y).pop();
  return y - b <= 2 && !isPier(c) ? ["tinted_glass"] : ["white_concrete"];
}

const DOOR_STATE = { facing: "west", hinge: "left", open: "false", powered: "false" };

for (const c of cell.values()) {
  const { x, z, ground, top } = c;
  for (let y = 0; y < ground; y++) vox.set(x, y, z, "stone_bricks");   // foundation: fills to the ground
  if (!top) continue;
  for (let y = ground; y < top; y++) {
    if (pocketAt(c, y)) continue;
    if (y === top - 1) vox.set(x, y, z, "gray_concrete");              // roof membrane
    else if (c.facade && y === ground) vox.set(x, y, z, "polished_andesite");  // plinth
    else if (c.facade) { const [b, s] = facadeBlock(c, y); vox.set(x, y, z, b, s); }
    else vox.set(x, y, z, SLABS.includes(y) ? "smooth_stone" : "stone");       // solid core, slab per storey
  }
  if (c.facade) vox.set(x, top, z, "orange_terracotta");                // cornice
}

// warm light in some pockets: lanterns on the ground-storey floor, glowstone on the upper floors
for (const c of cell.values()) {
  if (!c.pocket) continue;
  if (pocketAt(c, c.ground + 1) && (c.x * 7 + c.z * 13) % 4 === 0) vox.set(c.x, c.ground + 1, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  for (const b of SLABS) {
    if (b + 1 < c.top && pocketAt(c, b + 1) && (c.x * 7 + c.z * 13 + b * 3) % 7 === 0) vox.set(c.x, b + 1, c.z, "glowstone");
  }
}

// the recessed entrance: two-high oak door in the west face, an orange lintel over it, and a lantern inside
const dIn = at(door.x + 1, door.z);
vox.set(door.x, door.ground, door.z, "oak_door", { ...DOOR_STATE, half: "lower" });
vox.set(door.x, door.ground + 1, door.z, "oak_door", { ...DOOR_STATE, half: "upper" });
vox.set(door.x, door.ground + 2, door.z, "orange_terracotta");
vox.set(dIn.x, dIn.ground + 1, dIn.z, "lantern", { hanging: "false", waterlogged: "false" });

// roof plant: a 3 by 3 plant box on the tower's roof, well inside its edge; air-conditioning units on the first setback
const interior = (top) => [...cell.values()].filter((c) => c.top === top && !c.facade);
const towerSet = new Set(interior(30).map((c) => key(c.x, c.z)));
const towerCells = interior(30);
const cx = towerCells.reduce((s, c) => s + c.x, 0) / towerCells.length, cz = towerCells.reduce((s, c) => s + c.z, 0) / towerCells.length;
let plant = null, bestD = Infinity;
for (const c of towerCells) {
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) ok = towerSet.has(key(c.x + dx, c.z + dz));
  const d = (c.x - cx) ** 2 + (c.z - cz) ** 2;
  if (ok && d < bestD) { bestD = d; plant = c; }
}
if (plant) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const y of [30, 31]) vox.set(plant.x + dx, y, plant.z + dz, "light_gray_concrete");

let units = 0;
for (const c of interior(25)) {
  if (units < 4 && c.x % 4 === 0 && c.z % 4 === 0) { vox.set(c.x, 25, c.z, "light_gray_concrete"); units++; }
}

const out = vox.save(`${ROOT}/${ID}.nbt`);
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, door: [door.x, door.z], plant: plant && [plant.x, plant.z], acUnits: units }));
