import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// FR241938059: a 1494 seven-storey stone townhouse-tower on the Île de la Cité's left-bank edge (9 x 15 footprint).
// Walls are limestone (calcite) on stone-brick string courses and quoins, glass-paned windows on the odd bays with
// warm glowstone behind some of them, a flush stone portal with a dark-oak door on the south front, and a steep slate
// (deepslate tile) attic under a stone parapet. The lower western wing stops on a storey line.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938059.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938059.nbt";

// The lidar roof (top = roof - 1) snaps to the nearest storey line: the flat tiers the massing steps between.
const CAPS = [7, 10, 13, 16, 20, 25];
const capOf = (roof) => {
  const t = roof - 1;
  return CAPS.reduce((best, c) => (Math.abs(c - t) < Math.abs(best - t) ? c : best), CAPS[0]);
};

// Storey lines: the ground storey is rows 0-4 (plinth, three window rows, string course); each upper storey is
// three rows (string course, two window rows); row 23 is the attic floor, row 24 the attic windows, 25 the parapet.
const STRINGS = new Set([0, 4, 5, 8, 11, 14, 17, 20, 23]);
const WINDOW_ROWS = new Set([1, 2, 3, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24]);

const at = new Map();
for (const [x, z, ground, roof] of cells) at.set(`${x},${z}`, { ground, cap: capOf(roof) });
const cellOf = (x, z) => at.get(`${x},${z}`);
// the outward normals of a cell's faces that no footprint cell lies beyond
const exposed = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !cellOf(x + dx, z + dz));

const g = new Voxels([9, 42, 15]);
const glows = [];

for (const [x, z] of cells) {
  const { ground: G, cap: c } = cellOf(x, z);
  const ex = exposed(x, z);

  // foundation: solid from y 0 up to the cell's own ground, so nothing floats on the slope
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  if (ex.length === 0) {
    // interior: floor slabs on each storey line, the attic floor and ceiling, and the roof covering on top
    for (let y = G; y <= c; y++) {
      if (y === c) g.set(x, y, z, "deepslate_tiles");
      else if (y === c - 1 || STRINGS.has(y)) g.set(x, y, z, "stone_bricks");
    }
    continue;
  }

  // perimeter: a full wall from the ground up to the tier's cap, windows on the odd bays of each facade
  const [nx, nz] = ex[0];
  const corner = ex.length > 1;
  const u = nz !== 0 ? x : z;               // position along the facade
  const front = nz === 1 && z === 14;       // the south front, with the portal
  const glassState = nz !== 0
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = G; y <= c; y++) {
    if (front && u === 4 && y <= 1) {
      const half = y === 0 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
    } else if (front && u >= 3 && u <= 5 && y <= 3) {
      g.set(x, y, z, "stone_bricks");        // flush stone portal
    } else if (corner || y === c || y === G || STRINGS.has(y)) {
      g.set(x, y, z, "stone_bricks");        // quoins, parapet, plinth, string courses
    } else if (WINDOW_ROWS.has(y) && u % 2 === 1) {
      g.set(x, y, z, "glass_pane", glassState);
      if (y < 24 && (u + y) % 4 === 0) glows.push([x - nx, y, z - nz]);
    } else {
      g.set(x, y, z, "calcite");              // the piers between bays
    }
  }
}

// warm light behind some glass: the interior cell inboard of a window, if it is open air
for (const [x, y, z] of glows) {
  const i = cellOf(x, z);
  if (i && exposed(x, z).length === 0) g.set(x, y, z, "glowstone");
}

// two chimney stacks standing on the attic roof
g.set(3, 26, 6, "stone_bricks"); g.set(3, 27, 6, "stone_bricks"); g.set(3, 28, 6, "stone_bricks");
g.set(5, 26, 10, "stone_bricks"); g.set(5, 27, 10, "stone_bricks"); g.set(5, 28, 10, "stone_bricks");

g.save(OUT);
