// Way 291095422, Mt Eden / Eden Terrace side: a 1920s-30s stripped-classical commercial block, two storeys of red brick
// on a stone plinth, cream quartz piers, a smooth-stone string course and cornice, and a parapet. The lidar roof steps
// down to the east in two flat tiers (9, 8, 7 blocks), so the block reads as a main range with lower wings.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291095422.cells.json", "utf8"));

const W = 36, D = 37, H = 22;
const FLOOR = 2;                                   // ground-floor slab; below it the plinth and foundation
const UPPER = 5;                                   // first-floor slab, on the main range only
const PIER_EVERY = 4;                              // a quartz pier every fourth cell along each face

// footprint lookup, and the raw lidar roof and ground per cell
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);
const at = (x, z) => fp.get(`${x},${z}`);

// Smooth the roof: the median of each cell and its footprint neighbours, then three flat tiers (9 main, 8 and 7 wings).
const tier = new Map();
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [c.roof];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((dx || dz) && inFp(x + dx, z + dz)) vals.push(at(x + dx, z + dz).roof);
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  tier.set(key, m >= 9 ? 9 : m === 8 ? 8 : 7);
}
const roofAt = (x, z) => tier.get(`${x},${z}`);

// outward faces of a footprint cell: the sides whose neighbour is outside the footprint
const outward = (x, z) => {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
};
const isRing = (x, z) => outward(x, z).length > 0;
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const FACING = { N: "south", S: "north", W: "east", E: "west" };   // a door's facing: the direction it opens from outside in

// the entrance: the middle of the face with the most ring cells (the longest street front)
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const k of fp.keys()) { const [x, z] = k.split(",").map(Number); if (isRing(x, z)) for (const f of outward(x, z)) faceCount[f]++; }
const doorFace = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
const doorCells = [];
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isRing(x, z) && outward(x, z).length === 1 && outward(x, z)[0] === doorFace) doorCells.push([x, z]);
}
doorCells.sort((a, b) => (doorFace === "N" || doorFace === "S" ? a[0] - b[0] : a[1] - b[1]));
const [doorX, doorZ] = doorCells[doorCells.length >> 1];
const doorT = doorFace === "N" || doorFace === "S" ? doorX : doorZ;
const isDoorBay = (x, z) => outward(x, z).length === 1 && outward(x, z)[0] === doorFace && Math.abs((doorFace === "N" || doorFace === "S" ? x : z) - doorT) <= 1;

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

// pass 1: foundation, floor slabs and roof covers across the whole footprint (the interior is air, the shell is solid)
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  const R = roofAt(x, z);
  for (let y = 0; y < FLOOR; y++) put(x, y, z, "stone_bricks");
  put(x, FLOOR, z, "smooth_stone");                  // ground-floor slab
  if (R === 9) put(x, UPPER, z, "smooth_stone");     // first-floor slab on the main range
  put(x, R - 1, z, "stone");                         // roof cover (cornice on the shell, below)
}

// pass 2: the shell: brick walls, string courses, window rows, piers, cornice and parapet
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isRing(x, z)) continue;
  const R = roofAt(x, z);
  const faces = outward(x, z);
  const corner = faces.length > 1;                  // two outside sides meet here
  const face = faces[0];
  const t = face === "N" || face === "S" ? x : z;   // position along the face
  const pier = corner || t % PIER_EVERY === 0;
  const alongZ = face === "N" || face === "S";      // panes run along the face: connect east/west on N and S faces
  const pane = { north: !alongZ ? "true" : "false", south: !alongZ ? "true" : "false", east: alongZ ? "true" : "false", west: alongZ ? "true" : "false", waterlogged: "false" };
  for (let y = FLOOR + 1; y <= R - 1; y++) {
    if (y === UPPER) { put(x, y, z, "smooth_stone"); continue; }            // storey line
    if (y === R - 1) { put(x, y, z, "smooth_stone"); continue; }            // cornice
    const window = y === 3 || y === 4 || (R === 9 && (y === 6 || y === 7)); // two window rows per storey
    if (!window) { put(x, y, z, pier ? "quartz_block" : "bricks"); continue; }
    if (pier || (face && isDoorBay(x, z) && y <= 4)) { put(x, y, z, "quartz_block"); continue; }
    put(x, y, z, "glass_pane", pane);
  }
  if (R === 9) { put(x, 9, z, pier ? "quartz_block" : "stone_bricks"); }   // parapet
}

// the entrance: a door in the middle of the chosen face, with quartz jambs
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isRing(x, z) || !outward(x, z).includes(doorFace)) continue;
  if (x === doorX && z === doorZ) {
    const facing = FACING[doorFace];                // the way a player outside the door faces: inward
    put(x, 3, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 4, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// warm lights behind some windows: glowstone on the ground floor, shroomlight on the upper floor of the main range
let win = 0;
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isRing(x, z)) continue;
  const R = roofAt(x, z);
  const face = outward(x, z)[0];
  if (outward(x, z).length !== 1 || isDoorBay(x, z)) continue;
  const t = face === "N" || face === "S" ? x : z;
  if (t % PIER_EVERY === 0) continue;
  win++;
  const [dx, dz] = DIR[OPP[face]];                 // inward neighbour, behind the glass
  const ix = x + dx, iz = z + dz;
  if (!inFp(ix, iz) || isRing(ix, iz)) continue;
  if (win % 5 === 2) put(ix, 3, iz, "glowstone");
  if (R === 9 && win % 4 === 1) put(ix, 6, iz, "shroomlight");
}

// roof equipment on the main range: two plant boxes set off the parapet, on the roof cover
const roofPlant = [];
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (roofAt(x, z) !== 9 || isRing(x, z)) continue;
  if ([[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => inFp(a, b) && roofAt(a, b) === 9 && !isRing(a, b)))
    roofPlant.push([x, z]);
}
const plantSpots = [roofPlant[Math.floor(roofPlant.length * 0.3)], roofPlant[Math.floor(roofPlant.length * 0.75)]];
for (const p of plantSpots) if (p) for (const [a, b] of [[p[0], p[1]], [p[0] + 1, p[1]], [p[0], p[1] + 1], [p[0] + 1, p[1] + 1]]) put(a, 9, b, "iron_block");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291095422.nbt");
console.log(JSON.stringify({ door: { face: doorFace, x: doorX, z: doorZ }, faces: faceCount, tiers: { 9: [...tier.values()].filter((v) => v === 9).length, 8: [...tier.values()].filter((v) => v === 8).length, 7: [...tier.values()].filter((v) => v === 7).length }, ...stats }));
