# T-061-01 Design — consolidation & thin-boundary

Five decisions, each grounded in Research. The shape mirrors E-17 (T-057-01): a pure, tested
spine→`{md,json}` transform; an I/O runner that writes the tracked bundle + stitches composites; a
journal section; a frames-provenance edit. The new content over E-17 is (a) five metrics not two,
(b) attribution by **fix** (not rung), and (c) a **form-type-routing** verdict that is half quantitative
(per-subject thin form Δ) and half qualitative (the sword boundary).

## D1 — Scorecard is a PURE transform of the committed spine (`src/form/e18-scorecard.mjs`)

**Decision.** Add `assembleE18Scorecard(spine, opts) → {md, json}` to a new pure module. It reads the
*already-assembled* `e18-remeasure.json` verbatim and emits scorecard markdown + a `e18-scorecard/v1`
JSON. No re-derivation of any metric, no GL, no I/O, no imports outside `src/`. Reuses `METRICS`/`BUILDS`
and the `delta()` direction-aware math from `src/form/remeasure.mjs` rather than re-implementing them.

**Why.** The spine is T-060-01's single source of truth; re-deriving would risk the scorecard drifting
from the record — the exact failure E-17 designed against. A pure spine→view function is unit-testable
under `src/**/*.test.mjs` with a tiny synthetic spine, no files, no renders.

**Rejected.** (a) Let the runner build the markdown by hand from JSON — untestable, drifts. (b) Extend
`assembleRemeasure` to also emit the scorecard — conflates the *collector's* frozen record (T-060) with
the *presentation/attribution* layer (this ticket); keep them separate as E-17 did. (c) Generalize
E-17's `scorecard.mjs` to N metrics — its spine shape (`rungs.{R0..R3}` with `dFormIoU`/`dValueDeltaE`)
is a different contract; forcing a shared abstraction couples two frozen records.

## D2 — Attribution is by FIX, mapped to the baseline that isolates it

**Decision.** The scorecard's headline is a "what each fix bought" table over three fixes, each averaged
across the 7 subjects, with the baseline chosen so the delta isolates the fix:

| fix | isolating Δ | primary metric(s) | reason the baseline isolates it |
|---|---|---|---|
| **thin voxelization** (form) | E18 − **R1** | formIoU | R1 and E18 share the augmented design-doc palette; color does not move silhouette IoU, so the form Δ is purely the thin pass. |
| **material segmentation** (speckle/gradient) | E18 − **R2** | speckle | R2 is E-17's material-clean *smoothing*; E18 is region segmentation — the Δ is segmentation beating smoothing. |
| **palette discipline** (leakage) | E18 − **R2** | offPalette, distinct | R2 leaks to the GLB texture palette (off-pal 2790 avg); E18 snaps within the augmented design-doc palette → 0. |

Each row reports avg marginal, improved/held/regressed tally, and a verdict (`won-form`/`won-clean`/
`won-discipline`/`wash`/`regressed`). The per-subject Levels and Marginal-Δ tables (all five metrics ×
R1/R2/E18) come straight from the spine.

**Why.** The AC asks specifically for "the marginal Δ **each fix** bought," and names the mappings
(distinct ↓ + off-palette → 0 = palette discipline; speckle ↓ = gradient/segmentation). E-18 has only
three builds and two combined fixes, so unlike E-17's clean rung-by-rung ladder, attribution must pick
the baseline that *isolates* each fix. R1-vs-E18 for form is the key insight: because palette discipline
is already in R1, the form delta is the thin pass alone.

**Rejected.** A single e18-vs-R2 column for everything — would blur the thin-form win (R2 has the same
non-thin occupancy as R1, so e18-vs-R2 form = e18-vs-R1 form anyway, but the *narrative* baseline for
form is R1 = "the form-grounding rung," which is the honest framing).

## D3 — Form-type routing is a first-class verdict, derived + stated

