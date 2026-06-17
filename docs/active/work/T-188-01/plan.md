# T-188-01 — PLAN: ordered, verifiable steps

Execute the structure blueprint. Three commits: (1) pure gate module + tests, (2) runner + GUARD_ONLY dry
proof, (3) the metered run outputs + the eyes-vs-hands inventory. `npm test` green after step 1; the
metered run is the one paid step, asset-guarded and dry-probed first.

## Step 1 — `src/workshop/climb-gate.mjs` (pure) + `climb-gate.test.mjs`

1.1 Write `climb-gate.mjs` exporting `CLIMB_GATE_SCHEMA`, `CLIMB_DEFAULTS`, `TOOL_DEPARTMENTS`,
`acceptsRound(before, after, {margin})`, `stoppingDecision({...})`, `classifyInventory(trajectory)` per
structure §File 1. Pure: no imports beyond local constants; no I/O. Each function fail-loud on malformed
input (mirror the repo's `fail()` style) but tolerate missing optional evidence fields (default to 0).

1.2 Write `climb-gate.test.mjs` (CG1–CG8 per structure §File 2). Use the repo's test runner idiom
(match a sibling, e.g. `bakeoff-score.test.mjs`). Cover: accept/reject/tie-break; stop on
done/stall/cap; `minRounds` floor; inventory acted-on vs eyes-only; oscillation flag; purity.

**Verify:** `npm test` green (was 2304/2304 after T-187-01; expect +CG count). Run
`node --test src/workshop/climb-gate.test.mjs` for the fast loop.

**Commit 1:** `feat(T-188-01): picture-climb accept-gate + stopping rule + eyes-vs-hands classifier (pure, CG1-8)`

## Step 2 — `experiments/eval-alignment/picture-climb.mjs` + GUARD_ONLY dry proof

2.1 Create the runner by forking `autonomy-loop.mjs`: copy the three TOOLS + MENU verbatim; replace
`evalBuild` with `scoreBuild` (the DiagnoseBuild gradient, structure §File 3.4, lifting
`score-gatehouse-selfconcept.mjs::diagnose()`); replace the single-axis verdict plumbing with the
`{score, evidence, items}` bundle; rewrite `runSubject` as `run()` with the accept-gate + stopping rule
(structure §File 3.6). Wire `agentPick` to the structured critique (E1).

2.2 Asset guard: list `[ARTIFACT, PROGRAM, PACK, CONCEPT]` + assert each exists before any spend; assert
GL via the render path's `assertGlAvailable` (import from `render-beside.mjs`) — loud throw if absent.

2.3 `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` — must: confirm all assets, confirm
GL, **render round-0's four azimuths + the beside sheet** (GL is free), print the seed's render paths,
and **exit before any LLM call** (zero spend). This proves the render seam + program/pack load + occ
round-trip without metering.

**Verify:** GUARD_ONLY exits clean; `builds/gatehouse/picture-climb/round-0/` holds 4 views +
`beside-concept.png`; `npm test` still green (runner not in the suite, but confirm no import broke a
shared module).

**Commit 2:** `feat(T-188-01): picture-driven climb runner (DiagnoseBuild gradient + gate); GUARD_ONLY dry-proof`

## Step 3 — the metered run (≥3 rounds) + outputs

3.1 Pre-flight: re-run `GUARD_ONLY=1`; confirm the strong-tier shim is authenticated (a minimal
`claude -p` probe per [[spend-limit-reply-failure-mode]] — do NOT burn the diagnose budget probing).

3.2 Run `node experiments/eval-alignment/picture-climb.mjs` (background; ~18 strong-tier diagnoses ≈
metered, may take ~30–40 min by the T-186 rate). It writes per-round renders + beside sheets to
`builds/gatehouse/picture-climb/round-N/` and `docs/active/work/T-188-01/trajectory.json`.

3.3 If the run dies on a malformed/zero-token reply: **do not re-ask** (the no-re-ask rule). Record the
partial trajectory; if <3 rounds completed, diagnose (auth? GL? a tool throw?) and re-run once. If the
gradient is too coarse to steer (names a defect without a direction a tool can use), that is a *finding*
— record it, do not patch the prompt here (that is S-189).

**Verify:** `trajectory.json` has ≥3 rounds with `{score, evidence, items, pick, gate, accepted}`;
`classifyInventory` populated; beside renders present per round; `measurements/` untouched (`git status`).

## Step 4 — the eyes-vs-hands inventory + honest verdict

4.1 Read the per-round `beside-concept.png` sheets (the glance is the evidence) and `trajectory.json`.

4.2 Write `docs/active/work/T-188-01/eyes-vs-hands.md`: the `actedOn` list (department, tool, Δscore per
round) vs the `eyesOnly` list (department, the named items the loop had no lever for) straight from
`classifyInventory`. State the verdict plainly ([[calibrated-honesty-not-hype-or-brutality]]): **did it
climb, stall, or oscillate?** and **what fraction was actionable** (acted-on vs total tool attempts).
The `eyesOnly` set IS the discovered S-189 scope — **no speculative fix list**, only what the run
surfaced.

**Verify:** the inventory cites real rounds/scores; the verdict matches the trajectory numbers; no fix
proposals beyond naming the gaps.

**Commit 3:** `docs(T-188-01): metered picture-climb run — trajectory, beside renders, eyes-vs-hands inventory + verdict`

## Testing strategy

- **Unit (in `npm test`)**: only the pure gate module (CG1–CG8). The accept-gate decision, the stopping
  predicate, and the inventory classifier are the logic that must be correct regardless of the metered
  run's outcome — they are tested in isolation on synthetic trajectories.
- **Integration (out of `npm test`, metered)**: the runner is verified by the GUARD_ONLY dry proof
  (assets + GL + render seam + occ round-trip, zero spend) and then by the real ≥3-round run. It is an
  `experiments/` runner like its siblings — reproduced by re-invoking, not asserted in the suite.
- **Evidence (human glance)**: the per-round beside-concept renders. The score is the steering proxy; the
  glance is the judge ([[milestone-ladder]]).

## Acceptance-criteria → step map

| AC | step |
|---|---|
| picture-critique wired as gradient + accept-gate + restraint; ≥3 rounds | Steps 1–3 |
| per-round beside renders + critique trend in work dir | Step 3 (`trajectory.json` + renders) |
| eyes-vs-hands inventory (fixed vs named-no-lever; discovered S-189 scope) | Steps 1 (`classifyInventory`) + 4 |
| recorded honestly: climb/stall/oscillate, how much actionable | Step 4 verdict |
| `npm test` green; `measurements/` untouched; no new hands | Steps 1–3 (guards) |

## Risks & mitigations (carried from design)

- **Metered cost** → carry accepted scores forward (score each build once); GUARD_ONLY first; VOTES=3.
- **Score noise (0–76 swing)** → median over VOTES; margin calibrated from the observed spread, reported.
- **Auth/zero-token reply** → minimal probe before the run; no re-ask on malformed.
- **GL absent** → assert loud before any spend.
- **Coarse gradient** → recorded as a finding (the critique-must-emit-a-direction gap → S-189), not patched.
- **Scope creep into building hands** → strictly reuse the 3 tools; `refineAmplitude` deferred.
