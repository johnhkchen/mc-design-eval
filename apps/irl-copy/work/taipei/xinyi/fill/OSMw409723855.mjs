import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: two storeys of 5 blocks, a glazed
// shopfront, white and light-grey concrete facade with pilaster piers, a stone
// base, a crowned parapet and a grouped roof plant enclosure. Roof top sits at
// y = 12 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw409723855";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 24, D = 21;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const FACES = [
  { name: "north", d: [0, -1], along: "x" },
  { name: "south", d: [0, 1], along: "x" },
  { name: "west", d: [-1, 0], along: "z" },
  { name: "east", d: [1, 0], along: "z" },
];

function exposedFaces(x, z) {
  return FACES.filter(f => !has(x + f.d[0], z + f.d[1]));
}

// Perimeter cells and their exposed faces.
const info = new Map();
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const ex = exposedFaces(x, z);
  if (ex.length) info.set(`${x},${z}`, { x, z, ex, corner: ex.length > 1 });
}

// Entrance: middle of the south-facing exposed cells.
const southCells = [...info.values()]
  .filter(c => c.ex.some(f => f.name === "south"))
  .sort((a, b) => a.x - b.x);
const entranceCell = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const entranceKey = entranceCell ? `${entranceCell.x},${entranceCell.z}` : null;

// 1) Foundations, floors and roof deck for every footprint cell.
for (const [key, g0] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < g0; y++) put(x, y, z, "stone");
  put(x, g0, z, "polished_andesite");
  if (5 >= g0) put(x, 5, z, "white_concrete");
  if (10 >= g0) put(x, 10, z, "white_concrete");
}

// 2) Perimeter walls, shopfront, window grid, entrance and crowned parapet.
for (const c of info.values()) {
  const { x, z, ex, corner } = c;
  const g0 = gAt(x, z);
  const face = ex[0];
  const p = face.along === "x" ? x : z;
  const pier = corner || p % 3 === 0;
  const isEntrance = `${x},${z}` === entranceKey;

  for (let y = g0; y <= 11; y++) {
    let id = null;
    let props = null;

    if (y === g0) {
      id = "stone_bricks"; // base course
    } else if (y === 10) {
      id = "light_gray_concrete"; // cornice
    } else if (y === 11) {
      // Crowned parapet: alternating merlons and low slabs
      if (corner || p % 2 === 0) id = "white_concrete";
      else { id = "smooth_stone_slab"; props = { type: "bottom", waterlogged: "false" }; }
    } else if (y === 4 || y === 5) {
      id = "light_gray_concrete"; // storey lines
    } else if (y <= 3) {
      // Ground-floor shopfront
      if (isEntrance && (y === g0 + 1 || y === g0 + 2)) {
        id = "oak_door";
        const half = y === g0 + 1 ? "lower" : "upper";
        props = { facing: face.name, half, hinge: "left", open: "false", powered: "false" };
      } else if (pier) {
        id = "white_concrete";
      } else {
        id = "glass";
      }
    } else {
      // Storey-2 window grid, y in 6..9
      if (pier) {
        id = "light_gray_concrete";
      } else if (y === 6 || y === 9) {
        id = "white_concrete"; // sills and heads
      } else {
        id = "glass";
      }
    }

    if (id) {
      if (props) put(x, y, z, id, props);
      else put(x, y, z, id);
    }
  }

  // Entrance canopy: light lintel above the door, lanterns beside it.
  if (isEntrance) {
    put(x, g0 + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    const sideCells = [[-1, 0], [1, 0]];
    for (const [dx, dz] of sideCells) {
      const sx = x + dx, sz = z + dz;
      if (has(sx, sz) && info.has(`${sx},${sz}`)) {
        put(sx, g0 + 2, sz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }

  // Warm lights behind some glass.
  if (!pier) {
    const inward = [-face.d[0], -face.d[1]];
    const ix = x + inward[0], iz = z + inward[1];
    const interior = has(ix, iz) && !info.has(`${ix},${iz}`);
    if (interior) {
      if (p % 6 === 1 && 2 >= gAt(ix, iz)) put(ix, 2, iz, "glowstone");
      if (p % 6 === 4 && 8 >= gAt(ix, iz)) put(ix, 8, iz, "shroomlight");
    }
  }
}

// 3) Roof plant: one grouped enclosure with a rim, rather than scattered blocks.
const plant = { x0: 4, x1: 8, z0: 7, z1: 11 };
for (const [key, g0] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (info.has(key) || g0 > 10) continue;
  if (x < plant.x0 || x > plant.x1 || z < plant.z0 || z > plant.z1) continue;
  const rim = x === plant.x0 || x === plant.x1 || z === plant.z0 || z === plant.z1;
  if (rim) put(x, 11, z, "light_gray_concrete");
  else put(x, 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