**Decision.** The scorecard computes a per-subject **routing** classification from the spine: sign of
the thin form Δ (E18 − R1) partitions subjects into `thin-helped` (bow, koi, heart, moai) vs
`solid-hurt` (dancing-man, pineapple, mushroom). The runner + journal then state the **rule**: image→3D
voxelization (with thin preservation) is the path for bulky/organic forms; thin/angular forms route to
text→JSON — with **sword** as the boundary evidence (no GLB at all; TRELLIS 500s; yet its text→JSON
build was strong). The sword fact is qualitative (no spine row) and lives in the runner-appended prose +
journal, captioned as a finding.

**Why.** AC #3 makes form-type-routing the *deliverable*, not a gap. The spine already encodes its
quantitative half (thin helps organic, hurts solid); the sword is the qualitative boundary. Stating both
as one rule is the verdict the epic exists to produce.

**Rejected.** Treating the solid-subject form regressions as a defect to hide or "fix later" — they are
the evidence *for* routing; dropping them would violate the honesty discipline and erase the finding.

## D4 — Before/after composites stitched from existing renders (no GL)

**Decision.** The runner stitches three committed composites with the existing `montageRow`:
`pr/assets/frames/speckle-heart.png` and `speckle-koi.png` (before = R2 `glb-voxel-clean` render, after =
`e18-build` render) and `pr/assets/frames/thin-bow-and-arrow.png` (before = thin `render-base-3q.png`,
after = `render-thin-3q.png`). A missing source render is logged + skipped; the scorecard still writes.

**Why.** AC #2 wants before/after visuals on the noisy (heart/koi speckle) and thin (bow-and-arrow form)
subjects, saved for E-12. All four source renders exist locally but are gitignored, so committed
composites are the only durable form — exactly the E-17 march-strip pattern. Reusing `montageRow` (pure,
tested) means no new GL and no new pixel code. R2 (not R1) is the "before" because the AC frames the
speckle win as **segmentation beating R2 smoothing** — the conservative, honest comparison.

**Rejected.** (a) Re-rendering fresh frames — needs GL, slow, and would be identical to the committed
renders. (b) Using R1 as "before" — more dramatic but overclaims (R1 is rawer than the R2 the fix is
measured against). (c) Separate before/after files (E-14 style) — a single 2-panel strip per subject is
tidier for the cut and matches the E-17 strip convention.

## D5 — Journal + handoff follow the established consolidation shape

**Decision.** Append a `## Surface coherence & thin form (E-18) …` section to
`docs/knowledge/design-learnings.md` after the E-17 section: the speckle + palette-discipline + thin
numbers, the value-ΔE cost (honest negative), the form-type-routing rule with the sword boundary, the
residual, and a one-sentence distillation. Write the scorecard + an "E-12 handoff" section to
`pr/assets/surface-and-thin.md`, and append a provenance block to `pr/assets/frames/README.md` for the
three new composites.

**Why.** Matches E-14/15/16/17 exactly (the ticket says "consolidation style"). The journal is the
durable record; `pr/assets/` is the self-contained E-12 bundle; the README keeps frame provenance
honest (which gitignored render each panel came from + the regen command).

**Rejected.** Putting the routing finding only in the scorecard — the journal is the durable home for
learnings; both must carry it.

## Honesty commitments (AC #5)

The scorecard and journal both state, in numbers: **value ΔE rose** (E18 8.67 vs R1 5.47 avg) as the
real cost of palette discipline (not the R2=0 tautology); **form IoU is net-flat** with **3 solid
subjects regressing** (dancing-man −0.10, pineapple −0.06, mushroom −0.05); off-palette → 0 is measured
against the **augmented design-doc** palette (design-doc ∪ ≤2 gated secondary), named so it is not
over-read. n is reported on every average. Nothing dropped.

## Module/artifact summary

- **Create:** `src/form/e18-scorecard.mjs` (pure), `src/form/e18-scorecard.test.mjs`,
  `benchmarks/sculpture/e18-scorecard.mjs` (runner).
- **Write (tracked bundle):** `pr/assets/surface-and-thin.md`, `pr/assets/frames/{speckle-heart,
  speckle-koi,thin-bow-and-arrow}.png`.
- **Edit:** `docs/knowledge/design-learnings.md` (append E-18 section), `pr/assets/frames/README.md`
  (provenance), `.gitignore` (none needed — composites are tracked, sources already ignored).
