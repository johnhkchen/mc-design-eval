# T-061-01 Review — consolidation & thin-boundary (E-18, terminal)

The handoff document. What a reviewer needs to understand the work without reading every diff.

## What this ticket is

The **terminal consolidation** for Epic E-18 (surface coherence & thin form). Not a trial — no model
calls, no GL re-measurement. It turns the committed E-18 spine (`e18-remeasure.json`, T-060-01) into the
verdict + the honest boundary, in the E-14/15/16/17 consolidation style.

## What changed

**Created**
- `src/form/e18-scorecard.mjs` (pure, ~210 lines) — `assembleE18Scorecard(spine) → {md,json}` plus
  `attributeFixes`, `classifyRouting`, `meanPresent`, `FIXES`, `EPS`. Consumes the spine verbatim;
  no I/O, no GL, imports only `METRICS`/`BUILDS` from `remeasure.mjs`.
- `src/form/e18-scorecard.test.mjs` — 8 GL-free unit tests over a hand-built spine fixture.
- `benchmarks/sculpture/e18-scorecard.mjs` (runner, ~190 lines) — the I/O edge: reads the spine,
  stitches 3 before/after composites via `montageRow`, writes the tracked bundle.

**Written (tracked E-12 bundle)**
- `pr/assets/surface-and-thin.md` — the scorecard (Levels + Marginal Δ + per-fix attribution + routing
  + honesty notes) + the E-12 handoff/routing/sword prose.
- `pr/assets/e18-scorecard.json` — the structured `e18-scorecard/v1` record.
- `pr/assets/frames/speckle-heart.png`, `speckle-koi.png`, `thin-bow-and-arrow.png` — 1030×512 composites.

**Edited**
- `docs/knowledge/design-learnings.md` — appended the `## Surface coherence & thin form (E-18)` section.
- `pr/assets/frames/README.md` — provenance for the 3 new composites.

**Not touched:** the ticket frontmatter (`T-061-01.md` phase/status) — Lisa owns transitions. The other
modified files in the working tree (T-058/059/060 tickets + work docs) are not mine and were left alone.

## The verdict (what the scorecard says)

Two clean wins and one routed tradeoff, each measured against the baseline that isolates it:
- **Material segmentation** halves speckle vs R2's smoothing — avg **−0.180**, improved **7/7** (the most
  uniform single-metric win in the record; R1 0.44 → E18 0.13).
- **Palette discipline** drives off-palette to **0 on all 7** (vs R2's ~2790 texture-palette leak) with
  distinct ≤ R2 everywhere — avg Δ off-pal −2791, 7/7.
- **Thin voxelization** is a **routed tradeoff** (avg form −0.004, 4/7 improved): it lifts organic/thin
  subjects (bow 0.473 → 0.526 with 4→1 components, koi +0.08) and over-thickens 3 already-solid ones.

The deliverable boundary: **form-type routing** — bulky/organic → image→3D + thin voxelization;
thin/angular → text→JSON (sword the evidence: no GLB, TRELLIS 500s, yet a strong text→JSON cruciform).

## Design rationale (the one decision worth re-checking)

**Attribution baseline per fix.** Form is read as E18−**R1**, speckle/discipline as E18−**R2**. The
non-obvious part: because T-058-02 wired palette discipline into R1 too, R1 and E18 share the augmented
design-doc palette — so the E18−R1 form delta is the thin pass *alone* (colour can't move a silhouette
IoU). If a reviewer expects all deltas off one baseline, this is why they aren't. It is the honest framing
(R1 = "the form-grounding rung") and it keeps the thin-form attribution uncontaminated by recolor.

## Test coverage

- **Pure core: fully covered.** 8 tests exercise `attributeFixes` (form/speckle/discipline means + verdict
  + tally), `classifyRouting` (sign partition), `meanPresent` (null-skip), `assembleE18Scorecard` (schema +
  all 5 section headers + subject names), missing-cell tolerance (`—`), and frozen-contract guards.
- **Runner: manual.** The I/O + PNG stitch edge is not in the test glob (consistent with
  `sweep-scorecard.mjs`); verified by running it (3/3 composites, md numbers spot-checked digit-for-digit
  vs the spine table in research.md).
- **The spine itself** was unit-tested in T-060-01 (`remeasure.test.mjs`), so the scorecard only needs to
  prove it *reads* the spine faithfully — which the shape test + manual check cover.

## Open concerns / limitations

1. **The journal section is hand-written**, so its numbers are duplicated from the spine (not generated).
   Mitigation: every number was cross-checked against `e18-remeasure.json` during Step 3, and the
   scorecard markdown (which *is* generated) carries the same numbers as the canonical source. A future
   nicety would be to generate the journal table from the scorecard json, but that is out of scope.
2. **Composites depend on local gitignored renders.** If a reviewer regenerates from scratch they must
   run `e18-remeasure.mjs` / `glb-voxel-thin.mjs` first; the runner skips-and-logs absent pairs. All 3
   were present and stitched this run.
3. **"distinct" delta renders as `+0`** for the many zero-change cells — cosmetic, consistent with E-17's
   `+0.000`; honest (no change is shown as no change).
4. **Thin preservation is still applied universally** in the combined build — the routing rule is *stated*
   (the deliverable) but not yet *wired* as a per-subject switch. That is a future-epic lever, explicitly
   named as the residual in the journal, not silently deferred.

## Critical issues for human attention

None. The work is additive, the gate is green (608/608), and the honest negatives (value-ΔE rise, solid
over-thickening) are surfaced in both the scorecard and the journal rather than buried. The one thing a
reviewer might want to confirm by eye is the **before/after composites** — that the speckle pairs visibly
show scatter → clean regions and the thin pair shows the bow reconnecting — since those are the only
non-numeric claims.
