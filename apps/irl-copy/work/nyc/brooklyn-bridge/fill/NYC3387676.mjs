import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3387676.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3387676.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 15, GH = 17, D = 48;
const g = new Voxels([W, GH, D]);

// Footprint lookup
const map = new Map();
for (const c of cells) {
  const [x, z, gnd, roof] = c;
  map.set(`${x},${z}`, { x, z, gnd: Math.max(0, Math.round(gnd)), roof: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);

// Flatten the lidar roof into one clean tier: median of the cell roofs, capped to the grid.
const roofs = [...map.values()].map(c => c.roof).sort((a, b) => a - b);
const roofLevel = Math.min(14, Math.max(4, roofs[Math.floor(roofs.length / 2)]));

// Cell top = flat roof tier, never below the cell's own ground + 3 storey-rows.
function topOf(c) {
  return Math.min(14, Math.max(roofLevel, c.gnd + 3));
}

function exteriorBlock(x, z, rel, H) {
  if (rel === 0) return { id: "stone_bricks" };
  if (rel === H - 1) {
    return (x + z) % 2 === 0
      ? { id: "stone_bricks" }
      : { id: "chiseled_stone_bricks" };
  }
  if (rel % 2 === 0) {
    return { id: "stone_brick_slab", props: { type: "top", waterlogged: "false" } };
  }
  // window rows: glass between brick piers
  if (x % 3 === 0) return { id: "bricks" };
  return { id: "glass" };
}

const doorX = 7;

for (const c of map.values()) {
  const { x, z, gnd } = c;
  const top = topOf(c);
  const H = top - gnd;
  const ext = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone");

  for (let rel = 0; rel < H; rel++) {
    const y = gnd + rel;
    if (ext) {
      const b = exteriorBlock(x, z, rel, H);
      if (b.props) g.set(x, y, z, b.id, b.props);
      else g.set(x, y, z, b.id);

      // Entrance on the outward north face
      if (!has(x, z - 1) && x === doorX && rel === 1) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      }
      if (!has(x, z - 1) && x === doorX && rel === 2) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      }
    } else {
      // Interior: floor slabs on even rows, roof deck on top row, air between
      if (rel % 2 === 0 || rel === H - 1) {
        g.set(x, y, z, "smooth_stone");
      } else if (rel === 1 && x % 4 === 2 && z % 6 === 3) {
        g.set(x, y, z, "glowstone");
      }
    }
  }
}

// Roof plant: a few sparse units on interior roof cells, each standing on the deck
for (const c of map.values()) {
  const { x, z } = c;
  const top = topOf(c);
  const ext = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (ext) continue;
  if (x % 5 === 2 && z % 12 === 4 && top + 1 <= 16) {
    g.set(x, top, z, "iron_block");
  }
}

g.save(OUT);
