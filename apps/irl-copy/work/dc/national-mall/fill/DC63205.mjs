// 801 Rhode Island Ave NW: a 1920s-30s red-brick elevator apartment block on Logan Circle's edge.
// Brick body on a stone base, limestone string courses and cornice, glass in bays between brick piers,
// a central elevator penthouse (the lidar's 12-block cluster) with an overrun. Every floor slab is solid
// across the footprint; windows sit on a hollow shell with an air gap behind them, so nothing is furnished.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63205.cells.json", "utf8"));
const X = 22, Z = 8, Y = 24;
const FP = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFP = (x, z) => FP.has(`${x},${z}`);

// lidar smoothing: the body is one flat tier at 10; the 12-block cluster (x 7..12, z 2..5) is the elevator penthouse
const CORE = new Set();
for (const [x, z, , roof] of cells) if (roof >= 12) CORE.add(`${x},${z}`);
for (let x = 7; x <= 12; x++) for (let z = 2; z <= 5; z++) if (inFP(x, z)) CORE.add(`${x},${z}`);
const CORE_TOP = 12, BODY_TOP = 10;

const B = new Map();                       // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, [block, state]);
const AIR = "air";

// Which sides of a cell face outside its tier, and whether the wall there is a brick pier (corners and every third bay).
function faces(x, z, set) {
  return { n: !set.has(`${x},${z - 1}`), s: !set.has(`${x},${z + 1}`), w: !set.has(`${x - 1},${z}`), e: !set.has(`${x + 1},${z}`) };
}
function isPier(x, z, set) {
  const f = faces(x, z, set), zFace = f.n || f.s, xFace = f.w || f.e;
  if (zFace && xFace) return true;
  if (zFace) return x % 3 === 0;
  if (xFace) return z % 3 === 0;
  return false;
}
const isShell = (x, z, set) => { const f = faces(x, z, set); return f.n || f.s || f.w || f.e; };

// Body: rows 0..9. y0 base course + floor slab; y1,3,5,7 storeys of glass with brick piers (air behind);
// y2,4,6,8 floor slabs with a limestone string course on the face; y9 parapet ring; interior roof deck at y8.
for (const key of FP.keys()) {
  const [x, z] = key.split(",").map(Number);
  const shell = isShell(x, z, FP);
  const pier = isPier(x, z, FP);
  put(x, 0, z, shell ? "stone_bricks" : "smooth_stone");
  for (const y of [1, 3, 5, 7]) if (shell) put(x, y, z, pier ? "bricks" : "glass_pane", {});
  for (const y of [2, 4, 6, 8]) put(x, y, z, shell ? "calcite" : "smooth_stone");
  if (shell) put(x, 9, z, "calcite");
  // the storey below each glass row has brick above the slab for the spandrel: piers already cover it
}

// Entrance: a double door in the centre of the front (z=0) in a limestone surround, with lanterns either side
for (const y of [1, 2]) for (const x of [8, 13]) put(x, y, 0, "calcite");
for (const x of [10, 11]) {
  put(x, 1, 0, "oak_door", { facing: "north", half: "lower", hinge: x === 10 ? "left" : "right", open: "false", powered: "false" });
  put(x, 2, 0, "oak_door", { facing: "north", half: "upper", hinge: x === 10 ? "left" : "right", open: "false", powered: "false" });
}
put(9, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
put(12, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
put(9, 1, 1, "lantern", { hanging: "true", waterlogged: "false" });   // hangs inside the lobby, from the ceiling slab at y2

// Warm light behind some glass: glowstone and shroomlight in the air gap behind the front bays
for (const y of [1, 3, 5]) for (const x of [4, 13, 16, 19]) {
  if (inFP(x, 1) && !CORE.has(`${x},1`) && !B.has(`${x},${y},1`)) put(x, y, 1, y === 3 ? "shroomlight" : "glowstone");
}

// Penthouse: rows 9 (walls, air behind glass), 10 (roof slab), 11 (elevator overrun, 2x2, top at 12)
for (const key of CORE) {
  const [x, z] = key.split(",").map(Number);
  const shell = isShell(x, z, CORE), pier = isPier(x, z, CORE);
  if (shell) put(x, 9, z, pier ? "bricks" : "glass_pane", {});
  put(x, 10, z, shell ? "calcite" : "smooth_stone");
}
for (const x of [9, 10]) for (const z of [3, 4]) put(x, 11, z, "bricks");

// Roof equipment: two condenser boxes on the body's roof deck (y9, on the y8 slab)
for (const x of [18, 19]) for (const z of [2, 3]) put(x, 9, z, "smooth_stone");

// Pane connections: a pane joins a neighbour that holds any block (brick, glass, slab, stone); open air does not
const PANE = "glass_pane";
const occupied = (x, y, z) => { const v = B.get(`${x},${y},${z}`); return v && v[0] !== AIR; };
for (const [k, [block]] of [...B]) {
  if (block !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  B.set(k, [PANE, {
    north: String(occupied(x, y, z - 1)), south: String(occupied(x, y, z + 1)),
    east: String(occupied(x + 1, y, z)), west: String(occupied(x - 1, y, z)), waterlogged: "false",
  }]);
}

const g = new Voxels([X, Y, Z]);
for (const [k, [block, state]] of B) {
  if (block === AIR) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state && Object.keys(state).length ? state : undefined);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63205.nbt");
console.log(`DC63205: ${B.size} placed, core ${CORE.size} cells`);
