import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538461863";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 23 x 17. Two-storey 1970s-80s Taipei commercial block:
// reinforced concrete frame, white-painted wall with vertical pilasters,
// tinted glazing, polished granite shopfront, flat roof with parapet and plant box.
const W = 23;
const D = 17;

const key = (x, z) => `${x},${z}`;
const G = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  G.set(key(x, z), gr);
  maxG = Math.max(maxG, gr);
}
const has = (x, z) => G.has(key(x, z));

const H = Math.max(23, maxG + 13);
const g = new Voxels([W, H, D]);

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");

  // Floor slabs: ground floor, upper floor, roof.
  g.set(x, gr, z, "light_gray_concrete");
  g.set(x, gr + 5, z, "light_gray_concrete");
  g.set(x, gr + 10, z, "light_gray_concrete");

  const out = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (out.length === 0) continue; // interior cell: slabs only, air above

  const corner = out.length >= 2;
  const along = (x + z) % 3;
  const pilaster = corner || along === 0;

  // Walls: storey 1 (r 1..4), floor band r5, storey 2 (r 6..9), cornice r10.
  for (let r = 1; r <= 10; r++) {
    const y = gr + r;
    let b;
    if (r === 5) continue; // floor slab already placed
    if (r === 10) {
      b = "smooth_stone"; // cornice
    } else if (pilaster) {
      b = "white_concrete";
    } else if (r === 1) {
      b = "polished_granite"; // base course / shopfront plinth
    } else if (r === 4 || r === 6 || r === 9) {
      b = "white_concrete"; // spandrels and lintels
    } else if (r === 2 || r === 3) {
      b = "glass"; // ground floor glazing
    } else {
      b = "light_blue_stained_glass"; // upper storey glazing
    }
    g.set(x, y, z, b);
  }

  // Parapet on the roof edge.
  g.set(x, gr + 11, z, "white_concrete");

  // Warm light behind some glazing (air gap is the interior cell).
  if (!pilaster) {
    const outDir = out[0];
    const ix = x - outDir[0];
    const iz = z - outDir[1];
    if (has(ix, iz) && (x + z) % 6 === 1) {
      g.set(ix, gr + 2, iz, "glowstone");
      g.set(ix, gr + 7, iz, "glowstone");
    }
  }

  // Entrance on the front (z-min) face, centred.
  const frontFace = out.some(([dx, dz]) => dx === 0 && dz === -1);
  if (frontFace && x === 11) {
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 4, z, "dark_oak_planks"); // entrance lintel/canopy line
  }
}

// Rooftop plant enclosure near the centre of the roof.
for (const [x, z, gr] of cells) {
  const out = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (out.length > 0) continue;
  if (x >= 9 && x <= 13 && z >= 6 && z <= 10) {
    g.set(x, gr + 11, z, "stone_bricks");
    if (x >= 10 && x <= 12 && z >= 7 && z <= 9) g.set(x, gr + 12, z, "stone_bricks");
  }
}

g.save(`${dir}/${id}.nbt`);
