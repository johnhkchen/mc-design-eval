// room: Primary bath: spa bath in the box [39,6,23,42,8,26]. Entered from the primary bedroom through the door (40,6..7,22).
// Layout (x 39..42, z 23..26; the door comes in at (40,23)):
//   z23: potted azalea (39), entry (40, open), linen barrel + towels (41), shower screen (42)
//   z24..26 west column x39: double vanity, two cauldron sinks with a quartz-slab counter between them
//   x40 column: open walkway with white carpet mats; the vanity is reached from here
//   x41..42, z24..26: the soaking tub, a quartz-slab rim around two water cauldrons (the focal piece)
// Light: hanging lanterns over the vanity and the tub; candles on the counter and the rim.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const QUARTZ_SLAB = (type = "bottom") => ["quartz_slab", { type, waterlogged: "false" }];

export function build(g) {
  // linen barrel by the door, with folded towels on top
  g.set(41, 6, 23, "barrel", { facing: "north", open: "false" });
  g.set(41, 7, 23, "white_wool", {});

  // shower screen: a white glass pane post in the NE corner
  for (let y = 6; y <= 8; y++) g.set(42, y, 23, "white_stained_glass_pane", {});

  // plant in the NW corner
  g.set(39, 6, 23, "potted_azalea_bush", {});

  // double vanity on the west column: sink, counter, sink
  g.set(39, 6, 24, "cauldron", {});
  g.set(39, 6, 25, ...QUARTZ_SLAB());
  g.set(39, 6, 26, "cauldron", {});
  g.set(39, 7, 25, "candle", { candles: "3", lit: "true", waterlogged: "false" });
  g.set(39, 8, 25, ...B.lantern(true));

  // bath mats along the walkway
  for (let z = 24; z <= 26; z++) g.set(40, 6, z, "white_carpet", {});

  // soaking tub: quartz-slab rim on the north and south sides, water cauldrons between them
  for (const x of [41, 42]) {
    g.set(x, 6, 24, ...QUARTZ_SLAB());
    g.set(x, 6, 25, "water_cauldron", { level: "3" });
    g.set(x, 6, 26, ...QUARTZ_SLAB());
  }
  g.set(41, 7, 24, "candle", { candles: "2", lit: "true", waterlogged: "false" });
  g.set(42, 7, 26, "candle", { candles: "2", lit: "true", waterlogged: "false" });
  g.set(41, 8, 25, ...B.lantern(true));
}
