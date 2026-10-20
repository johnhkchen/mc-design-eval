import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690426";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (clamped so the storeys stay sane on steep cells)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(5, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: the north-most edge cell nearest the middle of the plan
let doorX = null;
{
  let minZ = Infinity;
  for (const [x, z] of cells) if (z < minZ) minZ = z;
  const northRow = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
  doorX = northRow[Math.floor(northRow.length / 2)];
  doorZ = minZ;
}
let doorZ;

const GLASS = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const PIER = "smooth_quartz";
const BAND = "light_gray_concrete";
const BASE = "stone_bricks";
const PARAPET = "smooth_quartz";

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(5, Math.round(gr0)));
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  // Storey floor slab above ground floor (interior and edge)
  g.set(x, 5, z, BAND);
  // Roof slab over whole footprint
  g.set(x, 10, z, BAND);

  if (!edge) {
    // Interior: air behind glass, occasional warm light on the second storey
    if ((x + z) % 7 === 0) g.set(x, 7, z, "glowstone");
    continue;
  }

  // Facade index along the wall for pier/window rhythm
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  const i = alongX ? x : z;
  const pier = i % 3 === 0;

  // Base course at ground line
  g.set(x, gr, z, BASE);

  // Ground floor: shopfront glass or piers, storey line at 5
  for (let y = gr + 1; y <= 4; y++) {
    if (pier) g.set(x, y, z, PIER);
    else g.set(x, y, z, GLASS);
  }
  if (gr + 1 > 4) {
    // Ground already at storey line: piers only keep the wall continuous
    g.set(x, 4, z, pier ? PIER : WALL);
  }

  // Entrance door on the north face
  if (x === doorX && z === doorZ) {
    const lo = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
    const up = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
    const y0 = Math.max(gr + 1, 1);
    g.set(x, y0, z, "oak_door", lo);
    g.set(x, y0 + 1, z, "oak_door", up);
  }

  // Second storey: window grid with frames
  for (let y = 6; y <= 8; y++) {
    if (pier) g.set(x, y, z, PIER);
    else g.set(x, y, z, GLASS);
  }
  // Warm light behind a few second-storey windows
  if (!pier && i % 6 === 1) {
    // Mid-window sill light on the wall line
    g.set(x, 6, z, "shroomlight");
  }

  // Cornice band under the roof slab
  g.set(x, 9, z, BAND);

  // Parapet on the roof edge
  g.set(x, 11, z, PARAPET);
}

// Roof terrace equipment: a small plant box and a rooftop lantern on interior roof cells
for (const [x, z] of cells) {
  if (!isEdge(x, z) && (x * 3 + z) % 11 === 0) {
    g.set(x, 11, z, "oak_fence");
    g.set(x, 12, z, "lantern");
  }
}

g.save(`${DIR}/${ID}.nbt`);
