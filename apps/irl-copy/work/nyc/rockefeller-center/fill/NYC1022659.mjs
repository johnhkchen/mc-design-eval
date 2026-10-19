// 142 West 46 Street, 1924: a five-storey brick mixed-use block (shop on the street, flats above), stone base and
// cornice, one-cell window pockets with the air behind the glass, solid floors between storeys. The lidar roof gives
// three flat tiers along the 24-cell depth: the street front and the rear at 16 blocks, a two-storey middle at 14.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022659.cells.json`, "utf8"));

const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof });
const has = (x, z) => F.has(`${x},${z}`);

// Roof tiers along z, smoothed from the lidar (14..16 noise): front and rear 16, middle 14.
const H = (x, z) => (z <= 5 ? 16 : z <= 16 ? 14 : 16);
const FRONT = 23;                       // 46th Street face (the lot is on its north side, even numbers)

// Window rows: storeys are 3 high, a spandrel band at y = 0, 3, 6, 9, 12, 15... and two glass rows above each band.
const isWindowRow = (y, h) => y >= 4 && y % 3 !== 0 && y < h - 1;

// Which faces carry windows, and the air cell behind each glass (the pocket).
function windowFace(x, z) {
  if (z === FRONT) return x === 2 || x === 3 ? { pocket: [x, FRONT - 1] } : null;
  if (z === 0) return x === 2 ? { pocket: [2, 1] } : null;
  if (x === 1) return z % 3 !== 2 ? { pocket: [2, z] } : null;
  if (x === 3 && !has(4, z)) return z % 3 !== 2 ? { pocket: [2, z] } : null;
  if (x === 4) return z >= 12 && z <= 22 && z % 3 !== 2 ? { pocket: [3, z] } : null;
  return null;
}

// A cell is on the outside if a neighbour is missing from the footprint or sits lower (a setback face).
const outside = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1) ||
  H(x, z - 1) < H(x, z) || H(x, z + 1) < H(x, z);

// Pockets: the air cells directly behind every window and shop glass, so the glass has depth.
const pockets = new Map();              // "x,y,z" -> warm light or null
const pkey = (x, y, z) => `${x},${y},${z}`;
for (const key of F.keys()) {
  const [x, z] = key.split(",").map(Number);
  const h = H(x, z);
  const wf = windowFace(x, z);
  if (wf) for (let y = 4; y < h - 1; y++) if (isWindowRow(y, h)) {
    const [px, pz] = wf.pocket;
    const warm = (z * 3 + y) % 5 === 0;     // a lit room in some windows
    pockets.set(pkey(px, y, pz), warm ? "glowstone" : null);
  }
}
// The shop: door and display window at street level, with air behind both.
for (const y of [1, 2]) {
  pockets.set(pkey(2, y, FRONT - 1), null);     // entrance hall behind the door
  pockets.set(pkey(3, y, FRONT - 1), null);     // display window
}
pockets.set(pkey(3, 1, FRONT - 1), "glowstone"); // shop lit from inside

const g = new Voxels([5, 28, 24]);

// Pass 1: the solid envelope and mass, with the foundation under each cell (none: every ground is 0).
for (const key of F.keys()) {
  const [x, z] = key.split(",").map(Number);
  const h = H(x, z), ground = F.get(key).ground;
  const edge = outside(x, z);
  for (let y = 0; y < h; y++) {
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }
    const p = pockets.get(pkey(x, y, z));
    if (pockets.has(pkey(x, y, z))) { if (p) g.set(x, y, z, p); continue; }   // air, or a lamp in the air
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                // base course

    if (!edge) { g.set(x, y, z, y === h - 1 ? "gravel" : "bricks"); continue; }  // roof covering and brick mass

    if (y === h - 1) { g.set(x, y, z, "calcite"); continue; }                // cornice
    if (z === FRONT && y === 1 || z === FRONT && y === 2) {                  // shopfront
      if (x === 3) g.set(x, y, z, "glass");
      else if (x === 2) { /* door, below */ }
      else g.set(x, y, z, "polished_andesite");   // pilasters either side of the shop front
      continue;
    }
    if (z === FRONT && y === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }  // shop fascia
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                // storey band (limestone)
    if (isWindowRow(y, h) && windowFace(x, z)) { g.set(x, y, z, "glass"); continue; }
    g.set(x, y, z, "bricks");                                                // piers and blank wall
  }
}

// The entrance door, lower and upper halves, on the street face.
g.set(2, 1, FRONT, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(2, 2, FRONT, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Water tower on the street-front roof (16): four legs, a plank tank, a slab cap.
for (const [x, z] of [[1, 18], [3, 18], [1, 20], [3, 20]]) {
  g.set(x, 16, z, "dark_oak_fence"); g.set(x, 17, z, "dark_oak_fence");
}
for (let x = 1; x <= 3; x++) for (let z = 18; z <= 20; z++) {
  g.set(x, 18, z, "spruce_planks"); g.set(x, 19, z, "spruce_planks");
  g.set(x, 20, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

const out = g.save(`${DIR}/NYC1022659.nbt`);
console.log(JSON.stringify(out));
