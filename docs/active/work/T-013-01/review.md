# Review — T-013-01: persona-system-prompt-ab

**Handoff for human review. Lisa detects this file and handles phase/status transitions — do not edit the
ticket frontmatter.**

> **⚠️ Headline: the code deliverable is complete and tested, but the experiment was never run.** The
> `--system-prompt` / persona wiring (AC #1) is in place, default-preserving, and `npm test` is 133/133
> green. The actual A/B (AC #2–4) did **not** complete: the OFF arm (run 023) stalled mid-pipeline, there is
> **no ON arm**, no judging, no journal entry, and no `progress.md`. **3 of 4 acceptance criteria are unmet.**
> This ticket is **not ready to close** — see Critical Issues.

## What was changed

Two-part ticket: **(1)** a minimal `--system-prompt` pass-through wiring (the guaranteed code change), and
**(2)** a two-run Taj A/B (persona on vs off) with an effect-size-calibrated verdict. Part 1 landed cleanly.
Part 2 was set up (persona authored, judge helper copied, OFF arm launched) but did not finish.

### Code wiring (DONE — AC #1 met)

- **`src/sdk-binding.mjs`** — added an optional `system` param to the three champion-pipeline functions that
  lacked it, each pushing `--system-prompt <text>` onto `args` **only when set**, mirroring the line already
  present in `requestText` (and updating each JSDoc):
  - `requestDesignArtifact` (L293 push, L279 JSDoc) — stage 2, high-res build.
  - `requestDesignArtifactWithImage` (L357 push, L338 JSDoc) — stage 3, reference-compared 2nd pass.
  - `requestTextWithImage` (L479 push, L465 JSDoc) — stage 1, reference design doc.
  - `grep -n "system-prompt" src/sdk-binding.mjs` → **4 occurrences** (was 1). `invokeClaude`, `_runClaude`,
    `requestText`, and all pure helpers untouched.
- **`benchmarks/temple-facade/run.mjs`** — threaded a `--persona-file <path>` harness flag:
  - `parseArgs` records `out.personaFile` (default `undefined`) (L1031, L1037).
  - `main` reads the file into a `persona` string (or `undefined`) and passes it into the `run(...)` ctx
    (L1096, L1114); records `persona: basename(personaFile) | null` in `summary.json` for attribution (L1150).
  - `vRefRevise-designdoc` approach passes `system: ctx.persona` into all three stage calls (L907, L917,
    L931) and writes `persona.txt` into the run dir for provenance when set (L898).
- **Default-preserving invariant (verified by inspection):** no `--persona-file` ⇒ `ctx.persona` undefined ⇒
  `system` undefined ⇒ every push is `if (system)`-guarded ⇒ `args` byte-identical to pre-change. No frozen
  file (`task.mjs`, `judge.*`, AJV schema, `src/config.mjs`, the `compose*Prompt` builders) was touched.
- `git diff --stat HEAD`: `src/sdk-binding.mjs` +16/−4 (net +12), `run.mjs` +22/−5 (net +17).

### Persona artifact (DONE — the independent variable)

- **`docs/active/work/T-013-01/persona.md`** — the final master-architect grounding prompt (~5 sentences):
  pure **stance + standards**, deliberately naming no size/relief/color/material/schema/temple directive, so
  any score movement is attributable to grounding framing rather than smuggled build rules. (Note: this is a
  tightened version of the draft quoted in `design.md` §B — the file is the source of truth.)

## Files

**Modified (source — the AC #1 deliverable):**
- `src/sdk-binding.mjs` — `system` param added to 3 functions (+ JSDoc).
- `benchmarks/temple-facade/run.mjs` — `--persona-file` flag, ctx thread, 3 call-site args, summary field.

**Created (work artifacts, `docs/active/work/T-013-01/`):**
- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSP artifacts (complete).
- `persona.md` — the persona text (the A/B independent variable).
- `judge-round0.mjs` — copied from `T-006-01` (scores any PNG via `judgeRender`, median-of-3, frozen brief).
- `review.md` — this file.

**Created (run outputs — INCOMPLETE):**
- `benchmarks/temple-facade/runs/023-vRefRevise-designdoc/` — partial OFF arm: `design-doc.md`
  ("Temple of the Lapis Crown", Taj-grounded), `design-doc.prompt.txt`, `build.prompt.txt`, `reference.png`
  only. **Missing** `round-0.png`, `render.png`, `artifact.json`, `summary.json`, `transcript.jsonl` — the
  run halted after the design-doc stage, before any render or score.

**Not created (expected by the AC, absent):**
- The ON arm run dir (run 024) — never launched.
- `docs/active/work/T-013-01/progress.md` — the live tracker / A/B scoreboard.
- Any judge output for T-013 images (none exist to judge).
- The `design-learnings.md` attempt-log entry for T-013-01.

**Deleted:** none.

## Test coverage

- `npm test` → **133/133 pass** (run post-wiring this review). The suite covers the pure helpers and
  artifact validation; the three spawn functions that gained the `system` param are **not** unit-tested and
  no test asserts their `args` array — so the suite confirms the change broke nothing, but does **not**
  positively exercise the new flag.
- The intended functional test of the wiring — the **OFF run reproducing the default-path behavior
  end-to-end** and landing in the expected strong band — was **not completed** (run 023 stalled). The flag's
  guard correctness is currently supported only by code inspection (`if (system)`), not by an executed run.

## Open concerns / TODOs

1. **The experiment is unfinished** — the core scientific deliverable. To complete AC #2–4:
   - Re-run / resume the **OFF** arm: `node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc
     --ref references/taj_mahal.png --note "persona A/B OFF (T-013-01)"`. (Run 023 is a dead partial; a fresh
     run is cleaner than resuming it.)
   - Run the **ON** arm after OFF completes (sequential, to avoid a `nextSeq()` collision):
     `… --persona-file docs/active/work/T-013-01/persona.md --note "persona A/B ON (T-013-01)"`.
   - Judge all four images (2× `round-0.png` via the copied helper; the 2× `render.png` are auto-judged by
     `main()`), build the per-dimension OFF-vs-ON table, and apply the **pre-registered verdict rubric**
     (`design.md` §D: adopt / no effect / harmful).
   - Write `progress.md` (scoreboard) and append the dated attempt-log entry to `design-learnings.md`
     (both run ids, ref=Taj/seed=11, the persona text, the wiring diff + tests green, the on/off table, which
     dimensions moved, the verdict).
2. **n=1 noise caveat (pre-registered, still binding):** `claude -p` is non-deterministic with no temperature
   control. A single on/off pair cannot separate a small persona effect from generation noise (P15: `detail`
   alone flips competent↔strong at identical config). The verdict must be effect-size-calibrated — only a
   categorical, multi-dimension, same-direction shift is credible; a single ≤1-step flip is "no effect /
   inconclusive." If "adopt," a confirmer run is required before changing any default.
3. **Persona is wired only into the champion (`vRefRevise-designdoc`).** The `system` param on the
   `sdk-binding` functions is general, but `run.mjs` threads `ctx.persona` only into that approach — by
   design (only the champion is under test), but worth noting if another approach later wants the knob.

## Critical issues to surface for human review

- **DO NOT treat this ticket as complete.** Only AC #1 (wiring + diff + green tests) is satisfied. AC #2
  (two scored champion trials), #3 (the journal comparison + verdict), and #4 (retained renders +
  `summary.json` for both runs) are **all unmet** — no A/B data exists. The session ended with the OFF arm
  stalled at the design-doc stage and the ON arm never started.
- **Decision for the human:** either (a) the code wiring alone is accepted and merged while the experiment is
  re-scoped to a follow-up ticket, or (b) this ticket is bounced back to the implementation phase to actually
  run the A/B. The wiring is independently mergeable and inert by default, so (a) is low-risk if the
  experiment is genuinely deferred — but the ticket's stated purpose (measure the persona knob) remains
  unanswered.
- **Stale partial run 023** should be deleted or clearly marked before re-running, so it isn't mistaken for a
  valid OFF arm (it has no scores and would corrupt any later gallery/scoreboard).

## Rollback

`git checkout HEAD -- src/sdk-binding.mjs benchmarks/temple-facade/run.mjs` restores the pre-wiring state;
the change is additive and inert without `--persona-file`. Work artifacts and run 023 are durable evidence.
