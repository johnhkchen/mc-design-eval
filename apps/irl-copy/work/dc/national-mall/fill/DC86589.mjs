import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC86589 - 915 15th St NW. Commercial-Office-Large.
// c.1970s five-storey Portland-cement-stone office block with
// tinted-glass ribbon windows, a stone base course, a projecting cornice.
// Storey module = 3 blocks: slab/spandrel course + two glass rows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86589.cells.json`, "utf8"));

const W = 12, H = 29, D = 7;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const footprint = new Map();
for (const c of cells) footprint.set(key(c[0], c[1]), c);

const isPerimeter = (x, z) =>
  !footprint.has(key(x - 1, z)) || !footprint.has(key(x + 1, z)) ||
  !footprint.has(key(x, z - 1)) || !footprint.has(key(x, z + 1));

// Entrance: front (north, z = min) row, centred on the footprint.
const frontZ = Math.min(...cells.map(c => c[1]));
const frontCells = cells.filter(c => c[1] === frontZ).sort((a, b) => a[0] - b[0]);
const entranceCell = frontCells[Math.floor(frontCells.length / 2)];
const entX = entranceCell ? entranceCell[0] : -1;

// Clean storey tiers: roof height above each cell's ground, quantised to 3-block storeys.
const plan = cells.map(([x, z, gr0, rf0]) => {
  const gr = Math.max(0, Math.round(gr0));
  const storeys = Math.max(1, Math.min(5, Math.round((Math.round(rf0) - gr) / 3)));
  const rf = gr + 3 * storeys;
  return { x, z, gr, rf, perim: isPerimeter(x, z) };
});

for (const { x, z, gr, rf, perim } of plan) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, "stone_bricks");
  }

  // Shell from ground to roof.
  for (let y = gr; y < rf; y++) {
    const rel = y - gr;
    const top = y === rf - 1;
    let b = null;
    let props = undefined;

    if (top) {
      // Parapet on the perimeter, roof deck inside.
      b = perim ? "smooth_stone" : "light_gray_concrete";
    } else if (rel % 3 === 0) {
      // Floor slab / spandrel course; ground course is the stone base.
      if (rel === 0) b = perim ? "stone_bricks" : "light_gray_concrete";
      else b = perim ? "white_concrete" : "light_gray_concrete";
    } else if (!perim) {
      // Interior: air gap behind the glazing line.
      continue;
    } else {
      // Window band: mullion piers alternate with tinted glass panes.
      if ((x + z) % 2 === 0) {
        b = "quartz_pillar";
        props = { axis: "y" };
      } else {
        const storey = Math.floor(rel / 3);
        const lit = ((x * 5 + storey * 4 + rel) % 13) === 0;
        b = lit ? "glowstone" : "gray_stained_glass";
      }
    }

    if (b) g.set(x, y, z, b, props);
  }

  // Projecting cornice over the parapet on perimeter cells.
  if (perim && rf < H - 1) {
    g.set(x, rf, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof plant: two boxes on interior roof cells.
  if (!perim && (x === 3 || x === 8) && z === 3 && rf < H - 1) {
    g.set(x, rf, z, "light_gray_concrete");
  }

  // Entrance: door in the centre of the front row, with a canopy slab
  // across the three front cells and quartz surrounds at the flanks.
  if (z === frontZ && x === entX) {
    g.set(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (z === frontZ && Math.abs(x - entX) <= 1 && gr + 2 < rf - 1) {
    g.set(x, gr + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  if (z === frontZ && Math.abs(x - entX) === 1 && gr + 1 < rf - 1) {
    g.set(x, gr + 1, z, "quartz_pillar", { axis: "y" });
  }
}

g.save(`${DIR}/DC86589.nbt`);
