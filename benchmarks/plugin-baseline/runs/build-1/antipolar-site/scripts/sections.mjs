// The district in eight sections, one schematicannon each. The cuts follow the ring: x 76 is the ring's outer edge on
// the east (so everything below the water line, which stays inside the ring's rectangle, falls in the west sections),
// z 52 / 99 / 154 run across the levee banks and the polder road. Each section is cropped to what its works touch.
export const SECTIONS = [
  { name: "A shore west", x0: 0, x1: 76, z0: 26, z1: 52, note: "terrace descent, north levee, the ring's north bank and seepage ditch, the north ramp" },
  { name: "B shore east", x0: 77, x1: 130, z0: 26, z1: 52, note: "shore street and its stub, M3-M5 made land, the north boardwalk and its piers" },
  { name: "C polder north", x0: 0, x1: 76, z0: 53, z1: 99, note: "west and east levees, the faubourg's raised lots, canal 1 and its sluices, the fields' north half" },
  { name: "D waterfront north", x0: 77, x1: 130, z0: 53, z1: 99, note: "M1-M2 made land, the east boardwalk, piers, the island boardwalk and its stub" },
  { name: "E polder south", x0: 0, x1: 76, z0: 100, z1: 154, note: "the fields' south half, canal 2, the rice beds, the south levee and ramp, the landing" },
  { name: "F waterfront south", x0: 77, x1: 130, z0: 100, z1: 154, note: "the distillery and brewhouse made land, piers, the boatyard, the south levee's east stub" },
  { name: "G bluff and plateau", x0: 0, x1: 76, z0: 155, z1: 194, note: "the bluff road, grove lane and its stub, the plateau roads" },
  { name: "H pasture", x0: 77, x1: 130, z0: 155, z1: 194, note: "the plateau road's east end, the pasture road and its stub" },
];
export function sectionBoxes(T) {
  return SECTIONS.map((s) => { let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const k of T.keys()) { const [x, z] = k.split(",").map(Number); if (z < s.z0 || z > s.z1 || x < s.x0 || x > s.x1) continue; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return { ...s, x0, x1, z0, z1, rect: [s.x0, s.z0, s.x1, s.z1] }; });
}
