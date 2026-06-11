# T-126-01 workshop-loop — Review

Phase artifact 6/6. The handoff: what changed, how it is tested, what a reviewer should weigh.

## What shipped

The **workshop loop** (E-31 Rule 1): the first legal look-adjust-look path in the project.
Build → 4-azimuth renders → the model critiques its own build against the concept → ONE
sanctioned action per round → the pack's conformance gate arbitrates (strictly-worse rolls back,
recorded) → repeat within the declared budget. Fully ledgered, byte-identical replay (Rule 5),
structurally unable to reach the frozen judge (the T-119 pattern, twice over).

### Files created
- `src/workshop/program.mjs` — the revisable object: `workshop-program/v1` (local contract,
  S-125-pluggable), generic `boxShell` (hollow, true holes, floorless, banded courses),
  deterministic `realizeProgram` (artifact assembled the idiom-card way), `applyParamAdjust`.
- `src/workshop/actions.mjs` — sanctioned vocabulary: `adjust-params`, `spray-paint` (the E-23
  canvas: `projectSurface` recolor, shaped cells never smashed), `re-recognize` (parses, but the
  applier seam is deliberately ABSENT until S-125 — selected live in round 4, recorded
  `action-unavailable`, no crash). `packVocabulary` mirrors `paletteInPackCheck`'s derivation.
