// ROOM corridor (interior designer): calm spruce-and-white corridor along the atrium's east glass (x=23..24, z=9..21).
// The walkway is the x=23 column, kept clear at y=2..3 from the gallery (z=9..10) to the master (z=21). The x=24 column
// holds the built-in storage run (z=11..14, spruce sideboard), a plant niche with two standing lanterns and a spruce
// panel backdrop (z=16..18, the focal wall), and a spruce panel at z=20. (24,z) stays clear at z=10, 15 and 19 where
// the bedroom doorways (25,2..3,z) open onto it. Hung lanterns at y=4 sit under the ceiling planks (z=9..13, 20..21).
// Item frames are entities, not blocks, so the art is left out: the backdrop panel carries the focal.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the corridor's air box is x 23..24, y 2..4, z 9..21 (plan.md ROOMS); the origin is its top-left corner
const ORIGIN = [23, 2, 9];

const LEGEND = {
  P: ["potted_cactus"],                       // plant on the floor at the gallery end
  C: ["potted_cactus"],                       // focal plant between the two standing lanterns
  Q: ["potted_cactus"],                       // plant on the sideboard top
  T: B.trapdoor("spruce", "west", "top", false),   // sideboard fronts, facing the walkway
  S: B.slab("spruce", "bottom"),              // sideboard top
  W: B.trapdoor("spruce", "west", "bottom", true), // spruce panelling (open trapdoor reads as a panel)
  L: B.lantern(false),                        // standing lantern on the floor
  H: B.lantern(true),                         // hung lantern under the ceiling planks
};

// one row per z (9..21), two characters per row: x=23 then x=24; '.' is left as it is
const FLOOR = [        // y=2: furniture on the floor
  ".P", "..", ".T", ".T", ".T", ".T", "..", ".L", ".C", ".L", "..", ".W", "..",
];
const TOP = [          // y=3: sideboard top and the panel backdrop
  "..", "..", ".S", ".S", ".S", ".S", "..", ".W", ".W", ".W", "..", ".W", "..",
];
const HIGH = [         // y=4: hung lanterns, plant on the sideboard, panel backdrop
  "..", "H.", "..", ".Q", "H.", ".Q", "..", ".W", ".W", ".W", "..", "HW", "..",
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [FLOOR, TOP, HIGH]);
}
