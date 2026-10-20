import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343797";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Era: 1970s-80s Xinyi-edge low-rise commercial block. Two storeys of ~5 blocks,
// cement-render walls, stone base, red awning over a glazed shopfront, flat roof
// with parapet, cornice, rooftop AC units and a stair housing.
const SLAB = 5;      // storey line between the two floors
const ROOF = 10;     // top wall/parapet block (roof ~11 blocks above lowest ground)

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));
const has = (x, z) => G.has(key(x, z));
const isPerim = (x, z) => !has(x, z + 1) || !has(x, z - 1) || !has(x + 1, z) || !has(x - 1, z);

// Pre-pass: door position = median x of non-corner south-facing cells
const frontXs = cells
  .filter(([x, z]) => !has(x, z + 1) && has(x - 1, z) && has(x + 1, z))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const xsAll = cells.map(c => c[0]), zsAll = cells.map(c => c[1]);
const xMin = Math.min(...xsAll), xMax = Math.max(...xsAll);
const zMin = Math.min(...zsAll), zMax = Math.max(...zsAll);

const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const gy = Math.round(gr);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const eS = !has(x, z + 1), eN = !has(x, z - 1), eE = !has(x + 1, z), eW = !has(x - 1, z);
  const edgeCount = [eS, eN, eE, eW].filter(Boolean).length;

  // Interior cell: floor at ground, storey slab, roof deck, no walls
  if (edgeCount === 0) {
    g.set(x, gy, z, "smooth_stone");
    if (SLAB > gy) g.set(x, SLAB, z, "smooth_stone");
    g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  const face = eS ? "S" : eN ? "N" : eE ? "E" : "W";
  const isFront = face === "S";
  const idx = (face === "S" || face === "N") ? x : z;
  const isCorner = edgeCount >= 2;

  // Inward offset for lights behind windows
  const inward = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] }[face];
  const ix = x + inward[0], iz = z + inward[1];
  const inwardInterior = !isCorner && has(ix, iz) && !isPerim(ix, iz);

  for (let y = gy; y <= ROOF; y++) {
    // Corner pilasters
    if (isCorner) {
      if (y === gy) g.set(x, y, z, "stone_bricks");
      else if (y === ROOF) g.set(x, y, z, "smooth_stone");
      else if (y === SLAB) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // Base course, parapet cap, cornice, storey line
    if (y === gy) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === ROOF) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === ROOF - 1) { g.set(x, y, z, "smooth_stone_slab", SLAB_BOTTOM); continue; }
    if (y === SLAB) { g.set(x, y, z, "smooth_stone"); continue; }

    // Front awning band over the shopfront
    if (isFront && y === SLAB - 1) { g.set(x, y, z, "red_concrete"); continue; }

    // Front ground floor: shopfront glazing, piers, entrance door
    if (isFront && y > gy && y < SLAB - 1) {
      if (x === doorX) {
        if (y === gy + 1) { g.set(x, y, z, "dark_oak_door", DOOR_LOWER); continue; }
        if (y === gy + 2) { g.set(x, y, z, "dark_oak_door", DOOR_UPPER); continue; }
      }
      if (idx % 3 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass_pane");
      continue;
    }

    // Upper storey windows and storey 1 windows on other faces
    const winRow = (y > gy && y < SLAB - 1) || (y > SLAB && y < ROOF - 1);
    if (winRow && idx % 3 === 1) {
      g.set(x, y, z, "glass_pane");
      // Warm light behind some upper-storey glass
      if (y === SLAB + 2 && idx % 6 === 1 && inwardInterior) {
        g.set(ix, y, iz, "glowstone");
      }
      continue;
    }

    // Piers and plain wall
    g.set(x, y, z, "white_concrete");
  }

  // Roof deck (parapet already set at ROOF)
  g.set(x, ROOF, z, "smooth_stone");
}

// Rooftop plant: two AC units and a stair housing on interior roof cells
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  // AC units
  if (x >= xMin + 3 && x <= xMin + 4 && z >= zMin + 4 && z <= zMin + 5) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
  // Stair housing (2 wide, 3 high) with cap
  if (x >= xMin + 1 && x <= xMin + 2 && z >= zMin + 1 && z <= zMin + 2) {
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "white_concrete");
    g.set(x, ROOF + 3, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
