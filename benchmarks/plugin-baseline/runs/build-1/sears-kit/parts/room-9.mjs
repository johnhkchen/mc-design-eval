// Room "P1 hall" (interior designer's part): the Mission entrance hall, x22..25 z14..20, feet at y2, floor layer y1.
// Target layout (not written yet): a spruce-stair bench at x22..23 z20 facing the front door; a fence-post table at x25 z17
// with a top slab at y3 and a potted poppy at y4; a coat rack by the door at x25 z14; lanterns hung at (23,4,16) and
// (23,4,19) from the upper floor (y5).
// Why it is empty: the shell (Part 1) carves every hall cell to air, and runParts locks each cell an earlier part
// wrote, air included. Every target cell is therefore refused, and there is no free cell inside the hall to move to.
// The layout comes back when room parts may furnish the shell's interior.
// The stair flight at x22 z15..18 is the stair joiner's and is never written here.
export function build(g) {
  // hanging lanterns from the upper floor (y5), down the hall's centre line, at feet level plus one (y4)
  g.set(23, 4, 16, "lantern", { hanging: "true" });
  g.set(23, 4, 19, "lantern", { hanging: "true" });
}
