// Way 326340934: a four-storey concrete-framed commercial block, c. 1960s (Auckland's post-war office and
// shop-over-flat blocks): a flat roof on one lidar tier (y 19), a plinth course and shopfront at grade, ribbon
// glazing between white concrete spandrels and light grey piers, a parapet with coping, and a stair/lift
// overrun on the roof. Footprint cells are [x, z, ground, roof]; the building stands on its own foundation
// wherever the ground is higher than y 0, so the downhill (north-west) side shows its extra storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_326340934.cells.json`, "utf8"));

const ROOF = 19;      // the lidar roof is one flat tier; its 14-18 fringe on the edge cells is noise, so smooth to 19
const PITCH = 4;      // storey pitch: a floor slab at y = 0, 4, 8, 12, 16 with three air blocks above each
const ROOF_DECK = 16; // top slab; parapet 17-18 above it

const foot = new Map();
for (const [x, z, g] of cells) foot.set(`${x},${z}`, g);
const inFoot = (x, z) => foot.has(`${x},${z}`);
const ground = (x, z) => foot.get(`${x},${z}`);

// a wall cell: any of its eight neighbours is outside the footprint (eight, so diagonal edges stay closed)
const ring = (x, z) => {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if ((dx || dz) && !inFoot(x + dx, z + dz)) return true;
  return false;
};
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz));   // the exposed faces of a cell
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the entrance: a ground-level cell on a single exposed face, on the street side (the lower north-west edge), near mid-length
let entry = null;
for (const [x, z, g] of cells) {
  const out = outward(x, z);
  if (g > 1 || out.length !== 1 || !ring(x, z) || out[0][0] !== -1) continue;   // west face
  if (!entry || Math.abs(z - 7) < Math.abs(entry.z - 7)) entry = { x, z, out: out[0] };
}
const entryKey = entry ? `${entry.x},${entry.z}` : null;
const entryIn = entry ? [entry.x - entry.out[0], entry.z - entry.out[1]] : null;   // the room cell behind the door

const PIER = "light_gray_concrete", SPANDREL = "white_concrete", GLASS = "light_blue_stained_glass";
const BASE = "polished_andesite", SLAB = "gray_concrete", FOUND = "stone";

// the cell's block at (x, y, z), or null for air: solid below its ground, then the storey grid
function elem(x, z, y) {
  const g = ground(x, z);
  if (y < g) return { block: FOUND };
  const slab = y % PITCH === 0;
  if (!ring(x, z)) {                                   // no interior: a floor slab per storey, air behind the glass
    return slab ? { block: y === 0 ? BASE : SLAB } : null;
  }
  if (y === 0) return { block: BASE };
  if (slab) return { block: SPANDREL };                 // floor line: a white concrete band round the building
  if (y === ROOF_DECK + 1) return { block: PIER };      // parapet
  if (y === ROOF_DECK + 2) return { block: "smooth_stone_slab", state: { type: "bottom" } };   // coping
  const ly = y % PITCH;                                 // 1, 2, 3 above a slab
  const out = outward(x, z);
  const corner = out.length >= 2;
  const pier = corner || out.length === 0 || (x + z) % 4 === 0;
  if (ly === 1 && y < PITCH) return { block: BASE };    // plinth course at grade
  if (ly === 3) return { block: pier ? PIER : SPANDREL };
  if (pier) return { block: PIER };
  if (y < PITCH) return { block: "glass" };             // shopfront at grade: clear glass
  return { block: GLASS };
}

const g3 = new Voxels([19, 32, 28]);
const put = (x, y, z, e) => { if (e) g3.set(x, y, z, e.block, e.state); };

// the building column by column; the entrance and its canopy are cut into the west wall at grade
for (const [x, z] of cells) for (let y = 0; y <= ROOF_DECK + 2; y++) put(x, y, z, elem(x, z, y));

if (entry) {
  const [ox, oz] = entry.out;
  const face = FACING[`${ox},${oz}`];
  const bay = [];                                       // the door's cell and its neighbours on the same face
  for (const dz of [-1, 0, 1]) { const bx = entry.x, bz = entry.z + dz; if (inFoot(bx, bz) && ring(bx, bz) && outward(bx, bz).some(([a, b]) => a === ox && b === oz)) bay.push([bx, bz]); }
  for (const [bx, bz] of bay) {
    g3.set(bx, 3, bz, "stone_brick_slab", { type: "top" });                    // canopy line over the bay
  }
  g3.set(entry.x, 1, entry.z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  g3.set(entry.x, 2, entry.z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  g3.set(entryIn[0], 3, entryIn[1], "lantern", { hanging: "true" });          // lantern in the hall, under the canopy
}

// roof plant: a stair and lift overrun on the roof deck, solid to 20, capped at 21; two plant units beside it
for (let x = 8; x <= 11; x++) for (let z = 16; z <= 19; z++) {
  for (let y = ROOF_DECK + 1; y <= 20; y++) g3.set(x, y, z, SPANDREL);
  g3.set(x, 21, z, "smooth_stone_slab", { type: "bottom" });
}
for (const [x, z] of [[9, 4], [10, 4], [9, 5], [10, 5]]) if (inFoot(x, z) && !ring(x, z)) g3.set(x, ROOF_DECK + 1, z, "iron_block");

// warm light: some windows on each storey, lamp set on the room side of the glass
let lamps = 0;
for (const [x, z] of cells) {
  if (!ring(x, z)) continue;
  const out = outward(x, z);
  if (out.length !== 1) continue;
  const [ox, oz] = out[0];
  for (let storey = 0; storey < 4; storey++) {
    const y = storey * PITCH + 2;                       // the glass row of each storey
    if (y < ground(x, z) || (x * 5 + z * 3 + storey * 7) % 9 !== 0) continue;
    const ix = x - ox, iz = z - oz;
    if (!inFoot(ix, iz) || ring(ix, iz) || y < ground(ix, iz)) continue;
    if (x === entry?.x && z === entry?.z) continue;
    g3.set(ix, y, iz, "glowstone");
    lamps++;
  }
}

const info = g3.save(`${HERE}/way_326340934.nbt`);
console.log(`cells ${cells.length}, entry ${entry ? `${entry.x},${entry.z} facing ${FACING[entry.out.join(",")]}` : "none"}, lamps ${lamps}, blocks ${info.blocks}, palette ${info.palette}`);
