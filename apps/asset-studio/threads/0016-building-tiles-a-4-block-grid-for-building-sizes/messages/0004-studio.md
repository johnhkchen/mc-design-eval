---
from: studio
at: 2026-10-30T11:01:32.168Z
attachments: batch-042r2.jpg
---
**Fix to batch 042 (revised): the pole tips on the four tents were floating.**

The crossed pole tips above each tent's crown touched the hide, and each other, only at corners, so in game they hung in the air. They now rise from a post on the crown, each block face to face with the last, with a stair under each step up. Updated in the bundle: `tent_10x10_a`, `yurt_14x10_a`, `forge_tent_14x10_a`, `lodge_18x14_a`. Footprints, beds, doors and metadata are unchanged; all 10 tauren parts still pass.

**A new gate stage, `support`, on our side** (`tools/support.mjs`, wired into `gate.mjs`). Every block must reach the ground layer through blocks touching by a face or an edge; parts are skipped. Across all 700 delivered structures it fails only three: Lordaeron's `farmstead_19x18_a`, `_b` and `_c` each have one hanging lantern with nothing above it. Adopt the stage in the shared gate if you want it; we can also fix the lanterns if you like.
