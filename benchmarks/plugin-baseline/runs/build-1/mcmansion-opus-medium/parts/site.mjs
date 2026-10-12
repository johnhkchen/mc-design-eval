// P5 site and deck (plan.md SITE, OUTDOOR, Back): road, sidewalk, drive and flares, brick walks, front beds, young birch,
// azalea cluster, lamp posts, mailbox, back deck with rail and steps, grill and patio table. The lawn is the grass the
// build lays first, so it is not written again; every other site cell is written here.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  GRAY_CONCRETE, LIGHT_GRAY_CONCRETE, SMOOTH_STONE, BRICKS, PODZOL, SPRUCE_PLANKS, SMOKER,
  bed, youngTree, lampPost, mailbox, deckRail, shrub,
} from "../vocab.mjs";

/**
 * A view that leaves out bed plants (y1) on cells an earlier part already holds: the house plinth's smooth_quartz_slab
 * sits at y1 along the front (z6 and z10). The mulch at y0 is still laid.
 */
function freeCells(g) {
  return new Proxy(g, {
    get(t, prop) {
      if (prop !== "set") return Reflect.get(t, prop);
      return (x, y, z, block, state, nbt) => {
        if (y === 1 && g.blockAt(x, y, z) !== "minecraft:air") return g;
        g.set(x, y, z, block, state, nbt);
        return g;
      };
    },
  });
}

export function build(g) {
  // Road, sidewalk and the drive (smooth_stone across the sidewalk, flared once at z2).
  g.fill([0, 0, 0], [43, 0, 0], GRAY_CONCRETE);
  g.fill([0, 0, 1], [43, 0, 1], LIGHT_GRAY_CONCRETE);
  g.fill([29, 0, 1], [41, 0, 10], SMOOTH_STONE);
  g.fill([30, 0, 11], [41, 0, 12], SMOOTH_STONE); // x29 z11..12 is the shell's foundation edge
  g.fill([28, 0, 2], [28, 0, 2], SMOOTH_STONE);
  g.fill([42, 0, 2], [42, 0, 2], SMOOTH_STONE);

  // Brick walk: sidewalk to the entry steps, then east along z3 to the drive.
  g.fill([16, 0, 2], [17, 0, 3], BRICKS);
  g.fill([18, 0, 3], [28, 0, 3], BRICKS);

  // Front beds: turret front, west and east of the portico. Each bed is mulch with shrubs and tulips.
  bed(freeCells(g), 2, 6, 7, 6);
  bed(freeCells(g), 8, 10, 11, 10);
  bed(freeCells(g), 23, 10, 28, 10);

  // Young birch on the west lawn, and a small azalea cluster on mulch.
  youngTree(g, 6, 4);
  g.fill([23, 0, 5], [25, 0, 7], PODZOL);
  for (const [x, z] of [[24, 6], [23, 6], [25, 6], [24, 5], [24, 7]]) shrub(g, x, z);

  // Street furniture beside the walk and the drive.
  lampPost(g, 14, 2);
  lampPost(g, 19, 2);
  mailbox(g, 27, 2);
  // Night lighting for the paths and courts (the lantern at y3 lights a floor cell within 12 steps across the ground):
  // sidewalk and road at the drive's west and east edges, the west and east side yards, and the back yard's south-west corner.
  lampPost(g, 28, 1);
  lampPost(g, 42, 1);
  lampPost(g, 1, 4);
  lampPost(g, 1, 28);
  lampPost(g, 42, 27);
  lampPost(g, 28, 30);

  // Back deck: flush with the house floor (y1), rail on the outer edge, steps on the west side.
  g.fill([6, 1, 26], [24, 1, 30], SPRUCE_PLANKS);
  deckRail(g, 6, 26, 24, 30, { gaps: [[6, 28], [6, 29]] });
  g.set(5, 1, 28, ...B.stairs("spruce", "east"));
  g.set(5, 1, 29, ...B.stairs("spruce", "east"));
  g.set(22, 2, 29, SMOKER, { facing: "north", lit: "false" });

  // Patio table (fence post, slab top) with four stair chairs, one per side.
  g.set(13, 2, 28, ...B.fence("spruce"));
  g.set(13, 3, 28, ...B.slab("spruce", "top"));
  g.set(12, 2, 28, ...B.stairs("spruce", "east"));
  g.set(14, 2, 28, ...B.stairs("spruce", "west"));
  g.set(13, 2, 27, ...B.stairs("spruce", "south"));
  g.set(13, 2, 29, ...B.stairs("spruce", "north"));
}
