# T-118-01 roof-form-seam — Plan

Ordered, atomically-committable steps. Verification criterion stated per step. Steps 1–6 build
and run the instrument (AC 1–2); steps 7–9 are the findings-gated refits (AC 3); step 10 closes
the invariants (AC 4).

## Step 1 — `normalizePlacement` extraction (pure refactor)

- `src/form/form-fidelity.mjs`: extract the letterbox placement math from `resampleInto` into an
  exported `normalizePlacement(bbox, { grid, fit })` → `{ tw, th, ox, oy }`; `resampleInto`
  consumes it. Add unit tests (aspect wide/tall/square, stretch) in `form-fidelity.test.mjs`.
- **Verify**: `npm run test:unit` green with zero changes to existing test expectations.
- Commit: `feat(E-30 T-118-01): expose normalizePlacement — one letterbox definition`.

## Step 2 — `src/view/roof-region-diff.mjs` core: regions + attribution

- Implement `ROOF_DIFF_SCHEMA/DEFAULTS`, `roofRegions`, `projectRegions`, `attributeMismatch`.
- Tests (synthetic only): region precedence/partition on a hand-built gable; fallback
  (`unpartitioned`) when gables empty; attribution partition invariant
  (Σ regions + wall === mismatchPx); both-empty masks; determinism (two runs byte-identical).
- **Verify**: new tests green; no fs/GL imports (eslint of the eye: imports list).
- Commit: `feat(E-30 T-118-01): roof-region diff core — regions from gable parametrics, XOR attribution`.

## Step 3 — height profiles + record assembly

- `heightProfiles` (aligned-triangle sampling, eave-relative + raw, uncovered counted) and
  `roofRegionDiff` (full record body, 3-decimal rounding).
- Tests: synthetic triangle sheet at a known pitch → exact expected heights; uncovered columns
  excluded from rmse but counted; eave anchors recorded; assembled record stable under re-call.
- **Verify**: tests green.
- Commit: `feat(E-30 T-118-01): roof-diff height profiles along ridge and rakes`.

## Step 4 — runner `benchmarks/sculpture/roof-diff.mjs`

- SUBJECTS iteration, the two path loaders (table in structure.md), refSils, double-run + sha256,
  `--repro` re-check, skip records for missing inputs, JSON + md + overlay PNGs + contact sheet.
  `package.json` script `diff:roof`; `.gitignore` entry for `roof-diff/**/*.png`.
- Gables source detail to resolve here: whether `roof/<s>.json` records swap-final gables — if
  yes use them, else compose `fit.gables` + accepted variant transforms; record which was used in
  the record's `inputs` block.
- **Verify**: `npm run diff:roof -- --subject cottage --path reconstructed` produces a record
  whose whole-object per-azimuth IoU matches the committed `roof/cottage.json` cage numbers
  (same comparison ⇒ same numbers — the instrument's self-calibration check).
- Commit: `feat(E-30 T-118-01): roof-diff runner — standing instrument beside the gate records`.

## Step 5 — run the instrument fleet-wide (BEFORE state)

- `npm run diff:roof` (all subjects × both paths; barn → named skip records ×2).
- Inspect the overlay renders by eye (memory: inspect renders, not block counts) before trusting
  the numbers; spot-check one azimuth's attribution against the multi-angle verdict regions.
- **Verify**: 6 records + 2 skip records + 6 contact sheets exist; `--repro` re-check passes.
- Commit: `feat(E-30 T-118-01): roof-diff records — all subjects, both paths (barn named-skipped)`.

## Step 6 — findings.md (AC 2, gates everything after)

- `benchmarks/sculpture/roof-diff/findings.md` + work-dir copy: per subject which regions carry
  the deltas; gatehouse `-x+z` decomposition explicitly; for each candidate refit a justified
  go/no-go. Possible outcomes are open: e.g. cottage ends may read clean ⇒ no end refit (named).
- **Verify**: every step-7/8 change cites a findings line; no refit lacks one.
- Commit: `docs(E-30 T-118-01): roof-diff findings — what reads wrong, region by region`.

## Step 7 — gatehouse ridge refit (if findings confirm ridge-height/ridge-region deltas)

- `ridgeApexDifferential` in `roof-ridge-fit.mjs` (+ tests: known apex/eave pair → expected ridge;
  sanity refusals preserved); rung wired into `roof-swap.mjs` ladder (+ ladder-order test).
- Re-run `roof-program` gatehouse; re-run `diff:roof` gatehouse (both paths if both move).
- **Verify**: cage outcomes recorded (accept or named refusal — both acceptable); before/after
  diff numbers move (or the impossibility is named with diff evidence — AC allows either);
  `npm run test:unit` green.
- Commit: `feat(E-30 T-118-01): gatehouse ridge — apex-differential rung under the cage`.

## Step 8 — cottage gable-end refit (if findings attribute mismatch to the ends)

- Whatever the findings justify (per design D6: evidence-source addition to end-fit, no threshold
  changes), with tests; re-run `roof-program` cottage + `diff:roof` cottage.
- If findings say ends are clean: skip with the finding quoted in findings.md and progress.md —
  that satisfies "no speculative rungs".
- **Verify/Commit**: as step 7.

## Step 9 — before/after evidence consolidation

- Copy pre-refit roof-diff records to `docs/active/work/T-118-01/artifacts/before/`; update
  findings.md with before→after tables per refit subject (diff artifacts, not verdicts).
- Commit: `docs(E-30 T-118-01): before/after roof-diff evidence`.

## Step 10 — invariants close-out

- `npm test` (unit glob + validate self-tests) green.
- Legacy single-mass byte-identity: run the legacy `--repro` path that exercises roof-swap (e.g.
  `roof-program` repro on an unrefit subject + one legacy sculpture repro per its runner) — must
  pass untouched.
- Self-grep the new files for subject names (`cottage|gatehouse|church|barn`) — registry-only.
- No judge surface: grep new/changed files for judge/sdk imports — none.
- Commit (if anything moved): `chore(E-30 T-118-01): close-out checks`.

## Testing strategy summary

- **Unit (src/, npm test)**: placement transform; region partition/precedence/fallback;
  attribution partition invariant; profile sampling exactness; apex-differential rung math;
  ladder ordering. All synthetic, no fixtures from disk.
- **Integration (manual, recorded)**: step-4 self-calibration (instrument IoU == cage IoU);
  step-5 fleet run + repro double-run; step-10 legacy repro.
- **Visual**: overlay sheets eyeballed before findings are written (the render-aliasing lesson:
  verify the lens before trusting the metric).

## Risks / contingencies

- Swap-final gables may not be recorded → compose variants (step 4 resolves; recorded either way).
- Attribution may look smeared at 30° elevation if region points are sparse → densify points with
  per-cell tops (already planned) before considering any cap/threshold (would be tuning).
- Gatehouse apex-differential may be refused by the cage (IoU regression at some azimuth) — that
  is a valid AC outcome: record the refusal + diff evidence, name the impossibility.
- provision-fit gables for the generated path may carry fewer fitted ends — regions degrade to
  footprint-band ends by design (endBandWidth rule), recorded per path.
