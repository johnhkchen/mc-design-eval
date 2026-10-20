// Room: bay hall (plot 2): grey gabled hall lit by great lunettes, open floor with a few stalls. Inner air box
// [65,1,65,99,32,77]; entered from the nave through the z64 openings and from the wing at x64. Focal piece: a pair of
// market stalls either side of a lamp post on the centre line, a row of chairs (stairs) facing them, lamp posts round
// the walls (quartz pillar + standing lantern), barrels against the east wall. Lanes kept clear: from each z64 opening
// (x66..69, 74..77, 82..85, 90..93) down to the focal stalls, and the west column x65..66.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { stall } from "../vocab.mjs";

const ROOM = [65, 1, 65, 99, 32, 77];
const X0 = 65, Z0 = 65, W = 35, D = 12;   // floor box x65..99, z65..76

// Lamp posts (fence, lantern on top): placed off every lane
const POSTS = [[71, 66], [79, 66], [88, 66], [96, 66], [71, 75], [96, 74], [67, 71], [84, 71]];
// Chairs: stairs with the back to the south, facing the stalls
const CHAIRS = [[81, 73], [84, 73], [87, 73]];
// Barrels along the east wall
const BARRELS = [[99, 66], [99, 67], [99, 68]];
// Standing lanterns on the floor against the south wall (the dark corners the room check names)
const LANTERNS = [[67, 76], [75, 76], [82, 76], [92, 76], [97, 76]];

function rows(cells) {
  const out = [];
  for (let j = 0; j < D; j++) out.push(Array(W).fill(".").join(""));
  const put = (x, z, ch) => {
    const j = z - Z0, i = x - X0;
    out[j] = out[j].slice(0, i) + ch + out[j].slice(i + 1);
  };
  for (const [x, z, ch] of cells) put(x, z, ch);
  return out;
}

export function build(g) {
  // Floor layer (y 1): posts, chairs, barrels. Layer 2 (y 2): the lanterns standing on the posts.
  const floor = rows([
    ...POSTS.map(([x, z]) => [x, z, "f"]),
    ...CHAIRS.map(([x, z]) => [x, z, "s"]),
    ...BARRELS.map(([x, z]) => [x, z, "b"]),
    ...LANTERNS.map(([x, z]) => [x, z, "L"]),
  ]);
  const top = rows(POSTS.map(([x, z]) => [x, z, "l"]));
  layers(g, [X0, 1, Z0], {
    f: ["quartz_pillar", { axis: "y" }],
    s: ["polished_andesite_stairs", { facing: "south", half: "bottom", shape: "straight" }],
    b: "barrel",
    l: ["lantern", { hanging: "false" }],
    L: ["lantern", { hanging: "false" }],
  }, [floor, top]);

  // The focal stalls flank the centre lamp post: barrels with a spruce counter on top (vocab stall())
  stall(g, 80, 71, { y: 1, room: ROOM });
  stall(g, 86, 71, { y: 1, room: ROOM });

  // Lamplighter: the two floor cells still dim (1-7) get a standing lantern each: the NW corner (65,65), tucked against
  // the two walls so the x66 lane stays open, and the east edge (98,70), one cell in from the wall. A lantern hung from
  // the deck (y26) would light nothing: 24 blocks of air to the floor, and light falls one level a block.
  layers(g, [X0, 1, Z0], { L: ["lantern", { hanging: "false" }] }, [rows([[65, 65, "L"], [98, 70, "L"]])]);
}
