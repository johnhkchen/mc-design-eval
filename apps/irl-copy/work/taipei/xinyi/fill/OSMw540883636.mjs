import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883636";
const W = 9, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Common body base: highest ground under the footprint, so every storey is level.
const B = Math.max(...cells.map(c => c[2]));

// Bounds-safe setter (skips anything outside the volume)
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const faces = (x, z) => Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));

// Entrance: middle of the north (or south, else any) street-facing cell
const perim = cells.filter(([x, z]) => faces(x, z).length > 0);
let doorCands = perim.filter(([x, z]) => faces(x, z).includes("N"));
if (doorCands.length === 0) doorCands = perim.filter(([x, z]) => faces(x, z).includes("S"));
if (doorCands.length === 0) doorCands = perim;
doorCands.sort((a, b) => a[0] - b[0]);
const door = doorCands.length ? doorCands[Math.floor(doorCands.length / 2)] : null;
const doorFace = door ? faces(door[0], door[1])[0] : null;

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [x, z] of cells) {
  // Foundation: solid from y 0 up to the body base
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  const f = faces(x, z);

  // Interior cell: floor decks, roof deck, rooftop plant
  if (f.length === 0) {
    put(x, B, z, "stone_bricks");
    put(x, B + 5, z, "white_concrete");
    put(x, B + 10, z, "white_concrete");
    if (x % 3 === 2 && z % 3 === 1) put(x, B + 11, z, "light_gray_concrete");
    if (x === 4 && z === 5) {
      put(x, B + 11, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
      put(x, B + 12, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
    continue;
  }

  // Base course on every perimeter cell
  put(x, B, z, "stone_bricks");

  // Corner piers
  if (f.length >= 2) {
    for (let y = B + 1; y <= B + 4; y++) put(x, y, z, "smooth_quartz");
    put(x, B + 5, z, "stone_bricks");
    for (let y = B + 6; y <= B + 9; y++) put(x, y, z, "smooth_quartz");
    put(x, B + 10, z, "stone_bricks");
    continue;
  }

  const face = f[0];
  const along = (face === "N" || face === "S") ? x : z;
  const isDoor = door && door[0] === x && door[1] === z;
  const isWin = !isDoor && along % 2 === 1;
  const ix = x - DIRS[face][0], iz = z - DIRS[face][1]; // inward neighbour

  // Ground floor: shopfront / entrance
  if (isDoor) {
    put(x, B + 1, z, "oak_door", { facing: FACING[face], half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, B + 2, z, "oak_door", { facing: FACING[face], half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, B + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    put(x, B + 4, z, "smooth_quartz");
  } else if (isWin) {
    put(x, B + 1, z, "glass_pane", PANE);
    put(x, B + 2, z, "glass_pane", PANE);
    put(x, B + 3, z, "white_concrete");
    put(x, B + 4, z, "smooth_quartz");
  } else {
    for (let y = B + 1; y <= B + 4; y++) put(x, y, z, "smooth_quartz");
  }

  // Storey line
  put(x, B + 5, z, "stone_bricks");

  // Upper storey: window grid with sills and heads
  if (isWin) {
    put(x, B + 6, z, "white_concrete");
    put(x, B + 7, z, "glass_pane", PANE);
    put(x, B + 8, z, "glass_pane", PANE);
    put(x, B + 9, z, "white_concrete");
    // Warm light behind some glass
    if ((along + (face === "N" || face === "S" ? z : x)) % 3 === 0 && has(ix, iz)) {
      put(ix, B + 7, iz, "glowstone");
    }
  } else {
    for (let y = B + 6; y <= B + 9; y++) put(x, y, z, "smooth_quartz");
  }

  // Parapet cap
  put(x, B + 10, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
