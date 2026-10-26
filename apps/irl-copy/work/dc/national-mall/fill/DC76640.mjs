// DC76640: a two-storey Beaux-Arts museum/library/gallery front on R Street NW, built on its footprint.
// Limestone-look quartz walls with a granite plinth, a smooth-quartz string course at the storey line,
// regular pier-and-window bays (glass panes framed by quartz piers), a dark-wood double entrance under a
// lintel, a cornice on the roofline, oxidized-copper roof plant and a central attic pavilion on the street axis.
// Each cell is a column from y 0 to the roof: walls on the perimeter, interior air behind the glass with a floor
// slab per storey (solid under every air layer), so nothing hangs free.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76640.cells.json", "utf8"));
const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => foot.has(key(x, z));

const ROOF = 5;                                   // lidar roof height above y 0 (every cell reads 5)
const STOREY_LINE = 3;                            // string course / second floor slab
const CORNICE = ROOF;                             // cornice slab on the walls, deck slab inside
const ATTIC = 6;                                  // central pavilion base, above the roof deck
const PANE = (ns, ew) => ({ north: String(ns), south: String(ns), east: String(ew), west: String(ew) });

const g = new Voxels([23, 17, 10]);

// 1. Ground and floors, then the walls on the perimeter of the footprint.
for (const [x, z, ground] of cells) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");        // foundation (none where ground is 0)

  const N = !has(x, z - 1), S = !has(x, z + 1), W = !has(x - 1, z), E = !has(x + 1, z);
  const wall = N || S || W || E;
  if (!wall) {                                    // interior: floor slabs only, air between
    g.set(x, 0, z, "smooth_stone");
    g.set(x, STOREY_LINE, z, "smooth_stone");
    g.set(x, CORNICE, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }

  const corner = (N || S) && (W || E);
  const t = N || S ? x : z;                       // position along the face
  const pier = corner || t % 4 === 0 || t % 4 === 3;  // 1-wide quartz piers, 2-wide glass bays between
  // glass panes connect along the face they sit in
  const pane = N || S ? PANE(false, true) : PANE(true, false);

  g.set(x, 0, z, "polished_granite");                       // plinth
  for (const y of [1, 2, 4]) {
    if (pier) g.set(x, y, z, "quartz_block");
    else g.set(x, y, z, "glass_pane", pane);
  }
  g.set(x, STOREY_LINE, z, "smooth_quartz");                // string course
  g.set(x, CORNICE, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 2. Entrance on the street front (z 0, north-facing): pilasters either side, double dark-wood doors, lintel above.
for (const y of [1, 2, 3, 4]) g.set(9, y, 0, "quartz_block");
for (const [x, hinge] of [[10, "left"], [11, "right"]]) {
  g.set(x, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}
g.set(12, 3, 0, "smooth_quartz");
g.set(9, 3, 0, "smooth_quartz");

// 3. Warm light behind some glass: hanging lanterns at the entrance, glowstone and a shroomlight behind upper bays.
g.set(10, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(11, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
for (const x of [3, 7, 15, 19]) g.set(x, 1, 1, "glowstone");
for (const x of [5, 13, 17]) g.set(x, 4, 1, "glowstone");
g.set(21, 4, 1, "shroomlight");

// 4. Roofline: oxidized-copper plant on the deck, and a central attic pavilion on the street axis.
for (const [x, z] of [[4, 3], [15, 3], [9, 6]]) g.set(x, ATTIC, z, "oxidized_copper");
for (const x of [9, 10, 11, 12, 13]) for (const z of [0, 1]) {
  g.set(x, ATTIC, z, "quartz_block");
  g.set(x, ATTIC + 1, z, "quartz_block");
  g.set(x, ATTIC + 2, z, "oxidized_cut_copper_slab", { type: "bottom", waterlogged: "false" });
}
for (const x of [10, 11, 12]) g.set(x, ATTIC + 1, 0, "glass_pane", PANE(false, true));

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76640.nbt");
console.log(res);
