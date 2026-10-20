import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988741";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Record: roof ~11 blocks above lowest ground, footprint 24 x 15.
// Read as a two-storey, early-2000s Xinyi commercial block: white cast-concrete
// frame, quartz storey bands, glass infill, shopfront on the ground storey,
// dark roof with parapet and rooftop plant.
const ROOF = 11;      // roof membrane level (absolute)
const CORNICE = 10;   // top band of the body
const FL1 = 5;        // first floor line

const WALL = "white_concrete";
const SPANDREL = "light_gray_concrete";
const BAND = "smooth_quartz";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const GLASS = "glass";
const SLAB = "light_gray_concrete";
const ROOFM = "gray_concrete";
const PLANT = "light_gray_concrete";

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const edge = (x, z) => DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));
const pillar = (x, z) => (x + z) % 3 === 0;

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Foundations, body, roof
for (const [x, z, gr] of cells) {
  // solid foundation from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, FOUND);

  const per = edge(x, z);

  if (!per) {
    // interior: floor slabs and roof only, air between (no interiors)
    if (FL1 > gr) put(x, FL1, z, SLAB);
    if (CORNICE > gr) put(x, CORNICE, z, SLAB);
    if (ROOF > gr) put(x, ROOF, z, ROOFM);
    continue;
  }

  // perimeter: facade
  for (let y = gr + 1; y <= CORNICE; y++) {
    let id;
    if (y === gr + 1) id = BASE;                       // base course
    else if (y === CORNICE || y === FL1) id = BAND;    // storey lines / cornice
    else if (y < FL1) {                                // ground storey: shopfront
      id = pillar(x, z) ? WALL : GLASS;
    } else {                                           // upper storey
      if (y === 6 || y === 9) id = pillar(x, z) ? WALL : SPANDREL;
      else id = pillar(x, z) ? WALL : GLASS;           // y 7, 8 windows
    }
    put(x, y, z, id);
  }

  // parapet and cap
  if (ROOF > gr) put(x, ROOF, z, WALL);
  if (ROOF + 1 > gr) put(x, ROOF + 1, z, BAND, undefined);
}

// Parapet cap slabs (bottom type so they sit on the parapet)
for (const [x, z, gr] of cells) {
  if (edge(x, z) && ROOF + 1 > gr) {
    put(x, ROOF + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm lights just inside some upper-storey windows
for (const [x, z, gr] of cells) {
  if (!edge(x, z)) continue;
  if (pillar(x, z)) continue;
  if (7 <= gr || (x + z) % 6 !== 1) continue;
  for (const [dx, dz] of DIRS) {
    const ix = x + dx, iz = z + dz;
    if (inFp(ix, iz) && !edge(ix, iz)) {
      put(ix, 7, iz, "lantern", { hanging: "false", waterlogged: "false" });
      break;
    }
  }
}

// Entrance: centre of the southern-most (max z) street face
let maxZ = -Infinity;
for (const [, z] of cells) if (z > maxZ) maxZ = z;
const doorXs = cells.filter(([, z]) => z === maxZ).map(([x]) => x).sort((a, b) => a - b);
const dx = doorXs[Math.floor(doorXs.length / 2)];
const dgr = gnd(dx, maxZ);
if (dgr !== undefined && dgr + 2 <= FL1 - 1) {
  put(dx, dgr + 1, maxZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dgr + 2, maxZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // canopy-style lintel over the door on the storey line
  put(dx, FL1 - 1, maxZ, BAND);
}

// Rooftop plant: two air-handling boxes with a low screen wall
const plantBoxes = [
  { x0: 4, x1: 6, z0: 4, z1: 5 },
  { x0: 16, x1: 18, z0: 9, z1: 10 },
];
for (const b of plantBoxes) {
  for (let x = b.x0; x <= b.x1; x++) {
    for (let z = b.z0; z <= b.z1; z++) {
      if (!inFp(x, z) || edge(x, z)) continue;
      const base = ROOF + 1;
      if (base <= gnd(x, z)) continue;
      put(x, base, z, PLANT);
      put(x, base + 1, z, PLANT);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
