import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334991478";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 19, D = 32;
const g = new Voxels([W, H, D]);

// Helper: bounds-checked set
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Footprint lookup: "x,z" -> ground
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, gr);
const has = (x, z) => foot.has(`${x},${z}`);

// Missing 4-neighbours => exterior faces
function missing(x, z) {
  return {
    N: !has(x, z - 1), // -z side
    S: !has(x, z + 1), // +z side
    W: !has(x - 1, z), // -x side
    E: !has(x + 1, z),
  };
}

// Entrance: front edge (min z) cell nearest the footprint centroid, not a corner
let minZ = Infinity;
let sumX = 0, n = 0;
for (const [x, z] of cells) {
  if (z < minZ) minZ = z;
  sumX += x; n++;
}
const cx = sumX / n;
let entrance = null, bestD = Infinity;
for (const [x, z] of cells) {
  const m = missing(x, z);
  if (!m.N || m.W || m.E) continue; // want a clean north-facing wall cell
  const d = Math.abs(x - cx);
  if (d < bestD) { bestD = d; entrance = `${x},${z}`; }
}
if (!entrance) {
  // fallback: any front-row cell
  for (const [x, z] of cells) {
    if (z !== minZ) continue;
    const d = Math.abs(x - cx);
    if (d < bestD) { bestD = d; entrance = `${x},${z}`; }
  }
}

for (const [x, z, gr] of cells) {
  const b = gr; // storey base on this cell's own ground

  // Foundation from y0 up to ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const m = missing(x, z);
  const isEdge = m.N || m.S || m.W || m.E;
  const isCorner = (m.N || m.S) && (m.W || m.E);
  const alongX = (m.N || m.S) && !(m.W || m.E); // wall runs east-west
  const alongZ = (m.W || m.E) && !(m.N || m.S);

  // Ground floor slab / base course
  put(x, b, z, isEdge ? "polished_granite" : "smooth_stone");

  // Roof deck (top of the single storey) on every cell
  put(x, b + 5, z, "light_gray_concrete");

  if (!isEdge) {
    // Interior: air, ceiling deck, occasional rooftop plant box
    if ((x * 3 + z * 5) % 11 === 0) put(x, b + 6, z, "smooth_stone");
    continue;
  }

  // Exterior wall cells
  const key = `${x},${z}`;
  const isEntrance = key === entrance;

  // Storey wall b+1 .. b+3: shopfront glazing with white piers
  for (let dy = 1; dy <= 3; dy++) {
    const y = b + dy;
    if (isCorner || (x + z) % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", {
        north: String(alongX),
        south: String(alongX),
        east: String(alongZ),
        west: String(alongZ),
        waterlogged: "false",
      });
    }
  }

  // Cornice band and parapet
  put(x, b + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  put(x, b + 5, z, "white_concrete");
  put(x, b + 6, z, "white_concrete");

  // Warm light behind a glass bay: lit glowstone on the interior floor cell
  if (!isCorner && (x * 2 + z) % 5 === 0) {
    let dxIn = 0, dzIn = 0;
    if (m.N) dzIn = 1;
    else if (m.S) dzIn = -1;
    else if (m.W) dxIn = 1;
    else if (m.E) dxIn = -1;
    const ix = x + dxIn, iz = z + dzIn;
    if (has(ix, iz) && !isEntrance) put(ix, b + 1, iz, "glowstone");
  }
}

// Entrance: door with lintel/canopy over it on the front wall
if (entrance) {
  const [ex, ez] = entrance.split(",").map(Number);
  const b = foot.get(entrance);
  put(ex, b + 1, ez, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(ex, b + 2, ez, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(ex, b + 3, ez, "dark_oak_planks");
}

g.save(`${DIR}/${ID}.nbt`);
