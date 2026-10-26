// 8 x 12 block on the Mall's Federal Triangle side: a 1930s Neoclassical limestone office block (calcite walls on a granite
// base, a chiseled string course at each storey line, a smooth-stone cornice). Massing from the lidar roof: an H-plan with
// the two wings (north and south) at 8 blocks, a lower central link at 7, and a 10-block corner tower on the NE corner.
// Each region takes its mean lidar roof, so the tiers are flat. Three storeys of one-block glass rows fit the wings; the
// link has two. Every column is solid from y 0 to its tier top, so nothing floats; floor slabs sit on the walls, and the
// air behind the glass is the storey's room (lit by glowstone and shroomlight in some bays). Main door on the south face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC54791.cells.json`, "utf8"));

const STONE = "calcite", BASE = "polished_granite", FOUND = "stone_bricks", BAND = "chiseled_stone_bricks", CORNICE = "smooth_stone";
const FLOOR = "stone", GLASS = "glass_pane";

// the three regions of the H, each one flat tier: the mean of its lidar roof heights, rounded
const region = (x, z) => (x >= 6 && z <= 1 ? "tower" : z >= 3 && z <= 7 ? "link" : "wings");
const tier = {};
for (const name of ["tower", "link", "wings"]) {
  const rs = cells.filter(([x, z]) => region(x, z) === name).map(([, , , r]) => r);
  tier[name] = Math.round(rs.reduce((a, b) => a + b, 0) / rs.length);
}

const foot = new Map(cells.map(([x, z, g]) => [`${x},${z}`, { g, top: tier[region(x, z)] }]));
const inF = (x, z) => foot.has(`${x},${z}`);
// outward faces of a footprint cell: a neighbour outside the footprint
const faces = (x, z) => ({ n: !inF(x, z - 1), s: !inF(x, z + 1), w: !inF(x - 1, z), e: !inF(x + 1, z) });

// entrance: a pair of dark oak doors on the south face, two blocks tall, with a stone canopy over them
const DOOR_X = [3, 4], DOOR_Z = 11;
const CANOPY_X = [2, 3, 4, 5];

// window bays: piers and glass alternate across each face; the corners are piers
const bayGlass = (x, z, f) => (f.n || f.s ? [1, 2, 5, 6].includes(x) : z % 2 === 1);

const blocks = new Map();                                      // "x,y,z" -> [block, state]
const put = (x, y, z, b, s) => blocks.set(`${x},${y},${z}`, [b, s]);
const solid = (x, y, z) => blocks.has(`${x},${y},${z}`);

for (const [key, { g, top }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  const perim = f.n || f.s || f.w || f.e;
  const corner = [f.n, f.s, f.w, f.e].filter(Boolean).length > 1;
  for (let y = 0; y < top; y++) {
    if (y === 0) { put(x, y, z, g === 0 ? BASE : FOUND); continue; }     // foundation to the lidar ground, granite where the ground is lower
    if (!perim) {                                                         // inside: floor slabs and the roof deck; air between
      if (y === 1 || y === top - 1 || y % 2 === 1) put(x, y, z, FLOOR);
      continue;
    }
    if (x >= DOOR_X[0] && x <= DOOR_X[1] && z === DOOR_Z && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === DOOR_X[0] ? "left" : "right", open: "false", powered: "false",
      });
      continue;
    }
    if (y === 1) { put(x, y, z, BASE); continue; }                       // granite base course
    if (y === top - 1) { put(x, y, z, CORNICE); continue; }              // cornice and roof edge
    if (y % 2 === 1) { put(x, y, z, BAND); continue; }                   // storey line (string course)
    if (corner || !bayGlass(x, z, f)) { put(x, y, z, STONE); continue; }  // piers and corners
    put(x, y, z, GLASS);
  }
}

// the canopy over the entrance: upside-down stairs on the storey line above the door lintel
for (const x of CANOPY_X) put(x, 4, DOOR_Z, "stone_brick_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });

// warm light in the air behind some glass
for (const [x, y, z, b] of [
  [2, 2, 1, "glowstone"], [5, 2, 1, "glowstone"], [2, 4, 1, "shroomlight"],
  [5, 6, 10, "glowstone"], [2, 2, 10, "shroomlight"], [6, 8, 1, "glowstone"],
]) put(x, y, z, b);

// roof plant: a two-block high box on the north wing's roof
for (const y of [8, 9]) for (const x of [3, 4]) put(x, y, 1, "light_gray_concrete");

// glass panes join the solid or glass neighbours in their wall plane, as placed by hand
for (const [k, [b]] of blocks) {
  if (b !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const f = faces(x, z);
  const ns = (f.n || f.s) && !(f.w || f.e);      // on a north/south-facing wall, the plane runs east-west
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (ns) { state.east = String(solid(x + 1, y, z)); state.west = String(solid(x - 1, y, z)); }
  else { state.north = String(solid(x, y, z - 1)); state.south = String(solid(x, y, z + 1)); }
  blocks.set(k, [GLASS, state]);
}

const g = new Voxels([8, 21, 12]);
for (const [k, [b, s]] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, s);
}
const out = `${DIR}/DC54791.nbt`;
const stats = g.save(out);
console.log(`tiers ${JSON.stringify(tier)}; ${stats.blocks} blocks, ${stats.palette} palette -> ${out}`);
