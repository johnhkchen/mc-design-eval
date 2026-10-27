// Way 912170775: a two-storey Edwardian brick shopfront block (c. 1910-1925) on a flat lidar roof 10 blocks up.
// Plinth, shopfront with a door and stone hood, brick piers with sash windows above, a smooth-stone cornice,
// and a brick parapet on a flat roof with a small plant box. Walls are a one-block shell with an air gap behind
// each pane; floor slabs at y 0 and y 4, and a roof slab at y 9.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170775.cells.json", "utf8"));

const R = 10;   // the lidar roof height above y 0 (every cell reads 10 here, all grounds 0)
if (cells.some(([, , g, r]) => g !== 0 || r !== R)) throw new Error("this script is laid out for ground 0, roof 10");

const key = (x, z) => `${x},${z}`;
const inF = new Set(cells.map(([x, z]) => key(x, z)));
const inside = (x, z) => inF.has(key(x, z));

// outward directions: N is -z (the street front is the north run of the footprint), S +z, W -x, E +x
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposedFaces = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));

const g = new Voxels([8, 23, 5]);

const DOOR = [4, 0];          // the front door cell on the north run
const CANOPY = [3, 4, 5];     // the door hood: stairs along y 4 over the three front cells around the door

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const ex = exposedFaces(x, z);

  // interior: floor slabs at each storey line and the roof slab; the storeys between are air
  if (ex.length === 0) {
    g.set(x, 0, z, "smooth_stone");
    g.set(x, 4, z, "smooth_stone");
    g.set(x, R - 1, z, "gray_concrete");
    continue;
  }

  const corner = ex.length >= 2;
  const front = ex.includes("N");
  // the bay along the face: x on the north and south runs, z on the east and west runs; odd bays get the windows
  const bay = ex.includes("N") || ex.includes("S") ? x : z;
  const win = bay % 2 === 1;
  const isDoor = x === DOOR[0] && z === DOOR[1];

  // y 0: plinth course
  g.set(x, 0, z, "stone_bricks");

  // ground storey, y 1-3: shopfront on the front run, sash-style windows and brick piers on the rest
  if (corner) {
    for (const y of [1, 2, 3]) g.set(x, y, z, "stone_bricks");
  } else if (front) {
    if (isDoor) {
      g.set(x, 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      g.set(x, 1, z, "glass");
      g.set(x, 2, z, "glass");
    }
    g.set(x, 3, z, "dark_oak_planks");
  } else if (win) {
    g.set(x, 1, z, "glass");
    g.set(x, 2, z, "glass");
    g.set(x, 3, z, "white_concrete");
  } else {
    for (const y of [1, 2, 3]) g.set(x, y, z, "bricks");
  }

  // y 4: string course, with the stair hood over the door
  if (corner) g.set(x, 4, z, "smooth_stone");
  else if (front && x >= CANOPY[0] && x <= CANOPY[2] && z === DOOR[1])
    g.set(x, 4, z, "dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  else g.set(x, 4, z, "smooth_stone");

  // upper storey, y 5-7: quoins at the corners, sash windows (white sill, glass, lit behind) on odd bays, brick piers
  if (corner) {
    for (const y of [5, 6, 7]) g.set(x, y, z, "stone_bricks");
  } else if (win) {
    g.set(x, 5, z, "white_concrete");
    g.set(x, 6, z, "glass");
    g.set(x, 7, z, "glass");
  } else {
    for (const y of [5, 6, 7]) g.set(x, y, z, "bricks");
  }

  // y 8: cornice course; y 9: brick parapet, stone-capped at the corners
  g.set(x, 8, z, corner ? "smooth_stone" : "smooth_stone");
  g.set(x, 9, z, corner ? "stone_bricks" : "bricks");

  // the gap behind each pane: a warm light in some of them (the gap cell is the interior next to the face)
  if (!corner && (win || (front && !isDoor))) {
    const [dx, dz] = DIRS[ex[0]];
    const gx = x - dx, gz = z - dz;
    if (inside(gx, gz) && exposedFaces(gx, gz).length === 0) {
      if (front && !win) g.set(gx, 1, gz, "glowstone");     // shopfront: a lamp behind the glass at street level
      else if (win && bay % 4 === 3) g.set(gx, 6, gz, "glowstone");
    }
  }
}

// roof plant box: two low stone-brick slabs on the roof slab (stone, not a glass block, so it reads as equipment)
for (const x of [2, 3]) g.set(x, R, 2, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170775.nbt");
console.log(`way_912170775: ${g.count()} blocks, palette ${g.palette.length - 1}`);
