# T-138-01 proportion-milestone — Progress

## Completed

- **Step 1** (e5b721f): `roofIdiomForPitch` exported from compile.mjs (the steep↔base door
  selection, nameable) + 1 test.
- **Step 2** (committed): the geometry lever crosses the steep door — `applyGeometryAdjust`
  re-aims the roof idiom before recompile; `validateProgramAgainstPack` accepts
  `roof.gable.steep` through the pack's `roof.gable` row (compile's own family fallback).
  **Discovery en route:** without this, a model aiming pitchClass 2 compiled but DIED at
  realization (`roof.gable`'s 45° contract) — the T-134 unlock was unreachable through the
  T-136 lever. G3b extended (re-aim + realize), G3c (rustic honest refusal), G3d (down-aim).
- **Step 3** (committed): `applyMeasuredProportions` re-aims on a >1 snap (note carries it; no
  conflict row); MP14; `measured:repro` byte-green (no-op at ≤1 — both sketches are
  TRELLIS-flattened to ≤45°).
- **Step 4** (committed): workshop.mjs gains hands — source + sketch load when the runKey's
  recognition record + sketch exist (data rule; fixture untouched, prompt byte-identical),
  re-recognize applier injected (T-136's composition), replay/offline thread the pack. All
  committed workshop replays byte-identical; isolation scan green.
- **Step 5** (committed): pattern-book stage 3 seeds the MEASURED program; refuse-to-spend
  computed UNARMED (regularity-only); T-135 declarations merged onto the committed seed; repro
  mirrors. **Named red window:** the three old chains' `--repro` diverge on the seed compare
  ONLY until the re-runs rotate those pins (all other legs green).
- **Step 6** (committed): proportion-milestone.mjs (baselines / compose / repro; outside the
  isolation scan; self-grep clean) + npm scripts. `npm test` 2009/2009.
- **Step 7** (committed): baselines banked — barn 4/4 same-object, 8 minor, budget-FAIL;
  saltcrag barn likewise; cottage decided-but-0-judged, 4 views coverage-refused.
  `measured/barn--saltcrag.*` written + repro byte-identical (`--ticket T-138-01` required on
  the repro invocation — the program record embeds the run's authority).

- **Step 8 — barn (rustic) DONE** (5db9a86): chain done 3/6 rounds — **the model AIMED the
  levers** (round 1 `eaveHeight:12` ACCEPTED, round 2 `depth:26` ACCEPTED, round 3 done);
  final proportion check PASS (ridge:eave 2.1667 vs 2.1 / roofShare 0.5385 vs 0.5238 / aspect
  1.7143 vs 1.8462). Gate: 4/4 same-object, 8 minor, budget-FAIL 8/2 (both arithmetics);
  proportion-flavored gaps 4 → 1 — the survivor is the rustic class-1 pitch ceiling (the named
  residual). Chain repro/offline + gate offline green. The eyes-to-hands finding landed on the
  first live run.

## In flight

- **Step 8 — saltcrag barn chain live** (background task bu6lz2mfh); cottage follows serially.
- Spend probes green before each spend block (the sibling T-136 run hit the monthly limit at
  10:24pm; the seam has answered since).

## Deviations from plan

1. Step 2 grew a `program.mjs` edit not in structure.md: the single-door property lives at
   REALIZATION (`roofGableConstruct`), not at program validation; validation instead refused
   the steep NAME for packs without the idiom row. The family-row relaxation (mirroring
   compile's `roofBlocks` fallback) was required to make the lever's re-aim land. Tested both
   ways (G3b/G3c/G3d), no committed record changed.
2. proportion-milestone derives runKey from the FILENAME — pre-T-132 chain records (cottage,
   barn) carry no `runKey` field; severities are tallied from per-view verdict gaps (the
   aggregate's flattened gap list drops severity).

## Remaining

- Step 8: saltcrag barn + cottage runs (chain → gate per subject, serial).
- Step 9: `milestone:proportion` compose + repro; `pattern-book-compare --rotate-pins`;
  witness-degradation check (`proportion:repro`, `visibility:repro` → named SKIPs expected).
- Step 10: design-learnings E-33 section + E-12 handoff.
- Step 11: review.md.

## Sibling-session notes

- T-136's session owns `benchmarks/sculpture/levers/*` (untracked, outcome `exchange-refused`
  at round 3 — their Step 8 re-run pending) and `docs/active/work/T-136-01/` — not touched
  here. After this ticket's chain-pin rotations their levers records' `refs.seed.sha256` will
  no longer match the on-disk cottage seed (input-ref drift of the recorded kind; their replay
  runs off their own ledger and survives).
