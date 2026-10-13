// Roofs (part 3): the A and C mansards (townhouse preset, one dormer each), the B flat parapet (modern preset, slate),
// the B bracketed cornice and eave course, and the two canted-bay decks. The chimney stacks pass through every roof:
// their cells are in each roof's keep. The portico entablature belongs to the fenestration part (front.mjs), not here.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { bracketCornice } from "../vocab.mjs";

const AIR = "minecraft:air";

// Write one block only into air; a cell already taken is counted, never overwritten.
function put(g, skipped, x, y, z, [block, state]) {
  if (g.blockAt(x, y, z) !== AIR) { skipped.push([x, y, z]); return; }
  g.set(x, y, z, block, state);
}

export function build(g) {
  const skipped = [];

  // Chimney stacks: x10..12 and x18..20 at z18..19, to y=28. Each roof keeps the cells of the stacks it passes.
  const stackAB = { from: [10, 18, 18], to: [12, 28, 19] };
  const stackBC = { from: [18, 18, 18], to: [20, 28, 19] };
  const bVolume = { from: [11, 18, 12], to: [19, 28, 24] };
  // The B face (z=11, x11..19): the eave course and the cornice own it, so the A/C overhangs stop at x=10 and x=20.
  const bFace = { from: [11, 17, 11], to: [19, 24, 11] };

  // Slate for the roofs: deepslate tile, polished blackstone brick and cracked tiles, each with stairs and slabs in the
  // palette (cobbled deepslate and tuff bricks have none there, so the library's dark-slate and slate mixes are not used).
  const SLATE = { mix: [["deepslate_tile", 70], ["polished_blackstone_brick", 25], ["cracked_deepslate_tiles", 5, "full"]],
    eave: "polished_blackstone_brick", ridge: "polished_deepslate", verge: "polished_blackstone_brick" };

  // The attic ladders (stairs part) stand at x=4 and x=26, z=23, y13..20. The attic is entered at y18 by stepping from
  // the ladder top onto the landing cell at z=22 beside it, so the roof keeps that cell and its headroom (y18..20).
  const ladderA = { from: [4, 18, 22], to: [4, 20, 23] };
  const ladderC = { from: [26, 18, 22], to: [26, 20, 23] };

  // A: mansard, townhouse preset (dark-slate palette), one gable dormer on the north face, eave at y=18.
  roof(g, [3, 12, 11, 24], "townhouse", { y: 18, front: "north", overhang: 1, material: SLATE, trim: "stone_brick", keep: [bVolume, bFace, { from: [10, 18, 18], to: [10, 28, 19] }, ladderA] });

  // C: mirror of A, keeps the same stacks and the B volume.
  roof(g, [19, 12, 27, 24], "townhouse", { y: 18, front: "north", overhang: 1, material: SLATE, trim: "stone_brick", keep: [bVolume, bFace, { from: [20, 18, 18], to: [20, 28, 19] }, ladderC] });

  // B: flat parapet on the modern preset, slate deck, parapet two courses high on the deck at y=23.
  // eave plain: the bracketed cornice below is the only cornice on B (the preset's stair cornice would sit on its row).
  roof(g, [11, 12, 19, 24], "modern", { y: 23, material: SLATE, trim: "smooth_stone", eave: "plain", parapet: 2, keep: [stackAB, stackBC] });

  // B eave course: the stone-brick top slab at y=17 carries A's and C's cornice line across B's face (1 proud, z=11).
  for (let x = 11; x <= 19; x++) put(g, skipped, x, 17, 11, B.slab("stone_brick", "top"));

  // B bracketed cornice: upside-down quartz stairs at y=22, brackets at y=21 under x=12, 14, 16, 18.
  const corn = bracketCornice(g, 11, 19, 11, 22, "south", { brackets: [12, 14, 16, 18] });
  if (corn.skipped) console.warn(`roofs: cornice left ${corn.skipped} cell(s) already taken`);

  // Canted-bay decks at y=12: the front row (z=11) is a quartz-slab edge, the centre of the bay (z=10) is smooth stone.
  for (const [x0, x1, zc] of [[7, 10, [8, 9]], [20, 23, [21, 22]]]) {
    for (let x = x0; x <= x1; x++) put(g, skipped, x, 12, 11, B.slab("quartz", "bottom"));
    for (const x of zc) put(g, skipped, x, 12, 10, B.slab("smooth_stone", "bottom"));
  }

  if (skipped.length) console.warn(`roofs: ${skipped.length} cell(s) already taken, left as they are: ${JSON.stringify(skipped)}`);
}
