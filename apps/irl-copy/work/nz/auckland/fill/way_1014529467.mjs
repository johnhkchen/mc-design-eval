// Way 1014529467, Eden Terrace: a four-storey 1960s-70s concrete office block on a sloping site. Plain white
// render piers, tinted glass bays, smooth-stone floor lines, a flat roof with a stone-brick parapet. The lidar roof
// reads 14 to 15 over the footprint, so it is one flat tier at DECK (15); the uphill (north) cells stand on a
// foundation to their own ground level and the downhill (south) face shows its full height.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_1014529467.cells.json`, "utf8"));

const DECK = 15;                  // roof deck: the top of the body; the cornice stands on it
const SLABS = [4, 8, 12];         // floor slabs, full footprint: the storey lines
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inS = (x, z) => ground.has(key(x, z));
const exposedNS = (x, z) => !inS(x, z - 1) || !inS(x, z + 1);
const exposedEW = (x, z) => !inS(x - 1, z) || !inS(x + 1, z);
const isEdge = (x, z) => exposedNS(x, z) || exposedEW(x, z);

const g = new Voxels([11, 28, 9]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Storey bands on the facade: [first, last] y of the glazed or pier rows; the ground floor starts at its own ground
const UPPER = [[5, 7], [9, 11], [13, DECK - 1]];

for (const [x, z, gr] of cells) {
  const ns = exposedNS(x, z), ew = exposedEW(x, z), corner = ns && ew;
  const u = ns ? x : z;                       // position along the face this cell's outside is on
  const bay = !corner && u % 3 !== 0;          // glazed bay, or a pier every third cell
  // foundation to its own ground, the top course is the base course
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
  for (const y of SLABS) put(x, y, z, "smooth_stone");
  put(x, DECK, z, "stone");                     // roof deck over the whole footprint
  if (isEdge(x, z)) {
    // ground floor: glazing above the base course, a lintel course at y 3
    for (let y = gr + 1; y <= 2; y++) put(x, y, z, bay ? "light_blue_stained_glass" : "white_concrete");
    put(x, 3, z, bay ? "smooth_stone" : "white_concrete");
    for (const [lo, hi] of UPPER)
      for (let y = lo; y <= hi; y++) put(x, y, z, bay ? "light_blue_stained_glass" : "white_concrete");
    put(x, DECK + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // cornice on the roof edge
  }
}

// Entrance: an iron door on the downhill south face (ground 0), under the ground-floor lintel
const doorCell = cells.find(([x, z]) => x === 4 && z === 8);
if (doorCell) {
  const [x, z] = doorCell;
  put(x, 1, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 2, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light: glowstone in the air behind a glazed bay, one step inside the shell, on the middle of two storeys
let lamps = 0;
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const ns = exposedNS(x, z), ew = exposedEW(x, z);
  if (ns && ew) continue;
  const u = ns ? x : z;
  if (u % 3 === 0 || u % 6 !== 1) continue;
  const ix = ns ? x : (!inS(x - 1, z) ? x + 1 : x - 1);
  const iz = ns ? (!inS(x, z - 1) ? z + 1 : z - 1) : z;
  if (!inS(ix, iz) || isEdge(ix, iz)) continue;
  for (const y of [6, 10]) { put(ix, y, iz, "glowstone"); lamps++; }
}

// Roof plant: a stair and lift overrun on the deck, two storeys of stone brick on a 2 x 2 footprint
for (const [x, z] of [[6, 3], [7, 3], [6, 4], [7, 4]]) {
  if (!inS(x, z)) continue;
  for (const y of [DECK + 1, DECK + 2]) put(x, y, z, "stone_bricks");
}

const out = `${dir}/way_1014529467.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries, ${lamps} glowstone lamps`);
