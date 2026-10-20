import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034012";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise 1980s-style Xinyi shophouse: two storeys, shopfront at ground,
// white tiled walls, grey concrete frames, flat roof with parapet.
const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const FRAME = "gray_concrete";
const CORNICE = "smooth_stone";
const GLASS = "glass_pane";
const FOUND = "stone_bricks";
const ROOF_Y = 10;     // roof deck / cornice level
const PARAPET_Y = 11;  // top of parapet, about 11 blocks above lowest ground
const FLOOR2_Y = 5;    // storey line between ground and upper floor

const G = new Map();
for (const [x, z, g] of cells) G.set(`${x},${z}`, g);
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([7, 23, 23]);

// Exterior faces: a neighbour outside the footprint means the cell is perimeter.
const FACES = [
  { name: "west",  dx: -1, dz: 0, facing: "west",  inX: 1,  inZ: 0,  along: "z" },
  { name: "east",  dx: 1,  dz: 0, facing: "east",  inX: -1, inZ: 0,  along: "z" },
  { name: "north", dx: 0,  dz: -1, facing: "north", inX: 0, inZ: 1,  along: "x" },
  { name: "south", dx: 0,  dz: 1,  facing: "south", inX: 0, inZ: -1, along: "x" },
];

function exteriorFaces(x, z) {
  return FACES.filter((f) => !has(x + f.dx, z + f.dz));
}

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
}

// Walls, floor slabs, roof deck, storey lines and windows.
for (const [x, z, gr] of cells) {
  const faces = exteriorFaces(x, z);
  const perimeter = faces.length > 0;

  for (let y = gr; y <= ROOF_Y; y++) {
    if (!perimeter) {
      // Interior: only floor slabs and the roof deck, air otherwise.
      if (y === FLOOR2_Y || y === ROOF_Y) g.set(x, y, z, CORNICE);
      continue;
    }

    if (y === ROOF_Y) {
      g.set(x, y, z, CORNICE); // roof edge / cornice
      continue;
    }

    const f = faces[0];
    const a = f.along === "z" ? z : x;
    const window = a % 3 !== 0; // pillars every third cell

    if (y === FLOOR2_Y) {
      g.set(x, y, z, TRIM); // storey line
      continue;
    }

    if (y < FLOOR2_Y) {
      // Ground floor: shopfront glass with frames, lintel at y = 4.
      if (y === 4) g.set(x, y, z, FRAME);
      else if (window && y >= 1) g.set(x, y, z, GLASS);
      else g.set(x, y, z, FRAME);
      continue;
    }

    // Upper floor: sill, glass, head.
    if (y === 6) g.set(x, y, z, window ? FRAME : WALL);
    else if (y === 7 || y === 8) g.set(x, y, z, window ? GLASS : WALL);
    else if (y === 9) g.set(x, y, z, window ? FRAME : WALL);
  }

  // Parapet on perimeter cells.
  if (perimeter) g.set(x, PARAPET_Y, z, TRIM);
}

// Warm light behind some upper-floor windows (glowstone in the air gap).
for (const [x, z, gr] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length === 0) continue;
  const f = faces[0];
  const a = f.along === "z" ? z : x;
  if (a % 6 !== 1) continue;
  const ix = x + f.inX;
  const iz = z + f.inZ;
  if (!has(ix, iz)) continue;
  if (7 < gr) continue;
  g.set(ix, 7, iz, "glowstone");
}

// Shopfront entrance on the west face at z = 11.
{
  const x = 0, z = 11;
  const gr = G.get(`${x},${z}`);
  if (gr !== undefined && gr <= 3) {
    g.set(x, gr, z, "dark_oak_door", {
      facing: "west", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "west", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Lantern-lit entrance: warm light either side of the door, inside the glass.
    if (has(1, 11)) g.set(1, gr + 2, 11, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Rooftop plant: a few AC/equipment boxes on the roof deck (interior cells only).
for (const [x, z] of [[2, 5], [4, 5], [2, 15], [4, 17]]) {
  if (!has(x, z)) continue;
  const gr = G.get(`${x},${z}`);
  if (gr === undefined || gr > PARAPET_Y) continue;
  if (exteriorFaces(x, z).length > 0) continue;
  g.set(x, PARAPET_Y, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
