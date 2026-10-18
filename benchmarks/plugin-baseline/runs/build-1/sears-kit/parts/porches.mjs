// Part "porches and facade ornament": porches, decks, pedimented and gabled entries, arcades, parapets and the
// porch-side ornament of all eight plots (plan.md FACADES, ROOFS for the porch roofs, SITE for the ramps).
// Everything here is built into air only; the shell, roofs and walks are earlier parts and stay locked.
import {
  portico, balcony, shapedParapet, arcadeBay, rafterTails, pedimentPorch, squarePorch,
  doorHood, gablePorch,
} from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // ---- plot 0 Magnolia: full-height portico (4 quartz columns, pediment) and the balcony over the door ----
  portico(g, { x0: 4, x1: 11, z0: 9, z1: 12, deck: "smooth_quartz", column: "quartz_pillar", trim: "smooth_quartz", rake: "quartz" });
  // flush the pediment's top step: the peak is two stairs meeting back to back, not a full block a jump above the rakes
  g.set(7, 12, 9, ...B.stairs("quartz", "east"));
  g.set(8, 12, 9, ...B.stairs("quartz", "west"));
  balcony(g, { x0: 6, x1: 9, z0: 10, z1: 12, y: 5, floor: "smooth_quartz", rail: "iron_bars" });

  // ---- plot 1 Alhambra: shaped parapet on the front wall, arcaded porch with a flat deck and red-tile pent ----
  shapedParapet(g, {
    z: 13,
    steps: [[9, 18, 29], [10, 19, 28], [11, 20, 27], [12, 21, 26], [13, 22, 25], [14, 23, 24]],
    piers: 10, vent: { x0: 23, x1: 24, y: 11 }, body: "white_terracotta", coping: "brick",
  });
  arcadeBay(g, { x0: 19, x1: 22, z: 9, y: 2 });
  arcadeBay(g, { x0: 22, x1: 25, z: 9, y: 2 });
  arcadeBay(g, { x0: 25, x1: 28, z: 9, y: 2 });
  g.fill([19, 1, 9], [28, 1, 12], "mud_bricks");            // porch deck (the piers stand on it)
  g.fill([19, 5, 9], [28, 5, 12], "mud_bricks");            // flat deck over the arcade
  for (const x of [19, 28]) {                                 // side walls with an arch each, z10..11
    g.fill([x, 2, 10], [x, 4, 12], "white_terracotta");
    g.fill([x, 2, 10], [x, 3, 11], "air");
    g.fill([x, 4, 10], [x, 4, 11], "bricks");
  }
  for (let x = 19; x <= 28; x++) g.set(x, 5, 8, ...B.stairs("brick", "south", "bottom"));  // the pent, rising to the house

  // ---- plot 2 Vallonia: tapered piers, porch ceiling, deck, rafter tails over the front eave ----
  // the roof sweep already fills the beam row (y5 z9), so the piers stop at the taper post under it
  for (const x of [35, 38, 42, 45]) roofedPier(g, { x, z: 9, stone: "cobblestone", post: "spruce" });
  g.fill([35, 1, 9], [45, 1, 12], "spruce_planks");          // deck (the piers stand on it)
  g.fill([35, 4, 10], [45, 4, 12], "spruce_slab", { type: "top" });   // porch ceiling, clear of the posts
  for (const [a, b] of [[36, 37], [39, 41], [43, 44]]) g.fill([a, 4, 9], [b, 4, 9], "spruce_slab", { type: "top" });
  rafterTails(g, { x0: 35, x1: 45, z: 8, y: 5, into: "south", wood: "spruce" });

  // ---- plot 3 Puritan: pedimented entry porch, two quartz columns ----
  // a small entry hood on two columns: the columns stand at x54 and x58, so the way in between them is 3 wide (x55..57, level with
  // the 3-wide walk and ramp), a solid quartz soffit closes the whole 5x3 bay against the dormer-high wall, and a slate slab canopy
  g.fill([54, 1, 10], [58, 1, 12], "smooth_quartz");
  for (const x of [54, 58]) g.fill([x, 2, 10], [x, 4, 10], "quartz_pillar", { axis: "y" });
  g.fill([54, 5, 10], [58, 5, 12], "smooth_quartz");
  g.fill([54, 6, 10], [58, 6, 12], "deepslate_tile_slab", { type: "bottom" });

  // ---- plot 4 Cornell: full-width square-columned porch ----
  squarePorch(g, { x0: 67, x1: 77, z0: 9, z1: 12, column: "smooth_quartz", pier: "bricks", frieze: "smooth_quartz", deck: "oak_planks" });

  // ---- plot 5 Stanford: door hood over the centred door, landing before it ----
  doorHood(g, { x0: 87, x1: 89, z: 13, y: 5, trim: "smooth_quartz" });
  g.fill([87, 1, 12], [89, 1, 13], "smooth_stone");          // landing (the ramp runs z10..11 into it)

  // ---- plot 6 Winona: small gabled porch on birch posts ----
  gablePorch(g, { x0: 102, x1: 106, z0: 10, z1: 12, deck: "oak_planks", column: "stripped_birch", roof: "spruce", verge: "birch", infill: "smooth_sandstone" });

  // ---- plot 7 Craftsman: broad porch on stone piers, deck ----
  // the porch roof (roofs part) fills the beam row y5 z9, so the piers stop at the taper post under it
  for (const x of [114, 117, 122, 125]) roofedPier(g, { x, z: 9, stone: "cobblestone", post: "spruce" });
  g.fill([114, 1, 9], [125, 1, 12], "spruce_planks");
}

// A pier whose beam row is already the roof's: stone y2..3 and the taper post at y4, nothing at y5 (the roof's cell)
function roofedPier(g, { x, z, stone, post }) {
  g.fill([x, 2, z], [x, 3, z], stone);
  g.set(x, 4, z, ...B.fence(post));
}
