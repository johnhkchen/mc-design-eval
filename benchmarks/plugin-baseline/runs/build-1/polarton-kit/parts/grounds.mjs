// Part: grounds (P6): the lane, plot rings and gates, the ground patched in coarse dirt, podzol and rooted dirt, the gravel
// ways from each gate to a grade-floor door, yards (bales, bench, flower beds, wheel stand, cart, cordwood, coal), the
// church graveyard with its picket and headstones, and a few plants. Only writes into air, and only ground cells that
// the ground fill (or this part's own lane and gravel) still holds; an earlier part's cell is left alone.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { laneRow, ringFence, baleStack, yardBench, wheelStand, cart, woodRick, headstone, picketYard } from "../vocab.mjs";
import { plot, rng } from "../vocab/base.mjs";

const AIR = "minecraft:air";
const GRASS = "minecraft:grass_block";
const COARSE_DIRT = "minecraft:coarse_dirt";
const PODZOL = "minecraft:podzol";
const ROOTED_DIRT = "minecraft:rooted_dirt";
const GRAVEL = "minecraft:gravel";
const GROUND = new Set([GRASS, COARSE_DIRT, PODZOL, ROOTED_DIRT, GRAVEL]);
const SOIL = new Set([GRASS, COARSE_DIRT, PODZOL, ROOTED_DIRT]);

/** Ground cell at y0 that is still ground (grass, dirt or gravel from this part): write it, else leave it. */
function groundAt(g, x, z, block, from = GROUND) {
  const c = g.get(x, 0, z);
  if (!c || !from.has(c.block)) return false;
  g.set(x, 0, z, block);
  return true;
}

/** Write one block into an air cell only; an occupied cell is left as it is. */
function put(g, x, y, z, block, state) {
  const c = g.get(x, y, z);
  if (c && c.block !== AIR) return false;
  g.set(x, y, z, block, state);
  return true;
}

/** A plant at y1 on a soil cell (grass, dirt, podzol): flowers stand on what they grow on. */
function plant(g, x, z, block) {
  const under = g.get(x, 0, z);
  if (!under || !SOIL.has(under.block)) return false;
  return put(g, x, 1, z, block, { });
}

/** Patch the open grass of every plot pad: coarse dirt in patches, podzol and rooted dirt by the fences. */
function patchGround(g) {
  const r = rng(5023);
  for (let i = 0; i < 8; i++) {
    const p = plot(i);
    for (let x = p.x0; x <= p.x1; x++) for (let z = p.z0; z <= p.z1; z++) {
      const nearFence = x === p.x0 + 1 || x === p.x1 - 1 || z === p.z0 + 1 || z === p.z1 - 1;
      const k = r();
      if (nearFence && k < 0.35) groundAt(g, x, z, PODZOL, new Set([GRASS]));
      else if (nearFence && k < 0.4) groundAt(g, x, z, ROOTED_DIRT, new Set([GRASS]));
      else if (k < 0.25) groundAt(g, x, z, COARSE_DIRT, new Set([GRASS]));
    }
  }
}

/** Level gravel from a gate across the yard to a grade-floor door (z5 is the gate line, z8 the last yard row). */
function gravelWay(g, x0, x1) {
  for (let x = x0; x <= x1; x++) for (let z = 5; z <= 8; z++) groundAt(g, x, z, GRAVEL);
}

/** The church graveyard: a picket round the front corner, the gate on its west side, headstones with mounds. */
function graveyard(g) {
  picketYard(g, [55, 1, 6, 58, 1, 8]);
  g.unset(55, 1, 7);
  put(g, 55, 1, 7, "minecraft:pale_oak_fence_gate", { facing: "east", open: "false", in_wall: "false", powered: "false" });
  headstone(g, 57, 7, "low");
  headstone(g, 58, 10, "tall");
  headstone(g, 58, 12, "low");
  headstone(g, 58, 14, "tall");
  headstone(g, 58, 16, "low");
  headstone(g, 57, 16, "low");
}

export function build(g) {
  // The lane, the plot rings and gates with their lantern posts (the pad's own), then the ground.
  laneRow(g, 0, 95);
  patchGround(g);
  for (let i = 0; i < 8; i++) ringFence(g, i);
  // the lane has no light of its own (the ring lanterns sit high at the corners): one standing lantern on each plot's
  // south lane edge, two cells in from the plot's west corner, so the street reads lit from the gate to the lane's edge
  for (let i = 0; i < 8; i++) g.set(12 * i + 2, 1, 4, "minecraft:lantern", { hanging: "false", waterlogged: "false" });

  // Plot 0 cotton gin: level gravel from the gate to the wagon bay; bale stacks either side of the path.
  gravelWay(g, 4, 7);
  baleStack(g, 1, 1, 6);
  baleStack(g, 8, 1, 6);

  // Plot 1 schoolhouse: bench by the west ring fence, a flower bed east of the ramp.
  yardBench(g, 13, 1, 7, "south");
  layers(g, [20, 1, 6], { p: "minecraft:poppy", d: "minecraft:dandelion" }, [["pdp", "dpd", "pdp"]]);

  // Plot 2 farmhouse: a few flowers either side of the porch step, clear of the gate line.
  plant(g, 26, 6, "minecraft:poppy");
  plant(g, 27, 6, "minecraft:dandelion");
  plant(g, 32, 6, "minecraft:dandelion");
  plant(g, 33, 6, "minecraft:poppy");

  // Plot 3 blacksmith: level gravel from the gate to the open forge front, the wheel on its stand, the cart under the
  // lean-to, a coal store and cordwood beside the forge stack.
  gravelWay(g, 41, 42);
  wheelStand(g, 37, 1, 6);
  cart(g, 45, 1, 10, "south");
  for (let z = 16; z <= 17; z++) for (let y = 1; y <= 2; y++) put(g, 42, y, z, "minecraft:coal_block");
  woodRick(g, [43, 1, 16, 46, 2, 17]);

  // Plot 4 church: the front-corner graveyard.
  graveyard(g);

  // Plot 5 tobacco barn: level gravel from the gate to the barn door; cordwood ricks on the east side.
  gravelWay(g, 65, 66);
  woodRick(g, [69, 1, 10, 70, 3, 15]);

  // Plot 7 owner's house: a few plants in the front yard, clear of the slab step at x89..90.
  plant(g, 86, 6, "minecraft:dandelion");
  plant(g, 87, 6, "minecraft:poppy");
  plant(g, 92, 6, "minecraft:poppy");
  plant(g, 93, 6, "minecraft:dandelion");
}
