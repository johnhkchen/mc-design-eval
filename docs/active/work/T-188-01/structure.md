# T-188-01 — STRUCTURE: file-level blueprint

The shape of the code for the picture-driven climb (design A1+B2+C3+D2+E1+F). Three new files (one pure
+ its test, one runner) and two generated output trees. **No existing source is modified** — the E-38
`autonomy-loop.mjs` is forked, not edited (its run is the baseline contrast); the frozen instrument and
`runWorkshopLoop` are untouched.

## File 1 (NEW, pure, in `npm test`) — `src/workshop/climb-gate.mjs`

The accept-gate, the stopping predicate, and the run-derived eyes-vs-hands classifier. Pure (no GL, no
LLM, no I/O) so it is unit-testable and the runner stays thin. Exports:

```
export const CLIMB_GATE_SCHEMA = "climb-gate/v1";

// Tunables (design C/D), overridable by the runner. MARGIN is re-reported by the run from the
// observed vote spread so it is calibrated, not asserted.
export const CLIMB_DEFAULTS = Object.freeze({ margin: 4, stallK: 2, maxRounds: 5, minRounds: 3 });

// Factual reach of the three EXISTING occ-tools over the five departments — a description of what the
// hands touch, NOT a fix proposal. Used only to label "no tool targets this department".
export const TOOL_DEPARTMENTS = Object.freeze({
  apply_gable_roof:   ["ROOF"],
  construct_walls:    ["WALL", "OPENING"],   // OPENING only incidentally, via the skin's dressOpenings
  add_timber_framing: ["WALL"],
});

// Decision C3 — accept iff the median score improves past MARGIN; on a within-margin tie, accept iff
// critique coverage shrinks (fewer wrong-style departments OR fewer majors); else roll back.
// before/after are critiqueEvidence bundles ({score, nMajor, wrongStyleBreadth, nItems}).
export function acceptsRound(before, after, { margin = CLIMB_DEFAULTS.margin } = {})
  // → { accept: boolean, reason: "improved +Δ" | "tie: coverage shrank" | "regressed −Δ" | "tie: no shrink" }

// Decision D2 — stop on agent `done`, OR stallK consecutive rolled-back rounds, OR round cap;
// never before minRounds (the ticket requires ≥3 rounds run).
export function stoppingDecision({ round, agentDone, noAcceptStreak,
  margin, stallK = CLIMB_DEFAULTS.stallK, maxRounds = CLIMB_DEFAULTS.maxRounds, minRounds = CLIMB_DEFAULTS.minRounds })
  // → { stop: boolean, reason: "agent-done" | "stalled (K rolled back)" | "round cap" | null }

// The eyes-vs-hands inventory, derived PURELY from the recorded trajectory (no speculation).
// A department is ACTED-ON iff some ACCEPTED round used a tool whose TOOL_DEPARTMENTS includes it;
// every department named in any round's critique that is not acted-on is EYES-ONLY.
export function classifyInventory(trajectory)
  // → { actedOn: [{department, byTool, rounds:[..], deltas:[..]}],
  //     eyesOnly: [{department, namedItems:[{round, kind, severity, missing}]}],
  //     verdict: { climbed: bool, stalled: bool, oscillated: bool,
  //                actionableFrac: number, scoreFirst, scoreLast, delta } }
```

`classifyInventory`'s verdict logic (run-derived, honest):
- `climbed` = `scoreLast − scoreFirst > margin`; `stalled` = stop reason was `stalled`/`round cap` with
  Δ within ±margin; `oscillated` = ≥1 department had an accepted round later *rolled back* (or
  accept→reject→accept on the same tool). `actionableFrac` = accepted-rounds / tool-attempt-rounds.

## File 2 (NEW, in `npm test`) — `src/workshop/climb-gate.test.mjs`

Pure unit tests (fast, no GL/LLM), tagged `CG1…`:
- **CG1–CG3 acceptsRound**: improve past margin → accept (`+Δ`); regress → reject; within-margin tie with
  fewer wrong-style departments → accept (coverage tie-break); tie with no shrink → reject.
- **CG4–CG5 stoppingDecision**: `done` stops; `stallK` consecutive rollbacks stops; round `< minRounds`
  never stops even if stalled (guarantees the ≥3-rounds AC); `maxRounds` caps.
- **CG6–CG8 classifyInventory**: a synthetic trajectory where ROOF was acted-on (kept gable, +Δ) and
  CHIMNEY was named-but-never-targeted → CHIMNEY in `eyesOnly`, ROOF in `actedOn`; a rolled-back-then-
  reaccepted tool flags `oscillated`; `actionableFrac` arithmetic; purity (no input mutation).

This is the **only `npm test` surface** — keeps the green-bar guarantee on the logic while the metered
GL/LLM runner stays out of the suite (like every `experiments/` sibling).

## File 3 (NEW, metered runner, NOT in `npm test`) — `experiments/eval-alignment/picture-climb.mjs`

Forks `autonomy-loop.mjs` and rewires the gradient + gate + restraint. Structure (top-to-bottom):

1. **Imports** — from `autonomy-loop.mjs`'s proven set: `artifactOccupancy`, `occupancyFromCells`
   (`occupancy.mjs`); `rebuildArtifact` (`shell-integrity.mjs`); `renderViews` (`multi-angle.mjs`);
   the three TOOLS' deps (`roleBlock`, `constructWalls`, `wallSkin`, `dressOpenings`/`extractApertures`,
   `gableRecord`/`generateRoof`, `infillPanel`). From the diagnose recipe (`score-gatehouse-selfconcept.mjs`):
   `MULTI_ANGLE_GATE` (`config.mjs`), `loadStylePack` (`style-pack.mjs`), `runTieredOp` (`model-tier.mjs`),
   `bamlRender`/`bamlParse` (`baml/bridge.mjs`), `diagnoseRenderArgs` (`diagnose.mjs`),
   `critiqueEvidence`/`itemStyleClass`/`styleFidelityScore` (`bakeoff-score.mjs`). From this ticket:
   `acceptsRound`, `stoppingDecision`, `classifyInventory`, `TOOL_DEPARTMENTS`, `CLIMB_DEFAULTS`
   (`climb-gate.mjs`). For renders: `renderBesideConcept` (`render-beside.mjs`).
