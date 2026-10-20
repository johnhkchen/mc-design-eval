import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw831857624";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 21, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Safe setter: ignores anything outside the volume.
function S(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Footprint lookup: key "x,z" -> ground height
const k = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(k(x, z), gr);
const has = (x, z) => groundOf.has(k(x, z));

// Outward directions
const DIRS = [
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
];

// Classify cells: facade if any side is open to the outside.
const facade = new Map(); // key -> { missing: [dirs], face }
for (const [x, z] of groundOf.keys().map((s) => s.split(",").map(Number))) {
  const missing = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  if (missing.length) {
    const face = missing.find((d) => d.name === "south") || missing[0];
    facade.set(k(x, z), { missing, face });
  }
}

// Front entrance: the middle south-facing facade cell.
const frontCells = [];
for (const [key, info] of facade) {
  if (info.missing.some((d) => d.name === "south")) {
    const [x] = key.split(",").map(Number);
    frontCells.push(x);
  }
}
frontCells.sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;
const doorZ = D - 1;

// Pass 1: foundations, floors, interior roof slab.
for (const [x, z, gr] of cells) {
  const isFacade = facade.has(k(x, z));
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");
  if (!isFacade) {
    S(x, gr, z, "light_gray_concrete");       // ground floor slab
    S(x, gr + 5, z, "light_gray_concrete");   // second floor slab
    S(x, gr + 10, z, "light_gray_concrete");  // roof slab
  }
}

// Pass 2: facade walls, windows, shopfront, cornices.
for (const [x, z, gr] of cells) {
  const info = facade.get(k(x, z));
  if (!info) continue;

  const u = info.face.axis === "x" ? x : z;
  const cornerish = info.missing.length >= 2;
  const pillar = cornerish || u % 3 === 0;
  const isDoor = x === doorX && z === doorZ;

  // Full-height wall: white concrete, gr .. gr+11
  for (let y = gr; y <= gr + 11; y++) S(x, y, z, "white_concrete");

  // Base course
  S(x, gr, z, "polished_andesite");

  // Ground floor shopfront: glass panes between pillars, door in the middle
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (pillar) continue;
    S(x, y, z, "glass_pane");
  }
  if (isDoor) {
    S(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false", hinge: "left" });
    S(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    S(x, gr + 3, z, "light_gray_concrete");
  }

  // Storey line above shopfront
  S(x, gr + 4, z, "light_gray_concrete");

  // Upper storey windows
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (pillar) continue;
    S(x, y, z, "light_blue_stained_glass_pane");
  }
  S(x, gr + 5, z, "light_gray_concrete");
  S(x, gr + 9, z, "light_gray_concrete");

  // Cornice band
  S(x, gr + 10, z, "light_gray_concrete");
}

// Pass 3: warm lights behind some upper-floor windows (interior neighbour).
for (const [key, info] of facade) {
  const [x, z] = key.split(",").map(Number);
  const gr = groundOf.get(key);
  const u = info.face.axis === "x" ? x : z;
  if (u % 3 === 0) continue;
  if (u % 6 !== 1) continue;
  const ix = x - info.face.dx, iz = z - info.face.dz;
  if (!has(ix, iz) || facade.has(k(ix, iz))) continue;
  S(ix, gr + 7, iz, "glowstone");
}

// Pass 4: rooftop water tank (3x3 steel block with cap), on interior cells.
let tank = null;
for (const [x, z, gr] of cells) {
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++)
    for (let dz = -1; dz <= 1 && ok; dz++) {
      if (!has(x + dx, z + dz) || facade.has(k(x + dx, z + dz))) ok = false;
      else if (groundOf.get(k(x + dx, z + dz)) !== gr) ok = false;
    }
  if (ok) { tank = { x, z, gr }; break; }
}
if (tank) {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      for (let y = tank.gr + 11; y <= tank.gr + 13; y++)
        S(tank.x + dx, y, tank.z + dz, "iron_block");
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      S(tank.x + dx, tank.gr + 14, tank.z + dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
