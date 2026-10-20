import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Footprint 20 x 18, roof about 11 blocks above lowest ground.
// Read as a two-storey, mid-century Taipei concrete shophouse block:
// white painted concrete frame, shopfront glazing at street level,
// a storey line, a cornice, a flat roof deck with a parapet and a rooftop tank.
const W = 20, H = 23, D = 18;
const ROOF = 11;                 // absolute roof deck level (lowest ground = 0)
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1174690423.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const groundOf = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const has = (x, z) => groundOf.has(key(x, z));
const isPerimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street frontage: the north row (lowest z) of the footprint.
const minZ = Math.min(...cells.map(([, z]) => z));
const meanX = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const frontCells = cells.filter(([x, z]) => z === minZ && isPerimeter(x, z));
const doorCell = frontCells.reduce((best, c) => (Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best), frontCells[0]);
const [doorX, doorZ, doorG] = doorCell;

// Taipei rooftop tank: a 2 x 2 footprint of interior cells nearest the centre.
const cx = W / 2, cz = D / 2;
const tankCorner = cells
  .filter(([x, z]) => [[x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => has(a, b)) && !isPerimeter(x, z))
  .reduce((best, c) => {
    if (!best) return c;
    const d = (c[0] + 0.5 - cx) ** 2 + (c[1] + 0.5 - cz) ** 2;
    const bd = (best[0] + 0.5 - cx) ** 2 + (best[1] + 0.5 - cz) ** 2;
    return d < bd ? c : best;
  }, null);

const g = new Voxels([W, H, D]);

const winPattern = (x, z) => ((x + z) % 4 === 0 ? "white_concrete" : "glass_pane");
const isLit = (x, y, z) => (x * 7 + z * 3 + y) % 11 === 0;

for (const [x, z, gr] of cells) {
  const perim = isPerimeter(x, z);

  // Plinth: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab / base for every cell.
  g.set(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // Interior: floor slabs only, air elsewhere (no interiors).
  if (!perim) {
    if (gr + 5 < ROOF) g.set(x, gr + 5, z, "smooth_stone");
    g.set(x, ROOF, z, "smooth_stone"); // roof deck
    continue;
  }

  // Facade: walls, window grids, storey lines, cornice.
  for (let y = gr + 1; y < ROOF; y++) {
    const r = y - gr;
    let block;
    if (r <= 3) {
      // Ground floor: shopfront glazing with entrance on the street side.
      block = (x === doorX && z === doorZ) ? null : winPattern(x, z);
      if (z === minZ && x === doorX && z === doorZ) block = null;
      if (r === 3 && isLit(x, y, z) && block === "glass_pane") block = "glowstone";
    } else if (r === 4) {
      block = "white_concrete";                       // spandrel
    } else if (r === 5) {
      block = "smooth_stone";                         // storey line / floor slab
    } else if (r <= 8) {
      block = winPattern(x, z);                       // upper storey windows
      if (block === "glass_pane" && isLit(x, y, z)) block = "shroomlight";
    } else if (r === 9) {
      block = "white_concrete";                       // spandrel
    } else {
      block = "stone_brick_slab";                     // cornice course
    }
    if (block === null) continue;
    if (block === "stone_brick_slab") {
      g.set(x, y, z, block, { type: "top", waterlogged: "false" });
    } else {
      g.set(x, y, z, block);
    }
  }
  // Re-assert the cornice at the top of the wall, ahead of the roof deck.
  if (ROOF - 1 > gr) g.set(x, ROOF - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  // Roof deck and parapet on the perimeter.
  g.set(x, ROOF, z, "smooth_stone");
  g.set(x, ROOF + 1, z, "white_concrete");
}

// Entrance door and hanging lantern on the street facade.
g.set(doorX, doorG + 1, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorX, doorG + 2, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(doorX, doorG + 3, doorZ, "lantern", { hanging: "true", waterlogged: "false" });

// Rooftop water tank on a 2 x 2 footprint.
if (tankCorner) {
  const [tx, tz] = tankCorner;
  for (const [a, b] of [[tx, tz], [tx + 1, tz], [tx, tz + 1], [tx + 1, tz + 1]]) {
    g.set(a, ROOF + 1, b, "oak_planks");
    g.set(a, ROOF + 2, b, "oak_planks");
    g.set(a, ROOF + 3, b, "oak_slab", { type: "top", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1174690423.nbt");
