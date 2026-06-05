# Plan — T-006-01

Ordered, independently-verifiable steps to apply the one detail lever (Option D, revision
seam), run the Taj `vRefRevise-designdoc` trial twice, judge both rounds, decide the verdict,
and journal it. Live & metered — each run is 3 `claude -p` calls.

## Step 1 — Apply the lever (one prompt diff)
Edit `composeRefRevisionPrompt` in `benchmarks/temple-facade/run.mjs`: rewrite ONLY the
`Detail — NO LARGE FLAT FIELDS` bullet into the mandatory recessed-panel + string-course
grammar (relief-only, palette held). Leave all other bullets intact and ahead of it.
- **Verify:** `git diff` shows exactly one bullet changed in one function; no other hunk.

## Step 2 — Tests stay green
Run `npm test`.
- **Verify:** validate self-test + invalid check + unit tests all pass (133 expected). No
  `baml:gen` needed (no `.baml` changed). If anything fails, the prompt edit is the only
  suspect — fix or revert before proceeding.

## Step 3 — Generation 1 of the variant
`node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/taj_mahal.png`
- Produces `runs/016-vRefRevise-designdoc/` with `round-0.png`, `render.png`, `summary.json`
  (render score, median-of-3).
- **Verify:** run completes; `summary.json.score` present; both PNGs exist.

## Step 4 — Judge round-0 of generation 1
Write `docs/active/work/T-006-01/judge-round0.mjs` (imports `judgeRender`, prints categorical
score for a PNG + the Taj brief). Run it on `runs/016-.../round-0.png`.
- **Verify:** get a per-dimension categorical score for round-0 (the within-run control).
- Record the A/B: round-0 vs render per dimension into `progress.md`.

## Step 5 — Generation 2 of the variant (robustness)
Re-run the identical command (no config change) → `runs/017-vRefRevise-designdoc/`. Judge its
`render.png` (auto) and `round-0.png` (helper).
- **Verify:** second full A/B captured. This supplies the 2-generation robustness sample the
  AC requires (`detail` strong must replicate, not be a one-shot category flip).

## Step 6 — Baseline articulation comparison
Compare the variant renders' detail to the **015 baseline** render
(`runs/015-vRefRevise-designdoc/render.png`): is there a *describable* articulation increase
(panels/courses now breaking the orange wall fields) or just window-grain noise? Note this
qualitatively in `progress.md` — it is the second acceptable robustness signal per the AC.

## Step 7 — Decide the verdict (AC promotion rule)
Promote **iff** ALL hold:
- `detail` rises a full category to *strong* (vs round-0 control and vs 014 competent), AND
- no regression on proportion / color / fidelity, AND overall stays ≥ *strong*, AND
- robust: `detail` *strong* across **both** generations' renders, OR a clear describable
  articulation increase vs the 015 baseline.
Else → **discard** (or **scope** if it helped one generation but not robustly): revert the
prompt diff. A single noisy `detail=strong` does not promote (within-band wobble).
- **Verify:** the decision is written with the numbers that justify it.

## Step 8 — Revert if not promoting
If discard/scope: revert the Step-1 edit in `run.mjs` (restore the original bullet) so the
champion config is unchanged on disk. The negative result still counts as a finding.
- **Verify:** `git diff` on `run.mjs` is empty after revert.

## Step 9 — Append the attempt-log entry
Append a dated entry (newest last) to `docs/knowledge/design-learnings.md` recording: the
**prompt diff** (before/after bullet), the **A/B per-dimension scores** for both generations
(round-0 vs render), the **015 baseline** articulation comparison, the **judge notes**, and the
**verdict** (promote / scope / discard, with revert noted if applicable). Refine P15 only as
the result warrants.
- **Verify:** entry present, contains diff + both A/Bs + verdict.

## Step 10 — Retain artifacts + Review
Confirm renders + `summary.json` retained under each `runs/<id>/`. Write `review.md`.

## Testing strategy
- **Unit/contract:** `npm test` (Step 2) — the only automated gate; guards that the edit didn't
  break the harness. A prompt change has no unit test of its own.
- **Experimental (the real test):** the categorical judge, median-of-3, on 4 renders (2 gens ×
  {round-0, render}). The A/B + 2-gen robustness + baseline comparison IS the verification of
  the hypothesis. This is judgment under noise — the controls (round-0, 015 baseline, 2
  generations) are what make a `detail=strong` credible rather than lucky.
- **Verification criteria = the AC promotion rule** in Step 7, applied honestly. Recording a
  falsified lever is a successful outcome of the ticket, not a failure.

## Commit strategy
- Commit the lever edit + work artifacts after the experiment concludes (one commit if
  promoting; if reverting, commit the journal entry + revert together so the diff trail shows
  the lever was tried and falsified). Lisa handles branch/serialization.

## Cost / time budget
~2 full runs × (3 model calls + 1 judge) + 2 round-0 judges ≈ ~$4–5, several minutes each.
Acceptable for an overnight hill-climb link.
</content>
