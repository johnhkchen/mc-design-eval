# T-171-01 — Plan

Ordered, independently-verifiable steps. Each commits atomically. Metered steps are marked **[$]**;
GL-only steps **[GL]**; pure/cheap steps unmarked. Fallbacks named inline.

## Step 0 — Pre-flight (no spend)

- Confirm GL: `cd render && node -e "require('gl')(8,8)"` returns a context (already verified).
- Confirm assets exist: gatehouse concept, `form-sketch/gatehouse.json`, `gatehouse-sheet.png` (verified
  in Research).
- Confirm gatehouse recognition outputs are absent (so the live run writes fresh drafts, no `--rotate`).
- **Verify:** all present; `recognition/gatehouse.*` absent.

## Step 1 — Live recognition run **[$][GL]**

```
node benchmarks/sculpture/recognize.mjs --subject gatehouse --ticket T-171-01
```

- Produces `recognition/gatehouse.{program,artifact,record,md,replies,prompt}` + `view-gatehouse-*.png`.
- **Verify:**
  - `gatehouse.program.json` exists and parses; `walls` carry a STONE role (`wall.field.ground` and/or
    `wall.dressing`), NOT `wall.infill.upper`/`timber-frame` treatment.
  - `gatehouse.artifact.json` block distribution: **cobblestone (or stone_bricks) dominant in the wall
    band**, `polished_basalt` absent. Compare against the OLD build's 35.8% basalt / 0.04% cobblestone.
  - Record conformance verdict noted (PASS or FAIL-recorded — either is acceptable; report it).
- **Fallback (B):** if `runLive` exits non-zero because every reply was malformed within budget
  (REFUSED), hand-author `recognition/gatehouse.program.json` from the concept (stone walls, gable roof,
  arched gate, rustic roles) and realize it offline:
  `node -e "import compileProgram+realizeProgram, write gatehouse.artifact.json"`. Log the deviation in
  `progress.md`. (Do NOT force-edit a model-authored program that simply chose timber-frame — that is a
  reportable result, not a failure to fix.)
- **Commit:** `feat(T-171-01): gatehouse recognition program + faithful build` (the recognition drafts).

## Step 2 — Assert + record faithfulness (block distribution) — pure

- Compute block distribution of the new artifact and the old build; write the contrast into
  `selfconcept-score.json` (seeded) and `progress.md`.
- **Verify:** the new build's wall material is stone (the ticket's material-faithfulness claim) — or, if
  not, write the honest refutation framing.
- (No separate commit; folds into Step 3/4 commits.)

## Step 3 — Beside-concept render (the glance, AC #2) **[GL]**

- Small invocation using `renderBesideConcept(newArtifact, conceptAbs,
  docs/active/work/T-171-01/beside-concept-gatehouse.png, { label: "gatehouse" })` from
  `src/view/render-beside.mjs`. `assertGlAvailable()` guards.
- **Verify:** the PNG exists; visually (Read the image) the gatehouse walls read as cobblestone/stone,
  not near-black basalt, beside the stone concept.
- **Commit:** `docs(T-171-01): beside-concept render — faithful cobblestone gatehouse`.

## Step 4 — Witness self-concept scorer **[$][GL-consumed-renders]**

- Author `experiments/eval-alignment/score-gatehouse-selfconcept.mjs` (per Structure): asset-guard →
  load new program + rustic pack + concept + new renders → VOTES=2 `diagnose()` (no re-ask) → mean
  `styleFidelityScore` + per-item `styleClass`/`kind` → write `selfconcept-score.json`, print summary.
- Validate wiring first: `GUARD_ONLY=1 node experiments/eval-alignment/score-gatehouse-selfconcept.mjs`
  (no spend) → guard passes.
- Run for real: `node experiments/eval-alignment/score-gatehouse-selfconcept.mjs`.
- **Verify:** mean self-concept score recorded; compare to the ~2 E-40 floor. Attribute the result:
  - lift → faithfulness helped (state magnitude);
  - still capped → per-item breakdown points at roof (S-172) or the term (E-41) — record which.
- **Fallback:** if metered access is unavailable, commit the scorer + `GUARD_ONLY` receipt and record
  the score as "not run — blocked on metered access"; the AC #2 glance (Step 3) stands as the primary
  evidence. Do NOT fabricate a number.
- **Commit:** `feat(T-171-01): self-concept scorer + result — gatehouse vs own concept`.

## Step 5 — Determinism receipt (optional, cheap) — pure

- `node benchmarks/sculpture/recognize.mjs --subject gatehouse --offline` → artifact reproduces
  byte-identically (E-31 Rule 5). Records the replay seam works for the new subject.
- **Verify:** "REPRODUCES byte-identically". (If it DIVERGES, that's a real bug to report — but the
  compile path is pure, so divergence would indicate a non-determinism I'd flag.)

## Step 6 — `npm test` green (AC #4)

- `npm test` → expect unchanged green count (no production source touched).
- **Verify:** green; no instrument file in `git status` under `measurements/`.

## Step 7 — review.md (Review phase)

- Summarize files created, the faithfulness result (block distribution before/after), the self-concept
  score vs floor, the honest attribution if capped, test status, and open concerns (notably: roof still
  S-172; whether the model chose stone vs timber-frame; metered-access caveats).

## Testing strategy

- **No new unit tests.** The change is data (a recognition program) + experiment runners, matching the
  no-test posture of `corpus-referee.mjs`. Correctness is verified by: (a) the conformance gate inside
  `recognize.mjs` (the program realizes + passes/fails the pack gate, recorded); (b) the `--offline`
  determinism replay; (c) the block-distribution assertion; (d) the visual beside-concept render; (e)
  the diagnose score. `npm test` guards that nothing in production regressed.
- **Independence:** Steps 1, 3, 4 are independently committable and verifiable. Step 3 (glance) does not
  depend on Step 4 (score); the metered score is isolated so its failure cannot sink the glance.

## Risk ledger

| risk | likelihood | mitigation |
| --- | --- | --- |
| model emits timber-frame (non-stone) program | low (concept is masonry) | inspect program; report as recognition-coverage refutation, don't force-edit |
| live recognition refuses within budget | low | fallback (B) hand-authored program, logged |
| conformance FAILs on the new program | medium | recorded, not fatal; report; faithfulness is about materials, not gate-pass |
| score still capped by roof prism read | medium-high | expected; attribute to S-172 with per-item breakdown (AC #3) |
| metered access unavailable for scorer | low (referee ran live today) | commit GUARD_ONLY receipt; glance is primary deliverable |
