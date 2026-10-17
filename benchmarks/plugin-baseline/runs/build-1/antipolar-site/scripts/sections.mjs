// The district in sections, one schematicannon each: z bands cut where the works are thin (across a cross-dike's
// lane or a levee's crest), each cropped in x to what its works touch. A section's file holds its whole box.
export const SECTIONS = [
  { name: "A shore west", z0: 26, z1: 52, xMax: 59, note: "terrace descent, north levee, shore row pads H5 H6" },
  { name: "B shore east", z0: 26, z1: 52, xMin: 60, note: "the ring's north-east corner, shore street, mixed-use plots M7-M9, the north boardwalk and its piers" },
  { name: "C faubourg", z0: 53, z1: 87, note: "polder 1: its floor, street, house pads, the west levee's ramp" },
  { name: "D fields", z0: 88, z1: 110, note: "polder 2: floor, ditches, pump house site" },
  { name: "E rice", z0: 111, z1: 172, note: "the polder 2/3 cross-dike, polder 3: paddies and bunds, the south levee, M4-M6, the bluff road up the draw" },
  { name: "F plateau west", z0: 173, z1: 194, xMax: 51, note: "plateau road west" },
  { name: "G plateau east", z0: 173, z1: 194, xMin: 52, note: "plateau road east" },
];
export function sectionBoxes(T) {
  return SECTIONS.map((s) => { let x0 = Infinity, x1 = -Infinity;
    for (const k of T.keys()) { const [x, z] = k.split(",").map(Number); if (z < s.z0 || z > s.z1 || x < (s.xMin ?? 0) || x > (s.xMax ?? 1e9)) continue; x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    return { ...s, x0, x1 }; });
}
