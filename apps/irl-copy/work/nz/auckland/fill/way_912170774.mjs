// Way 912170774, Mt Eden side of the CBD: a two-storey brick-and-plaster shop-top of the 1920s on the 8 x 6 footprint,
// flat roof behind a plaster parapet. The lidar gives roof 10 above ground under every cell, so the plan is a fixed
// storey stack: ground slab + base course (y 0), ground storey (1-3, shopfront on the north face), string course and
// floor slab (4), upper storey (5-8, sash-style glass grid), cornice / roof deck (9), parapet cap (10).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170774.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170774.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell
const g = new Voxels([8, 23, 6]);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ORDER = ["N", "S", "W", "E"];
const byKey = new Map(cells.map(([x, z, gr, rf]) => [`${x},${z}`, { gr, rf }]));
const has = (x, z) => byKey.has(`${x},${z}`);
const exposed = (x, z) => ORDER.filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
const edge = (x, z) => exposed(x, z).length > 0;

const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

for (const [x, z, gr, rf] of cells) {
  if (rf - gr !== 10) throw new Error(`cell ${x},${z} is ${rf - gr} above its ground; this storey plan is 10`);
  const b = gr, ex = exposed(x, z), wall = ex.length > 0;
  // a quoin only at a convex corner: a north/south face meets an east/west face and the cell diagonally inside is in the footprint
  const ns = ex.find((d) => d === "N" || d === "S"), we = ex.find((d) => d === "W" || d === "E");
  const corner = !!(ns && we) && has(x - DIRS[ns][0] - DIRS[we][0], z - DIRS[ns][1] - DIRS[we][1]) === true;

  // foundation under the building, ground slab + base course, the storey string course / floor slab, cornice / roof deck
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, b, z, "stone_bricks");
  g.set(x, b + 4, z, wall ? "smooth_quartz" : "stone");
  g.set(x, b + 9, z, wall ? "smooth_quartz" : "stone");
  if (!wall) continue;                                     // interior: air between the floor slabs, no interiors modelled
  g.set(x, b + 10, z, "smooth_quartz_slab", SLAB_BOTTOM);  // parapet cap

  // the face this cell shows to the street (north first), the cell just inside it, and whether that is air
  const prim = ex[0], [dx, dz] = DIRS[prim];
  const along = prim === "N" || prim === "S" ? x : z;
  const inX = x - dx, inZ = z - dz;
  const gap = has(inX, inZ) && !edge(inX, inZ);            // interior air behind the glass
  const front = prim === "N" && z === 1;                   // the shopfront face

  for (const k of [1, 2, 3, 5, 6, 7, 8]) {                 // storey rows; k = 4 is the string course above
    const y = b + k, lintel = k === 3 || k === 8;
    const win = (k !== 3 && k !== 8) && !corner && along % 2 === 1 && gap;
    if (front && k <= 3 && x >= 1 && x <= 5) {
      if (k === 3) g.set(x, y, z, "dark_oak_planks");                              // timber fascia
      else if (x === 3) {                                                          // the entrance
        g.set(x, y, z, "dark_oak_door", { ...DOOR, half: k === 1 ? "lower" : "upper" });
      } else if (x === 1 || x === 5) g.set(x, y, z, "dark_oak_planks");            // shop piers
      else g.set(x, y, z, "glass");                                                // shop windows
      if (k === 1 && (x === 2 || x === 4)) g.set(inX, y, inZ, "lantern", LANTERN); // warm light inside the shop
      continue;
    }
    if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }                     // quoins
    if (win) { g.set(x, y, z, "glass_pane"); if (k === 5 && along % 4 === 1) g.set(inX, y, inZ, "lantern", LANTERN); continue; }
    g.set(x, y, z, lintel ? "smooth_quartz" : "bricks");                           // lintel course or brick
  }
}

// rooftop plant on the interior cell nearest the middle of the plan, standing on the roof deck
const inner = cells.filter(([x, z]) => !edge(x, z));
if (inner.length) {
  const cx = 3.5, cz = 2.5;
  const [x, z, gr] = inner.reduce((a, c) => ((c[0] - cx) ** 2 + (c[1] - cz) ** 2 < (a[0] - cx) ** 2 + (a[1] - cz) ** 2 ? c : a));
  g.set(x, gr + 10, z, "iron_block");
}

const stats = g.save(OUT);
console.log(`wrote ${OUT}: ${stats.blocks} blocks, palette ${stats.palette}`);
