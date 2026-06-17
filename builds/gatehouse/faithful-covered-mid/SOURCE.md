# builds/gatehouse/faithful-covered-mid — controlled hard-middle (one wrong material) (E-46 / S-183 / T-183-01)

A pure single-factor mutation of builds/gatehouse/faithful-covered: the ROOF timber family swapped
minecraft:dark_oak_stairs->minecraft:spruce_stairs, minecraft:dark_oak_planks->minecraft:spruce_planks on every placement (225 roof cells). Dark oak (near-black, the
concept's roof) becomes spruce (warm medium-brown) — both are wood-shingle roofs, so it is a
plausible-but-wrong material, NOT a broken roof. The roof is prominent, so the change is VISIBLE
(unlike a first stone_bricks->cobblestone attempt that was invisible grey-on-grey); a brown-timber
gatehouse vs a dark-timber concept is genuinely rank-either-way — the contestable hard middle.

Model-free, deterministic. Reproduce: `node experiments/eval-alignment/corpus-build.mjs`.
Contestability confirmed by render inspection (T-183-01 AC #3); call recorded in the work review.

## Numbers
- roof placements rewritten: 225 / 1339
- palette manifest: minecraft:cobblestone, minecraft:dark_oak_log, minecraft:spruce_planks, minecraft:spruce_stairs, minecraft:stone_bricks
