import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, Xinyi district style: white tiled
// concrete frame, stone base and storey bands, shopfront with a dark-oak door
// and canopy on the street (north) face, pane windows with warm lanterns
// inside, parapet and a rooftop plant box with a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888783";
const W = 15, H = 23, D = 24;
const ROOF = 10;          // roof deck y (roof edge ~11 above lowest ground)
const PARAPET = ROOF + 1; // parapet course
const FRONT = "north";    // street face (min z)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(g)));
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Exterior faces of a footprint cell, north (min z) first so corners take the front.
function outsideFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
const isBoundary = (x, z) => outsideFaces(x, z).length > 0;
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function paneProps(face) {
  return (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Facade block for a boundary cell at height y (y > ground).
function facadeAt(x, z, y, gr, face) {
  const front = face === FRONT;
  const t = (face === "north" || face === "south") ? x : z;

  // Entrance: door on the street face, canopy above it.
  if (front && x === 7 && (y === gr + 1 || y === gr + 2)) {
    return ["dark_oak_door", {
      facing: "north", half: y === gr + 1 ? "lower" : "upper",
      hinge: "left", open: "false", powered: "false",
    }];
  }
  if (front && y === gr + 3 && x >= 5 && x <= 9) {
    return ["dark_oak_slab", { type: "top", waterlogged: "false" }];
  }
  // Storey lines (cornice band at 5, roof edge band at ROOF).
  if (y === ROOF || y === 5) return ["smooth_stone"];
  // Spandrels above each window band.
  if (y % 5 === 4) return ["white_concrete"];
  // Pilasters every third column.
  if (t % 3 === 0) return ["smooth_quartz"];
  // Ground-floor shopfront glass on the street face.
  if (front && y < 5) return ["glass"];
  // Upper window panes with frame.
  return ["glass_pane", paneProps(face)];
}

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
};

for (const [x, z, gr] of cells.map(([x, z]) => [x, z, G(x, z)])) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr > ROOF) continue;

  // Floor slab at ground level.
  put(x, gr, z, "stone_bricks");

  const faces = outsideFaces(x, z);
  if (faces.length > 0) {
    const face = faces[0];
    for (let y = gr + 1; y <= ROOF; y++) {
      const [block, props] = facadeAt(x, z, y, gr, face);
      put(x, y, z, block, props);
    }
    // Parapet course on the roof edge.
    put(x, PARAPET, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

    // Lantern warmth inside a window: interior neighbour, on the storey-2 floor slab.
    const [dx, dz] = inward[face];
    const nx = x + dx, nz = z + dz;
    const nbGround = has(nx, nz) ? G(nx, nz) : null;
    const isWindowRow = face !== FRONT || x !== 7;
    if (nbGround !== null && !isBoundary(nx, nz) && nbGround <= 5
        && (x + z) % 4 === 0 && isWindowRow && gr < 6) {
      put(nx, 6, nz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  } else {
    // Interior cell: storey floor slabs and roof deck only (no interior fit-out).
    for (let y = gr + 1; y <= ROOF; y++) {
      if (y === 5) put(x, y, z, "smooth_stone");
      else if (y === ROOF) put(x, y, z, "light_gray_concrete");
    }
  }
}

// Rooftop plant box and mast, on footprint cells above the roof deck.
for (let x = 4; x <= 10; x++) {
  for (let z = 8; z <= 15; z++) {
    if (!has(x, z) || G(x, z) > ROOF) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
    put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (has(7, 12) && G(7, 12) <= ROOF) {
  for (let y = ROOF + 4; y <= ROOF + 7; y++) {
    put(7, y, 12, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

vox.save(`${DIR}/${ID}.nbt`);
