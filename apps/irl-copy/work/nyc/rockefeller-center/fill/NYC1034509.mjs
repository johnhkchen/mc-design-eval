// 1258 Avenue of the Americas (NYC 1034509), a 1933 Commercial & Office building on Sixth Avenue: a buff-stone office block over
// granite shopfronts, with the lidar's stepped read. Body roof 10 (parapet ring to 11, a one-block-higher frieze on the north
// street face to 12); the SE corner (x 16-18, z 4-6) reads 13 and carries a penthouse storey. Each storey is a window band
// between belt courses, quartz piers (Art Deco verticals), a granite base, the avenue entrance on x = 0.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034509.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 19, D = 7, H = 13;
const BASE = "polished_granite", FIELD = "sandstone", BELT = "smooth_sandstone", CORNICE = "chiseled_sandstone";
const PIER = { block: "quartz_pillar", state: { axis: "y" } }, GLASS = "light_blue_stained_glass";
const FLOOR = "smooth_stone", ROOF = "stone", GLOW = "shroomlight";

// Lidar check: the footprint must be the full 19 x 7 rectangle, on ground 0.
if (cells.length !== W * D || cells.some(([, , gr]) => gr !== 0)) throw new Error("footprint is not the flat 19 x 7 rectangle");
const lidar = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const putPier = (x, y, z) => put(x, y, z, PIER.block, PIER.state);

const perim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
// Piers on the long street faces (z = 0, 6) every third column, on the short avenue faces (x = 0, 18) at z = 0, 3, 6.
const PIERS_X = [0, 3, 6, 9, 12, 15, 18], PIERS_Z = [0, 3, 6];
const pierCell = (x, z) => (z === 0 || z === D - 1 ? PIERS_X.includes(x) : PIERS_Z.includes(z));
// The avenue entrance: the door on x = 0 at z = 3, with granite flanks at z = 2 and 4.
const DOOR = [0, 3], FLANK = (x, z) => x === 0 && (z === 2 || z === 4);
const northFrieze = (x, z) => z === 0;

// 1. Interior: floor slabs at each storey, the roof slab at y 9, air between (no interiors; the glass looks onto air).
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) for (const y of [0, 3, 6]) put(x, y, z, FLOOR);
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) put(x, 9, z, ROOF);

// 2. The shell, storey by storey (layers 0-9 under the roof, the parapet to 10, the north frieze to 11).
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!perim(x, z)) continue;
  const pier = pierCell(x, z), door = x === DOOR[0] && z === DOOR[1];
  // Ground storey: granite base and shopfronts; the door and its flanks on the avenue.
  put(x, 0, z, door ? "iron_door" : BASE, door ? { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" } : null);
  if (door) put(x, 1, z, "iron_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  else if (pier || FLANK(x, z)) { put(x, 1, z, BASE); put(x, 2, z, BASE); }
  else { put(x, 1, z, GLASS); put(x, 2, z, GLASS); }
  if (door) put(x, 2, z, BASE);                                         // lintel over the door
  // Office storeys: belt courses at y 3 and 6, windows at y 4-5 and 7-8 between the piers.
  for (const y of [3, 6]) pier ? putPier(x, y, z) : put(x, y, z, BELT);
  for (const y of [4, 5, 7, 8]) pier ? putPier(x, y, z) : put(x, y, z, GLASS);
  // Parapet and cornice; the north street face carries one more course (lidar 12 there).
  for (const y of [9, 10]) pier ? putPier(x, y, z) : put(x, y, z, y === 10 ? CORNICE : FIELD);
  if (northFrieze(x, z)) pier ? putPier(x, 11, z) : put(x, 11, z, CORNICE);
}
// 3. The SE penthouse (lidar 13): x 16-18, z 4-6, one storey of glass on a sandstone plinth, roof at 12.
const PH = { x0: 16, x1: 18, z0: 4, z1: 6 };
const inPH = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1;
const phRing = (x, z) => inPH(x, z) && (x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1);
const phCorner = (x, z) => (x === PH.x0 || x === PH.x1) && (z === PH.z0 || z === PH.z1);
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  if (!phRing(x, z)) continue;
  if (phCorner(x, z)) { for (const y of [10, 11, 12]) putPier(x, y, z); continue; }
  put(x, 10, z, FIELD);
  put(x, 11, z, GLASS);
  put(x, 12, z, CORNICE);
}
put(17, 12, 5, ROOF);                                                   // the penthouse roof slab (interior)

// 4. Roof plant on the body roof (y 9): two blocks of mechanical room and a low plant box.
for (let x = 4; x <= 6; x++) for (let z = 2; z <= 3; z++) for (const y of [10, 11]) put(x, y, z, "stone_bricks");
for (let x = 10; x <= 11; x++) for (let z = 4; z <= 5; z++) put(x, 10, z, "light_gray_concrete");

// 5. Warm light behind some glass: shroomlight just inside the street windows (z = 2 north, z = 4 south), on the floor slabs.
const LIGHTS = [
  [2, 1, 2], [8, 1, 2], [14, 1, 2],          // north shopfronts
  [5, 1, 4], [11, 1, 4],                     // south shopfronts
  [2, 4, 2], [8, 4, 2], [14, 4, 2],          // north office storey 2
  [5, 7, 2], [11, 7, 2], [17, 7, 2],         // north office storey 3
  [4, 4, 4], [10, 4, 4], [16, 4, 4],         // south office storey 2
  [1, 7, 4], [7, 7, 4], [13, 7, 4],          // south office storey 3
  [17, 10, 5],                               // penthouse, on its floor (the roof slab)
];
for (const [x, y, z] of LIGHTS) put(x, y, z, GLOW);

// Lobby light: a lantern hangs from the floor slab above the door, inside.
put(1, 2, 3, "lantern", { hanging: "true", waterlogged: "false" });

// The lintel over the door is granite at y 2 (set above); the belt course over the door stays at y 3.
const out = `${DIR}/NYC1034509.nbt`;
const stats = g.save(out);
console.log(`NYC1034509: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${out}`);
