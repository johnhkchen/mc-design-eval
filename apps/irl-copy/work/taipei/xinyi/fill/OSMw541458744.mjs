import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458744";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 9 x 16 footprint, roof ~11 blocks above lowest ground, 2 storeys of ~5 blocks.
// Read as a 1980s-90s Taipei mid-rise commercial block: stone plinth, pale tiled/quartz
// facade, red shop awning band, glass shopfronts, framed upper windows, parapet and roof plant.
const W = 9, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ROOF = 11;   // roof deck level
const PARA = 12;   // parapet course on the perimeter
const FLOORS = [5, 10];

const minG = Math.min(...cells.map((c) => c[2]));
const map = new Map();
for (const [x, z, gr] of cells) {
  map.set(`${x},${z}`, Math.min(gr - minG, ROOF - 2));
}
const has = (x, z) => map.has(`${x},${z}`);
const ground = (x, z) => map.get(`${x},${z}`);

// outward faces: [dx, dz, facingName]
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const facesOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => facesOf(x, z).length > 0;

// Front = north-facing boundary (fallback: first boundary face). Door at the median x.
const northCells = [...map.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => facesOf(x, z).some(([, dz]) => dz === -1))
  .sort((a, b) => a[0] - b[0]);
let doorCell = null;
let doorFace = null;
if (northCells.length) {
  doorCell = northCells[Math.floor(northCells.length / 2)];
  doorFace = [0, -1, "north"];
} else {
  const any = [...map.keys()].map((k) => k.split(",").map(Number)).find(([x, z]) => isPerim(x, z));
  if (any) {
    doorCell = any;
    doorFace = facesOf(any[0], any[1])[0];
  }
}

for (const [key, gr] of map) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);

  // Foundation under the cell up to its ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs across the footprint at storey lines above the ground.
  for (const L of FLOORS) {
    if (L >= gr) g.set(x, L, z, "light_gray_concrete");
  }

  // Roof deck over the whole footprint.
  g.set(x, ROOF, z, "light_gray_concrete");

  if (perim) {
    g.set(x, PARA, z, "smooth_quartz");
  }

  // Facade walls on each exposed face.
  if (perim) {
    for (const face of facesOf(x, z)) {
      const [dx, dz] = face;
      const idx = dx !== 0 ? z : x; // along-face index for the window rhythm
      for (let y = gr; y <= ROOF - 1; y++) {
        let blk;
        if (y === gr) {
          blk = "polished_andesite";              // base course
        } else if (FLOORS.includes(y)) {
          blk = "light_gray_concrete";            // storey lines
        } else if (y < 5) {
          // Ground storey: shopfront glazing with stone mullions; y=4 is the red awning band.
          if (y === 4) blk = "red_concrete";
          else blk = idx % 2 === 1 ? "glass_pane" : "stone_bricks";
        } else if (y === 9) {
          blk = "smooth_quartz";                  // lintel band
        } else {
          // Upper storey: framed window grid, y 6..8.
          blk = idx % 2 === 0 ? "glass_pane" : "smooth_quartz";
        }
        g.set(x, y, z, blk);
      }

      // Warm light behind selected upper windows, two cells in, leaving an air gap.
      for (let y = 7; y <= 7; y++) {
        if (idx % 4 === 0) {
          const ix = x - 2 * dx;
          const iz = z - 2 * dz;
          if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Entrance: door in the front wall, lower and upper halves, with the red awning above it.
if (doorCell && doorFace) {
  const [x, z] = doorCell;
  const facing = doorFace[2];
  g.set(x, ground(x, z) + 1, z, "dark_oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, ground(x, z) + 2, z, "dark_oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Canopy slab sitting in the wall above the door.
  g.set(x, ground(x, z) + 3, z, "red_concrete_slab", { type: "bottom" });
}

// Roof plant: a small block of equipment on the deck, centred on the footprint.
for (const x of [3, 4]) {
  for (const z of [6, 7]) {
    if (has(x, z)) {
      g.set(x, ROOF + 1, z, "white_concrete");
      g.set(x, ROOF + 2, z, "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
