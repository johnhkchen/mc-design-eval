# T-178-01 — Review

## What this ticket did

Re-ran the style-distance **crater** (`corpus-referee.mjs` Section A) on the T-177-01 **fully-faithful**
gatehouse build at **VOTES=6**, matched vs two same-family wrong-style concepts, to confirm or refute
T-173-01's PROMOTE-PENDING-CONFIRMATION. **Result: refuted — the crater collapsed. The gate is the measure,
not the build.** Recommendation: **DO-NOT-PROMOTE / RE-CALIBRATE** the term. Promotion correctly blocked; the
frozen instrument was not touched.

## Files changed

| File | Change |
|---|---|
| `experiments/eval-alignment/corpus-referee.mjs` | **MODIFIED** (commit f6ec27a). `VOTES` env-overridable (`Number(process.env.VOTES ?? 2)`); population `std` helper + `scoreStd` per condition; `±std`/`(votes=N)` in the verdict line. Additive; default 2 keeps prior reproductions byte-identical. |
| `experiments/eval-alignment/results/corpus-referee-faithful-covered.json` | **CREATED** (8bf8091). The VOTES=6 run output; new file name, no baseline overwritten. |
| `docs/active/work/T-178-01/{research,design,structure,plan,progress,review}.md`, `FINDINGS.md`, `crater-*.png`, `run-votes6.log` | **CREATED**. RDSPI artifacts + the report + beside-concept composites + console log. |

No `src/` change. No `measurements/` change. No edits to the scoring (`bakeoff-score.mjs`) or the held-FIXED
PROGRAM/conditions.

## The result (evidence)

- **A-matched 13±12, B-arc 0±0, B2-chapelle 0±0, C-control 5±7.** A−B=13 is **inside** the ±12 noise; the
  2·NOISE=24 crater bar is not cleared. (T-173-01: A=28 B=0 at VOTES=2.)
- A-matched per-vote: `[0,4,20,28,28,0]` — the prior 28 was a 2-sample artifact from this distribution.
- **Per-item audit:** matched earns WALL:`replace` 6/6 + OPENING:`replace` 6/6 against its **own** concept —
  the same pattern as the wrong-style twin. `replaceContrast=−0.20` → NO CONTRAST. The term cannot separate
  the correct pairing from the wrong one.
- **Glance:** one genuine build-vs-concept divergence — build roof is brown dark_oak, concept roof is grey
  stone (a recognition/material-map gap, secondary; explains only ROOF:replace 3/6, not WALL/OPENING 6/6).

## Acceptance criteria

- [x] **AC#1** Crater re-run at VOTES≥4–6 (=6), matched vs same-family wrong-style; committed to `results/`.
- [x] **AC#2** Report: spread vs ±12; std across votes; vs T-173-01 (28/0 @ VOTES=2) and T-170-02 (8/14);
      per-item `kind`/`styleClass` audit; renders beside both concepts. (FINDINGS.md + crater-*.png.)
- [x] **AC#3** Recorded honestly — non-separation (collapse), not softened; residual gate localized as the
      **term scale (measure)**, with the secondary roof-color build note named separately.
- [x] **AC#4** Recommendation updated to **DO-NOT-PROMOTE / RE-CALIBRATE**, with the re-calibration target
      (concept-conditional `replace` + softening the single-`replace` hard cap) spelled out. **No PROMOTE → no
      freeze step executed** (and none should be).
- [x] **AC#5** `npm test` green (2283/0); frozen instrument untouched (`git status measurements/` clean).

## Test coverage / gaps

- The only code change is a metered experiment harness **not in `npm test`**; correctness was verified by a
  `GUARD_ONLY` parse/load dry-run + a well-formed result JSON + std checked by eye against `votes[].score`.
  No unit test added — a one-line env read and a one-line std helper would be ceremony, and the suite does not
  import this harness. **Gap (acceptable):** if someone later folds `std` into a reported decision rule, a
  unit test on the formula would be worth adding then.
- `npm test` regression guard passed at 2283/0 (the TG26 failure observed during T-177-01 is since resolved
  by the sibling commit; it is not attributable here).

## Open concerns / handoff for a human

1. **The headline for E-44/E-42:** the multi-ticket bet "faithful build + more votes → robust crater" is
   **refuted**. S-177 made the build fully faithful and it did **not** lift the matched score; VOTES=6
   dissolved T-173-01's separation rather than confirming it. **The residual gate was always the measure.**
2. **Re-calibration is a new owned ticket, not done here** (this ticket recommends, does not freeze). Target:
   make Layer A's `replace`/`wrong-style` determination **concept-conditional** (a faithful element vs its own
   concept should score `add/absent`, recoverable — not `replace`, capping), and/or replace the single-
   `replace` **hard cap** in `styleFidelityScore` with a graded distance. Until then the style-distance term
   should **not** enter the frozen instrument.
3. **Secondary, lower priority:** the roof-color divergence (dark_oak vs the concept's grey roof) is a
   recognition/material-assignment fidelity gap, not an S-177 construction defect. It is **not** why the
   crater failed and should not be conflated with the term re-calibration.
4. **Vote-count caveat for future runs:** at VOTES=2 the score is near-bimodal (the cap floors on any 2nd
   `replace`), so 2-vote means are unreliable for this fixture. Use ≥6 for any crater-confirmation claim.
