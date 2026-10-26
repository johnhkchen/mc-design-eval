import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1200 19th St NW: a 1960s-70s Washington office block on a granite plinth. Pale quartz piers and light concrete
// spandrels frame grey tinted glass in every bay; a six-storey core rises over five-storey wings, with a plant
// penthouse on the core and a glazed entrance with a canopy on the street (z = 0) face. Storeys are 3 blocks: a
// spandrel course and two rows of glass. Lidar roof is snapped to two flat tiers: wings at 17, core at 20.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76563.cells.json`, "utf8"));

const W = 17, D = 31, H = 32;
const STOREY = 3;
const WING = 17, CORE = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const inFp = (x, z) => raw.has(key(x, z));

// Lidar noise out: 3x3 median of the roof, then the nearest tier (19+ is the core, anything lower the wings)
const TOP = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const c = raw.get(key(x + dx, z + dz));
      if (c) vals.push(c.roof);
    }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  TOP.set(key(x, z), med >= 19 ? CORE : WING);
}
const top = (x, z) => TOP.get(key(x, z)) ?? 0;
const solid = (x, z, y) => inFp(x, z) && y >= 0 && y < top(x, z);

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
// the outward faces of a solid cell at layer y: a neighbour that is not solid there
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => !solid(x + DIRS[d][0], z + DIRS[d][1], y));

// Entrance: the street (z = 0) face, the middle five cells, a door in the middle one
const ENT_X = [6, 10], DOOR_X = 8;
const inEntrance = (x, z) => z === 0 && x >= ENT_X[0] && x <= ENT_X[1];

const rel = (y) => (y - 1) % STOREY;   // 0 = spandrel / bulkhead, 1 and 2 = glass rows

// Warm light just inside a glass row (the room behind the glass is air; a light stands on the slab below it)
function warm(x, y, z) {
  if (rel(y) !== 1) return null;
  const facing = Object.values(DIRS).some(([dx, dz]) => solid(x + dx, z + dz, y) && exposed(x + dx, z + dz, y).length);
  if (!facing || (x * 7 + z * 13 + y * 5) % 5 !== 0) return null;
  if ((x + z + y) % 3 === 0) return ["glowstone"];
  if ((x + z + y) % 3 === 1) return ["lantern", { hanging: "false", waterlogged: "false" }];
  return ["shroomlight"];
}

function glazing(x, z, y, dirs) {
  const ns = dirs[0] === "n" || dirs[0] === "s";
  const conn = (dx, dz) => (solid(x + dx, z + dz, y) ? "true" : "false");
  return ns
    ? ["gray_stained_glass_pane", { east: conn(1, 0), west: conn(-1, 0), north: "false", south: "false", waterlogged: "false" }]
    : ["gray_stained_glass_pane", { north: conn(0, -1), south: conn(0, 1), east: "false", west: "false", waterlogged: "false" }];
}

// What stands at cell (x, z), layer y: [block, state?] or null for air
function blockAt(x, z, y) {
  if (y === 0) return ["polished_granite"];                         // plinth on every cell
  const t = top(x, z);
  const dirs = exposed(x, z, y);
  if (!dirs.length) {                                              // interior: floor slabs, roof deck, lights, air
    if (y === t - 1) return ["smooth_stone"];
    if (rel(y) === 0) return ["light_gray_concrete"];
    return warm(x, y, z);
  }
  if (y === t - 1) return ["smooth_quartz"];                       // cornice
  if (z === 0 && x >= ENT_X[0] - 1 && x <= ENT_X[1] + 1 && y === 4) return ["smooth_quartz_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" }];
  if (inEntrance(x, z) && (y === 2 || y === 3)) {
    if (x === DOOR_X) return ["iron_door", { facing: "north", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    return ["cyan_stained_glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }];
  }
  if (rel(y) === 0) return y === 1 ? ["polished_granite"] : ["light_gray_concrete"];   // base course / spandrel
  const along = dirs[0] === "n" || dirs[0] === "s" ? x : z;
  const pier = dirs.length > 1 || along % 2 === 0;                 // corners and every other bay
  return pier ? ["quartz_block"] : glazing(x, z, y, dirs);
}

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (let y = 0; y < top(x, z); y++) {
    const b = blockAt(x, z, y);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// Plant penthouse on the core: a 5 x 5 box, two layers of walls, a roof deck over
const PH = new Set();
for (let z = 9; z <= 13; z++) for (let x = 6; x <= 10; x++) if (inFp(x, z) && top(x, z) === CORE) PH.add(key(x, z));
for (const k of PH) {
  const [x, z] = k.split(",").map(Number);
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !PH.has(key(x + dx, z + dz)));
  for (let y = CORE; y <= CORE + 1; y++) if (edge) g.set(x, y, z, "quartz_block");
  g.set(x, CORE + 2, z, "smooth_stone");
}

// Rooftop cooling plant on the wings: two iron boxes on the wing roof, standing on its deck
for (let z = 24; z <= 25; z++) for (let x = 2; x <= 3; x++) if (inFp(x, z) && top(x, z) === WING) g.set(x, WING, z, "iron_block");

const info = g.save(`${DIR}/DC76563.nbt`);
console.log(JSON.stringify(info));
