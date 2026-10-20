import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339540106.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339540106.nbt";

const W = 23, H = 19, D = 14;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// Footprint lookup, grounds normalised so the lowest ground is y 0.
const fp = new Map();
let base = Infinity;
for (const [x, z, gr] of cells) base = Math.min(base, Math.round(gr));
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, Math.round(gr) - base);

const has = (x, z) => fp.has(`${x},${z}`);
const gnd = (x, z) => fp.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Mid-century Taipei low-rise commercial block: white concrete walls,
// a polished andesite base course, storefront glass on the street face,
// a light-grey frieze and a parapet with stone cap. Roof sits at about 6-7 blocks.
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = gnd(x, z);                 // ground of this cell
  const T = Math.max(6, gr + 5);       // roof slab level for this cell

  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const perim = nN || nS || nW || nE;

  // Foundation from y 0 up to this cell's ground, so nothing floats.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!perim) {
    // Interior: floor slab at ground, roof slab on top, air between.
    put(x, gr, z, "smooth_stone");
    put(x, T, z, "smooth_stone");
    // Roof equipment: AC plant boxes on the roof, a few spots only.
    if (x % 6 === 3 && z % 5 === 2) {
      put(x, T + 1, z, "light_gray_concrete");
      put(x, T + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter wall.
  put(x, gr, z, "polished_andesite");           // base course
  put(x, T, z, "smooth_stone");                 // roof edge slab
  put(x, T + 1, z, "white_concrete");           // parapet
  put(x, T + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // cap

  // Frieze row just under the roof slab.
  put(x, T - 1, z, "light_gray_concrete");

  // Face orientation and index along that face for the window rhythm.
  const alongX = nN || nS;  // face runs along x
  const idx = alongX ? x : z;
  const corner = (nN || nS) && (nW || nE);
  const pillar = corner || idx % 3 === 0;

  // Inward neighbour for interior lighting.
  let inX = x, inZ = z;
  if (nN) inZ = z + 1;
  else if (nS) inZ = z - 1;
  else if (nW) inX = x + 1;
  else if (nE) inX = x - 1;
  const hasInward = has(inX, inZ) && !((has(inX, inZ - 1) === false) || (has(inX, inZ + 1) === false) || (has(inX - 1, inZ) === false) || (has(inX + 1, inZ) === false));

  const glassProps = alongX
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // Door on the street face (south, z = max) near the centre.
  const isDoorCol = nS && (x === 11 || x === 12);

  for (let r = gr + 1; r <= T - 2; r++) {
    const doorRow = r === gr + 1 || r === gr + 2;
    if (isDoorCol && doorRow) {
      const half = r === gr + 1 ? "lower" : "upper";
      put(x, r, z, "oak_door", {
        facing: "south", half, hinge: x === 11 ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }
    if (pillar) {
      put(x, r, z, "white_concrete");
      continue;
    }
    put(x, r, z, "glass_pane", glassProps);
  }

  // Warm light behind some windows, in the air gap at mid-window height.
  const lightRow = gr + 2;
  if (!pillar && !isDoorCol && (idx + lightRow) % 4 === 0 && hasInward) {
    put(inX, lightRow, inZ, "glowstone");
  }

  // Ground-floor shopfront: frame the glass with a lintel band at the top of the storefront.
  if (nS && !isDoorCol && !pillar) {
    put(x, gr + 3, z, "white_concrete");
  }
}

g.save(OUT);
