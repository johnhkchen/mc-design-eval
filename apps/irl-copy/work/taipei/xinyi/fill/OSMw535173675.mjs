import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535173675.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535173675.nbt";

const W = 14, H = 23, D = 23;

// Footprint: [x, z, ground] per cell. Era decision: 1960s-70s two-storey
// concrete commercial block with white tiled facade, ground-floor shopfronts
// under a red fascia, ribbon-style upper windows in light grey frames,
// a smooth-stone cornice, a parapet and a rooftop water tank.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
let F = 0;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gy = Math.round(gr);
  ground.set(`${x},${z}`, gy);
  F = Math.max(F, gy);
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

function outward(x, z) {
  const d = [];
  if (!has(x, z - 1)) d.push("north");
  if (!has(x, z + 1)) d.push("south");
  if (!has(x - 1, z)) d.push("west");
  if (!has(x + 1, z)) d.push("east");
  return d;
}

// Vertical levels (relative to F, the floor datum under the uphill side):
// F            base slab
// F+1..F+4     storey 1 walls (4), slab at F+5
// F+6..F+9     storey 2 walls (4), roof deck slab at F+10
// F+11         parapet (top at roughly 11 blocks above the lowest ground)
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const gr = ground.get(`${x},${z}`);
  // Foundation / plinth: solid from y 0 up to the floor datum.
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");
  // Floor slabs (full footprint) so interiors are enclosed.
  put(x, F, z, "light_gray_concrete");
  put(x, F + 5, z, "light_gray_concrete");
  put(x, F + 10, z, "light_gray_concrete");

  const out = outward(x, z);
  if (out.length === 0) continue;

  // Cornice and parapet on the perimeter.
  put(x, F + 10, z, "smooth_stone");
  put(x, F + 11, z, "light_gray_concrete");

  const corner = out.length >= 2;
  const face = out[0];
  const i = face === "north" || face === "south" ? x : z;
  const pier = corner || i % 3 === 0;

  // Storey 1: shopfront.
  const isDoor = face === "north" && z === 0 && x === 6 && has(6, 0);
  for (let y = F + 1; y <= F + 4; y++) {
    if (y === F + 4) {
      put(x, y, z, pier ? "white_concrete" : "red_concrete");
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass");
    }
  }
  if (isDoor) {
    put(x, F + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, F + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Storey 2: ribbon windows in light grey frames.
  for (let y = F + 6; y <= F + 9; y++) {
    if (y === F + 6 || y === F + 9) {
      put(x, y, z, "light_gray_concrete");
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass");
    }
  }

  // Warm lights behind some glass, inside the shell (interior air).
  if (!corner) {
    const [dx, dz] = DIR[OPP[face]];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz)) {
      if (!pier && i % 6 === 4) put(ix, F + 7, iz, "glowstone");
      if (!pier && i % 6 === 2 && !isDoor) {
        put(ix, F + 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  }
}

// Rooftop water tank (3x3) on a plinth, with a slab cap.
for (let x = 4; x <= 6; x++) {
  for (let z = 9; z <= 11; z++) {
    if (!has(x, z)) continue;
    put(x, F + 11, z, "white_concrete");
    put(x, F + 12, z, "white_concrete");
    put(x, F + 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Two small AC condenser units on the roof.
for (const [x, z] of [[2, 17], [2, 18], [10, 4], [10, 5]]) {
  if (has(x, z)) put(x, F + 11, z, "iron_block");
}

g.save(OUT);
