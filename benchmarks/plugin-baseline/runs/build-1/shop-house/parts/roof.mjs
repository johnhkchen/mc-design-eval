// SPDX-License-Identifier: AGPL-3.0-or-later
// Roofs: the main shop roof is roof.json (laid by runParts right after the shell, with its king-post trusses).
// The back return (rear wing) has its own cottage roof: runParts takes one roof spec, so this part lays the wing roof
// itself, on the wing footprint at eave y 19, with the same dark slate mix and dark oak verges. The chimney S stack
// is kept through it (the roof meets the stack on every side).
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SLATE = { mix: [["deepslate_tiles", 50], ["cobbled_deepslate", 30], ["polished_deepslate", 20]] };

export function build(g) {
  roof(g, [4, 23, 11, 30], "cottage", {
    y: 19,
    front: "south",
    ridgeAxis: "z",
    overhang: { north: 0, south: 1, east: 1, west: 1 },   // no eave on the north: the wing butts the main rear wall (z 22)
    pitch: "steep",
    material: SLATE,
    eave: "plain",
    verge: "dark_oak",
    gable: "bricks",
    chimneys: [],
    // the shell's quoin pairs at the wing's south corners (x 4 / 11, z 29..30, y 18..19) own the eave course there
    keep: [
      { from: [7, 18, 31], to: [8, 26, 32] },
      { from: [4, 19, 29], to: [4, 19, 30] },
      { from: [11, 19, 29], to: [11, 19, 30] },
    ],
  });
}

/**
 * After runParts (the roof tool's cells are locked while the parts run): the finishing the tool leaves.
 * 1. The main gable trim stops one course short of the ridge at both ends: the apex course x 11..12, y 31 is missing
 *    on the verge row (z 3 / z 24, dark oak) and the slate row behind it (z 4 / z 23), so the rake did not run eave to
 *    ridge. Both stairs meet at the ridge, as on every slope row in between.
 * 2. A slate stair standing on a bottom slab hangs half a block in the air: the slab becomes a top slab.
 */
export function finish(g) {
  const stair = (block, facing) => [block, { facing, half: "bottom", shape: "straight", waterlogged: "false" }];
  for (const [z, block] of [[3, "dark_oak_stairs"], [24, "dark_oak_stairs"], [4, "polished_deepslate_stairs"], [23, "polished_deepslate_stairs"]]) {
    g.set(11, 31, z, ...stair(block, "east"));
    g.set(12, 31, z, ...stair(block === "polished_deepslate_stairs" ? "deepslate_tile_stairs" : block, "west"));
  }
  for (const c of [...g]) {
    const [x, y, z] = c.pos;
    if (y < 19 || !/_stairs$/.test(c.block)) continue;
    const below = g.get(x, y - 1, z);
    if (below && /deepslate.*_slab$/.test(below.block) && below.state?.type === "bottom") g.set(x, y - 1, z, below.block, { ...below.state, type: "top" });
  }
}
