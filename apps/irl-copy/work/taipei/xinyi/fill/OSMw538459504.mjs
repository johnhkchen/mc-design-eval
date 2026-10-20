import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey Xinyi-style commercial block (no record; era and type chosen from the
// lidar roof height of ~11 blocks, i.e. two 5-block storeys). Plain white render,
// stone-brick plinth, shopfront ground floor, banded upper floor with window grid,
// stone cornice and parapet, flat roof with a small plant box and lantern.
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459504.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459504.nbt";
const W = 11, H = 23, D = 11;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward directions for a footprint cell: a side is exterior when its neighbour is missing.
function exteriorSides(x, z) {
  const s = [];
  if (!has(x, z - 1)) s.push("north");
  if (!has(x, z + 1)) s.push("south");
  if (!has(x - 1, z)) s.push("west");
  if (!has(x + 1, z)) s.push("east");
  return s;
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function paneProps(dir) {
  const xRun = dir === "north" || dir === "south";
  return {
    north: xRun ? "false" : "true",
    south: xRun ? "false" : "true",
    east: xRun ? "true" : "false",
    west: xRun ? "true" : "false",
    waterlogged: "false",
  };
}

// Exterior wall column for one edge cell, heights relative to its ground gy.
function wallColumn(x, z, gy, dir) {
  const idx = dir === "north" || dir === "south" ? x : z;
  const pillar = idx % 3 === 0;
  const top = gy + 11;
  for (let h = 1; h <= 11; h++) {
    const y = gy + h;
    let id = "white_concrete";
    let props;
    if (h === 1) id = "stone_bricks";                       // base course
    else if (h === 2 || h === 3) {                           // shopfront
      if (pillar) id = "stone_bricks";
      else { id = "glass_pane"; props = paneProps(dir); }
    } else if (h === 4) id = "smooth_stone";                 // shopfront lintel
    else if (h === 5) id = "smooth_stone";                   // storey line
    else if (h === 6) id = "white_concrete";
    else if (h === 7 || h === 8) {                           // upper windows
      if (pillar) id = "white_concrete";
      else { id = "glass_pane"; props = paneProps(dir); }
    } else if (h === 9) id = "white_concrete";
    else if (h === 10) {                                     // cornice
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    } else if (h === 11) id = "white_concrete";              // parapet
    put(x, y, z, id, props);
  }
  return top;
}

// Entrance: centre bay of the south face, with a door and glass above.
function entrance(x, z, gy) {
  const y = gy + 2;
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(x, y, z, "oak_door", { ...base, half: "lower" });
  put(x, y + 1, z, "oak_door", { ...base, half: "upper" });
}

// Pass 1: foundations, walls, floors, roof.
for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gy; y++) put(x, y, z, "stone_bricks");

  const sides = exteriorSides(x, z);
  if (sides.length > 0) {
    const onSouthCentre = sides.includes("south") && x === 5;
    if (onSouthCentre) {
      // Entrance bay: wall column first, then door overwrites the shopfront cells.
      wallColumn(x, z, gy, "south");
      entrance(x, z, gy);
    } else {
      wallColumn(x, z, gy, sides[0]);
    }
  } else {
    // Interior cell: ground floor, storey floors, roof deck; air between.
    put(x, gy + 1, z, "smooth_stone");
    put(x, gy + 5, z, "smooth_stone");
    put(x, gy + 6, z, "smooth_stone");
    put(x, gy + 11, z, "smooth_stone");
  }
}

// Pass 2: warm lights behind some upper windows (interior cells only) and rooftop plant.
for (const [x, z, gy] of cells) {
  if (exteriorSides(x, z).length > 0) continue;
  if ((x + z) % 5 === 0) put(x, gy + 7, z, "glowstone");
}

// Roof plant box on the central interior cells and a lantern on top.
let centreX = null, centreZ = null;
for (const [x, z, gy] of cells) {
  if (exteriorSides(x, z).length > 0) continue;
  if (x >= 4 && x <= 6 && z >= 4 && z <= 6) {
    put(x, gy + 12, z, "light_gray_concrete");
    put(x, gy + 13, z, "light_gray_concrete");
    if (x === 5 && z === 5) { centreX = x; centreZ = z; }
  }
}
if (centreX !== null) {
  const gy = ground.get(`${centreX},${centreZ}`);
  put(centreX, gy + 14, centreZ, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(OUT);
