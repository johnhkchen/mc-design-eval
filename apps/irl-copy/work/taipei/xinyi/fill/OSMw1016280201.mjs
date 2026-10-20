import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280201";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 38, D = 16;
const ROOF = 26;      // parapet top, about 26 above lowest ground
const CORNICE = 25;   // top storey line / cornice
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const SPANDREL = "light_gray_concrete";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const SLAB = "light_gray_concrete";

const LEVELS = [5, 10, 15, 20, 25]; // storey lines, absolute

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const edge = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const isEdge = edge.n || edge.s || edge.w || edge.e;
  const corner = (edge.n || edge.s) && (edge.w || edge.e);
  const alongIdx = (edge.n || edge.s) ? x : z;
  const pier = corner || alongIdx % 3 === 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Ground floor slab / base course
  g.set(x, gr, z, isEdge ? BASE : SLAB);

  // Floor slabs at storey lines above ground
  for (const L of LEVELS) {
    if (L > gr) {
      g.set(x, L, z, isEdge ? FRAME : SLAB);
    }
  }

  if (!isEdge) continue;

  // Facade: storeys, window grids, spandrels, parapet
  for (let y = gr + 1; y <= ROOF; y++) {
    if (y === ROOF) { g.set(x, y, z, FRAME); continue; }
    const m = y % 5;
    if (m === 0) { g.set(x, y, z, FRAME); continue; }     // storey line
    if (m === 4) { g.set(x, y, z, SPANDREL); continue; }  // spandrel
    // window rows (m = 1, 2, 3)
    if (pier) { g.set(x, y, z, FRAME); continue; }
    const storey = Math.floor(y / 5);
    if (m === 2 && (storey === 1 || storey === 3) && alongIdx % 6 === 1) {
      g.set(x, y, z, "glowstone"); // warm lit window
    } else {
      g.set(x, y, z, GLASS);
    }
  }
}

// Main entrance on the south face, centred on x = 10
if (has(10, 15)) {
  const gr = ground.get("10,15");
  g.set(10, gr + 1, 15, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(10, gr + 2, 15, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  g.set(10, gr + 3, 15, "lantern", { hanging: "true" });
}

// Rooftop plant box with corner lanterns
for (let x = 7; x <= 13; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!has(x, z)) continue;
    for (let y = ROOF; y <= ROOF + 2; y++) g.set(x, y, z, SPANDREL);
  }
}
for (const [x, z] of [[7, 5], [13, 5], [7, 10], [13, 10]]) {
  if (has(x, z)) g.set(x, ROOF + 3, z, "lantern", { hanging: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
