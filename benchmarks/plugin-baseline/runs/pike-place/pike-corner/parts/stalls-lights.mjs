// Part 6: Stalls, lights and grounds. Stalls behind the open fronts and street windows, street lamps on the footprint
// edge of each Pike Place face (read off the footprint map, so they follow the jogs), lanterns at the arch crowns,
// rooftop planters on the Economy terrace and the Garden Center roof, and window boxes. Writes only into air.
import { stallFit, hangingLantern, lampPost, gardenPot, rooftopPlanter, onFootprint, groundAt, ECONOMY, CORNER, SANITARY } from "../vocab.mjs";

// the stall rooms from plan.md ROOMS (C3 is cut at z90 so it does not overlap the C3 south stalls)
const STALLS = [
  [[50, 18, 3, 52, 24, 29], "east", "produce"],   // Economy Pike Place street band
  [[79, 8, 32, 82, 14, 53], "west", "produce"],   // Corner C1
  [[73, 6, 56, 76, 14, 77], "west", "produce"],   // Corner C2
  [[67, 4, 80, 70, 14, 90], "west", "produce"],   // Corner C3
  [[68, 4, 91, 73, 14, 93], "south", "produce"],  // Corner C3 south (Pike Street)
  [[131, 2, 82, 134, 9, 108], "west", "produce"], // Sanitary S1 shops
  [[131, 2, 115, 134, 9, 119], "west", "produce"],// Sanitary S1 south shops
  [[131, 2, 120, 134, 9, 143], "west", "produce"],// Sanitary S1b shops
  [[159, 4, 8, 162, 10, 39], "west", "produce"],  // Sanitary S6 shops
  [[215, 2, 4, 218, 6, 13], "west", "pots"],      // Garden Center shop A
  [[215, 2, 16, 218, 6, 25], "west", "pots"],     // Garden Center shop B
];

// the footprint edge of a row: the first (min) or last (max) footprint cell in x across a plot
function edgeX(plot, z, side) {
  let found = null;
  for (let x = plot.x0; x <= plot.x1; x++) {
    if (!onFootprint(x, z)) continue;
    if (side === "min") { found = x; break; }
    found = x;
  }
  return found;
}

// [plot, side of the Pike Place face, z range] for the street lamps, one every 10 along z
const LAMP_FACES = [
  [ECONOMY, "max", 2, 92],
  [CORNER, "min", 2, 98],
  [SANITARY, "min", 2, 150],
];

export function build(g) {
  for (const [box, front, trade] of STALLS) stallFit(g, { box, front, trade });

  // street lamps on each Pike Place face's footprint edge, on the ground cell
  for (const [plot, side, z0, z1] of LAMP_FACES) {
    for (let z = z0; z <= z1; z += 10) {
      const x = edgeX(plot, z, side);
      if (x === null) continue;
      const y = groundAt(x, z);
      if (y === null) continue;
      lampPost(g, { at: [x, y + 1, z], h: 4 });
    }
  }

  // arch crowns of the Corner ground storey: a lantern just inside each arch, hung from the keystone
  for (const [x, z] of [[79, 35], [79, 43], [79, 51], [71, 59], [71, 67], [71, 75]]) {
    hangingLantern(g, { at: [x, 14, z], drop: 0 });
  }

  // rooftop planters: the Economy E4 terrace, and the Garden Center roof
  rooftopPlanter(g, { box: [8, 18, 50, 10, 19, 54] });
  rooftopPlanter(g, { box: [20, 18, 50, 22, 19, 54] });
  rooftopPlanter(g, { box: [220, 16, 8, 226, 17, 20] });

  // window boxes under the Garden Center's west windows
  gardenPot(g, { at: [211, 8, 6], box: true, face: "west" });
  gardenPot(g, { at: [211, 8, 13], box: true, face: "west" });
  gardenPot(g, { at: [211, 8, 20], box: true, face: "west" });
}
