import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${base}/OSMw831858850.cells.json`, "utf8"));

const W = 24, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Outward normals: [dx, dz, name]
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [1, 0, "east"],
  [-1, 0, "west"],
];

// Mid-rise (2 storeys of ~5 blocks + parapet), 1990s Xinyi commercial:
// white tiled concrete facade, smooth quartz piers, blue-tinted glass,
// stone base and cornice, shopfront glazing at ground level.
const ROOF_BASE = 10;      // parapet / roof surface level (top of body at 11)
const STOREY_LINE = 5;     // floor slab / string course between storeys
const LINTEL = 4;          // top of ground-storey glazing
const SPANDREL = 9;        // spandrel under roof parapet

const WALL = "white_concrete";
const PIER = "smooth_quartz";
const GLASS_UP = "light_blue_stained_glass_pane";
const GLASS_GF = "glass_pane";
const BASE_COURSE = "polished_granite";
const FOUNDATION = "stone_bricks";
const CORNICE = "smooth_stone";
const ROOF_INT = "gray_concrete";

// Facade block at absolute height y for a perimeter cell, u = position along face
function facadeBlock(y, roofY, u, isGroundStorey) {
  if (y === STOREY_LINE) return CORNICE;
  if (y === roofY - 1 || y === SPANDREL) return WALL;
  if (isGroundStorey) {
    if (y === LINTEL) return WALL;
    return u % 3 === 0 ? PIER : GLASS_GF;
  }
  if (y >= 6 && y <= 8) return u % 3 === 0 ? PIER : GLASS_UP;
  return WALL;
}

// Pass 1: foundations, floor slabs, walls, roof
for (const [x, z, gr] of cells) {
  const gc = Math.round(gr);
  const roofY = Math.max(ROOF_BASE, gc + 1);
  const sides = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const perimeter = sides.length > 0;
  const [sdx, sdz] = sides[0] ? [sides[0][0], sides[0][1]] : [0, 0];
  const u = sdz !== 0 ? x : z;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, FOUNDATION);

  // Floor at ground level
  g.set(x, gc, z, perimeter ? BASE_COURSE : "smooth_stone");

  // Walls / interior floor slabs
  for (let y = gc + 1; y < roofY; y++) {
    if (!perimeter) {
      if (y === STOREY_LINE) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const isGround = y <= LINTEL;
    g.set(x, y, z, facadeBlock(y, roofY, u, isGround));
  }

  // Roof surface / parapet
  g.set(x, roofY, z, perimeter ? CORNICE : ROOF_INT);
}

// Pass 2: warm lights behind upper and ground-storey glazing
for (const [x, z, gr] of cells) {
  const gc = Math.round(gr);
  const roofY = Math.max(ROOF_BASE, gc + 1);
  const sides = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (!sides.length) continue;
  const [dx, dz] = sides[0];
  const u = dz !== 0 ? x : z;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz)) continue;
  if (DIRS.some(([ex, ez]) => !has(ix + ex, iz + ez))) continue; // inward cell must be interior
  if (u % 6 !== 1) continue;
  for (const y of [2, 7]) {
    if (y <= gc || y >= roofY - 1) continue;
    if (y === 2 && gc + 1 > LINTEL) continue;
    if (y === 2 && u % 3 === 0) continue;
    if (y === 7 && u % 3 === 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Pass 3: entrance on the north (min z) face, centred
{
  let minZ = Infinity, maxX = -Infinity, minX = Infinity;
  for (const [x, z] of cells) {
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    minX = Math.min(minX, x);
  }
  const northRow = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
  const doorX = northRow[Math.floor(northRow.length / 2)];
  const gc = Math.round(gAt(doorX, minZ));
  if (gc + 2 <= LINTEL) {
    g.set(doorX, gc + 1, minZ, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(doorX, gc + 2, minZ, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Glazed transom above the door, under the lintel line
    // (lintel at LINTEL stays wall; the door sits under it)
  }
}

// Pass 4: rooftop penthouse with cap and lightning rod, set in from the parapet
for (let x = 9; x <= 14; x++) {
  for (let z = 6; z <= 11; z++) {
    if (!has(x, z)) continue;
    const gc = Math.round(gAt(x, z));
    const roofY = Math.max(ROOF_BASE, gc + 1);
    const edge = x === 9 || x === 14 || z === 6 || z === 11;
    for (let y = roofY + 1; y <= roofY + 2; y++) {
      g.set(x, y, z, edge ? WALL : "air");
    }
    g.set(x, roofY + 3, z, "stone_bricks");
  }
}
{
  const gc = Math.round(gAt(11, 8) ?? 0);
  const roofY = Math.max(ROOF_BASE, gc + 1);
  if (has(11, 8)) g.set(11, roofY + 4, 8, "lightning_rod");
}

g.save(`${base}/OSMw831858850.nbt`);
