# Concept-grounded materials A/B — colorimetric E-19 → map + feature-assign (T-074-01)

The terminal E-21 measurement. Per subject the GLB-voxel build across **two material authorities**:
**before** = colorimetric (mean-colour `segmentMaterials`, the E-19 build — the path that COLLAPSES
near-tone materials) → **after** = concept-grounded (the T-071 LLM material map placed by T-072
geometric feature). Cells read **before→after**. Lower better for speckle / off-palette; `distinct` is
the palette-growth axis (grows only by concept-justified additions).

Scale 32. Subjects: 4. Schema `concept-materials-ab/v1`.

| subject | kind | distinct | speckle | off-pal | near-tone collapsed→restored | true-by-feature | judge |
| ------- | ---- | -------- | ------- | ------- | ---------------------------- | --------------- | ----- |
| gatehouse | architectural | 5→5 | 0.006→0.035 | 0→0 | 3→3 (sep 4) | ✓ | **restored** |
| cottage | architectural | 7→6 | 0.002→0.093 | 1416→0 | 3→0 (sep 1) | ✗ | **over-reach** |
| moai | sculpture | 5→3 | 0.005→0.079 | 1492→0 | 1→0 (sep 0) | ✗ | **over-reach** |
| pineapple | sculpture | —→— | —→— | —→— | — | n/a | **deferred** |

## Palette growth — what the LLM added back, and why (AC#4)

| subject | distinct Δ | added blocks (role · concept justification) | justified? |
| ------- | ---------- | ------------------------------------------- | ---------- |
| gatehouse | 0 | _(none)_ | ✓ |
| cottage | -1 | _(none)_ | ✓ |
| moai | -2 | `stone_bricks` (base) · plinth / footing course — Near-tone but NOT the same material as the body: the base shows a regular tiled grid / coursed jointing in all three views, versus the smooth jointless concrete of the column. Kept distinct as bricks (visible coursing, masonry role as a wider footing) rather than collapsed into the body's gray. | ✓ |
| pineapple | — | _(none)_ | — |

## Judge tally (AC#2)

- **restored** (1): gatehouse
- **clean-held** (0): —
- **no-distinction** (0): —
- **over-reach** (2): cottage, moai
- **deferred** (1): pineapple

## Headline

**Is the near-tone material distinction restored where the concept put it, clean (E-19 coherence held) and true (right material per feature), with concept-justified palette growth?**

→ **Restored on the architectural headline; honest over-reach recorded on organic forms (see ledger).**

Near-tone pairs collapsed by colorimetry **7** → restored by the concept-grounded build **3**. restored: gatehouse; over-reach: cottage, moai; deferred: pineapple.
> _restored = a colorimetric near-tone collapse is present again, placed by feature; over-reach = a map block dominates the wrong feature OR growth is unjustified (honest); no-distinction = monochrome subject, growth must stay flat (bloat control); deferred = no after build._

## Honesty ledger

- `trim` (a 1-block accent voussoir/band) has no geometric feature in the T-072 classifier — recorded as a known gap, not placed by form (see T-072 review).
- Non-full-cube fixtures (spruce_door, dark_oak_trapdoor, lantern) are dropped by the material map (not voxel materials) — see the cottage map `dropped`.
- The colorimetric BEFORE and concept-grounded AFTER share the SAME map palette universe; the ONLY variable is the authority (mean colour vs geometric feature). Architectural before/after share one voxelization; sculpture before is the published E-19 build (its own routed+pruned geometry), after is a fresh voxelization.
- SHARED-RULE LIMIT (the cottage finding): the T-072 assigner places ONE block per geometric feature, but the LLM map may assign TWO materials to the same placementRule (cottage: stone_bricks + white_terracotta both `walls`; spruce_planks + dark_oak_planks both `roof`). The second same-role material has no distinct feature to land on and is mis-placed (white_terracotta→base, dark_oak_planks→opening-recess) — recorded as `over-reach` though the material is concept-justified, not invented. Geometry alone cannot separate two materials sharing one architectural role; this needs a finer sub-feature selector (same family as the `trim` gap). The gatehouse (1:1 rule→block) restores cleanly.
- On organic sculptures the architectural feature classifier (flat-face/edge-corner/roof/base/recess) is ill-defined; the concept-grounded build leans on the colour fallback and may mis-zone — recorded as `over-reach`, the honest negative (AC#5), not a regression.
- Near-tone identity is invisible to a render (T-073 finding): the refine pass corrects VISIBLE mis-zoning; the near-tone distinction is carried by GEOMETRY (T-072), not colour. This A/B measures the assign-level build; the T-073 correct pass is cited, not re-run per subject.

> _Note:_ Per subject two builds: BEFORE = colorimetric (mean-colour segmentMaterials, the E-19 authority); AFTER = concept-grounded (T-071 map → T-072 feature-assign). distinct = palette size (the growth axis); speckle / off-palette = cleanliness (lower better); near-tone collapsed→restored = the headline; trueByFeature = each map block dominates its intended feature; growth = blocks added back vs the design-doc, each with its concept justification.
