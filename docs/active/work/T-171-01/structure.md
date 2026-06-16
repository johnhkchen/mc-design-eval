# T-171-01 — Structure

The blueprint: which files are created/modified, the module boundaries, and the ordering. The headline
is that **no production source file changes** — faithfulness comes from running the existing chain for a
subject it was never run for, plus one witness scorer. This keeps "no per-subject constants" and "frozen
instrument untouched" true by construction.

## Files CREATED (all drafts — none under `measurements/`, none in `npm test`)

By the live recognition run (`recognize.mjs --subject gatehouse --ticket T-171-01`), under
`benchmarks/sculpture/recognition/`:

- `gatehouse.program.json` — **the deliverable (AC #1)**: model-authored `building-program/v1`, roles
  only. The `recognition/<key>.program.json` canonical location named in the ticket.
- `gatehouse.artifact.json` — the realized faithful build (compile→realize output).
- `gatehouse.record.json` — the recognition draft record (asks, conformance, evidence, generalization).
- `gatehouse.md` — the human-readable draft summary.
- `gatehouse.replies.json` — the T-114 re-ask ledger + full raw model texts.
- `gatehouse.prompt.md` — the rendered prompt + its sha256.
- `view-gatehouse-+x+z.png`, `-+x-z.png`, `--x+z.png`, `--x-z.png` — 4-azimuth render evidence.

Witness measurement + glance artifacts I author:

- `experiments/eval-alignment/score-gatehouse-selfconcept.mjs` — **NEW witness scorer** (NOT in
  `npm test`, NOT the frozen instrument). One matched-condition diagnose of the new build vs its own
  concept → self-concept score + per-item breakdown. ~60 lines, mirrors `corpus-referee.mjs::diagnose`.
- `docs/active/work/T-171-01/beside-concept-gatehouse.png` — the AC #2 beside-concept sheet (via
  `renderBesideConcept`).
- `docs/active/work/T-171-01/selfconcept-score.json` — the scorer's machine-readable output (committed
  as evidence; mean score, votes, per-item styleClass/kind, block distribution before/after).
- `docs/active/work/T-171-01/progress.md`, `review.md` — RDSPI artifacts.

## Files MODIFIED

**None in production source.** Explicitly NOT touched:

- `benchmarks/sculpture/recognize.mjs` — subject-blind; run as-is.
- `src/recognition/compile.mjs`, `src/workshop/program.mjs` — the role→block lowering, used as-is.
- `benchmarks/sculpture/durable-skin.mjs` (`SUBJECTS`) — gatehouse already registered; no edit.
- `experiments/eval-alignment/corpus-referee.mjs` + `results/*.json` — the E-40 baseline; untouched.
- `packs/rustic.json`, the instrument, any `measurements/` file — untouched (AC #4).

If — and only if — Decision 1's fallback (B) triggers (live recognition refuses within budget), I
hand-author `recognition/gatehouse.program.json` as data and add a tiny offline realize step inside the
scorer or a one-off node invocation (still no production edit). This deviation is logged in
`progress.md`.

## Module boundaries the witness scorer respects

`score-gatehouse-selfconcept.mjs` is a thin composition of EXISTING exports — it introduces no new
scoring logic (the instrument logic lives in `bakeoff-score.mjs`, used read-only):

```
imports (all existing, read-only):
  src/config.mjs                  → MULTI_ANGLE_GATE (azimuths)
  src/pack/style-pack.mjs         → loadStylePack
  src/model-tier.mjs              → runTieredOp
  src/baml/bridge.mjs             → bamlRender, bamlParse
  src/workshop/diagnose.mjs       → diagnoseRenderArgs
  src/workshop/bakeoff-score.mjs  → critiqueEvidence, itemStyleClass, styleFidelityScore
  node:fs/promises, node:path

inputs (data, read from disk):
  recognition/gatehouse.program.json     (the new program — passed to diagnoseRenderArgs)
  recognition/gatehouse.artifact.json    (for the before/after block distribution)
  recognition/view-gatehouse-<az>.png    (the new build renders, base64)
  runs/015-…/concept.png                 (the self concept)
  builds/gatehouse/new-roof/artifact.json (OLD build, for the before block distribution contrast)
  packs/rustic.json                      (MATCHED pack)

output:
  docs/active/work/T-171-01/selfconcept-score.json
  stdout summary: mean score vs ~2 floor + per-item styleClass/kind
```

Control flow (mirrors the referee, deliberately): asset-guard (all paths exist) → load → VOTES=2 loop of
`diagnose()` (no re-ask) → mean → write json + print. A `GUARD_ONLY=1` env short-circuits before any
spend (same affordance as the referee) so the wiring can be validated without metering.

The scorer is **subject-parameterizable but defaults to gatehouse** via plain constants at the top
(paths), not a `SUBJECTS`-style table — it is an experiment harness, not production; the "no per-subject
constants" rule governs the *production* recognition/construction path (which stays subject-blind), not a
one-witness experiment script. (Same posture as `corpus-referee.mjs`, which hardcodes `CRATER_BUILD`.)

## Ordering of changes (why this order)

1. **Live recognition run** must come first — everything downstream (block distribution, beside-PNG,
   score) consumes its outputs. It is the only metered, fail-prone step; if it refuses, the fallback
   decision happens here before any other work.
2. **Inspect + assert faithfulness** (block distribution of the new artifact) before authoring the
   scorer — if walls did NOT go stone, the result is the honest refutation and the scorer's framing
   changes (still run it for the number, but the narrative is "coverage is the wall").
3. **Beside-concept render** — independent of the score; the glance (AC #2) is the primary deliverable
   and is cheap (GL only, no metering), so it lands before the metered scorer as insurance.
4. **Witness scorer** — the metered measurement; last so a metering failure doesn't block the glance.
5. **Commit** after each of (1), (3), (4) so the artifacts are durable insurance (RDSPI: artifacts are
   insurance).

## Test / verification surface

- `npm test` must stay green (AC #4). Since no production source changes, the only way tests move is if
  a new `.test.mjs` is added — I add none; the scorer is an experiment runner, matching the referee's
  no-test posture. I run `npm test` at the end to confirm green regardless.
- The recognition `--offline` replay (`recognize:offline`) becomes available once the artifact is
  committed; running it is the determinism receipt (program → byte-identical artifact). Optional but
  cheap; included as a verification step.
