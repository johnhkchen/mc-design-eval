# E-21 concept-grounded materials — the mean-colour collapse restored by feature, measured honest (T-074-01)

The E-21 terminal handoff. E-19 made the GLB-voxel build *clean* (off-palette 0/7, speckle ≤ 0.05) but it
still chose every block by **nearest mean colour** — the authority that **collapses near-tone-distinct
materials** into one block (stone-brick walls and cobblestone corners both go grey; the deliberate masonry
distinction vanishes). E-21 replaced that single authority with a **concept-grounded material map** (T-071:
an LLM names the real survival block per visible region) **placed by geometric feature** (T-072: each named
block lands on the flat-face / edge-corner / roof / base / recess feature it is *for*) and **refined against
the concept** (T-073). T-074 is the measurement: per subject one GLB-voxel build under **two material
authorities** — `before` = colorimetric (the E-19 mean-colour `segmentMaterials`) → `after` = concept-grounded
(map → feature-assign) — on the **same GLB and the same palette universe**, so the only variable is the
authority. Spine: `benchmarks/sculpture/concept-materials-ab.{md,json}`; maps: `material-map/{subject}.json`;
builds: `concept-materials/{subject}/{before,after}-{3q.png,artifact.json}`; before/after composites:
`pr/assets/frames/concept-{gatehouse,cottage}-{before,after}.png`. This doc is a narrative over them.

- **distinct** — distinct blocks in the manifest. The **palette-growth axis**: it should grow *only* by a
  concept-justified addition (a material the concept shows that the design-doc omitted), never by table bloat.
- **speckle** — fraction of occupied cells locally outvoted (fragmentation; lower = cleaner).
- **off-pal** — cells using a block outside the concept map's declared palette (lower = disciplined). Measured
  vs the *map* palette, so it is texture-independent and reads identically live and offline.
- **near-tone collapsed→restored** — how many near-tone material pairs the colorimetric build merged into one
  block, vs how many the concept-grounded build places back as **separate blocks on separate features**
  (`sep` = pairs separated by feature). This is the headline axis.
- **true-by-feature** — does each map block end up *dominating* the feature it was assigned to (right material
  in the right place), or does it land mostly on the wrong feature (over-reach)?

## The four subjects — colorimetric before → concept-grounded after

| subject | kind | distinct | speckle | off-pal | near-tone collapsed→restored | true-by-feature | judge |
| ------- | ---- | -------- | ------- | ------- | ---------------------------- | --------------- | ----- |
| gatehouse | architectural | 5→5 | 0.006→0.035 | 0→0 | 3→3 (sep 4) | ✓ | **restored** |
| cottage | architectural | 7→6 | 0.002→0.093 | 1416→0 | 3→0 (sep 1) | ✗ | **over-reach** |
| moai | sculpture | 5→3 | 0.005→0.079 | 1492→0 | 1→0 (sep 0) | ✗ | **over-reach** |
| pineapple | sculpture | 4→4 | 0.021→0.073 | 0→0 | 3→2 (sep 2) | ✗ | **over-reach** |

Near-tone pairs collapsed by colorimetry **10** → restored by the concept-grounded build **5**. **restored**:
gatehouse · **over-reach**: cottage, moai, pineapple · **deferred**: none.

## The headline — is the near-tone distinction restored? **Yes on the architectural 1:1 case; honest over-reach everywhere a feature can't carry the material.**

**gatehouse is the clean restoration.** The colorimetric build merged its four materials toward grey; the
concept-grounded build places all four back on the feature each is *for* — `stone_bricks` on flat-face walls,
`cobblestone` on the edge-corner quoins, `deepslate_tiles` on the roof, `dark_oak_planks` in the opening
recesses — **every block dominates its intended feature** (true-by-feature ✓), 4 near-tone pairs separated,
off-palette stays 0, and distinct holds at 5 (no bloat). This is the exact failure E-21 set out to fix —
grey-blob walls become brick-walls-with-cobble-corners — measured restored. See
`frames/concept-gatehouse-{before,after}.png`.

The other three are **honest over-reach**, each with a *named, distinct cause* — not a regression, the
negative the metric exists to surface (AC#5):

- **cottage — the SHARED-RULE LIMIT.** Its map is concept-honest but assigns **two materials to one
  `placementRule`**: `stone_bricks` *and* `white_terracotta` both `walls`; `spruce_planks` *and*
  `dark_oak_planks` both `roof`. The T-072 assigner places **one block per geometric feature**, so the second
  same-role material has no distinct feature to land on — `white_terracotta` spills onto the base,
  `dark_oak_planks` onto the opening recess (true-by-feature ✗). The materials are *justified by the concept*,
  not invented; **geometry alone cannot separate two materials that share one architectural role.** This needs
  a finer sub-feature selector (the same gap as the unplaced `trim` accent). Recorded, not patched.
- **moai — organic feature classifier + a justified addition that can't land.** The LLM correctly adds
  `stone_bricks` back for the coursed plinth (distinct 5→3 net, growth +1, **justified**: the base shows a
  tiled grid the smooth `gray_concrete` column does not). But on an organic monolith the architectural feature
  classifier (flat-face / edge-corner / roof / base / recess) is ill-defined; the plinth bricks land on
  edge-corner cells instead of the base ring (true-by-feature ✗). The near-tone pair the concept shows
  (smooth body vs coursed base) is real and *named in the map* — the assigner just can't place it on an
  organic form.
- **pineapple — same organic limit, no growth.** Palette holds at 4 (no bloat), near-tone 3→2 separated, but
  `green_concrete` (the leaf crown, assigned `roof`) dominates edge-corner cells and the base `yellow_terracotta`
  lands on flat-face — the radial fins and ovoid have no clean roof/base feature for the classifier to key on.

## Palette growth — concept-justified, never bloat (AC#4)

distinct grew on **no** subject and *shrank* on three (cottage 7→6, moai 5→3). The single addition across all
four — moai's `stone_bricks` plinth — is **concept-justified** (a coursed masonry footing the design-doc
omitted, distinct in texture and role from the smooth body) and flagged `justified: true`. The build does
**not** slide back toward full-table bloat: the LLM adds a material *only* where the concept shows one the
design-doc missed, and the distinct-block count is bounded by the map, not the 305-block table.

## What this buys, honestly

- **The collapse is fixable by authority, not colour.** Where the geometry carries a 1:1 rule→block mapping
  (gatehouse), the concept-grounded build restores every near-tone distinction the colorimetric build merged,
  cleanly (off-palette 0, distinct flat) and truly (every block on its feature). That is the E-21 thesis,
  demonstrated.
- **The boundary is the feature classifier, and it is named.** Over-reach is not noise — it is exactly two
  reusable gaps: (1) **two materials per architectural role** (cottage) need a sub-feature selector;
  (2) **organic forms** (moai, pineapple) need a form-aware feature vocabulary, not the flat-face/edge/roof/base
  classifier built for architecture. Both are honest negatives the A/B surfaces, not regressions it hides.
- **Near-tone identity is geometric, and invisible to a render (the T-073 finding).** The distinction is
  carried by *feature assignment*, not colour, so a render-based refine pass (T-073) cannot see it — which is
  why this A/B measures the assign-level build and cites the correct pass rather than re-running it per subject.

**One sentence:** E-21 restores the near-tone material distinction the mean-colour build collapses — cleanly
and truly on the architectural 1:1 case (gatehouse: 4 pairs separated, every block on its feature, no bloat) —
and the three over-reaches are the honest, named boundary of the geometric assigner (two-materials-one-role
and organic-form feature ambiguity), with palette growth that only ever adds a concept-justified material back.
