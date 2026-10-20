import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001610.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001610.nbt";

const W = 5, H = 23, D = 11;
const g = new Voxels([W, H, D]);

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const cellMap = new Map();
for (const c of raw) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  cellMap.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(rf) });
}

// Lowest ground under the footprint is y0; roof from lidar, flattened to one tier.
const grounds = [...cellMap.values()].map((c) => c.g);
const base = Math.min(...grounds);
const roofs = [...cellMap.values()].map((c) => c.r);
let Rf = Math.min(H - 1, Math.max(...roofs));
if (Rf < base + 10) Rf = Math.min(H - 1, base + 10);
// Parapet needs one block above the roof slab; keep it inside the build height.
const hasParapet = Rf + 1 < H;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const cellGround = (x, z) => {
  const c = cellMap.get(`${x},${z}`);
  return c ? Math.min(c.g, Rf - 3) : null;
};

// Footprint, foundation, walls, floors, cornice, roof
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const gr = cellGround(x, z);
    if (gr === null) continue;
    const isB = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const isCorner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

    // foundation: solid from y0 up to this cell's ground
    for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

    // walls / floors up to the cornice
    for (let y = gr; y <= Rf - 2; y++) {
      const rel = y - base;
      const isFloorRow = rel > 0 && rel % 2 === 0;
      if (isB) {
        if (y === base) put(x, y, z, "stone_bricks");
        else if (isFloorRow) put(x, y, z, "smooth_stone");
        else if (isCorner && (rel % 4 === 1)) put(x, y, z, "stone_bricks"); // quoins
        else put(x, y, z, "bricks");
      } else if (isFloorRow) {
        put(x, y, z, "oak_planks");
      }
    }

    // cornice course on the outer ring
    if (isB && Rf - 1 >= gr) put(x, Rf - 1, z, "smooth_stone");

    // flat roof cap over the whole footprint
    put(x, Rf, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

    // brick parapet on the outer ring, standing on the roof slab
    if (hasParapet && isB) {
      put(x, Rf + 1, z, "brick_wall", { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" });
    }
  }
}

// Street facade (z=0) entrance at the centre bay, at that cell's own ground level
const doorGround = cellGround(2, 0);
if (doorGround !== null) {
  const dy = doorGround;
  put(2, dy, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(2, dy + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // stone lintel above the door (over the string course row)
  put(1, dy + 2, 0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  put(2, dy + 2, 0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  put(3, dy + 2, 0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Window rows per storey (2-block storeys: floor row, then one window row)
const storeys = [];
for (let s = 0; base + 2 * s + 1 <= Rf - 2; s++) storeys.push(base + 2 * s + 1);

// Front (z=0) and rear (z=D-1) facades: two windows per bay, pier in the middle
for (const z of [0, D - 1]) {
  const innerZ = z === 0 ? 1 : D - 2;
  storeys.forEach((w, s) => {
    for (const x of [1, 3]) {
      const gr = cellGround(x, z);
      if (gr === null || w < gr) continue;
      if (z === 0 && w <= base + 1 && x === 2) continue;
      put(x, w, z, "glass_pane");
      // warm light behind some panes
      if ((s + (x === 1 ? 0 : 1)) % 3 === 0) put(x, w, innerZ, "glowstone");
    }
  });
}

// Party-side walls (x=0 and x=W-1): a few windows
for (const x of [0, W - 1]) {
  for (const z of [2, 5, 8]) {
    storeys.forEach((w) => {
      const gr = cellGround(x, z);
      if (gr === null || w < gr) return;
      put(x, w, z, "glass_pane");
    });
  }
}

// Brick chimneys on the roof, if the height allows
if (Rf + 3 < H) {
  for (const [x, z] of [[1, 1], [3, 9]]) {
    put(x, Rf + 1, z, "bricks");
    put(x, Rf + 2, z, "bricks");
    put(x, Rf + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
