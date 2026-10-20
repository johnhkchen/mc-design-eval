import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw587169544: no record. Read as a 3-storey-equivalent (roof 13 blocks above
// lowest ground) reinforced-concrete mixed-use block, Xinyi district, 1980s-90s:
// white-tiled concrete frame, pillar-and-spandrel facade, tinted glass in
// bays, a shopfront storey with a recessed entrance, parapet and roof plant.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169544.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169544.nbt";

const W = 26, H = 25, D = 15;
const TOP = 12;           // coping block; roof surface at y = 13
const SHOP_TOP = 4;       // ground storey lintel band
const FLOOR1 = 5;         // storey line / slab
const FLOOR2 = 10;        // roof deck slab on the upper storey
const SPANDREL = 9;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const groundOf = new Map();
for (const [x, z, gr] of cells) {
  groundOf.set(`${x},${z}`, Math.min(Math.max(Math.round(gr), 0), TOP - 1));
}
const has = (x, z) => groundOf.has(`${x},${z}`);

const SIDES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const g = new Voxels([W, H, D]);

function facadeBlock(x, y, z, side, gr) {
  // u = position along the facade, for pillar rhythm and bays
  const u = side.dx !== 0 ? z : x;
  const pillar = u % 3 === 0;
  const ix = x - side.dx, iz = z - side.dz; // inward cell
  const inward = has(ix, iz);

  if (y <= SHOP_TOP - 1) {
    // ground storey: shopfront, recessed entrance on the north frontage
    if (side.name === "north" && u === 13 && y <= gr + 2 && y >= gr + 1) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      return;
    }
    if (pillar) { g.set(x, y, z, "polished_andesite"); return; }
    g.set(x, y, z, "glass");
    if (inward && u % 6 === 1 && y === gr + 1) {
      g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
    return;
  }
  if (y === SHOP_TOP) { g.set(x, y, z, "white_concrete"); return; }    // lintel band
  if (y === FLOOR1)   { g.set(x, y, z, "smooth_stone"); return; }      // storey line
  if (y >= 6 && y < SPANDREL) {
    if (pillar) { g.set(x, y, z, "white_concrete"); return; }
    g.set(x, y, z, "light_blue_stained_glass");
    if (inward && u % 6 === 2 && y === 7) {
      g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
    return;
  }
  if (y === SPANDREL) { g.set(x, y, z, "white_concrete"); return; }
  if (y === FLOOR2)   { g.set(x, y, z, "smooth_stone"); return; }      // roof deck edge
  if (y === 11)       { g.set(x, y, z, pillar ? "polished_andesite" : "white_concrete"); return; }
  if (y === TOP)      { g.set(x, y, z, "smooth_stone"); return; }      // coping
}

for (const [x, z] of groundOf.keys().map((k) => k.split(",").map(Number))) {
  const gr = groundOf.get(`${x},${z}`);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  // base course / surface at ground
  g.set(x, gr, z, "stone_bricks");

  const missing = SIDES.filter((s) => !has(x + s.dx, z + s.dz));
  const perimeter = missing.length > 0;

  if (!perimeter) {
    // interior: floor slabs and roof deck only, air between (no interiors)
    if (FLOOR1 > gr) g.set(x, FLOOR1, z, "smooth_stone");
    if (FLOOR2 > gr) g.set(x, FLOOR2, z, "light_gray_concrete");
    // roof plant on the deck
    if (FLOOR2 > gr && x % 8 === 4 && z % 6 === 4) {
      g.set(x, 11, z, "iron_block");
    }
    if (FLOOR2 > gr) g.set(x, TOP, z, "air");
    continue;
  }

  // perimeter: facade walls from ground to the coping
  for (const side of missing) {
    for (let y = gr; y <= TOP; y++) {
      if (y === gr) continue; // base already set
      facadeBlock(x, y, z, side, gr);
    }
  }
  // ensure perimeter cells that are corners keep the base course
  g.set(x, gr, z, "stone_bricks");
}

// The perimeter pass above can overwrite the entrance in corner cases; the door
// is only placed on the north frontage, which is never a corner for u = 13.

g.save(OUT);
