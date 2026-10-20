import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339401647.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339401647.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 29, H = 24, D = 66;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Bounds-guarded setter
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior face of a footprint cell: outward normal axis, and inward direction
// (inward = toward the building interior, used for placing lights behind glass).
const faceOf = (x, z) => {
  if (!has(x - 1, z)) return { axis: "x", dx: 1, dz: 0 };
  if (!has(x + 1, z)) return { axis: "x", dx: -1, dz: 0 };
  if (!has(x, z - 1)) return { axis: "z", dx: 0, dz: 1 };
  if (!has(x, z + 1)) return { axis: "z", dx: 0, dz: -1 };
  return null;
};

// Entrance: first street-side cell on the centre column (z minimum face).
const DOOR_X = Math.floor(W / 2);
let doorZ = -1;
for (let z = 0; z < D; z++) {
  if (has(DOOR_X, z) && !has(DOOR_X, z - 1)) { doorZ = z; break; }
}

const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: exterior cells (walls, windows, lights in the interior cell behind glass)
// Pass 2: interior cells (floor slabs, roof deck, rooftop plant)
const exteriorCells = [];
const interiorCells = [];
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  (f ? exteriorCells : interiorCells).push([x, z, gr, f]);
}

// Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// ---- Exterior shell ----
for (const [x, z, gr, f] of exteriorCells) {
  const idx = f.axis === "x" ? z : x;
  const paneProps = f.axis === "x" ? PANE_X : PANE_Z;
  const isDoor = z === doorZ && x === DOOR_X && f.dz === 1;
  const isPierG = idx % 3 === 0;

  // Main wall column: white tiled walls with a polished base course
  for (let y = gr; y <= gr + 11; y++) put(x, y, z, "white_concrete");
  put(x, gr, z, "polished_andesite");

  // Storey lines (concrete bands) at the top of each storey and roof deck
  put(x, gr + 3, z, "smooth_quartz");
  put(x, gr + 4, z, "smooth_quartz");
  put(x, gr + 7, z, "smooth_quartz");
  put(x, gr + 8, z, "smooth_quartz");
  put(x, gr + 11, z, "smooth_quartz");

  // Ground floor shopfront: glass bays between dark mullions, door at entrance
  if (isDoor) {
    put(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "light_blue_stained_glass_pane", paneProps);
  } else if (isPierG) {
    put(x, gr + 1, z, "dark_oak_planks");
    put(x, gr + 2, z, "dark_oak_planks");
  } else {
    put(x, gr + 1, z, "light_blue_stained_glass_pane", paneProps);
    put(x, gr + 2, z, "light_blue_stained_glass_pane", paneProps);
  }

  // Upper storeys: window grids (two storeys, glass at b+1..b+2)
  for (const s of [1, 2]) {
    const b = gr + 4 * s;
    const isPier = idx % 3 === 0;
    if (!isPier) {
      put(x, b + 1, z, "light_blue_stained_glass_pane", paneProps);
      put(x, b + 2, z, "light_blue_stained_glass_pane", paneProps);
    }
  }

  // Warm light in the interior cell behind some windows
  if (f.dx !== 0 || f.dz !== 0) {
    const ix = x + f.dx, iz = z + f.dz;
    if (has(ix, iz) && !faceOf(ix, iz)) {
      if (!isPierG && idx % 6 === 2 && !isDoor) {
        put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
      for (const s of [1, 2]) {
        const b = gr + 4 * s;
        if (!(idx % 3 === 0) && idx % 6 === 1) {
          put(ix, b + 1, iz, "glowstone");
        }
      }
    }
  }

  // Parapet cap with cornice
  put(x, gr + 12, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Canopy over the entrance (on the street face, lintel row above the door)
if (doorZ >= 0) {
  for (let x = DOOR_X - 2; x <= DOOR_X + 2; x++) {
    if (!has(x, doorZ)) continue;
    const gr = ground.get(`${x},${doorZ}`);
    put(x, gr + 3, doorZ, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- Interior: floor slabs, roof deck, rooftop plant ----
for (const [x, z, gr, f] of interiorCells) {
  put(x, gr, z, "smooth_quartz");        // ground floor slab
  put(x, gr + 4, z, "smooth_quartz");    // second floor slab
  put(x, gr + 8, z, "smooth_quartz");    // third floor slab
  put(x, gr + 11, z, "smooth_quartz");   // roof deck

  // Rooftop mechanical plant: a few low concrete plant rooms
  if (gr + 12 < H && (x % 10 >= 3 && x % 10 <= 6) && (z % 18 >= 6 && z % 18 <= 11)) {
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(OUT);
