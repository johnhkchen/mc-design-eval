import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 25 x 12 footprint, roof ~50 blocks above lowest ground.
// Read as a ~10-storey, 1990s-2000s pale-tile office/commercial block with
// blue-glass bands, a cornice and parapet, a shopfront ground storey,
// a framed street entrance, and a rooftop plant penthouse with a mast.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw352791655.cells.json", "utf8"));

const W = 25, H = 62, D = 12;
const ROOF_Y = 50;      // roof deck; parapet sits on top of the cornice
const TOP_BODY = 49;    // last wall row of the 10th storey (cornice row)
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(key(x, z), gr);
const has = (x, z) => occ.has(key(x, z));

// Neighbour directions: face name, dx, dz (empty neighbour on that side = face)
const DIRS = [
  { name: "N", dx: 0, dz: -1 },
  { name: "S", dx: 0, dz: 1 },
  { name: "W", dx: -1, dz: 0 },
  { name: "E", dx: 1, dz: 0 },
];

const isPerim = (x, z) => DIRS.some(d => !has(x + d.dx, z + d.dz));

// Which exterior face a perimeter cell carries (first empty side in order N,S,W,E)
const faceOf = new Map();
const perimCells = [];
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const f = DIRS.find(d => !has(x + d.dx, z + d.dz));
  faceOf.set(key(x, z), f);
  perimCells.push([x, z, gr]);
}

// Entrance: middle-most N-facing perimeter cell
const nFaces = perimCells
  .filter(([x, z]) => faceOf.get(key(x, z))?.name === "N")
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = nFaces.length ? nFaces[Math.floor(nFaces.length / 2)] : -1;
const doorZ = nFaces.length ? 0 : -1;

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs per storey (interior air is kept between them)
for (const [x, z, gr] of cells) {
  g.set(x, gr, z, "smooth_stone");
  for (let s = 1; s <= 9; s++) {
    const fy = 5 * s;
    if (fy > gr && fy < ROOF_Y) g.set(x, fy, z, "smooth_stone");
  }
  // Roof deck over the whole footprint
  g.set(x, ROOF_Y, z, "light_gray_concrete");
}

// 3. Facade on perimeter cells, from each cell's ground up to the cornice
for (const [x, z, gr] of perimCells) {
  const face = faceOf.get(key(x, z));
  // Along-face coordinate for bay rhythm
  const u = face.name === "N" || face.name === "S" ? x : z;
  // Inward neighbour (opposite the face), used for interior lights
  const ix = x - face.dx, iz = z - face.dz;
  const inwardOpen = has(ix, iz);

  const isDoor = face.name === "N" && x === doorX && z === doorZ;
  // Entrance surround: quartz jambs flanking the door on the ground storey
  const isJamb = face.name === "N" && z === doorZ && Math.abs(x - doorX) === 1 && doorX >= 0;

  for (let y = gr; y <= TOP_BODY; y++) {
    const s = Math.floor(y / 5);
    const rel = y % 5;
    const ground = s === 0;

    // Door on the ground storey, framed by jambs and a lintel
    if (isDoor && (y === gr || y === gr + 1) && gr + 1 <= 4) {
      const half = y === gr ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoor && y === gr + 2 && gr + 1 <= 4) {
      g.set(x, y, z, "smooth_quartz");   // lintel over the door
      continue;
    }
    if (isJamb && y >= gr && y <= gr + 2 && gr + 1 <= 4) {
      g.set(x, y, z, "polished_andesite"); // entrance jamb
      continue;
    }

    let block;
    if (s === 9 && rel === 4) {
      block = "smooth_quartz";                       // cornice
    } else if (rel === 0) {
      block = "smooth_quartz";                       // storey belt course
    } else if (rel === 4) {
      block = "white_concrete";                      // spandrel
    } else {
      // window band rows 1..3
      if (u % 3 === 0) {
        // mullion; every sixth bay is a deeper pilaster for relief
        block = u % 6 === 0 ? "light_gray_concrete" : "white_concrete";
      } else {
        block = ground ? "cyan_stained_glass" : "light_blue_stained_glass";
      }
    }
    g.set(x, y, z, block);

    // Warm light behind some glass panes
    if (block.endsWith("stained_glass") && rel === 2 && s % 2 === 0 && u % 6 === 1 && inwardOpen && y !== gr) {
      const lamp = ground ? "glowstone" : "shroomlight";
      g.set(ix, y, iz, lamp);
    }
  }

  // Parapet, cap above the roof line
  g.set(x, ROOF_Y, z, "white_concrete");
  g.set(x, ROOF_Y + 1, z, "white_concrete");
  g.set(x, ROOF_Y + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Corner lanterns on the parapet cap
for (const [x, z] of perimCells.map(([x, z]) => [x, z])) {
  const openSides = DIRS.filter(d => !has(x + d.dx, z + d.dz)).length;
  if (openSides >= 2) {
    g.set(x, ROOF_Y + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 4. Rooftop plant penthouse on interior cells
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (isPerim(x, z)) continue;
  if (x < 5 || x > 19 || z < 3 || z > 8) continue;
  for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) {
    g.set(x, y, z, "light_gray_concrete");
  }
}

// 5. Mast: iron column with a lightning rod at the top
const mastX = 12, mastZ = 5;
if (has(mastX, mastZ)) {
  for (let y = ROOF_Y + 4; y <= 60; y++) g.set(mastX, y, mastZ, "iron_block");
  g.set(mastX, 61, mastZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw352791655.nbt");
