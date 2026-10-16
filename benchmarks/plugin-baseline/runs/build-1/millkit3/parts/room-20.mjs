// P3 stair hall: a 3 x 4 entrance hall at the foot of the flight (x44 z15->11, locked by the stair joiner).
// The way in is the double door x41..42 z9 (first cell (42,3,10)) and the opening (43,3,14). The lane is x43 from z10
// to z13, so the furniture takes the two corners the lane leaves free: a newel lamp at the stair foot (44,10) and a
// hall table with a flower pot at (42,13). Lanterns hang from the upper floor down the lane's centre line, so the
// stair and its landing are the brightest thing in the room.
export function build(g) {
  // newel post at the foot of the stair, with a standing lantern on top (fence under it)
  g.set(44, 3, 10, "spruce_fence");
  g.set(44, 4, 10, "lantern", { hanging: "false" });

  // hall table: spruce fence post, spruce top slab (top half) and a flower pot on its top face
  g.set(42, 3, 13, "spruce_fence");
  g.set(42, 4, 13, "spruce_slab", { type: "top" });
  g.set(42, 5, 13, "flower_pot");

  // hanging lanterns under the upper floor, on the lane's centre line (never over the doorway cells)
  g.set(43, 6, 10, "lantern", { hanging: "true" });
  g.set(43, 6, 13, "lantern", { hanging: "true" });
}
