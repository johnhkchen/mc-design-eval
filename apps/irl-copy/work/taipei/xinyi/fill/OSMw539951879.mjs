import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951879";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([21, 23, 18]);

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Outward directions: [name, dx, dz]
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const missingFaces = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));
const isPerimeter = (x, z) => missingFaces(x, z).length > 0;

// Door: on the south face, the perimeter cell nearest the middle of the frontage
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!has(x, z + 1) && isPerimeter(x, z)) {
      const d = Math.abs(x - 10);
      if (d < best) { best = d; doorCell = [x, z]; }
    }
  }
}

// Storey plan relative to each cell's ground b:
// b       base course (stone bricks)
// b+1..3  shopfront glass with white pillars / door
// b+4     ground-floor lintel band
// b+5     floor slab (light gray)
// b+6     sill/head band
// b+7..8  upper windows with white pillars
// b+9     head band
// b+10    roof slab / cornice
// b+11    parapet (white)
for (const [x, z, gr] of cells) {
  const b = gr;

  // Foundation fill and base course
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone");
  g.set(x, b, z, "stone_bricks");

  // Floor slab and roof slab across the whole footprint
  g.set(x, b + 5, z, "light_gray_concrete");
  g.set(x, b + 10, z, "light_gray_concrete");

  const faces = missingFaces(x, z);
  if (faces.length === 0) {
    // Interior cell: air gap behind the walls, roof equipment on some cells
    if (x >= 8 && x <= 12 && z >= 6 && z <= 11 && b + 13 < 23) {
      // Stair and lift core rising above the parapet line
      for (let y = b + 11; y <= b + 13; y++) g.set(x, y, z, "white_concrete");
    } else if (((x * 7 + z * 3) % 13) === 0 && b + 11 < 23) {
      g.set(x, b + 11, z, "iron_block");
    }
    continue;
  }

  // Perimeter cell: walls, glazing, parapet
  const isCorner = faces.length >= 2;
  const [, fdx, fdz] = faces[0];
  const t = fdx !== 0 ? z : x; // coordinate along the face

  // Ground floor walls b+1..b+3
  for (let y = b + 1; y <= b + 3; y++) {
    if (isCorner) g.set(x, y, z, "white_concrete");
    else if (t % 3 === 0) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "glass_pane");
  }
  g.set(x, b + 4, z, "light_gray_concrete"); // lintel band

  // Upper walls b+6..b+9
  g.set(x, b + 6, z, "light_gray_concrete");
  for (let y = b + 7; y <= b + 8; y++) {
    if (isCorner || t % 3 === 0) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "glass_pane");
  }
  g.set(x, b + 9, z, "light_gray_concrete");

  // Parapet
  if (b + 11 < 23) g.set(x, b + 11, z, "white_concrete");

  // Entrance door on the south frontage
  if (doorCell && doorCell[0] === x && doorCell[1] === z) {
    g.set(x, b + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    g.set(x, b + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    g.set(x, b + 3, z, "white_concrete");
  }

  // Warm light behind selected upper windows
  if (!isCorner && t % 6 === 1) {
    const [, dx, dz] = faces[0];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !isPerimeter(ix, iz) && b + 7 < 23) {
      g.set(ix, b + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
