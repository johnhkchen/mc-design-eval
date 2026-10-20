import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise two-storey commercial/office block, Xinyi district, Taipei.
// Light concrete frame with tinted glazing, stone base course, a dark-oak
// entrance on the south frontage, and a rooftop plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016292939";
const W = 21, H = 23, D = 17;
const ROOF_Y = 11;      // roof slab top layer, about 11 blocks above lowest ground
const PARAPET_Y = 12;   // parapet course sits on the roof slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(ROOF_Y - 3, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const outFaces = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !has(x + dx, z + dz)).length;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, st) => (st ? g.set(x, y, z, id, st) : g.set(x, y, z, id));

// Entrance: on the south frontage (highest z), cell nearest the frontage midpoint.
let entrance = null;
{
  const southCells = cells
    .filter(([x, z]) => !has(x, z + 1))
    .map(([x, z]) => [x, z]);
  if (southCells.length) {
    const mx = southCells.reduce((s, [x]) => s + x, 0) / southCells.length;
    southCells.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx));
    entrance = southCells[0];
  }
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gy = ground.get(key(x, z));
  const out = outFaces(x, z);
  const perim = out > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Body: storeys from ground up to the roof slab.
  for (let y = gy; y < ROOF_Y; y++) {
    const rel = y - gy;
    const band = rel % 5;
    if (perim) {
      if (rel === 0) {
        put(x, y, z, "stone_bricks");                       // base course
      } else if (band === 0) {
        put(x, y, z, "smooth_quartz");                      // storey line
      } else if (band === 4) {
        put(x, y, z, "white_concrete");                     // spandrel
      } else {
        const windowCell = out === 1 && (x + z) % 2 === 0;  // one glazed bay in two
        if (windowCell) {
          put(x, y, z, "light_blue_stained_glass_pane");
        } else {
          put(x, y, z, "white_concrete");                   // pier
        }
      }
    } else {
      // Interior: floor slabs per storey, air otherwise, occasional warm light.
      if (band === 0) {
        put(x, y, z, "smooth_quartz");
      } else if (band === 2 && (x * 5 + z * 3) % 11 === 0) {
        put(x, y, z, "glowstone");
      }
    }
  }

  // Roof slab over every footprint cell.
  put(x, ROOF_Y, z, "smooth_quartz");

  // Parapet on perimeter.
  if (perim) put(x, PARAPET_Y, z, "white_concrete");
}

// Rooftop plant box on the interior of the roof.
for (const [x, z] of cells) {
  if (outFaces(x, z) === 0 && x % 6 === 3 && z % 5 === 2) {
    const gy = ground.get(key(x, z));
    if (gy < ROOF_Y) {
      put(x, PARAPET_Y, z, "light_gray_concrete");
      put(x, PARAPET_Y + 1, z, "light_gray_concrete");
    }
  }
}

// Entrance: dark-oak door in the ground storey, lintel above it.
if (entrance) {
  const [ex, ez] = entrance;
  const gy = ground.get(key(ex, ez));
  put(ex, gy + 1, ez, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(ex, gy + 2, ez, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(ex, gy + 3, ez, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
