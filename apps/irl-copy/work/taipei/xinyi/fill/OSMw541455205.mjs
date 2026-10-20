import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 17 x 17 footprint, roof about 11 blocks above lowest ground.
// Reading: a two-storey mid-century Taipei commercial block. Pale concrete frame,
// stone-clad plinth and cornice, shopfronts with glass and an entrance on the south
// face, a glazed upper storey with lit windows, and a rooftop plant penthouse.

const W = 17, H = 23, D = 17;
const ROOF = 11;          // roof deck level above lowest ground
const CORNICE = 11;
const PARAPET = 12;

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455205.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), Math.max(0, Math.min(H - 1, Math.round(gr))));

const inFp = (x, z) => fp.has(key(x, z));

// Exterior faces of a footprint cell, with the inward offset for lights.
function exteriorFaces(x, z) {
  const out = [];
  if (!inFp(x, z - 1)) out.push({ face: "north", dx: 0, dz: 1 });
  if (!inFp(x, z + 1)) out.push({ face: "south", dx: 0, dz: -1 });
  if (!inFp(x - 1, z)) out.push({ face: "west", dx: 1, dz: 0 });
  if (!inFp(x + 1, z)) out.push({ face: "east", dx: -1, dz: 0 });
  return out;
}

const put = (x, y, z, block, props) => {
  if (y < 0 || y > H - 1 || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Facade row material for an exterior cell at height y.
function facadeBlock(y, idx, pier) {
  switch (true) {
    case y === 0: return "stone_bricks";                 // plinth
    case y <= 3: return pier ? "white_concrete" : "glass_pane"; // shopfront
    case y === 4: return "smooth_stone";                 // shopfront lintel
    case y === 5: return "white_concrete";               // storey line
    case y <= 9: return pier ? "white_concrete" : "glass_pane"; // upper glazing
    case y === 10: return "smooth_stone";                // sill band
    case y === CORNICE: return "stone_bricks";           // cornice
    case y === PARAPET: return "white_concrete";         // parapet
    default: return "white_concrete";
  }
}

// Pass 1: foundations, floor slabs, roof deck, facades.
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);

  if (faces.length === 0) {
    // Interior: floor slabs at ground and storey line, roof deck at ROOF, air between.
    put(x, gr, z, "smooth_stone");
    if (gr < 5) put(x, 5, z, "smooth_stone");
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Exterior: pick the primary face (north/south first, then west/east).
  const order = ["north", "south", "west", "east"];
  const primary = order.map(f => faces.find(e => e.face === f)).find(Boolean);
  const idx = (primary.face === "north" || primary.face === "south") ? x : z;
  const pier = idx % 3 === 0 || idx === 0 || idx === 16;

  for (let y = gr; y <= PARAPET; y++) {
    let block = facadeBlock(y, idx, pier);

    // Entrance: south face, centre bay, two-high oak door, glazed above is kept as lintel.
    if (primary.face === "south" && idx === 8 && (y === 1 || y === 2)) {
      continue; // door placed in pass 2
    }
    put(x, y, z, block);
  }

  // Corner/roof-edge treatment: the roof deck ring at ROOF is the cornice, already set.
  // Floor slab for the storey line inside the outer wall.
  if (gr < 5) put(x, 5, z, "smooth_stone");
  if (gr <= 0) put(x, 0, z, "stone_bricks");
}

// Pass 2: entrance door, lit windows, rooftop plant, roof deck.
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);
  const faces = exteriorFaces(x, z);
  if (faces.length === 0) continue;

  const order = ["north", "south", "west", "east"];
  const primary = order.map(f => faces.find(e => e.face === f)).find(Boolean);
  const idx = (primary.face === "north" || primary.face === "south") ? x : z;

  if (primary.face === "south" && idx === 8) {
    put(x, 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 4, z, "smooth_stone"); // canopy edge over entrance
  }

  // Warm lanterns in some upper-storey windows, placed inside the glazing.
  const pier = idx % 3 === 0 || idx === 0 || idx === 16;
  if (!pier && idx % 6 === 2 && gr <= 6) {
    const ix = x + primary.dx, iz = z + primary.dz;
    if (inFp(ix, iz) && exteriorFaces(ix, iz).length === 0) {
      put(ix, 6, iz, "lantern", { hanging: "false" });
    }
  }
}

// Rooftop plant penthouse in the middle of the roof, with a simple parapet.
for (let x = 6; x <= 10; x++) {
  for (let z = 6; z <= 10; z++) {
    if (!inFp(x, z)) continue;
    const edge = x === 6 || x === 10 || z === 6 || z === 10;
    put(x, ROOF + 1, z, edge ? "light_gray_concrete" : "smooth_stone");
    put(x, ROOF + 2, z, edge ? "light_gray_concrete" : "smooth_stone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455205.nbt");