- `src/workshop/critique.mjs` — one exchange per round: prompt (embeds program, pack vocabulary,
  the round's conformance report, last round's outcome) + STRICT parser (throws on malformed —
  routed into judge-reply's bounded re-asks; revise requires an action, done forbids one).
- `src/workshop/loop.mjs` — the round state machine. Cage = lexicographic conformance score
  (checks passed, then −findings, presentation-cap recovered); regression → rollback, recorded.
  Structural termination at the declared budget. Seams (`exchange`, `render`) injected; the gate
  is deterministic data only — GL bytes never decide.
- `src/workshop/replay.mjs` — `serializeArtifact` (THE canonical text), `replayLedger` (seed
  program + accepted rounds' recorded actions → final build; no model, no GL), `offlineAssert`
  (schema/budget/reply-policy bounds, cage arithmetic on the recorded reports, replay
  byte-equality, final-conformance re-derivation).
- `src/workshop/isolation.test.mjs` — judge isolation pinned structurally: precise-token source
  scan (the judge's six seam names + the gate-record namespace) over every workshop module AND
  the runner; guard-refusal asserts; loop-core import boundary.
- `benchmarks/sculpture/workshop.mjs` — the impure runner: GL renders at the 4 gate azimuths,
  strong tier (op `workshop-critique`), `preflightPins` before any spend, every write
  `domain:"workshop"`. Modes: live / `--replay` / `--offline` (exit-coded).
- `benchmarks/sculpture/workshop/fixture/program.json` — the committed fixture: rustic cottage
  shell + hip roof + chimney with two seeded action-matched defects (pink y=4 band; ridgeY 7).
- Proof-run records: `workshop/fixture.json` (ledger), `fixture.md` (digest),
  `fixture/final-artifact.json`, `pr/assets/frames/workshop-fixture-{before,after}.png`.

### Files modified
- `src/form/pin-guard.mjs` — **additive** `GATE_RECORD_NAMESPACES` + `domainRefusal` + `domain`
  param on `guardedWriteRecord`/`preflightPins`: a workshop-domain write into the gate-record
  namespace throws BEFORE tracked/rotate logic; neither `--rotate-pins` nor a sanction overrides
  it. The nine pre-existing writers pass no domain and are untouched.
- `src/model-tier.mjs` — additive `OP_ROUTING` row `workshop-critique → strong` (cross-view
  judgement + authoring the revision action).
- `package.json` — `workshop:fixture` / `workshop:replay` / `workshop:offline`.
- `.gitignore` — `benchmarks/sculpture/workshop/**/*.png` (renders are evidence, never pins).
- `src/form/pin-guard.test.mjs` — group F (domain refusal incl. rotate/sanction overrides).

## Acceptance criteria — verdicts

1. **Loop runner** ✅ — all sanctioned behaviors exercised LIVE in the proof run: accept-with-
   improvement (r1), accept-lateral (r2), rollback ×3 (r3/r5/r6), unavailable (r4), budget
   exhaustion. Subscription shim, strong tier per the E-23 rubric (routing row recorded).
2. **Ledger** ✅ — every round carries critique, action, conformance both sides, render refs
   (ROOT-relative), raw replies (judge-reply entry shape, ≤400-char clips) and askCount.
3. **Replay** ✅ — `npm run workshop:replay`: BYTE-IDENTICAL from committed program + ledger,
   zero model calls, zero GL; `npm run workshop:offline` re-asserts the record clean (both
   exit-coded; verified post-run in this session).
4. **Judge isolation, structural** ✅ — two independent enforcements: (a) the precise-token
   source scan over all workshop files + the runner (THROWS on any judge seam reference);
   (b) the pin-guard domain refusal (tested with rotate AND sanction). The runner renders
   through `src/view/multi-angle.mjs` (the lens); the gate module is never imported or spawned.
5. **Proof run** ✅ — committed fixture (S-125 cottage draft not landed; the ticket's fallback):
   conformance **4✓/29 findings → 6✓/0 findings** (the metric improvement, round 1) AND the
   seeded squat roof fixed (ridgeY 7→9, round 2 — the named visual defect; before/after frames
   committed). Budget declared (6) and respected; replay verified.
6. **No per-building code; tests green** ✅/⚠️ — subjects are data (program/concept/pack paths in
   a registry); 77 workshop-scope tests green (50 new in `src/workshop/` + pin-guard F group +
   model-tier integrity). ⚠️ Full `npm test` currently shows ONE failure in
   `src/recognition/program.test.mjs` — that file belongs to the T-125-01 sibling session
   mid-flight in this shared tree (commit a5c8033, not this ticket's lineage); every suite this
   ticket touches passes.

## Test coverage

- **program**: contract rejection matrix; shell hole/floorless/band invariants; realize
  double-run byte-equality + live AJV gate; adjust merge/immutability; broken-adjust fail-loud.
- **actions**: vocabulary + grounding rejections; spray applier dirs (ortho + diag), fromBlock/
  bounds filters, shaped-cell respect, determinism; applier routing + injectability.
- **critique**: fence discipline; accept + 12-case rejection matrix; prompt content pins.
- **loop**: accept/rollback/done/budget/unavailable/refused/apply-failed against the REAL pure
  conformance gate; score cap-recovery; ledger invariants; import-boundary scan.
- **replay**: byte-identity round-trip (paint + adjust mix); 12-case tamper matrix; missing-text.
- **isolation**: the structural pins (see above).
- **Not covered (deliberate)**: the GL render path and the live shim (evidence/metered seams —
  exercised by the proof run, asserted by `--replay`/`--offline`, never by unit tests).

## Open concerns (ranked)

1. **Declared bands are static; the cage blocks legitimate stylistic upgrades.** Rounds 3/5
   (roof stair courses) and 6 (timber-frame studs) regressed `courses-even` solely because the
   program's band declarations don't include the new blocks — the model's reading of the concept
   was RIGHT (stairs eave, half-timbering) and the cage rolled it back. The fix is an action that
   co-edits declarations with params (or declarations derived from elements). S-127 will hit this
   on real subjects; recommend a follow-up ticket before the milestone.
2. **`re-recognize` is vocabulary-only** until S-125 wires its applier into the injectable seam
   (`DEFAULT_APPLIERS`); the model DID reach for it (round 4), so demand exists.
3. **Paint placements survive program adjusts at absolute positions** — after a geometry change,
   stale paint could land as strays; today the cage catches it (single-component/courses), but a
   region-aware invalidation would be cleaner. (No paint was accepted in the proof run.)
4. **Prompt calibration is N=1.** The model declared done never (budget-exhausted); its
   late-round critiques fixated on improvements the cage forbids (see #1). One prompt revision
   was allowed by plan; none was needed for the proof, so none was spent.
5. **Conformance-score granularity**: `palette-in-pack` emits one finding per foreign block TYPE,
   so partially removing a foreign block doesn't move the score (the per-cell `courses-even`
   findings carried the signal here). Fine for the cage (monotone), but don't read the score as
   a per-cell metric.
6. **Sibling-session test failure** (see AC #6) — needs the T-125-01 thread to land/fix its own
   suite; nothing for this ticket to do.

## How to verify quickly

```
node --test "src/workshop/*.test.mjs" src/form/pin-guard.test.mjs   # 70 tests
npm run workshop:replay && npm run workshop:offline                 # Rule 5, exit-coded
open pr/assets/frames/workshop-fixture-{before,after}.png           # the seeded defects, fixed
```
