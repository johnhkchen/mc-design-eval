# T-074-01 — concept-materials-consolidation · Progress

Tracks execution against `plan.md`. Steps 1–4 (the architectural headline) landed in two commits before this
session; this session completes Step 5 (sculptures), Step 6 (design-learnings), the Step 4 handoff narrative,
and Step 7 (final verification).

## Status by step

- **Step 1 — pure assembler + tests.** ✅ Committed `046faf4`. `src/form/concept-materials-ab.mjs`
  (`abRow`, `judgeSubject`, `nearToneRestoration`, `paletteGrowth`, `assembleConceptMaterialsAb`,
  `render*Md`) + `concept-materials-ab.test.mjs`. Pure, null-tolerant, `concept-materials-ab/v1` schema.
- **Step 2 — runner skeleton + `--offline`.** ✅ Folded into `d26b32a`. `deriveRow` is the single source of
  truth for live and offline (one code path, no live/offline drift — the bug found + fixed last session).
- **Step 3 — live headline (gatehouse + cottage).** ✅ Committed `d26b32a`. Colorimetric `segmentMaterials`
  before vs concept-grounded map+feature-assign after on the same GLB/palette universe. **gatehouse:
  restored** (near-tone 3→3, separated 4, true-by-feature, on-palette). **cottage: over-reach** (the
  shared-rule limit — two materials assigned one `walls` role, the second has no distinct feature).
- **Step 4 — frames + E-12 handoff.** ⏳ Frames committed (`pr/assets/frames/concept-{gatehouse,cottage}-
  {before,after}.png`). Handoff narrative `pr/assets/concept-materials.md` — written this session.
- **Step 5 — sculptures (moai + pineapple).** ✅ Metered `material:map` gen completed for both; maps in
  `material-map/{moai,pineapple}.{json,raw.json}`, before/after builds + 3q renders in
  `concept-materials/{moai,pineapple}/`. Both judged **over-reach** (organic feature classifier ill-defined →
  colour fallback mis-zones; moai also adds a justified `stone_bricks` plinth the assigner can't place on the
  base). Required a 2-line `spawnMap` fix (missing `child.stdin.end()`) — the committed runner crashed on the
  first sculpture; fix is a working-tree change to commit with the artifacts.
- **Step 6 — design-learnings section.** ✅ `## Concept-grounded materials (E-21)` appended to
  `docs/knowledge/design-learnings.md` — collapse failure, authority-swap fix, justified-growth-not-bloat, the
  two named over-reach boundaries.
- **Step 7 — final verification.** ✅ `npm test` → 758 pass / 0 fail; `--offline` re-derived 4/4 subjects
  (judges `{restored:1, over-reach:3}`), AJV re-validated, no GL/model.
- **Step 4 handoff.** ✅ `pr/assets/concept-materials.md` written. **Review.** ✅ `review.md` written.

## Deviations from plan

- **Cottage judged `over-reach`, not `restored`/`clean-held` (Step 3).** The plan anticipated cottage as a
  second clean architectural headline. Reality: its map assigns two materials to one `placementRule`
  (`walls`: stone_bricks + white_terracotta; `roof`: spruce_planks + dark_oak_planks). The T-072 assigner
  places ONE block per geometric feature, so the second same-role material lands on the wrong feature. This
  is a genuine, concept-honest finding (the material is justified, the geometry can't separate it) — recorded
  as the SHARED-RULE LIMIT in the ledger, not patched. It strengthens AC#5 (honest over-reach) rather than
  weakening the headline; the gatehouse (1:1 rule→block) carries the clean restoration.
- **No `correct` pass in the sweep (per D4).** T-073 already proved it a no-op on the as-built gatehouse and
  it is metered; cited in the ledger, not re-run per subject.

## Verification log

- `npm test` → 758 pass / 0 fail (post-changes, this session).
- Full live sweep completed (all 4 subjects) after the `spawnMap` stdin fix; the prior sweep had crashed on
  moai. `--offline` re-derives the full report from committed artifacts with no GL/model → 4/4 subjects,
  judges `{restored:1, over-reach:3}`.

## Sculpture results (Step 5)

| subject | distinct | speckle | off-pal | near-tone collapsed→restored | true | judge |
| ------- | -------- | ------- | ------- | ---------------------------- | ---- | ----- |
| moai | 5→3 | 0.005→0.079 | 1492→0 | 1→0 (sep 0) | ✗ | over-reach |
| pineapple | 4→4 | 0.021→0.073 | 0→0 | 3→2 (sep 2) | ✗ | over-reach |

Both confirm the **organic-form boundary**: the architectural feature classifier
(flat-face/edge/roof/base/recess) is ill-defined on a monolith / ovoid-with-fins, so a concept-honest map block
leans on the colour fallback and mis-zones. moai's `stone_bricks` plinth is a justified addition (growth +1)
the assigner places on edge-corners instead of the base ring. Off-palette is eliminated on both (1492/0 → 0);
palette stays bounded (no bloat). Honest negatives (AC#5), not regressions.
