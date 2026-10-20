import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343770.cells.json", "utf8"));

const W = 13, H = 23, D = 33;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Which outward face an edge cell presents, and its index along that face
function faceOf(x, z) {
  if (!has(x, z - 1)) return { f: "N", i: x, len: W };
  if (!has(x, z + 1)) return { f: "S", i: x, len: W };
  if (!has(x - 1, z)) return { f: "W", i: z, len: D };
  if (!has(x + 1, z)) return { f: "E", i: z, len: D };
  return null;
}

// Minimum z of the footprint = the street (north) side with the entrance
let zMin = Infinity;
for (const [, z] of cells) zMin = Math.min(zMin, z);

// Palette: 1990s Taipei commercial/office block. White tiled walls, grey
// spandrels, light-blue glass in bronze-grey frames, stone base.
const WALL = "white_concrete";
const FRAME = "light_gray_concrete";
const BASE = "polished_andesite";
const GLASS = "light_blue_stained_glass";
const FOUND = "stone_bricks";
const SLAB = "light_gray_concrete";
const WARM = "glowstone";
const LIT2 = "shroomlight";

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Ground-floor slab over the whole footprint
  g.set(x, gr, z, SLAB);
  // Storey-2 floor slab (interior) and roof deck
  g.set(x, gr + 5, z, SLAB);
  g.set(x, gr + 10, z, SLAB);

  const fa = faceOf(x, z);
  if (!fa) continue; // interior cell: air above the floor slabs

  const pillar = fa.i % 4 === 0 || fa.i === fa.len - 1;
  const isEntranceCell = fa.f === "N" && z === zMin && x === 6;

  // Full wall column from the base up to the parapet
  for (let y = gr + 1; y <= gr + 11; y++) g.set(x, y, z, WALL);

  // Storey 1 (shopfront): base course, glass band, lintel
  g.set(x, gr + 1, z, BASE);
  for (const y of [gr + 2, gr + 3]) {
    if (pillar) {
      g.set(x, y, z, WALL);
    } else if ((fa.i + gr) % 3 === 0 && fa.f === "N") {
      g.set(x, y, z, WARM); // lit shopfront behind the street glass
    } else {
      g.set(x, y, z, GLASS);
    }
  }
  g.set(x, gr + 4, z, pillar ? WALL : FRAME);

  // Storey break band
  g.set(x, gr + 5, z, FRAME);

  // Storey 2: spandrel, window band, spandrel
  g.set(x, gr + 6, z, WALL);
  for (const y of [gr + 7, gr + 8]) {
    if (pillar) {
      g.set(x, y, z, WALL);
    } else if ((fa.i * 2 + gr) % 5 === 0) {
      g.set(x, y, z, LIT2); // warm lit office window
    } else {
      g.set(x, y, z, GLASS);
    }
  }
  g.set(x, gr + 9, z, WALL);

  // Cornice band and parapet cap
  g.set(x, gr + 10, z, FRAME);
  g.set(x, gr + 11, z, FRAME);

  // Entrance: door at the centre of the street face, dark canopy above
  if (isEntranceCell) {
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  if (fa.f === "N" && fa.i >= 4 && fa.i <= 8) {
    g.set(x, gr + 4, z, "dark_oak_planks"); // entrance canopy accent
  }
}

// Roof plant: a mechanical penthouse in the middle of the roof
for (const [x, z, gr] of cells) {
  if (x >= 4 && x <= 8 && z >= 12 && z <= 18) {
    g.set(x, gr + 11, z, FRAME);
    g.set(x, gr + 12, z, z === 12 || z === 18 || x === 4 || x === 8 ? WALL : "gray_concrete");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343770.nbt");
