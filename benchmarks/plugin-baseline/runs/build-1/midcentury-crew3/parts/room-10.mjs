// ROOM bedroom 2 (interior designer): inner air [26,2,18,30,4,20]. Entries: doorway (25,2..3,19) from the corridor,
// door (29,2..3,17) to bath 2. Layout (x 26..30 across, z 18..20 down, z=21 is the south partition):
//   wardrobe on the north wall (x 26..27), a yellow rug mid-room, the yellow bed head-south against the south wall
//   at x=30 with its nightstand (barrel + standing lantern) beside the head, the lectern workstation and its stair
//   seat on the south-west corner. The nightstand lamp is the only light: the vault over z=18..19 is open, so no
//   lantern can hang over the bed.
// Row 0 is z=18, row 1 is z=19, row 2 is z=20; the layers are y=2 (furniture), y=3 (tops), y=4 (hung and pot).
// The path row z=19 and the door cells (25,19), (29,18) stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  W: ["spruce_planks"],                              // wardrobe body
  Y: ["yellow_carpet"],                              // yellow rug
  F: ["yellow_bed", { facing: "south", part: "foot" }],
  H: ["yellow_bed", { facing: "south", part: "head" }],
  L: ["lectern", { facing: "east" }],                // desk workstation
  C: ["spruce_stairs", { facing: "west", half: "bottom" }], // chair (stair as seat)
  N: ["barrel", { facing: "up" }],                   // nightstand
  l: ["lantern", { hanging: false }],                // lamp on the nightstand
  P: ["potted_cactus"],                              // pot on the wardrobe top
};

export function build(g) {
  layers(g, [26, 2, 18], LEGEND, [
    [
      "WW...", // z=18: wardrobe x=26..27
      "..Y.F", // z=19: rug x=28, bed foot x=30
      "LC.NH", // z=20: lectern x=26, chair x=27, nightstand x=29, bed head x=30
    ],
    [
      "WW...", // y=3: wardrobe top
      ".....",
      "...l.", // lamp on the nightstand (29,3,20)
    ],
    [
      "P....", // y=4: pot on the wardrobe top (26,4,18)
      ".....",
      ".....",
    ],
  ]);
}
