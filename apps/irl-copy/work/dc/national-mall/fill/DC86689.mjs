// 1155 16th St NW (Commercial-Office-Large): a 1970s stone-clad office block on a plinth, four storeys on the
// perimeter, a five-storey core stepping up to a penthouse crown, and a one-storey service wing at the back.
// Massing comes from the lidar roof grid (median-smoothed into three flat tiers: 12, 14, 15) and the 3-block
// storey module: floor band (smooth quartz), two glass layers, floors and roof decks in between. Interiors are
// air behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86689.cells.json", "utf8"));

const W = 13, D = 20, H = 27;
const foot = new Map(cells.map(([x, z, g, L]) => [`${x},${z}`, { g, L }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);

// Roof tier of each cell: wings (lidar 2-3) take one storey; elsewhere the 3x3 median of the lidar roof picks 12, 14 or 15.
function tier(x, z) {
  const { L } = foot.get(`${x},${z}`);
  if (L <= 3) return 4;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) vals.push(foot.get(`${x + dx},${z + dz}`).L);
  vals.sort((a, b) => a - b);
  const m = vals[Math.floor(vals.length / 2)];
  return m <= 12 ? 12 : m <= 14 ? 14 : 15;
}
const R = new Map(); for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) R.set(`${x},${z}`, tier(x, z));
const roofOf = (x, z) => R.get(`${x},${z}`);

// Storey floors (band course at each floor level); windows fill the two layers above each floor.
const FLOORS = new Set([1, 4, 7, 10, 13]);
// [dx, dz, face name]: z = 0 is the street (16th St) front, the north face.
const DIRS = [[0, -1, "N"], [0, 1, "S"], [1, 0, "E"], [-1, 0, "W"]];

// The faces of a cell at height y that are on the outside: beyond the footprint, or above a lower neighbour's roof.
function exposed(x, z, y) {
  return DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || roofOf(x + dx, z + dz) <= y);
}

// Piers every third bay, and the last bay of each face, so the window grid sits square on each facade.
function isPier(x, z, face) {
  const [, , name] = face;
  const idx = name === "N" || name === "S" ? x : z;
  const len = name === "N" || name === "S" ? W : D;
  return idx % 3 === 0 || idx === len - 1;
}

const g = new Voxels([W, H, D]);
const PLINTH = "polished_granite", BAND = "smooth_quartz", GLASS = "light_blue_stained_glass", DECK = "light_gray_concrete", SLAB = "smooth_stone";

for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) {
  const r = roofOf(x, z);
  g.set(x, 0, z, PLINTH);                                    // base course over the whole footprint (foundation to the ground)
  for (let y = 1; y < r; y++) {
    const ex = exposed(x, z, y), top = y === r - 1, floor = FLOORS.has(y);
    if (!ex.length) {
      if (top) g.set(x, y, z, DECK);                         // roof deck over the interior
      else if (floor) g.set(x, y, z, SLAB);                  // floor slab per storey (interior air above)
      continue;
    }
    if (top || floor || ex.length > 1) { g.set(x, y, z, BAND); continue; } // parapet, floor band, corner pier
    const face = ex[0];
    if (isPier(x, z, face)) { g.set(x, y, z, BAND); continue; }
    g.set(x, y, z, GLASS);
    // Warm light in some windows: a glowstone in the air gap behind the glass, inside the building only.
    const [dx, dz] = face, ix = x - dx, iz = z - dz;
    if ((x * 7 + z * 3 + y * 5) % 23 === 0 &&inFoot(ix, iz) && roofOf(ix, iz) > y) g.set(ix, y, iz, "glowstone");
  }
}

// Street entrance on the north face, centre bay: a dark oak door on the threshold, under the pier lintel.
g.set(6, 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Rooftop mechanical penthouse on the 14 tier, a 3 x 2 block box set in from the edges, with a smooth cap.
for (let z = 9; z <= 11; z++) for (let x = 3; x <= 5; x++) {
  if (roofOf(x, z) !== 14) continue;
  g.set(x, 14, z, "calcite"); g.set(x, 15, z, "calcite");
}
for (let z = 9; z <= 11; z++) for (let x = 3; x <= 5; x++) if (roofOf(x, z) === 14) g.set(x, 16, z, BAND);

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86689.nbt");
console.log(JSON.stringify(info));
