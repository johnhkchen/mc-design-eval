// Parkside Hotel & Apartments, Auckland (way 162319861): a 1980s precast-concrete hotel-apartment slab on a basalt plinth,
// 13 storeys of 4 blocks (floor lines at y = 4k) under a parapet, 55 blocks to the top of the coping. Lidar roofs read
// 53 to 55 across the whole footprint with no real step, so they are smoothed to one flat tier: a single slab on a plinth
// with no setbacks (the lidar records none). The footprint's ground runs 0 (NE, the street side) to 7 (SW), so the
// plinth shows as foundation on the uphill side and the downhill side carries the extra storeys.
// The facade is a 1-block shell: the outer ring of footprint cells carries a string course at every floor line, glass
// windows in bays of 2 with a white concrete pier every 3 blocks, a head course above each window row, and a white
// parapet with a light-grey coping. Behind some windows a glowstone sits in the air gap, on the floor slab. The
// ground storey is a shopfront with a recessed dark-oak entrance on the east face. Interiors are air with one floor slab
// per storey (the roof deck at y 52) and a few roof plant boxes. A canopy is not built: the module's box ends at the
// footprint's edge, so nothing can project outside it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162319861.cells.json", "utf8"));
const X = 39, Y = 67, Z = 38;
const FOUND = "polished_andesite", SHELL = "white_concrete", BAND = "light_gray_concrete", GLASS = "light_blue_stained_glass_pane";
const SLAB = "white_concrete", ROOF = "gray_concrete", PLANT = "light_gray_concrete";
const TOP = 54;           // the coping's layer: the top of the parapet is 55 blocks above y 0
const DECK = 52;          // the roof deck (also the top floor slab): 4 x 13
const g = new Voxels([X, Y, Z]);

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const foot = (x, z) => ground.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter(d => !foot(x + DIRS[d][0], z + DIRS[d][1]));
const ring = (x, z) => exposed(x, z).length > 0;

// the entrance: east face, ground 0, cell z = 2 (the door sits in the bay, flanked by piers)
const DOOR = { x: 38, z: 2 };

for (const [x, z, gr] of cells) {
  const faces = exposed(x, z);
  // u runs along the face the cell is on: x for a north or south face, z for east or west
  const u = faces.includes("N") || faces.includes("S") ? x : z;
  if (!faces.length) {
    // interior: plinth under the floor, the ground slab, then one slab per storey up to the roof deck
    for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
    const floorStart = Math.ceil(gr / 4) * 4;
    for (let y = gr; y < floorStart; y++) g.set(x, y, z, FOUND);
    for (let y = floorStart; y <= DECK; y += 4) g.set(x, y, z, y === DECK ? ROOF : SLAB);
    continue;
  }
  // the foundation under the wall, from y 0 to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  const pierOrGlass = u % 3 === 0 ? SHELL : GLASS;
  for (let y = gr; y <= TOP; y++) {
    let b;
    if (y === gr) b = FOUND;                          // base course on the ground
    else if (y === TOP) b = BAND;                     // light-grey coping
    else if (y >= DECK) b = SHELL;                    // parapet
    else if (y < 4) b = y === 3 ? BAND : pierOrGlass; // ground storey: shopfront glass, fascia on top
    else if (y % 4 === 0) b = BAND;                   // floor-line string course
    else if (y % 4 === 3) b = SHELL;                  // head course above each window row
    else b = pierOrGlass;                             // window rows: glass between piers
    g.set(x, y, z, b);
  }
}

// the entrance: a dark-oak door (lower and upper halves) with piers either side, under a black fascia
const { x: dx, z: dz } = DOOR;
g.set(dx, 1, dz, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx, 2, dz, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const zz of [dz - 1, dz + 1]) for (const yy of [1, 2]) g.set(dx, yy, zz, SHELL);
for (const zz of [dz - 1, dz, dz + 1]) g.set(dx, 3, zz, "black_concrete");

// warm light: a glowstone in the air gap behind some window glass, standing on the floor slab
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const faces = exposed(x, z);
  if (!faces.length) continue;
  const inX = x - DIRS[faces[0]][0], inZ = z - DIRS[faces[0]][1];
  if (!foot(inX, inZ) || ring(inX, inZ)) continue;
  const u = faces.includes("N") || faces.includes("S") ? x : z;
  for (let y = 5; y < DECK; y += 4) {
    if (u % 3 === 0) continue;                       // a pier, not a window
    if ((x * 5 + z * 7 + y * 3) % 10 !== 0) continue;
    if (y - 1 < Math.ceil(ground.get(`${inX},${inZ}`) / 4) * 4) continue;   // needs the floor slab under it
    g.set(inX, y, inZ, "glowstone");
  }
}

// roof plant: 3 x 2 boxes on the deck, only where the whole box is interior
for (let x = 4; x < X - 3; x += 7) for (let z = 3; z < Z - 2; z += 6) {
  const box = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) box.push([x + i, z + j]);
  if (box.every(([bx, bz]) => foot(bx, bz) && !ring(bx, bz))) for (const [bx, bz] of box) g.set(bx, DECK + 1, bz, PLANT);
}

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162319861.nbt"));
