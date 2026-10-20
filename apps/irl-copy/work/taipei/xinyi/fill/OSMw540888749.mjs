import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey (about 11 blocks) low-rise commercial block of the 1970s-80s Xinyi
// shophouse type: cream smooth-tile facade, stone base, storey bands, a shopfront
// with green-and-white awning on the street face, a parapet and a rooftop water tank.
const W = 11, H = 23, D = 8;
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw540888749.cells.json`, "utf8"));

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gl = (x, z) => ground.get(`${x},${z}`);
const exterior = (x, z) =>
  !has(x, z) || !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, b] of cells) {
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
}

// 2. Storeys, bands, cornice, parapet, windows, shopfront.
for (const [x, z, b] of cells) {
  const ext = exterior(x, z);
  const front = ext && z === 0;

  // Base / floor slab at ground level.
  put(x, b, z, ext ? "stone_bricks" : "gray_concrete");

  // Storey bands (floor lines) at b+5 and b+10 (roof slab interior).
  put(x, b + 5, z, ext ? "smooth_stone" : "light_gray_concrete");
  put(x, b + 10, z, ext ? "smooth_stone" : "gray_concrete");

  if (!ext) {
    // Interior: air behind glass, floor slabs only (already placed).
    // Tank on the roof of the interior cells.
    if (x >= 3 && x <= 4 && z >= 2 && z <= 3) put(x, b + 11, z, "iron_block");
    continue;
  }

  // Parapet ring.
  put(x, b + 11, z, "white_concrete");

  // Exterior walls, both storeys.
  for (const y of [b + 1, b + 2, b + 3, b + 4, b + 6, b + 7, b + 8, b + 9]) {
    put(x, y, z, "smooth_quartz");
  }

  if (corner(x, z)) {
    // Corner columns stay solid.
    continue;
  }

  // Upper-storey windows (glass with frame), parity pattern on every face.
  const upperWin = (x + z) % 2 === 1;
  if (upperWin) {
    for (const y of [b + 6, b + 7, b + 8]) put(x, y, z, "glass_pane");

    // Warm light behind some windows, placed one cell inward.
    if ((x + 2 * z) % 3 === 0) {
      const ix = x === 0 ? 1 : x === W - 1 ? W - 2 : x;
      const iz = z === 0 ? 1 : z === D - 1 ? D - 2 : z;
      if (has(ix, iz) && !exterior(ix, iz)) put(ix, b + 7, iz, "glowstone");
    }
  }

  if (front) {
    // Shopfront: pillars at x 0,3,7,10; door at x 5; glass elsewhere.
    if (x === 3 || x === 7) {
      for (const y of [b + 1, b + 2, b + 3]) put(x, y, z, "smooth_quartz");
    } else if (x === 5) {
      put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, b + 3, z, "smooth_quartz");
    } else {
      for (const y of [b + 1, b + 2, b + 3]) put(x, y, z, "glass");
    }

    // Awning band over the shopfront: alternating green and white stripes.
    put(x, b + 4, z, x % 2 === 1 ? "green_wool" : "white_wool");
  } else {
    // Side and back ground-floor windows, same parity as upper.
    if (upperWin) {
      for (const y of [b + 1, b + 2, b + 3]) put(x, y, z, "glass_pane");
    }
  }
}

g.save(`${DIR}/OSMw540888749.nbt`);
