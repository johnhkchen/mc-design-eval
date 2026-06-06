# T-074-01 — concept-materials-consolidation · Design

Decisions for the terminal E-21 measurement. The work is a **consolidation**, not new pipeline capability:
build both sides of the A/B, score clean-and-true + near-tone restoration + justified growth, and write the
durable record + learnings + handoff. Grounded in Research: mirror `e19-cleanup.mjs` (pure assembler + impure
runner), reuse the committed predecessor artifacts, build only the missing colorimetric architectural sides.

## D1 — One pure assembler + one impure runner (mirror E-19's consolidation)

**Decision.** Add `src/form/concept-materials-ab.mjs` (PURE, unit-tested) + `benchmarks/sculpture/
concept-materials-ab.mjs` (impure, live + `--offline`). The assembler owns the row math, the categorical
judge, palette-growth tabulation, averages, headline; the runner owns GL/dwebp/metered/I/O and feeds cells.

**Why.** This is the established and reviewed shape for a terminal consolidation (E-19/T-066 did exactly
this). It keeps `npm test` green deterministically (the assembler is pure), keeps the report reproducible via
`--offline`, and the live branch metered/GL is exercised only by committed runs — the project idiom every
predecessor followed. Rejected: a single impure script that computes + renders inline (untestable, can't
re-derive the report after a crash); reusing `assembleCleanup` verbatim (its axes are speckle/stray/IoU for
the cleanup story — the wrong axes here; clone the *shape*, not the module).

## D2 — Subjects: gatehouse + cottage (headline) + moai + pineapple (sculptures)

**Decision.** Four subjects. gatehouse + cottage are the architectural headline (both have committed maps,
both carry the stone_bricks/cobblestone near-tone pair). moai + pineapple are the two sculptures.

**Why.** AC#1 names exactly "gatehouse + cottage (the headline) and 2 sculptures." moai is near-monochrome
stone → **no near-tone pair to restore**, so it is the *bloat control*: concept-grounded growth must stay
flat. pineapple has a body/crown two-material story → a real distinction. Together they show both the
"nothing to restore, don't bloat" and the "over-reach on organic form" honesty cases AC#5 asks for. Both have
committed `e19-build/<subj>/artifact.json` (the colorimetric before) + GLB + concept run. Rejected: heart/koi
(speckle stories already told by E-19; moai+pineapple give the cleaner monochrome-vs-two-material contrast).

## D3 — The colorimetric "before": build it for architectural, reuse it for sculptures

**Decision.** For gatehouse/cottage the "before" is built fresh with `segmentMaterials` (the E-19 colorimetric
authority) on the GLB — no committed colorimetric architectural build exists. For moai/pineapple the "before"
is the committed `e19-build/<subj>/artifact.json` read straight off disk.

**Why.** The headline claim ("grey-blob walls become brick-walls-with-cobble-corners") *requires* the
colorimetric gatehouse to exist as a real artifact + render — it is the failure E-21 fixes, and it was never
built. Reusing E-19's committed sculpture artifacts keeps the sculpture before identical to the published
E-19 result (no re-derivation drift) and avoids re-rendering 7 builds. Rejected: skipping the colorimetric
architectural build and asserting the collapse abstractly — AC#3 needs the actual before frame.

## D4 — The concept-grounded "after": map → feature-assign; correct is optional/separate

**Decision.** The A/B "after" is the **feature-assigned** build (map → `classifyFeatures` →
`assignFeatureBlocks`). The T-073 correct pass is **not** in the A/B headline build; the committed
`material-correct/gatehouse` record is cited as the refine-pass evidence, not re-run per subject.

