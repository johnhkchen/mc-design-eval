// Room 13, Hyatt guest floor corridor (interior designer): the floor's air box x154..198, y8..11, z66..90, walked from the
// stair core (x184..191, z72..79). A 2-wide corridor runs east-west on z80..81 and stays clear. Guest bays line the
// north wall (beds head-on to the wall at z66, desk and chair in the bay); the lounge at the core door (the focal
// piece) sits south of the corridor, lit by a hanging lantern over its table. Corridor lanterns hang from the ceiling.
// Beds are not in palette.json, so each bed is a two-cell low bed in palette blocks: a quartz pillow at the head (z66, against
// the north wall) and a sandstone blanket at the foot (z67).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BAY_X = [156, 163, 170, 177, 194];                       // north guest bays, bed foot x

export function build(g) {
  // North guest bays: bed (pillow and blanket slabs), a desk (fence + top slab) with a standing lantern and a
  // chair (stairs, back to the south), and a hanging lantern over the bed.
  BAY_X.forEach((bx) => {
    g.set(bx, 8, 66, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    g.set(bx, 8, 67, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
    g.set(bx + 1, 11, 68, "lantern", { hanging: "true" });
    g.set(bx + 3, 8, 69, "oak_fence", { waterlogged: "false" });
    g.set(bx + 3, 9, 69, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
    g.set(bx + 3, 10, 69, "lantern", { hanging: "false", waterlogged: "false" });
    g.set(bx + 3, 8, 70, ...B.stairs("smooth_quartz", "south"));
  });

  // Corridor: hanging lanterns down the centre line, clear floor.
  [158, 167, 176, 185, 194].forEach((x) => g.set(x, 11, 80, "lantern", { hanging: "true" }));

  // Lounge (focal piece, in view from the core door): a 2x1 table of fence legs and top slabs, four quartz chairs
  // facing in, a hanging lantern overhead. Sits on z83..86, clear of the corridor lanes.
  g.set(187, 8, 84, "oak_fence", { waterlogged: "false" });
  g.set(188, 8, 84, "oak_fence", { waterlogged: "false" });
  g.set(187, 9, 84, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  g.set(188, 9, 84, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  g.set(187, 10, 84, "lantern", { hanging: "false", waterlogged: "false" });
  g.set(186, 8, 84, ...B.stairs("smooth_quartz", "west"));
  g.set(189, 8, 84, ...B.stairs("smooth_quartz", "east"));
  g.set(187, 8, 83, ...B.stairs("smooth_quartz", "north"));
  g.set(188, 8, 85, ...B.stairs("smooth_quartz", "south"));
  g.set(187, 11, 84, "lantern", { hanging: "true" });

  // South zone light: hanging lanterns so the south half is lit (checked with $MCD room).
  [160, 172, 182].forEach((x) => g.set(x, 11, 87, "lantern", { hanging: "true" }));
}
