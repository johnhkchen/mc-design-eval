// Part "Porches, ramps, banners" (plan.md PARTS 4): the two-storey white porches of the museum (z 15..17) and the
// barracks (z 14..16), the Visitor Center porch posts (z 8), the porch decks at y 0, the entrance ramps and their
// handrails, the DISNEY and MUSEUM banner runs with their red_wool panels. Writes only into air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { groundCourse, porchBay, ramp, handrail, bannerRun } from "../vocab.mjs";

// one non-post porch cell (the end of a porch, where no post stands at its column): the same gallery beam, deck,
// roof, railings as porchBay's non-post branch. front = the high-z line, back = the cells behind it
function openCell(g, x, z0, z2, { rail = true, lowerRail = true } = {}) {
  const front = z2;
  g.set(x, 4, front, "smooth_quartz");
  g.set(x, 7, front, "smooth_quartz");
  for (let z = z0; z < z2; z++) {
    g.set(x, 4, z, ...B.slab("smooth_quartz", "top"));
    g.set(x, 7, z, ...B.slab("smooth_quartz", "bottom"));
  }
  if (rail) g.set(x, 5, front, "diorite_wall", { east: "low", west: "low" });
  if (lowerRail) g.set(x, 1, front, "polished_blackstone_wall", { east: "low", west: "low" });
}

// the posts of one porch line: diorite_wall columns at x, y 1..3 and y 5..6 (the porchBay post, without its rails)
function posts(g, xs, z, ys) {
  for (const x of xs) for (const y of ys) g.set(x, y, z, "diorite_wall");
}

export function build(g) {
  // ---- Walt Disney Family Museum (plot 0): porch z 15..17, front z 17, posts x 1,5,9,14,18,22 ----
  groundCourse(g, 0, 15, 23, 17);
  openCell(g, 0, 15, 17);
  // bays from post to post; x 1 and x 18 carry the red_wool panels in place of the rail (rail: false), and the
  // ramp bay x 9 has no lower rail between its posts (the open stair gap x 10..13)
  porchBay(g, 1, 15, 17, { span: 4, rail: false });
  porchBay(g, 5, 15, 17, { span: 4 });
  porchBay(g, 9, 15, 17, { span: 5, lowerRail: false });
  porchBay(g, 14, 15, 17, { span: 4 });
  porchBay(g, 18, 15, 17, { span: 4, rail: false });
  porchBay(g, 22, 15, 17, { span: 2 });
  ramp(g, 10, 13, 18);
  handrail(g, 9, 18, 18);
  handrail(g, 14, 18, 18);
  bannerRun(g, "DISNEY", 2, 7, 18, 4, { panels: [[2, 4, 5, 6]] });
  bannerRun(g, "MUSEUM", 16, 21, 18, 4, { panels: [[19, 21, 5, 6]] });

  // ---- Montgomery Street barracks (plot 1): porch z 14..16, front z 16, posts x 25,30,34,39,43,48 ----
  groundCourse(g, 24, 14, 49, 16);
  openCell(g, 24, 14, 16);
  porchBay(g, 25, 14, 16, { span: 5 });
  porchBay(g, 30, 14, 16, { span: 4 });
  porchBay(g, 34, 14, 16, { span: 5, lowerRail: false });
  porchBay(g, 39, 14, 16, { span: 4 });
  porchBay(g, 43, 14, 16, { span: 5 });
  porchBay(g, 48, 14, 16, { span: 2 });
  ramp(g, 35, 38, 17);
  handrail(g, 34, 17, 17);
  handrail(g, 39, 17, 17);

  // ---- Visitor Center (plot 3): porch deck z 7..8, posts x 81,84,87,90 at z 8 (y 1..2) ----
  groundCourse(g, 80, 7, 91, 8);
  posts(g, [81, 84, 87, 90], 8, [1, 2]);
  ramp(g, 84, 87, 9);
}