**Why.** Feature-assignment is the step that *restores the near-tone distinction by geometry* — the core
E-21 mechanism and the thing the A/B measures. It is **deterministic + GL-only** (no metered call), so the
headline A/B runs reproducibly. The correct pass is a refinement that T-073 already proved is a no-op on the
as-built gatehouse and is metered; folding it into a 4-subject sweep adds cost + flakiness for ~zero signal.
The report cites it honestly as the complementary visible-mis-zone net. Rejected: running correct per subject
(metered ×4, no measured benefit, contradicts T-073's own finding).

## D5 — Generating the two sculpture maps (the only metered step), gated + graceful

**Decision.** The runner generates moai/pineapple maps via the committed `material:map` bridge **if absent**,
then commits them. The step is gated: if a metered call fails/times out, the runner records the subject as
`deferred` (no map) and the A/B still ships for the subjects that completed. `--offline` never calls the
model.

**Why.** AC#1 wants 2 sculptures through the *full* pipeline, which needs maps, which are metered (the maps
ARE the LLM output — can't be derived offline). Gating + graceful degradation matches the predecessor idiom
(an absent GLB/concept is skipped, never fatal) and keeps an autonomous run from dying on one flaky metered
call. The committed maps make subsequent runs + `--offline` free. Rejected: hand-authoring sculpture maps
(would fake the LLM's judgement — the whole point is the model defines materials); requiring all 4 or fail
(one metered hiccup loses the whole headline).

## D6 — The metrics (the A/B cell) and the deterministic judge

**Decision.** Per subject, per side (before=colorimetric, after=concept-grounded), compute:
- `distinct` — palette size (the growth axis).
- `speckle` (`speckleScore`) + `offPalette` (`offPaletteCount` vs the augmented allowed palette) — **clean**.
- `nearTone` restoration — from the map's `nearTonePairs`: for each pair, is **both** blocks present? In the
  after, are they **feature-separated** (each dominating a distinct feature via `featureBlockMatrix`)? In the
  before, count pairs **collapsed** (≤1 of the pair present) — the mean-colour merge.
- `growth` — `palette ∖ design-doc-manifest`: each added block + its map `role`/`rationale` (justification)
  + `placementRule` (material role). A boolean `justified` (every addition carries a concept rationale) vs
  `bloat` (count jumped toward full-table with unjustified entries).
- `trueByFeature` — the T-072 `brickNotCobbleByFeature`-style check generalized: does each map block dominate
  its own feature (right material where the concept put it)?

**The deterministic judge (AC#2 categorical), per subject:**
- `restored` — a near-tone pair collapsed in before is present + feature-separated in after, clean held.
- `clean-held` — speckle not worse AND offPalette ≤ before (E-19 region coherence preserved).
- `no-distinction` — the subject has no near-tone pair (moai): growth must stay flat (the bloat control).
- `over-reach` — the after invented/mis-assigned a material (a map block dominates the WRONG feature, or
  growth is unjustified) — the honest negative.

**Why.** These are precisely AC#2/#4's questions ("near-tone distinction restored? clean AND true? growth
concept-justified not bloat?"). The judge is **deterministic** (the E-15/T-073 lesson: a non-deterministic
gate confounds the measurement). It reuses the existing pure kernels (`nearTonePairs`, `featureBlockMatrix`,
`speckleScore`, `offPaletteCount`) rather than re-deriving colour math. Rejected: a multimodal LLM judge as
the categorical (non-reproducible, can't run in `--offline`, contradicts the deterministic-gate lesson) —
noted as a separable follow-up.

## D7 — Outputs

**Decision.**
- `benchmarks/sculpture/concept-materials-ab.{md,json}` — the durable A/B record (AC#2/#4).
- `benchmarks/sculpture/concept-materials/<subj>/{before,after}-artifact.json` + renders (gitignored PNGs).
- `pr/assets/frames/concept-gatehouse-{before,after}.png` (+ cottage) — the AC#3 visual for E-12.
- `pr/assets/concept-materials.md` — the E-12 handoff narrative.
- `docs/knowledge/design-learnings.md` += a "concept-grounded materials (E-21)" section (AC#5).
- `package.json` += `"concept:ab"` script.

**Why.** Matches `e19-cleanup.{md,json}` + `pr/assets/<epic>.md` + `frames/` exactly. PNGs gitignored,
artifacts/records committed (the project convention). Rejected: a new top-level dir (benchmarks/sculpture is
where every material runner already writes).

## What is deliberately NOT done

- No change to any pipeline module (map/assign/correct/segment) — this is measurement; zero regression
  surface beyond new files + additive lines (the predecessor invariant).
- No correct pass in the sweep (D4). No multimodal judge (D6). No new sculpture beyond moai/pineapple.
- The `trim` placement gap (T-072) and non-full-cube fixtures (T-071) are inherited, not fixed — recorded in
  the honesty ledger, not closed here.
