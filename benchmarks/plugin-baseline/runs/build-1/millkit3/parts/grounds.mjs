// Grounds and yards (part 7): the lane, the lamp posts, every plot's fence line and lane gate, the ground's patches,
// the paddock with its trough, composter and hay, the wagon under the lean-to, the rain barrels, the picnic table
// and the yard paths. Ground cells are laid before runParts, so only a cell still holding its grass (or gravel) is
// changed; anything an earlier part built is left alone, and every other write goes into air only.
import { rng, LAMP_XS, PLOT_WIDTH, lane_strip, lamp_post, fence_run, wagon, rain_barrels, picnic_table } from "../vocab.mjs";

const GRASS = "minecraft:grass_block";
const GRAVEL = "minecraft:gravel";
const COARSE = "minecraft:coarse_dirt";

// Ground cell at y0: changed only while it still holds one of `from` (the laid ground), so built cells are never touched.
function ground(g, x, z, block, from = [GRASS]) {
  if (from.includes(g.blockAt(x, 0, z))) g.set(x, 0, z, block);
}

// Air-only write: returns false (and writes nothing) if the cell is already built.
function put(g, x, y, z, block, state) {
  if (!g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

// Plot fence lines: wood of the front picket, the gate's wood, and the back-line gaps where a stack stands (absolute x).
const PLOTS = [
  { wood: "birch_fence", gate: "birch", open: [[3, 8]] },            // 0 double shotgun: twin stack x3..8
  { wood: "dark_oak_fence", gate: "dark_oak", open: [] },            // 1 Creole cottage
  { wood: "birch_fence", gate: "birch", open: [] },                  // 2 Foursquare
  { wood: "birch_fence", gate: "birch", open: [[40, 42]] },          // 3 Queen Anne: back stack x40..42
  { wood: "oak_fence", gate: "oak", open: [[50, 52]] },              // 4 gable-front-and-wing: back stack x50..52
  { wood: "spruce_fence", gate: "spruce", open: [] },                // 5 mule barn
  { wood: "dark_oak_fence", gate: "dark_oak", open: [] },            // 6 bake-oven yard
  { wood: "brick_wall", gate: "spruce", open: [[86, 88], [91, 93]] }, // 7 company duplex: two back stacks
];

export function build(g) {
  // The lane (z0..4) and its lantern posts on the south edge (z4).
  lane_strip(g, 0, 95, 0);
  for (const x of LAMP_XS) lamp_post(g, x);

  // Ground patches on each plot's yard (z5..18): coarse dirt, podzol and rooted dirt by the fence lines; the bake yard
  // (plot 6) is gravel with coarse patches.
  for (let i = 0; i < 8; i++) {
    const x0 = PLOT_WIDTH * i, r = rng(31 + i);
    for (let x = x0; x < x0 + PLOT_WIDTH; x++) for (let z = 5; z <= 18; z++) {
      const roll = r();
      const edge = x === x0 || x === x0 + PLOT_WIDTH - 1 || z === 18;
      if (i === 6) {
        ground(g, x, z, roll < 0.25 ? COARSE : GRAVEL);
      } else if (edge && roll < 0.2) {
        ground(g, x, z, roll < 0.08 ? "minecraft:podzol" : "minecraft:rooted_dirt");
      } else if (roll < 0.25) {
        ground(g, x, z, COARSE);
      } else if (roll < 0.3) {
        ground(g, x, z, "minecraft:podzol");
      }
    }
  }

  // Plot fence lines (side columns, front picket with its gate, back line).
  PLOTS.forEach((p, i) => fence_run(g, PLOT_WIDTH * i, p.wood, PLOT_WIDTH * i + 5, { gate: p.gate, open: p.open }));

  // Plot 5 paddock (x61..70, z16..18): a fence along z16 with a gate on the barn's back doors (x64..65), a water
  // trough, a composter and a hay bale on the yard floor.
  for (const x of [61, 62, 63, 66, 67, 68, 69, 70]) put(g, x, 1, 16, "spruce_fence");
  for (const x of [64, 65]) put(g, x, 1, 16, "spruce_fence_gate", { facing: "south", in_wall: "false", open: "true" });
  put(g, 68, 1, 17, "water_cauldron", { level: "3" });
  put(g, 61, 1, 17, "composter", { level: "0" });
  put(g, 62, 1, 17, "hay_block", { axis: "y" });

  // Plot 5 wagon under the lean-to, bed along x69..70, tongue toward the lane's south (z13).
  wagon(g, 69, 9, "south");

  // Plot 6 yard: the rain barrels with their tap, the long table's bench row, and the paths from the gate.
  rain_barrels(g, [79, 81, 82], 13, 1, 80);
  picnic_table(g, 76, 79, 9);
  for (const z of [5, 6, 12]) for (const x of [77, 78]) ground(g, x, z, "minecraft:dirt_path", [GRAVEL, COARSE]);
}
