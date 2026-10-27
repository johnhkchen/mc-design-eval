// Way 162319945: a 1980s concrete-frame office block on a stone plinth. A 12-storey slab (roof 48) with a 13-storey tower
// core (roof 55) set over its north-west half, a 3-storey wing on the east side, tinted glass in white-concrete frames,
// a stone base course, a cornice and a parapet, roof plant boxes, warm lights in some windows, and a canopied entrance
// on the uphill face. Storey plates sit on y = 3, 7, 11 ... (a plate and three rows of wall: 4 blocks a storey).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_162319945.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 38, Z = 52, Y = 67;
const FRAME = "white_concrete", GLASS = "light_blue_stained_glass", SLAB = "smooth_stone", BASE = "stone_bricks", STONE = "stone";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

const ground = new Map(), lidar = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); lidar.set(key(x, z), r); }
const inside = (x, z) => ground.has(key(x, z));
const median = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];

// the lidar roof, median-smoothed over the 3x3 footprint neighbourhood, snapped to four massing tiers
const tierOf = (s) => (s >= 51 ? 55 : s >= 44 ? 48 : s >= 26 ? 36 : s >= 15 ? 24 : 14);
// the lowest storey plate at or above the cell's ground
const floorAbove = (g) => { let L = 3; while (L < g + 1) L += 4; return L; };

const roofOf = new Map(), floorOf = new Map();
for (const [x, z, g] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) near.push(lidar.get(key(x + dx, z + dz)));
  const L = floorAbove(g);
  floorOf.set(key(x, z), L);
  roofOf.set(key(x, z), Math.max(tierOf(median(near)), L + 4));   // at least one storey above its own plate
}
const roof = (x, z) => roofOf.get(key(x, z));
const floor = (x, z) => floorOf.get(key(x, z));
// the faces open to the street or a lower roof (where a taller cell's wall shows)
const faces = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || roof(x + dx, z + dz) < roof(x, z));

const V = new Voxels([X, Y, Z]);
for (const [x, z] of cells) {
  const T = roof(x, z), L0 = floor(x, z), sh = faces(x, z), shell = sh.length > 0;
  // solid from y 0 to the lowest storey plate: the foundation, the base course, the pad under the ground floor
  for (let y = 0; y < L0; y++) V.set(x, y, z, shell ? BASE : STONE);
  for (let y = L0; y <= T; y++) {
    if (y === T) { V.set(x, y, z, SLAB); continue; }                       // roof deck
    if (y % 4 === 3) { V.set(x, y, z, SLAB); continue; }                  // storey plate (a storey line)
    if (!shell) continue;                                                  // interior air behind the glass
    if (y === T - 1) { V.set(x, y, z, BASE); continue; }                   // cornice course
    // piers on every third column and at each corner; the first storey is a shopfront (glass to the plate)
    const along = sh[0][0] ? z : x;
    const pier = sh.length > 1 || along % 3 === 0;
    const spandrel = y % 4 === 0 && y !== L0 + 1;
    if (pier || spandrel) { V.set(x, y, z, FRAME); continue; }
    const h = x * 5 + z * 11 + y * 7;
    V.set(x, y, z, h % 41 === 0 ? "shroomlight" : h % 13 === 0 ? "glowstone" : GLASS);   // warm light in some panes
  }
  if (shell) V.set(x, T + 1, z, "stone_brick_wall");                       // parapet
  else if (T >= 48 && x % 6 === 2 && z % 8 === 3) {                        // roof plant boxes on the deck
    V.set(x, T + 1, z, "light_gray_concrete");
    V.set(x, T + 2, z, "light_gray_concrete");
  }
}

// the entrance: the uphill cell on the south (+z) face, the smallest step up from the pad, centred on its face
const southFace = cells.filter(([x, z]) => faces(x, z).some(([dx, dz]) => dx === 0 && dz === 1));
const [ex, ez] = southFace.sort((a, b) => ground.get(key(b[0], b[1])) - ground.get(key(a[0], a[1])) || Math.abs(a[0] - 19) - Math.abs(b[0] - 19))[0];
const L = floor(ex, ez);
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
V.set(ex, L + 1, ez, "dark_oak_door", doorState("lower"));
V.set(ex, L + 2, ez, "dark_oak_door", doorState("upper"));
// a canopy over the door, lanterns hanging from it on either side
for (let dx = -2; dx <= 2; dx++) if (inside(ex + dx, ez) && faces(ex + dx, ez).some(([a, b]) => a === 0 && b === 1)) {
  V.set(ex + dx, L + 3, ez, BASE);
  if (Math.abs(dx) === 2) V.set(ex + dx, L + 2, ez, "lantern", { hanging: "true" });
}

const { blocks, palette } = V.save(`${HERE}/way_162319945.nbt`);
console.log(`way_162319945: ${cells.length} footprint cells, ${blocks} blocks, ${palette} palette entries; entrance at ${ex},${ez}`);
