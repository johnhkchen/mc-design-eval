// Sunken well: plot 0 x20..45 z10..45, rink, steps, restaurants, terraces, parapet.
// Order matters: the steps and planters go in before the walls and parapet, so the later (thinner) parts give way.
import {
  wellWall, rinkRim, gardenSteps, planterBox, glassFront, froglightBay, umbrella, parapet,
  WELL, RINK, RESTAURANTS, UMBRELLAS, RINK_GATE,
} from "../vocab.mjs";

export function build(g) {
  // Channel Gardens steps down to the well's east edge; cheek walls at z19 and z34
  gardenSteps(g, 42, 47, 20, 33);

  // Stair-head planters flank the axis. Shifted one cell outward (z16..18, z35..37) so they clear the cheek walls at z19 and z34.
  planterBox(g, 46, 16);
  planterBox(g, 46, 35);

  // Rink: packed ice on the reserved floor cells, white rim with its gates (rink gate, north and south terrace gaps)
  for (let x = RINK.x0; x <= RINK.x1; x++)
    for (let z = RINK.z0; z <= RINK.z1; z++) g.set(x, 0, z, "packed_ice");
  rinkRim(g, RINK.x0 - 1, RINK.x1 + 1, RINK.z0 - 1, RINK.z1 + 1, 1, {
    gaps: [
      [RINK_GATE.x, RINK_GATE.z0, RINK_GATE.x, RINK_GATE.z1],  // east gate onto the stairs
      [30, RINK.z0 - 1, 33, RINK.z0 - 1],                       // north terrace gap
      [30, RINK.z1 + 1, 33, RINK.z1 + 1],                       // south terrace gap
      [RINK.x0 - 1, 20, RINK.x0 - 1, 35],                       // west side: the fountain's dark rim
    ],
  });

  // Retaining walls on the sides that are not restaurant glass. The north and south edges are the restaurant
  // fronts (z9 and z46); the west side is the Prometheus basin between z20 and z35.
  wellWall(g, WELL.x0, 10, WELL.x0, 19);
  wellWall(g, WELL.x0, 36, WELL.x0, WELL.z1);
  wellWall(g, WELL.x1, 10, WELL.x1, 19);
  wellWall(g, WELL.x1, 34, WELL.x1, WELL.z1);

  // Sunken restaurants: glass fronts with piers, warm light in the bays, tables
  const N = RESTAURANTS.northZ, S = RESTAURANTS.southZ;
  glassFront(g, N, "south", { x0: RESTAURANTS.x0, x1: RESTAURANTS.x1, door: RESTAURANTS.doorX });
  glassFront(g, S, "north", { x0: RESTAURANTS.x0, x1: RESTAURANTS.x1, door: RESTAURANTS.doorX });
  for (const x of [24, 28, 36, 40]) {
    froglightBay(g, x, N, "north");
    froglightBay(g, x, S, "south");
  }

  // Dining terraces: six umbrellas
  for (const [x, z] of UMBRELLAS) umbrella(g, x, z);

  // Parapets at y5 on the well's lip (the restaurant heads and the promenade edges)
  parapet(g, "z", 9, 20, 45, 5);                       // north, over the restaurant glass
  parapet(g, "z", 46, 20, 45, 5);                      // south
  parapet(g, "x", 19, 10, 17, 5);                      // west, north of the basin
  parapet(g, "x", 19, 38, 45, 5);                      // west, south of the basin
  parapet(g, "x", 46, 10, 19, 5);                      // east, north of the stair head
  parapet(g, "x", 46, 34, 45, 5);                      // east, south of the stair head
}
