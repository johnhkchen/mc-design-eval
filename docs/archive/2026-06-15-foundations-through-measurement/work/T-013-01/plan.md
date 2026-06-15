# Plan — T-013-01: persona-system-prompt-ab

Ordered, independently verifiable steps. Testing strategy inline. The deliverables are **(1)** the minimal
`--system-prompt` wiring (diff + green tests) and **(2)** a clean two-run Taj A/B with an effect-size-
calibrated verdict. The code change must land and be tested *before* either metered run.

## Step 1 — Confirm baseline (pre-change gate)
- `git diff --stat HEAD` → only the docs already written this session; `src/sdk-binding.mjs` and
  `benchmarks/temple-facade/run.mjs` clean. `npm test` → 133/133.
- **Verify:** clean source tree; tests green. ✅ gate before touching code.

## Step 2 — Wire `system` into the three champion functions (`src/sdk-binding.mjs`)
- Add optional `system` param + guarded `if (system) args.push("--system-prompt", system)` to
  `requestTextWithImage`, `requestDesignArtifact`, `requestDesignArtifactWithImage` (mirror `requestText`
  L450). Update each JSDoc.
- **Verify:** `grep -n "system-prompt" src/sdk-binding.mjs` shows 4 occurrences (was 1). Default path
  unchanged (push is `if (system)`-guarded). `npm test` → **133/133 green** (no test asserts these args).

## Step 3 — Thread `--persona-file` through the harness (`benchmarks/temple-facade/run.mjs`)
- `parseArgs`: add `--persona-file` → `out.personaFile`. `main`: read the file → `persona` string (or
  undefined); pass `persona` into the `run(...)` ctx; add a persona attribution field to `summary.json`.
- `vRefRevise-designdoc`: add `system: ctx.persona` to the three stage calls.
- **Verify:** `node benchmarks/temple-facade/run.mjs --approach v0-facade` is NOT run (costs money); instead
  verify by inspection that without `--persona-file`, `ctx.persona` is undefined ⇒ `system` undefined ⇒ no
  flag. `npm test` → **133/133 green**. `git diff HEAD -- src/sdk-binding.mjs benchmarks/temple-facade/run.mjs`
  captured for the journal (AC #1).

## Step 4 — Author the persona (`docs/active/work/T-013-01/persona.md`)
- Write the master-architect stance+standards prompt (Decision B): no size/relief/color/material/schema/
  temple directives. ~5 sentences.
- **Verify:** re-read it against the brief (`task.mjs goal`) and the schema directives — confirm **zero
  overlap** with build rules (AC: "must not duplicate the brief or the schema directives"). This file is
  the recorded persona text (AC #3).

## Step 5 — Copy the round-0 judge helper
- `cp docs/active/work/T-006-01/judge-round0.mjs docs/active/work/T-013-01/judge-round0.mjs`.
- **Verify:** present; same relative-import depth (no path edit).

## Step 6 — Run the OFF arm (LIVE, metered, ~15 min) — the default-path control
- `node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/taj_mahal.png
  --note "persona A/B OFF (T-013-01): champion default, no system prompt"`.
- **Verify:** `runs/<NNN>-vRefRevise-designdoc/` has `round-0.png`, `render.png`, `summary.json` (persona
  field = off/false); console prints `judge[...] overall=...`. This run also re-confirms the wiring left
  the default path intact (it should land in the 014/015 strong band, generation noise allowing).

## Step 7 — Run the ON arm (LIVE, metered, ~15 min) — launched AFTER OFF completes
- `node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/taj_mahal.png
  --persona-file docs/active/work/T-013-01/persona.md
  --note "persona A/B ON (T-013-01): master-architect system prompt across all 3 stages"`.
- **Sequential** (after OFF's dir exists / OFF done) to avoid `nextSeq()` collision; rate limits serialize.
- **Verify:** `runs/<NNN+1>-…/` has the same outputs; `summary.json` persona field = on (basename of
  persona.md); console prints the judge line.

## Step 8 — Judge round-0 of BOTH runs (the build-stage attribution; P14)
- `node docs/active/work/T-013-01/judge-round0.mjs runs/<OFF>/round-0.png`
- `node docs/active/work/T-013-01/judge-round0.mjs runs/<ON>/round-0.png`
- **Verify:** each prints median-of-3 per-dimension scores + notes. (Each `render.png` was already
  auto-judged by `main()` in Steps 6–7 → all four images scored, AC #2.)

## Step 9 — Compare + decide the verdict (Decision D rubric)
- Build the per-dimension table: {OFF round-0, OFF render, ON round-0, ON render} × {prop, color, detail,
  fidelity, overall}.
- Apply the **pre-registered** verdict rubric (Decision D):
  - **adopt** ⇐ ON beats OFF by ≥2 same-direction categorical steps (or +1 overall), no regression.
  - **no effect** ⇐ identical, or a single ≤1-step difference (within noise — esp. detail).
  - **harmful** ⇐ ON regresses overall or ≥2 dimensions.
- State the **n=1 generation-noise caveat** (P15): a single on/off pair cannot separate a small effect from
  noise; only a large, multi-dimension, same-direction shift is credible. If "adopt," recommend a confirmer
  run before changing any default.

## Step 10 — Journal attempt-log entry (AC #3)
- Append a dated entry to `docs/knowledge/design-learnings.md` "Attempt log" (EOF): both run ids, ref/seed,
  the **persona text** (quoted or pointed-to), the **wiring diff** + tests green, the **per-dimension on/off
  table**, **which dimensions moved**, and the **verdict** (adopt/no-effect/harmful) with the noise caveat.
  Add a tunable-params/Principle note only if the effect is credible.
- **Verify:** entry present, dated, render-grounded; no rubric/brief edits.

## Step 11 — progress.md + review.md
- Fill `progress.md` (tracker + final scoreboard + verdict). Write `review.md` (handoff: the wiring, test
  coverage, the A/B result, open concerns incl. the n=1 caveat). Then stop — Lisa handles transitions.

## Testing strategy (summary)
- **Automated:** `npm test` (133) — guards the pure helpers + artifact validation; run at Step 1 (gate),
  Step 2, and Step 3 (after each code edit). The wiring adds CLI flags to untested spawn functions, so the
  *test* of the wiring is the **OFF run reproducing the default behavior** (the default path is exercised
  end-to-end and lands in the expected band), plus inspection that the flag is `if`-guarded.
- **Experimental (the real test):** the frozen categorical judge (median-of-3) on all four images. The
  headline is OFF render vs ON render, per dimension; round-0 attributes any effect to build vs 2nd pass.
- **Verification criteria = the AC:** wiring confirmed + diff + green tests; two champion trials (on/off,
  same ref+seed) each scored median-of-3 per-dimension; journal entry with the comparison + verdict + the
  persona text; both runs' outputs retained.

## Rollback
- `git checkout HEAD -- src/sdk-binding.mjs benchmarks/temple-facade/run.mjs` restores the pre-wiring state
  (the wiring is additive/inert without the flag). Run outputs and artifacts are durable evidence; keep.
