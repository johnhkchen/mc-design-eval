import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 8 x 14 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, mid-century (c. 1970s-80s) Taipei low-rise shophouse:
// cream rendered walls, stone plinth, light-grey banding, a shopfront on the
// street (north, z = 0) with a central entrance, and a flat parapeted roof
// with a water tank and a stair housing.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950888";
const W = 8, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);

const inFP = (x, z) => ground.has(`${x},${z}`);

// Perimeter face of a footprint cell (null = interior cell)
const faceOf = (x, z) => {
  if (!inFP(x, z - 1)) return "north"; // street frontage
  if (!inFP(x, z + 1)) return "south";
  if (!inFP(x - 1, z)) return "west";
  if (!inFP(x + 1, z)) return "east";
  return null;
};
const isInterior = (x, z) => inFP(x, z) && faceOf(x, z) === null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, st) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Pass 1: foundations, floor slabs, roof deck, perimeter walls
for (const [x, z, gy] of cells) {
  // foundation up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  // storey-1 / storey-2 floor slab (only where the ground is low enough)
  if (gy <= 4) put(x, 5, z, "light_gray_concrete");
  // flat roof deck
  if (gy <= 10) put(x, 10, z, "light_gray_concrete");

  const face = faceOf(x, z);
  if (!face) continue; // interior cell: air behind the glass

  const ns = face === "north" || face === "south";
  const t = ns ? x : z;           // position along the face
  const L = ns ? W : D;           // face length
  const pier = t === 0 || t === L - 1 || t % 3 === 0;
  const win = !pier;
  const front = face === "north";
  const door = front && x === 3 && gy <= 2;
  const pane = ns ? PANE_NS : PANE_EW;

  for (let y = gy; y <= 11; y++) {
    // parapet
    if (y === 11) { put(x, y, z, "smooth_stone"); continue; }
    // cornice and string course
    if (y === 10 || y === 5) { put(x, y, z, "light_gray_concrete"); continue; }

    // ground-floor entrance
    if (door && y <= 4) {
      if (y === gy) { put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gy + 1) { put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 4 && x >= 2 && x <= 4) { put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
      put(x, y, z, "white_concrete");
      continue;
    }

    // plinth / shopfront base
    if (y <= 1) { put(x, y, z, "stone_bricks"); continue; }

    // ground storey: shopfront glazing at y 2..3, solid head at 4
    if (y <= 4) {
      if (y <= 3 && win) put(x, y, z, "glass_pane", pane);
      else put(x, y, z, "white_concrete");
      continue;
    }

    // upper storey: sills and heads solid, panes at y 7..8
    if ((y === 7 || y === 8) && win) put(x, y, z, "glass_pane", pane);
    else put(x, y, z, "white_concrete");
  }
}

// Pass 2: warm lights behind some glass (interior cells only)
for (const [x, z, gy] of cells) {
  const face = faceOf(x, z);
  if (!face) continue;
  const ns = face === "north" || face === "south";
  const t = ns ? x : z;
  const pier = t === 0 || t === (ns ? W : D) - 1 || t % 3 === 0;
  if (pier) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!isInterior(ix, iz)) continue;

  // glowstone in the shopfront at street level
  if (face === "north" && t % 6 === 1 && gy <= 2) {
    put(ix, 2, iz, "glowstone");
  }
  // shroomlight standing on the upper floor slab behind selected windows
  if (t % 6 === 2 && gy <= 4) {
    put(ix, 6, iz, "shroomlight");
  }
}

// Pass 3: roof equipment on the deck (y 10 is the deck top = 11)
const onRoof = (cs) => cs.every(([x, z]) => inFP(x, z));

// water tank, 2 x 2, on the rear-left of the roof
const tank = [[1, 2], [2, 2], [1, 3], [2, 3]];
if (onRoof(tank)) {
  for (const [x, z] of tank) {
    put(x, 11, z, "iron_block");
    put(x, 12, z, "iron_block");
  }
}

// stair/lift housing, 2 x 2, toward the rear-right, with a solid cap
const housing = [[5, 9], [6, 9], [5, 10], [6, 10]];
if (onRoof(housing)) {
  for (const [x, z] of housing) {
    for (let y = 11; y <= 13; y++) put(x, y, z, "white_concrete");
    put(x, 14, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
