// P6 grounds: lawn patches, dirt_path walks, the south hedge band, topiary cones, flagpoles. Ground cells only (y 0 and
// the planting above it), on the # footprint; the podium and steps belong to earlier parts and are never touched.
import { onFootprint, GROUND_Y, COARSE_DIRT, DIRT_PATH, GRASS_BLOCK, IRON_BARS, hedge_run, topiary_cone } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Swap grass for another ground block over a rectangle, only where the cell is still park grass on the footprint.
function ground(g, x0, x1, z0, z1, block) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!onFootprint(x, z) || g.blockAt(x, GROUND_Y, z) !== `minecraft:${GRASS_BLOCK}`) continue;
    g.set(x, GROUND_Y, z, block);
    n++;
  }
  return n;
}

// Hedge segments left open at the flagpoles, so a pole stands in a gap rather than inside the leaves.
const POLES = [[20, 145], [46, 145], [112, 145], [134, 145]];
const HEDGE_WEST = [[4, 19], [21, 45], [47, 51]];
const HEDGE_EAST = [[100, 111], [113, 133], [135, 147]];

// Cone centres every 18 along the lawn strips (x 4..7, z 4..7 and x 144..147 around the podium).
const CONE_AT = [13, 31, 49, 67, 85, 103, 121, 139];

// Flagpole: iron_bars six high on [x, 1, z], a standing red banner on the top (the 1.21.1 palette has no red wall
// banner for the flag, so the cloth flies from the finial, facing east). Cells must be air; a taken one is left alone.
function flagpole(g, x, y, z) {
  for (let i = 0; i < 6; i++) {
    if (g.blockAt(x, y + i, z) !== "minecraft:air") continue;
    g.set(x, y + i, z, IRON_BARS, { north: "false", east: "false", south: "false", west: "false" });
  }
  if (g.blockAt(x, y + 6, z) === "minecraft:air") g.set(x, y + 6, z, ...B.banner("red", [], { wall: false, rotation: 12 }));
}

export function build(g) {
  // Ground in patches: a few coarse-dirt scrapes in the lawn, and a worn scrape in the south scraps.
  ground(g, 4, 5, 60, 61, COARSE_DIRT);
  ground(g, 146, 147, 90, 91, COARSE_DIRT);
  ground(g, 120, 121, 4, 5, COARSE_DIRT);
  ground(g, 0, 1, 148, 149, COARSE_DIRT);

  // Walks around the podium (dirt_path at ground level, the planting stays on the lawn beyond them).
  ground(g, 6, 7, 8, 143, DIRT_PATH);
  ground(g, 144, 145, 8, 143, DIRT_PATH);
  ground(g, 8, 143, 6, 7, DIRT_PATH);
  // The approach from the south: dirt_path under the steps and out to the plot's south edge.
  ground(g, 56, 95, 144, 158, DIRT_PATH);

  // South hedge band z 144..147, west and east of the steps (cheek walls keep x 52..55 and 96..99 free).
  for (const [x0, x1] of HEDGE_WEST) for (const z of [144, 146]) hedge_run(g, x0, x1, z);
  for (const [x0, x1] of HEDGE_EAST) for (const z of [144, 146]) hedge_run(g, x0, x1, z);

  // Topiary cones on the lawn strips, every 18.
  for (const c of CONE_AT) {
    topiary_cone(g, 5, c);
    topiary_cone(g, 145, c);
    topiary_cone(g, c, 5);
  }

  // Flagpoles in the gaps of the south hedge.
  for (const [x, z] of POLES) flagpole(g, x, 1, z);
}
