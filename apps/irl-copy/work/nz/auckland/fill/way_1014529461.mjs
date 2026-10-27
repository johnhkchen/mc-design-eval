// Auckland, Mt Eden side (way 1014529461): a three-storey 1920s-30s stripped-classical shop and office block.
// Red brick piers and infill on a stone plinth, cream plaster string courses and cornice, shopfront with a
// door on the downhill (south) face, a one-block-taller west wing, and a parapet with two plant units on the roof.
// Hollow: an air gap behind the glass, a floor slab per storey, no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1014529461.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => foot.has(key(x, z));

// Lidar roof heights are 14 or 15 with noise: take the majority of the 3x3 block so each tier is flat.
// The top block of a tier's roof slab sits one below its roof height.
function tierTop(x, z) {
  let n15 = 0, n14 = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inF(x + dx, z + dz)) continue;
    if (foot.get(key(x + dx, z + dz)).roof >= 15) n15++; else n14++;
  }
  return (n15 > n14 ? 15 : 14) - 1;
}

// Exposed faces in priority order: south (the downhill, street-facing side) first.
const FACES = [["s", 0, 1], ["n", 0, -1], ["e", 1, 0], ["w", -1, 0]];
const exposedFace = (x, z) => FACES.find(([, dx, dz]) => !inF(x + dx, z + dz))?.[0] ?? null;

const g = new Voxels([10, 28, 10]);

const PLINTH = "stone_bricks", BASE = "polished_andesite", BRICK = "bricks", TRIM = "white_concrete";
const FLOOR = "smooth_stone", GLASS = "glass_pane";

// Glass panes connect along the wall they sit in.
const paneState = (face) => (face === "s" || face === "n" ? { east: "true", west: "true" } : { north: "true", south: "true" });

const glowAt = [];   // warm lights behind the front glass, placed after the shell

for (const [k, { ground }] of foot) {
  const [x, z] = k.split(",").map(Number);
  const T = tierTop(x, z);                        // top block of the roof slab at this cell
  const face = exposedFace(x, z);

  // Foundation and plinth: solid from y 0 up to the storey base (2), under every cell whatever its ground.
  for (let y = 0; y < 2; y++) g.set(x, y, z, PLINTH);

  if (!face) {
    // Interior cell: floor slabs at each storey line and the roof slab; air between.
    g.set(x, 2, z, FLOOR);
    g.set(x, 6, z, FLOOR);
    g.set(x, 10, z, FLOOR);
    g.set(x, T, z, FLOOR);
    continue;
  }

  // Facade cell. Along the face, every third cell is a brick pier; the rest hold glass between cream bands.
  const u = face === "s" || face === "n" ? x : z;
  const pier = u % 3 === 0;
  const front = face === "s";
  const door = front && u === 4;
  const pane = paneState(face);

  g.set(x, 2, z, BASE);                           // base course on the plinth

  // Storey 1, y 3 to 5: shopfront (sill, glass, transom); the door on the front.
  for (let y = 3; y <= 5; y++) {
    if (pier) g.set(x, y, z, BRICK);
    else if (y === 3) g.set(x, y, z, BASE);
    else if (y === 4) g.set(x, y, z, GLASS, pane);
    else g.set(x, y, z, TRIM);
  }
  if (door) {
    g.set(x, 3, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 4, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 5, z, "lantern", { hanging: "true", waterlogged: "false" });   // lamp over the entrance
  }
  g.set(x, 6, z, TRIM);                           // string course between storeys one and two

  // Storey 2, y 7 to 9: glass with a cream head.
  for (let y = 7; y <= 9; y++) {
    if (pier) g.set(x, y, z, BRICK);
    else if (y === 9) g.set(x, y, z, TRIM);
    else g.set(x, y, z, GLASS, pane);
  }

  g.set(x, 10, z, TRIM);                          // string course between two and three

  // Storey 3, y 11 to 12, then the cornice at the roof top; a taller tier keeps brick one course below its cornice.
  for (let y = 11; y <= T; y++) {
    if (y === T) g.set(x, y, z, TRIM);
    else if (pier || y === 13) g.set(x, y, z, BRICK);
    else g.set(x, y, z, GLASS, pane);
  }

  g.set(x, T + 1, z, TRIM);                       // parapet on the outer ring

  // Warm light behind some front windows, in the air gap just inside the glass.
  if (front && !pier && !door && u % 4 === 2) glowAt.push([x, 7, z - 1]);
}

const interior = (x, z) => inF(x, z) && inF(x + 1, z) && inF(x - 1, z) && inF(x, z + 1) && inF(x, z - 1);
for (const [x, y, z] of glowAt) if (interior(x, z)) g.set(x, y, z, "glowstone");

// Roof plant: two units on the interior of the lower tier, set on the roof slab.
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) {
  if (inF(x, z) && tierTop(x, z) === 13 && exposedFace(x, z) === null) g.set(x, 14, z, "light_gray_concrete");
}

g.save(`${DIR}/way_1014529461.nbt`);
