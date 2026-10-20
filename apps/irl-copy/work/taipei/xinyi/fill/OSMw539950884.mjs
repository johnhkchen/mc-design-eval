import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: footprint 19 x 17, roof ~11 blocks above lowest ground.
// Read as a 1980s-90s two-storey commercial block: pale concrete piers,
// light-blue glazed bays, a stone-brick base course, a shopfront ground floor,
// a light concrete cornice and a parapet with a bottom slab cap.
const W = 19, H = 23, D = 17;
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539950884.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539950884.nbt";

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const FLOOR = 6;     // storey line between ground and upper floor
const ROOF = 11;     // roof slab level
const PARAPET = 12;  // parapet course
const CAP = 13;      // cap slab on parapet
const LINTEL = 5;    // top of ground storey

const FACE = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] };
const ORDER = ["south", "north", "east", "west"];

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const exteriorOf = (x, z) => ORDER.filter(d => !has(x + FACE[d][0], z + FACE[d][1]));

// Entrance: the south-facing perimeter cell nearest the footprint's centre line.
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let door = null;
for (const [x, z] of [...G.keys()].map(k => k.split(",").map(Number))) {
  const ex = exteriorOf(x, z);
  if (!ex.includes("south")) continue;
  if (!door || Math.abs(x - meanX) < Math.abs(door.x - meanX)) door = { x, z };
}
const doorKey = door ? `${door.x},${door.z}` : null;

const wallId = (y, gr, isWin) => {
  if (y === gr + 1 && y <= LINTEL) return "stone_bricks";        // base course
  if (y === PARAPET) return "white_concrete";
  if (y === ROOF) return "light_gray_concrete";                   // cornice line
  if (y === 10) return "white_concrete";                          // upper transom
  if (y >= 7 && y <= 9) return isWin ? "light_blue_stained_glass" : "white_concrete";
  if (y === FLOOR || y === LINTEL) return "light_gray_concrete";  // spandrels
  if (y >= gr + 2 && y <= 4) return isWin ? "light_blue_stained_glass" : "white_concrete";
  return "white_concrete";
};

// Pass 1: foundations, interiors and perimeter shell.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone");

  const ex = exteriorOf(x, z);
  if (ex.length === 0) {
    // Interior: floor slabs per storey, air gap between, roof slab.
    if (gr < FLOOR) put(x, FLOOR, z, "light_gray_concrete");
    if (gr < ROOF) put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Perimeter shell.
  const isCorner = ex.length > 1;
  const face = ex[0];
  const u = (face === "south" || face === "north") ? x : z;
  const isDoor = key === doorKey;

  for (let y = gr + 1; y <= CAP; y++) {
    if (y === CAP) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    const isWin = !isCorner && (u % 3 !== 0);
    put(x, y, z, wallId(y, gr, isWin));
  }

  // Ground-floor door canopy is kept inside the footprint as a lantern on the lintel line.
  if (isDoor && LINTEL >= gr + 3) {
    put(x, LINTEL, z, "light_gray_concrete");
  }
}

// Pass 2: rooftop plant on interior cells.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (exteriorOf(x, z).length) continue;
  if (x % 5 === 2 && z % 5 === 1) {
    put(x, ROOF + 1, z, "iron_block");
  }
}

// Pass 3: warm light behind glazed bays (glowstone in the interior cell inside a window).
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const ex = exteriorOf(x, z);
  if (!ex.length || ex.length > 1 || key === doorKey) continue;
  const face = ex[0];
  const u = (face === "south" || face === "north") ? x : z;
  if (u % 3 === 0 || u % 6 !== 2) continue;
  const ix = x - FACE[face][0], iz = z - FACE[face][1];
  if (!has(ix, iz) || exteriorOf(ix, iz).length) continue;
  for (const y of [3, 8]) {
    if (y >= gr + 2 && y <= 9) put(ix, y, iz, "glowstone");
  }
}

g.save(OUT);
