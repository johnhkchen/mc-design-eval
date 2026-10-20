import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE106-0165-1F.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE106-0165-1F.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// Record: built 2017, roof ~7 blocks above lowest ground. A small 2017 Xinyi
// commercial block: white-painted concrete wall, stone plinth, ground-floor
// glass shopfront, two upper storeys of framed glass, stone cornice band,
// smooth-quartz parapet, light-grey roof with one plant box.
const W = 8, H = 19, D = 7;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  gmap.set(`${x},${z}`, gr ?? 0);
}
const has = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);
const perim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const missingCount = (x, z) =>
  [!has(x + 1, z), !has(x - 1, z), !has(x, z + 1), !has(x, z - 1)].filter(Boolean).length;

// Entrance: on the south face (max z), the cell nearest the middle of that face.
const southCells = [...gmap.keys()].map(k => k.split(",").map(Number)).filter(([x, z]) => !has(x, z + 1));
let entX = -1, entZ = -1;
if (southCells.length) {
  const meanX = southCells.reduce((s, [x]) => s + x, 0) / southCells.length;
  southCells.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  [entX, entZ] = southCells[0];
}

// Glass pane with connections to neighbouring ring cells.
function pane(x, y, z, color) {
  const conn = (nx, nz) => (has(nx, nz) && perim(nx, nz) ? "true" : "false");
  g.set(x, y, z, `${color}_stained_glass_pane`, {
    east: conn(x + 1, z),
    west: conn(x - 1, z),
    north: conn(x, z - 1),
    south: conn(x, z + 1),
    waterlogged: "false",
  });
}

const FRAME = "white_concrete";
const ROOF = "light_gray_concrete";
const GLASS = "light_blue";

for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const isPerim = perim(x, z);
  const corner = missingCount(x, z) >= 2;
  const roofY = gr <= 6 ? 6 : gr;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Body walls, floors and interior columns.
  if (gr <= 5) {
    for (let y = gr; y < roofY; y++) {
      if (isPerim) {
        if (y === gr) {
          g.set(x, y, z, "stone_bricks"); // base course
        } else if (y === 3) {
          g.set(x, y, z, "smooth_stone"); // storey line
        } else if (x === entX && z === entZ && y <= gr + 2) {
          if (y === gr + 2) g.set(x, y, z, "stone_bricks"); // lintel; door set later
        } else if (corner) {
          g.set(x, y, z, "smooth_quartz"); // full-height corner pillar
        } else if (y < 3) {
          pane(x, y, z, GLASS);
        } else {
          if ((x + z) % 2 === 1) pane(x, y, z, GLASS);
          else g.set(x, y, z, FRAME);
        }
      } else {
        // interior: air gap behind glass, floor slab per storey
        if (y === 3) g.set(x, y, z, "smooth_stone");
      }
    }
  }

  // Interior structural columns carry the floors and roof.
  if (!isPerim && (x === 2 || x === 5) && (z === 2 || z === 4) && gr <= 5) {
    for (let y = gr; y < roofY; y++) g.set(x, y, z, "quartz_pillar", { axis: "y" });
  }

  // Roof edge: stone cornice band on the perimeter, light-grey roof inside.
  if (isPerim) {
    g.set(x, roofY, z, "smooth_stone");
  } else {
    g.set(x, roofY, z, ROOF);
  }

  // Parapet on the perimeter.
  if (isPerim && roofY + 1 < H) {
    g.set(x, roofY + 1, z, "smooth_quartz");
  }
}

// Warm lights: shroomlights in the interior behind some north-ring windows.
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  if (perim(x, z)) continue;
  if (z === 1 && (x === 1 || x === 4) && gr <= 4) {
    g.set(x, 4, z, "shroomlight");
  }
}

// Roof plant box on an interior column cell (supported by the column).
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  if (!perim(x, z) && x === 5 && z === 2 && gr <= 6) {
    const roofY = gr <= 6 ? 6 : gr;
    g.set(x, roofY + 1, z, "light_gray_concrete");
    g.set(x, roofY + 2, z, "light_gray_concrete");
  }
}

// Entrance: double-height door on the south face, with a hanging lantern.
if (entX >= 0) {
  const gr = groundAt(entX, entZ);
  g.set(entX, gr, entZ, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(entX, gr + 1, entZ, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  if (gr === 0 && has(entX, entZ - 1)) {
    g.set(entX, 2, entZ - 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(OUT);
