import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block (Xinyi, 1970s-80s era): white quartz
// walls, pier-and-spandrel window bands, a glazed shopfront, a parapet cornice
// and rooftop plant. Footprint 23 x 18 from the cells file.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538464242";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);

// Floor level sits on the highest ground under the footprint so every cell
// has foundation below it and no storey hangs over a slope.
const B = Math.max(...cells.map(c => c[2]));

// Exposed faces of a footprint cell (neighbour outside the footprint).
function exposedFaces(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("north");
  if (!inFp(x, z + 1)) f.push("south");
  if (!inFp(x - 1, z)) f.push("west");
  if (!inFp(x + 1, z)) f.push("east");
  return f;
}
const isPerim = (x, z) => exposedFaces(x, z).length > 0;

// Main door: middle of the north-facing wall.
const northCells = cells
  .filter(([x, z]) => !inFp(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const doorZ = doorX === null ? null : ground.has(`${doorX},0`) ? 0 : Math.min(...cells.filter(c => c[0] === doorX).map(c => c[1]));

// Pass 1: foundation, floor slabs and roof slab across the whole footprint.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to floor level, covering each cell's ground.
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, B, z, "smooth_stone");          // ground-floor slab
  g.set(x, B + 5, z, "light_gray_concrete"); // storey-two floor slab
  g.set(x, B + 10, z, "light_gray_concrete"); // roof slab
}

// Pass 2: perimeter walls with window grids, shopfront and cornice.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const faces = exposedFaces(x, z);
  if (!faces.length) continue;

  const face = faces[0];
  const along = (face === "north" || face === "south") ? x : z;
  const corner = faces.length > 1;
  const pier = corner || along % 4 === 0;
  const isDoor = face === "north" && x === doorX && z === doorZ;

  // Base course.
  g.set(x, B, z, "stone_bricks");

  // Ground floor: shopfront glass between stone piers.
  for (let y = B + 1; y <= B + 3; y++) {
    g.set(x, y, z, pier ? "stone_bricks" : "glass");
  }
  // Lintel band over the shopfront.
  g.set(x, B + 4, z, "smooth_quartz");

  // Upper storey: pier-and-spandrel window grid.
  for (let y = B + 6; y <= B + 9; y++) {
    if (pier) g.set(x, y, z, "smooth_quartz");
    else if (y === B + 6 || y === B + 9) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "light_blue_stained_glass");
  }

  // Roof edge and parapet cornice.
  g.set(x, B + 10, z, "light_gray_concrete");
  g.set(x, B + 11, z, "smooth_quartz");

  // Entrance door on the north facade.
  if (isDoor) {
    g.set(x, B + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, B + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, B + 3, z, "glass");
  }

  // Warm light: glowstone standing inside, behind the glass.
  if (!pier && along % 8 === 4) {
    const [ix, iz] = face === "north" ? [x, z + 1]
      : face === "south" ? [x, z - 1]
      : face === "west" ? [x + 1, z]
      : [x - 1, z];
    if (inFp(ix, iz) && !isPerim(ix, iz)) {
      g.set(ix, B + 6, iz, "glowstone");   // upper storey, on the floor slab
      g.set(ix, B + 1, iz, "glowstone");   // ground floor, on the base slab
    }
  }
}

// Entrance lantern hanging from the storey-two slab, inside the door.
if (doorX !== null && inFp(doorX, doorZ + 1) && !isPerim(doorX, doorZ + 1)) {
  g.set(doorX, B + 4, doorZ + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: rooftop plant boxes on interior roof cells.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (isPerim(x, z)) continue;
  if (x % 6 === 3 && z % 6 === 3) {
    g.set(x, B + 11, z, "light_gray_concrete");
    g.set(x, B + 12, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
