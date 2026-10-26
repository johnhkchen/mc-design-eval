// 1425 N St NW (Residential-Apartment-Elevator), 18 x 16 footprint, built as a 1920s red-brick apartment block:
// a stone base, a commercial-scale lobby storey on the street (z 15) face, three brick floors with a calcite string course
// and cornice, a stepped penthouse setback (roof 13) and a small crown (roof 14) on the lidar's central mass.
// Storeys are two to three blocks at 0.42 blocks/m (a 1920s storey is about 3 m, so 1.3 blocks is rounded up to make a window row
// and a floor slab read). Each row stands on the one below; no interiors beyond an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86754.cells.json", "utf8"));
const NX = 18, NZ = 16;
const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => F.has(key(x, z));

// Tier sets from the lidar: smoothed roof (3x3 median) >= 13 is the penthouse block; >= 14 inside it, bounded by it, is the crown.
const smooth = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) v.push(F.get(key(x + dx, z + dz)).roof);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const inB = (x, z) => inF(x, z) && smooth(x, z) >= 13;
const inC = (x, z) => inB(x, z) && smooth(x, z) >= 14 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inB(x + dx, z + dz));

// A cell is on a tier's outer face when a side neighbour is outside that tier.
const edgeSides = (inside, x, z) => {
  const s = [];
  if (!inside(x, z - 1)) s.push("N");
  if (!inside(x, z + 1)) s.push("S");
  if (!inside(x - 1, z)) s.push("W");
  if (!inside(x + 1, z)) s.push("E");
  return s;
};
// Along a face, a pier every third bay, windows between; a corner (two faces) is always a pier.
const facePattern = (sides, x, z) => {
  if (sides.length >= 2) return "pier";
  const idx = sides[0] === "N" || sides[0] === "S" ? x : z;
  return idx % 3 === 0 ? "pier" : "window";
};
// The cell inward of a window's face (its interior air, behind the glass) for a light.
const inward = (sides, x, z) => {
  if (sides.length !== 1) return null;
  return { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[sides[0]];
};

const g = new Voxels([NX, 26, NZ]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// The street front: a lobby door on the z = 15 face, a stair-stepped canopy over it.
const DOOR_X = 9, DOOR_Z = 15;
const isEntrance = (x, z) => z === DOOR_Z && (x === DOOR_X);
const isCanopy = (x, z) => z === DOOR_Z && (x === DOOR_X - 1 || x === DOOR_X || x === DOOR_X + 1);

// --- main body: footprint F, base y0, storeys 1-2 (lobby), 4-5, 7-8; floor slabs y3, y6, y9; cornice cap y10 (roof 11)
const LIGHT_LOBBY = new Set(), LIGHT_F2 = new Set(), LIGHT_F3 = new Set();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const sides = edgeSides(inF, x, z), perim = sides.length > 0, kind = perim ? facePattern(sides, x, z) : null;

  // base course, fills under every cell from y0 (the lowest ground); downhill cells just start here
  put(x, 0, z, "stone_bricks");

  // ground storey: lobby glass and calcite piers; the door sits in the street face
  for (const y of [1, 2]) {
    if (!perim) continue;
    if (isEntrance(x, z)) { put(x, y, z, "oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isCanopy(x, z)) { put(x, y, z, "calcite"); continue; }
    if (kind === "pier") put(x, y, z, "calcite");
    else put(x, y, z, "glass_pane");
  }

  // floor slabs: string course outside (calcite), floor inside (smooth stone)
  for (const y of [3, 6, 9]) {
    if (y === 3 && isCanopy(x, z)) { put(x, y, z, "stone_brick_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" }); continue; }
    put(x, y, z, perim ? "calcite" : "smooth_stone");
  }

  // upper floors: window grids over brick, air behind the glass
  for (const [y0, y1] of [[4, 5], [7, 8]]) {
    for (const y of [y0, y1]) {
      if (!perim) continue;
      if (kind === "pier") put(x, y, z, "calcite");
      else if (kind === "window") put(x, y, z, "glass_pane");
      else put(x, y, z, "bricks");
    }
  }

  // warm lights behind some panes (glowstone on the interior cell inward of the glass, on the floor slab)
  if (perim && kind === "window") {
    const inn = inward(sides, x, z);
    if (inn && inF(inn[0], inn[1]) && !edgeSides(inF, inn[0], inn[1]).length) {
      if ((x + z) % 5 === 0) { put(inn[0], 1, inn[1], "glowstone"); LIGHT_LOBBY.add(key(x, z)); }
      if ((x + 2 * z) % 7 === 0) { put(inn[0], 4, inn[1], "glowstone"); LIGHT_F2.add(key(x, z)); }
      if ((2 * x + z) % 9 === 0) { put(inn[0], 7, inn[1], "shroomlight"); LIGHT_F3.add(key(x, z)); }
    }
  }

  // cornice cap: roof deck over the whole footprint (interior tar roof, calcite edge), the base for the setbacks
  put(x, 10, z, perim ? "calcite" : "gray_concrete");
  // a continuous cornice band on the outer edge of the main roof only (the penthouse rises from the inside)
  if (perim && !inB(x, z)) put(x, 11, z, "calcite");
}

// --- the penthouse tier: B, a window row at y11 on a cap at y12 (roof 13); the crown C, one solid row at y13 (roof 14)
const Bcells = cells.filter(([x, z]) => inB(x, z)).map(([x, z]) => [x, z]);
for (const [x, z] of Bcells) {
  const sides = edgeSides(inB, x, z), perim = sides.length > 0, kind = perim ? facePattern(sides, x, z) : null;
  if (perim) {
    if (kind === "pier") put(x, 11, z, "calcite");
    else put(x, 11, z, "glass_pane");
  }
  put(x, 12, z, perim ? "calcite" : "gray_concrete");
  if (perim && kind === "window" && (x + z) % 4 === 0) {
    const inn = inward(sides, x, z);
    if (inn && inB(inn[0], inn[1]) && !edgeSides(inB, inn[0], inn[1]).length) put(inn[0], 11, inn[1], "shroomlight");
  }
}
for (const [x, z] of Bcells) {
  if (!inC(x, z)) continue;
  put(x, 13, z, edgeSides(inC, x, z).length ? "calcite" : "stone_bricks");
}

// roof equipment: a stair-and-plant bulkhead on the wing's flat roof
for (const [x, z] of [[9, 4], [10, 4], [9, 5], [10, 5]]) { put(x, 11, z, "stone_bricks"); put(x, 12, z, "stone_bricks"); }

const counts = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86754.nbt");
console.log(JSON.stringify({ ...counts, penthouse: Bcells.length, crown: cells.filter(([x, z]) => inC(x, z)).length, lights: LIGHT_LOBBY.size + LIGHT_F2.size + LIGHT_F3.size }));
