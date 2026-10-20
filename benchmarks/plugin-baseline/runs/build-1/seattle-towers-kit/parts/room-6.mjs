// Room 6, KOMO E broadcast studio (interior designer). Inner air x 60..99, z 60..100, y 1..11 (floor y 0, ceiling y 12).
// A two-storey TV studio: the news set on the north wall (backdrop, desk, two anchor chairs) is the focal piece; the
// audience rows of quartz stairs face it across an aisle; camera pedestals stand on the audience's flanks; a glass
// control booth sits in the north-east corner, opened onto the lane; a lighting grid of lanterns hangs on iron chains
// every 5 blocks so every floor cell is lit.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // The set: blue backdrop with a white frame, on the north wall (z 60).
  g.fill([74, 1, 60], [86, 6, 60], "blue_concrete");
  g.fill([73, 1, 60], [73, 7, 60], "white_concrete");
  g.fill([87, 1, 60], [87, 7, 60], "white_concrete");
  g.fill([73, 7, 60], [87, 7, 60], "white_concrete");

  // The news desk: a quartz body at y 1, a top slab at y 2, with two anchor chairs behind it (backs to the backdrop).
  g.fill([76, 1, 62], [84, 1, 63], "smooth_quartz");
  for (let x = 76; x <= 84; x++) for (let z = 62; z <= 63; z++) g.set(x, 2, z, ...B.slab("smooth_quartz", "top"));
  for (const x of [78, 82]) g.set(x, 1, 61, ...B.stairs("smooth_quartz", "north"));

  // Audience: four rows of seats facing north to the set (backs to the south), an aisle down x 80.
  for (const z of [68, 70, 72, 74]) {
    for (let x = 68; x <= 92; x++) if (x !== 80) g.set(x, 1, z, ...B.stairs("quartz", "south"));
  }

  // Cameras: a pole of iron bars with an iron block head, flanking the audience and off the lanes.
  for (const [x, z] of [[70, 78], [90, 78], [96, 72]]) {
    g.set(x, 1, z, "iron_bars");
    g.set(x, 2, z, "iron_bars");
    g.set(x, 3, z, "iron_block");
  }

  // Control booth, north-east: glass partition on x 94 with an opening at z 64..65, a console and an operator's chair.
  g.fill([94, 1, 60], [94, 4, 63], "glass");
  g.fill([94, 1, 66], [94, 4, 66], "glass");
  g.fill([94, 3, 64], [94, 4, 65], "glass");
  g.fill([96, 1, 61], [98, 1, 63], "smooth_quartz");
  for (let x = 96; x <= 98; x++) for (let z = 61; z <= 63; z++) g.set(x, 2, z, ...B.slab("smooth_quartz", "top"));
  g.set(95, 1, 62, ...B.stairs("smooth_quartz", "west"));

  // Lighting grid: lanterns hang at y 4 from iron chains (y 5..11, up to the ceiling) on a 5-block grid. A chain stops
  // short of a cell an earlier part already holds (the ceiling light at 87,11,87), so it never writes into it.
  const free = (x, y, z) => !g.get(x, y, z) || /(^|_)air$/.test(g.get(x, y, z).block);
  for (const x of [62, 67, 72, 77, 82, 87, 92, 97]) {
    for (const z of [62, 67, 72, 77, 82, 87, 92, 97]) {
      for (let y = 5; y <= 11; y++) if (free(x, y, z)) g.set(x, y, z, ...B.chain("y"));
      g.set(x, 4, z, ...B.lantern(true));
    }
  }
}
