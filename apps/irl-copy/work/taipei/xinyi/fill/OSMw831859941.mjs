import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831859941.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831859941.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 26, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Two storeys of 5 blocks, parapet to 11 blocks above ground.
const FOUND = "stone_bricks";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "polished_granite";
const CORNICE = "smooth_stone";
const FLOOR = "smooth_stone";

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(x + "," + z, gr);
const inside = (x, z) => gmap.has(x + "," + z);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pick the entrance: north-edge cell nearest the footprint's mid x.
const northEdge = cells.filter(([x, z]) => !inside(x, z - 1));
let doorKey = null;
if (northEdge.length) {
  const mid = northEdge.reduce((s, c) => s + c[0], 0) / northEdge.length;
  let best = Infinity;
  for (const [x, z] of northEdge) {
    const d = Math.abs(x - mid);
    if (d < best) { best = d; doorKey = x + "," + z; }
  }
}

// Pass 1: foundations, floors and roof deck.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  put(x, gr, z, FLOOR);
  put(x, gr + 5, z, FLOOR);
  put(x, gr + 10, z, CORNICE);
}

// Pass 2: facades, windows, entrance, corners.
for (const [x, z, gr] of cells) {
  const N = !inside(x, z - 1);
  const S = !inside(x, z + 1);
  const Wf = !inside(x - 1, z);
  const E = !inside(x + 1, z);
  if (!(N || S || Wf || E)) continue;

  const corner = (N || S) && (Wf || E);
  const alongNS = N || S;
  const idx = alongNS ? x : z;
  const isDoor = N && doorKey === x + "," + z;
  const frame = idx % 3 === 0;

  // Inward neighbour for interior lights.
  let ix = x, iz = z;
  if (N) iz = z + 1;
  else if (S) iz = z - 1;
  else if (Wf) ix = x + 1;
  else if (E) ix = x - 1;
  const inwardOk = inside(ix, iz);

  for (let k = 0; k <= 10; k++) {
    const y = gr + k;
    let id = WALL;
    let props;

    if (k === 0) {
      id = BASE;
    } else if (k >= 1 && k <= 3) {
      // Ground storey: shopfront glazing, entrance on the north face.
      if (isDoor && k === 1) {
        id = "dark_oak_door";
        props = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
      } else if (isDoor && k === 2) {
        id = "dark_oak_door";
        props = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
      } else if (isDoor && k === 3) {
        id = "shroomlight"; // warm light over the entrance
      } else if (corner || frame) {
        id = BAND;
      } else {
        id = GLASS;
      }
    } else if (k === 4 || k === 5) {
      id = BAND; // storey line
    } else if (k >= 6 && k <= 8) {
      if (corner || frame) id = BAND;
      else id = GLASS;
    } else if (k === 9) {
      id = CORNICE;
    } else if (k === 10) {
      id = WALL; // parapet
    }

    put(x, y, z, id, props);

    // Warm interior light behind some upper windows.
    if (k === 7 && id === GLASS && inwardOk && idx % 6 === 1) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// Pass 3: roof equipment on the deck.
for (const [x, z, gr] of cells) {
  if (inside(x, z - 1) && inside(x, z + 1) && inside(x - 1, z) && inside(x + 1, z)) {
    if ((x * 3 + z * 5) % 11 === 0) {
      put(x, gr + 11, z, BAND);
    }
  }
}

g.save(OUT);