2. **Config** — `SUBJECT="gatehouse"`; `ARTIFACT=benchmarks/sculpture/generated/gatehouse/artifact.json`
   (the climb seed); `PROGRAM=benchmarks/sculpture/recognition/gatehouse.program.json` (the real
   recognition program for the DiagnoseBuild grounding — exists); `PACK=packs/rustic.json`;
   `CONCEPT=…/runs/015-…gatehouse…/concept.png`; `eaveY=18`, `ridgeAxis="z"`; `VOTES=3`, plus
   `CLIMB_DEFAULTS`. `GUARD_ONLY=process.env.GUARD_ONLY==="1"`.
3. **TOOLS** — copy the three occ-tools verbatim from `autonomy-loop.mjs` (`apply_gable_roof`,
   `construct_walls`, `add_timber_framing`) + the `MENU`. **No new hands.**
4. **`scoreBuild(occ, template, round, tag)`** — the picture gradient. `renderViews(rebuildArtifact(occ,
   template), [...MULTI_ANGLE_GATE.azimuths], {outDir: round dir})` → four PNGs; load concept + the four
   renders as base64; run the `diagnose()` recipe VOTES times; return `{ score: median, evidence: modal
   critiqueEvidence, items }`. Renders are written to `builds/gatehouse/picture-climb/round-N/`.
5. **`agentPick(evidence, items, history)`** — keep the sonnet pick (decision E1) but feed it the
   structured critique (top items by severity: department/kind/missing) + the score + the helped/rolled-
   back history; return `{tool, reason}` from the MENU.
6. **`run()`** — the loop with the accept-gate:
   ```
   asset-guard (all paths exist) → if GUARD_ONLY: log + exit
   occ = artifactOccupancy(ARTIFACT); base = scoreBuild(occ, …, round0, "base")   // score the seed once
   prev = base; trajectory=[ {round0, prev, pick from agentPick(prev)} ]; noAcceptStreak=0
   for round 1..maxRounds:
     pick = trajectory[last].pick
     if pick.tool==="done" || !TOOLS[pick]: record done; break
     cand = TOOLS[pick.tool](occ); candScore = scoreBuild(cand, …, round, "cand")
     gate = acceptsRound(prev.evidence, candScore.evidence, {margin})
     if gate.accept: occ = cand; prev = candScore; noAcceptStreak = 0
     else:           /* roll back: occ unchanged */ noAcceptStreak++
     nextPick = agentPick(prev.evidence, prev.items, history-with-gate-results)
     record round {score, evidence, items, pick(applied), gate, accepted, scoreAfter:candScore, nextPick}
     stop = stoppingDecision({round, agentDone:nextPick.tool==="done", noAcceptStreak, margin})
     if stop.stop && round>=minRounds: break
   ```
   Carry `prev`'s score forward (don't re-score an unchanged build) — the metered-cost mitigation.
7. **Outputs** —
   - per-round renders + `renderBesideConcept` beside-sheet → `builds/gatehouse/picture-climb/round-N/`;
   - `docs/active/work/T-188-01/trajectory.json` (`{schema:"picture-climb/v1", subject, seed, pack,
     concept, votes, margin (observed spread), rounds:[…], inventory: classifyInventory(...)}`);
   - the runner prints the trend (`score_0 → … → score_N`) + the inventory verdict.
8. **`run().catch(FATAL)`** — loud exit; never a silent partial.

## File 4 (NEW, written in Review/after the run) — `docs/active/work/T-188-01/eyes-vs-hands.md`

The human-readable inventory + the honest verdict (climbed/stalled/oscillated, actionable fraction),
quoting `classifyInventory`'s output and the per-round beside renders. The discovered S-189 scope =
`eyesOnly` (no speculative fixes). Written from the real run, with the beside-concept PNGs as the glance
evidence.

## Generated output trees (NEW, git-tracked artifacts)

- `builds/gatehouse/picture-climb/round-0..N/` — `view-<azimuth>.png` ×4 + `beside-concept.png` per round.
- `docs/active/work/T-188-01/` — `trajectory.json`, `eyes-vs-hands.md`, plus the RDSPI artifacts.

## Ordering (matters)

1. **File 1 + File 2** (gate module + tests) — pure, land first, `npm test` stays green.
2. **File 3** (runner) — wire it; **`GUARD_ONLY=1` dry run** proves assets + wiring with **zero spend**.
3. **The metered run** — spend the diagnoses (≥3 rounds), write renders + `trajectory.json`.
4. **File 4** — read the renders + trajectory, write the honest inventory.
5. Commit incrementally: (a) gate+tests, (b) runner + guard-dry, (c) run outputs + inventory.

## Invariants / guards

- `measurements/` never written (frozen instrument); `git status` checked before commit
  ([[location-encodes-status]], [[pin-guard-is-structural]]).
- GL asserted loud before any spend ([[render-every-loop-pattern]]).
- No re-ask on a malformed/zero-token diagnose reply ([[spend-limit-reply-failure-mode]]).
- `autonomy-loop.mjs` and `results/autonomy-gatehouse.json` untouched (the baseline contrast).
- The gate/stopping/inventory logic is pure and tested; the runner holds zero scoring logic of its own.
