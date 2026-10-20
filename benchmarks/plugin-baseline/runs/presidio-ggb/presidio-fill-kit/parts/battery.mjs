// Coastal battery, plot 7 (plan.md "Battery detail"): emplacement and parapet in weathered concrete, deck, two gun pits
// with iron rings, banquette, magazines with iron doors, deck stair, iron-bar rail, earth glacis and side mounds, rust.
// Writes only inside plot 7 (x76..93, z0..23); the ground course under it is laid before this part.
import { weathered_concrete, glacis, gun_pit, magazine_door, deck_stair } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const DECK = "minecraft:polished_andesite";

export function build(g) {
  // emplacement walls: weathered foot (y1) and light grey courses (y2); the deck layer (y3) is laid after
  weathered_concrete(g, [77, 1, 10, 92, 2, 21]);
  // parapet on the seaward side, z8..9, y1..4; its crest course (y5) is at z8 only
  weathered_concrete(g, [77, 1, 8, 92, 4, 9]);
  g.fill([77, 5, 8], [92, 5, 8], "minecraft:smooth_stone");

  // magazines under the rear strip (y1..2): rooms carved from the solid concrete
  g.fill([78, 1, 18], [83, 2, 20], "minecraft:air");
  g.fill([86, 1, 18], [91, 2, 20], "minecraft:air");
  // rear wall doors, frames and rust; laid before the deck so the lintel (y3) is taken into the deck fill
  magazine_door(g, [80, 1, 21]);
  magazine_door(g, [88, 1, 21]);

  // deck top (y3): the walkway between the pits (x84..85) is part of it; the stair's last step takes z21 at x84..85
  g.fill([77, 3, 10], [83, 3, 21], DECK);
  g.fill([86, 3, 10], [92, 3, 21], DECK);
  g.fill([84, 3, 10], [85, 3, 20], DECK);

  // gun pits: cut from the deck, iron rings and polished blackstone pivots
  gun_pit(g, 78, 11);
  gun_pit(g, 86, 11);

  // banquette: bottom smooth stone slabs at z10, y4, either side of each pit
  for (const [a, b] of [[78, 83], [86, 91]]) {
    for (let x = a; x <= b; x++) g.set(x, 4, 10, ...B.slab("smooth_stone", "bottom"));
  }

  // deck stair up to the deck: x84..85, from z23 (y1) to z21 (y3)
  deck_stair(g, [84, 1, 23], "north");

  // iron-bar rail along the rear edge of the deck (stair gap at x84..85)
  for (const [a, b] of [[77, 83], [86, 92]]) {
    for (let x = a; x <= b; x++) g.set(x, 4, 21, "iron_bars", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
  }

  // rust streaks: the only rust, on the rear wall at x78 and x91 under the deck edge
  for (const x of [78, 91]) for (const y of [1, 2]) g.set(x, y, 21, "terracotta", {});

  // earth embankment: side mounds at x76 and x93 (z8..20, grass top; the glacis covers z0..7)
  for (const x of [76, 93]) {
    for (let z = 8; z <= 20; z++) {
      const top = z <= 12 ? 3 : z <= 17 ? 2 : 1;
      for (let y = 1; y <= top; y++) g.set(x, y, z, y === top ? "minecraft:grass_block" : "minecraft:dirt", {});
    }
  }
  // glacis, seaward north: x76..93, z0..7, stepping up to y4 at the parapet
  glacis(g, [76, 0, 93, 7]);
}
