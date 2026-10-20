import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807577";
const W = 24, H = 23, D = 18;

// Record: 24 x 18 footprint, roof about 11 blocks above lowest ground.
// Read as a 2-storey, 1990s-era mixed-use block: concrete frame with tinted-glass
// upper windows, a shopfront ground floor with a centred entrance, a light cornice
// and a parapet with penthouse on the roof.

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) ground.set(`${c[0]},${c[1]}`, c[2] ?? 0);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Which facade (if any) a footprint cell sits on, and its index along that face.
function face(x, z) {
  if (!has(x, z - 1)) return { f: "N", i: x };
  if (!has(x, z + 1)) return { f: "S", i: x };
  if (!has(x - 1, z)) return { f: "W", i: z };
  if (!has(x + 1, z)) return { f: "E", i: z };
  return null;
}

// Inward neighbour across a facade cell.
function inward(x, z, f) {
  if (f === "N") return [x, z + 1];
  if (f === "S") return [x, z - 1];
  if (f === "W") return [x + 1, z];
  return [x - 1, z];
}

const DOOR_I = 12;

function facadeBlock(fc, y, gr, x, z) {
  // Base course
  if (y === gr) return { b: "stone_bricks" };

  // Ground floor: shopfront (gr+1 .. 4)
  if (y >= gr + 1 && y <= 4) {
    // Entrance on the south (street) face
    if (fc.f === "S" && fc.i === DOOR_I && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      return {
        b: "dark_oak_door",
        p: { facing: "south", half, hinge: "left", open: "false", powered: "false" },
      };
    }
    if (y === 4) {
      // Dark fascia over the entrance, lighter band elsewhere
      if (fc.f === "S" && fc.i >= 10 && fc.i <= 14) return { b: "dark_oak_planks" };
      return { b: "light_gray_concrete" };
    }
    if (fc.i % 3 === 0) return { b: "white_concrete" };
    return { b: "glass" };
  }

  // Storey line
  if (y === 5) return { b: "light_gray_concrete" };

  // Upper floor (6 .. 8): tinted glass in a 3-bay grid
  if (y >= 6 && y <= 8) {
    if (fc.i % 3 === 0) return { b: "white_concrete" };
    return { b: "tinted_glass" };
  }

  // Sill / lintel band
  if (y === 9) return { b: "white_concrete" };

  // Cornice
  if (y === 10) return { b: "light_gray_concrete" };

  // Parapet
  if (y === 11) return { b: "white_concrete" };

  // Coping
  if (y === 12) return { b: "stone_brick_slab", p: { type: "bottom", waterlogged: "false" } };

  return null;
}

// ---- Pass 1: foundations, floors, roof deck, facades ----
const cells = [...ground.keys()].map((k) => k.split(",").map(Number));

for (const [x, z] of cells) {
  const gr = gAt(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fc = face(x, z);

  if (!fc) {
    // Interior: ground slab, upper floor slab, roof deck. Air between.
    put(x, gr, z, "smooth_stone");
    if (gr <= 5) put(x, 5, z, "smooth_stone");
    if (gr <= 10) put(x, 10, z, "light_gray_concrete");
  } else {
    // Facade column from ground to coping
    for (let y = gr; y <= 12; y++) {
      const spec = facadeBlock(fc, y, gr, x, z);
      if (spec) put(x, y, z, spec.b, spec.p);
    }
    // Roof deck under the facade ring so the parapet stands on something
    if (gr <= 10) put(x, 10, z, "light_gray_concrete");
  }
}

// ---- Pass 2: warm lights behind selected windows ----
for (const [x, z] of cells) {
  const fc = face(x, z);
  if (!fc) continue;
  if (fc.i % 6 !== 2) continue;
  const gr = gAt(x, z);
  const [ix, iz] = inward(x, z, fc.f);
  if (!has(ix, iz) || face(ix, iz)) continue;

  // Ground floor light behind shopfront glass
  if (fc.i % 3 !== 0 && gr + 2 <= 4) put(ix, gr + 2, iz, "glowstone");
  // Upper floor light behind tinted glass
  if (fc.i % 3 !== 0) put(ix, 7, iz, "glowstone");
}

// ---- Pass 3: roof penthouse on the central roof deck ----
const PX0 = 8, PX1 = 15, PZ0 = 6, PZ1 = 11;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const gr = gAt(x, z);
    if (gr > 10) continue;
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;

    // Penthouse floor-to-roof sits on the roof deck at y 10
    if (ring) {
      put(x, 11, z, "light_gray_concrete");
      const corner = (x === PX0 || x === PX1) && (z === PZ0 || z === PZ1);
      if (corner || (x + z) % 3 === 0) put(x, 12, z, "white_concrete");
      else put(x, 12, z, "tinted_glass");
      put(x, 13, z, "white_concrete");
    }
    // Penthouse roof slab
    put(x, 14, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
