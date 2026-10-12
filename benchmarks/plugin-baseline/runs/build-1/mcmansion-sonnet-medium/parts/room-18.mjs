// Walk-in closet (interior designer): inner air x31..34, y6..8, z21..24. Entered from the primary bath through the
// door at (35,6..7,22); the window (32..33,7..8,25) is on the south wall. Floor y=5 block, walking y=6.
// Layout: full-length mirror on the north wall (the focal piece, lit by a lantern in front), hanging rail and a shoe
// shelf along the west partition, a central island dresser in the middle row, and two hanging lanterns for light.
// The entry column x=34 and the front of the mirror (z=22) stay clear for the walk.
const FLOOR_BLOCK = "dark_oak_planks";
const TRIM_PILLAR = "quartz_pillar";
const SHELF_TOP = "smooth_quartz_slab";
const LANTERN = "lantern";

export function build(g) {
  // full-length mirror: quartz frame pillars at x31 and x34, glass panes between, on the north wall (z=21)
  for (let y = 6; y <= 8; y++) {
    g.set(31, y, 21, TRIM_PILLAR, { axis: "y" });
    // the x34 pillar stops at y7: the y8 cell is the roof's stair course, built by an earlier part
    if (y < 8) g.set(34, y, 21, TRIM_PILLAR, { axis: "y" });
    g.set(32, y, 21, "glass_pane");
    g.set(33, y, 21, "glass_pane");
  }

  // shoe shelf: dark oak base on the west column (x=31, z22..24) with a bottom slab top at y7
  for (let z = 22; z <= 24; z++) {
    g.set(31, 6, z, FLOOR_BLOCK);
    g.set(31, 7, z, SHELF_TOP, { type: "bottom" });
  }

  // hanging rail: iron bars at head height (y=8) along the west partition, clear of the 2-high walk path
  for (let z = 23; z <= 24; z++) g.set(31, 8, z, "iron_bars");

  // central island dresser: a single row at z=23 (x32..33), base planks with a slab top, so the mirror and the
  // window keep a clear front
  for (let x = 32; x <= 33; x++) {
    g.set(x, 6, 23, FLOOR_BLOCK);
    g.set(x, 7, 23, SHELF_TOP, { type: "bottom" });
  }

  // light: lanterns hanging from the top plate (y=9), one over the mirror and one over the entry side of the island
  g.set(33, 8, 22, LANTERN, { hanging: "true" });
  g.set(33, 8, 24, LANTERN, { hanging: "true" });
}
