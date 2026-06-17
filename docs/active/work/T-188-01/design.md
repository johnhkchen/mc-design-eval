# T-188-01 — DESIGN: the picture-driven climb, its accept-gate, and the eyes-vs-hands record

Decisions, grounded in `research.md`. The ticket is a **discovery**: wire the E-47 picture-anchored
`DiagnoseBuild` as the climb gradient on the gatehouse, add an accept-gate + a restraint rule, run ≥3
rounds, and produce the **eyes-vs-hands inventory** — honestly recorded, no speculative fix list.

## Decision A — Which skeleton to fork: `autonomy-loop.mjs` (NOT `runWorkshopLoop`)

Two existing render→critique→revise loops (research §2, agent-2 §1):

- **A1 — fork `experiments/eval-alignment/autonomy-loop.mjs`** (the E-38 agentic climb). Real
  occ-mutating hands (`apply_gable_roof`/`construct_walls`/`add_timber_framing`) that *visibly change the
  build*; already renders the gatehouse per round; self-contained `experiments/` runner (not in `npm
  test`, metered-aware). Missing: a picture gradient, an accept-gate, a restraint rule.
- **A2 — extend `src/workshop/loop.mjs::runWorkshopLoop`**. Already has a round ledger + accept-gate —
  but the gate is **conformance-score** based (`isRegression`), the wrong gate (the ticket wants a
  *picture* gate), and its action path routes through `RouteCritique`, whose **idiom appliers do not
  exist** (decision is hard-wired `"done"` — agent-2 §6.2, route.mjs). So `runWorkshopLoop` **cannot act
  on a critique today**; wiring a picture-gate onto a loop that can't move the build proves nothing.

**Chosen: A1.** A discovery ticket needs hands that actually mutate the build so the eyes-vs-hands gap is
*real*, not a routing stub. Forking the autonomy loop leaves both the frozen instrument (`measurements/`)
and the formal `runWorkshopLoop` untouched, and reuses three construction hands that already exist (the
ticket's "no new construction hands yet"). New file: `experiments/eval-alignment/picture-climb.mjs`
(don't mutate the E-38 `autonomy-loop.mjs` — its defect-dominated run is a recorded baseline to compare
against, [[generalization-grep-and-no-evidence-rerolls]]).

## Decision B — The gradient: picture-anchored `DiagnoseBuild`, multi-view, vote-median

- **B1 — keep the defect-dominated single-axis eval** (`evalBuild`: one view, `worstDefect`+`quality`).
  Rejected: it is the very ad-hoc judge the ticket replaces; single-view; not picture-anchored.
- **B2 — swap in the E-47 `DiagnoseBuild` term** (research §1): four azimuths → `Critique` items →
  `styleFidelityScore` + `critiqueEvidence`. **Chosen.** This *is* the ticket ("wire the E-47
  picture-anchored DiagnoseBuild … as the workshop loop's gradient").

Implementation = lift `score-gatehouse-selfconcept.mjs::diagnose()` verbatim (the proven recipe):
`diagnoseRenderArgs({program, pack, azimuths})` → `bamlRender(DiagnoseBuild,{concept,renders})` →
`runTieredOp({tier:"strong"})` → `bamlParse` → `{score, items, evidence}`. **Multi-view**: render all four
`MULTI_ANGLE_GATE.azimuths` each round (the gatehouse roof/gate read differently per azimuth — research
§5). **Noise control**: the matched-build score swings 0–76 (T-187 research §2a), so take **VOTES=3**
diagnoses per scored build and use the **median** `styleFidelityScore` + the modal critique items (the
N=3 pattern `evalBuild` and the self-concept scorer already use). The program for the grounding is the
REAL recognition program `benchmarks/sculpture/recognition/gatehouse.program.json` (exists — verified),
not the synthetic stand-in; the pack `packs/rustic.json` is the matched naming vocabulary.

## Decision C — The accept-gate signal: median-score improvement past a noise margin, coverage tie-break

The toward/away signal is `styleFidelityScore` (research §1, §4a). Options:

- **C1 — scalar only, strict `>`**. Rejected: the score is noisy and cap-dominated; a single noisy uptick
  would latch a regression.
- **C2 — coverage only** (shrink of `nItems`/`departments`/`missing[]`). Rejected: coverage ignores
  severity and the wrong-style cap that the score encodes; a round can drop one minor item while adding a
  major.
- **C3 — median-score improvement past a margin, coverage as tie-break.** **Chosen.** Accept the
  candidate iff `median(score_after) ≥ median(score_before) + MARGIN`; on a within-margin tie, accept iff
  the critique **coverage shrinks** (fewer wrong-style departments OR fewer major items), else **roll
  back** `occ` to the pre-tool state. `MARGIN` is seeded from the observed vote spread (start ~4 ≈ one
  minor item; the run reports the actual spread so the margin is calibrated, not guessed). Both `before`
  and `after` are scored under the SAME VOTES so the comparison is like-for-like (research §6.3).

This is the accept-gate the autonomy loop lacks (research §2: `occ` currently keeps every mutation).
Rolling back a *regressing* round is a climb mechanism, not a creation freeze — the
[[defreeze-creation-loop]] caution is about not freezing the *draft*; here we freeze nothing, we just
don't let the build walk downhill.

## Decision D — Restraint / stopping rule: converge, don't oscillate

Named failure: T-176's amplitude loop **overshot** (hd3 glance-overruled to hd2 — research §4b). Options:

- **D1 — round cap only**. Rejected: spends the whole budget even after convergence; doesn't detect
  churn.
- **D2 — cap + agent `done` + no-accept-for-K** (+ the existing no-repeat-failed-tool). **Chosen.** Stop
  when ANY of: (a) the agent picks `done`; (b) **K=2 consecutive rounds are rolled back** (no available
  tool moved the score past the gate — the build has converged for this hand-set); (c) a round cap
  `ROUNDS=5` (≥3 required; 5 gives the climb room while bounding spend). Plus the inherited rule: a tool
  that was rolled back is not offered again (it doesn't work on this build).

**Why oscillation is structurally bounded here**: T-176 oscillated because `refineAmplitude` could keep
bumping a *continuous* amplitude knob (hd2→hd3→…). This climb reuses the three **fixed-shape** occ-tools
(each is idempotent-ish: a second `apply_gable_roof` re-lays the same gable) and the accept-gate **rolls
back** any non-improving re-application. So the loop cannot ratchet past the gate — the restraint is the
gate + the no-repeat rule, and we report whether convergence actually held.

## Decision E — The driver: keep the agent pick, fed the structured critique

- **E1 — keep the sonnet `agentPick`** but feed it the **structured `DiagnoseBuild` critique** (top items
  by severity + their departments + add/replace/missing text), not the single `worstDefect.axis`.
  **Chosen.** The eyes-vs-hands honesty is about whether a *hand exists* for the named department, which
  the agent surfaces by picking `done`/a fallback when nothing fits — a deterministic department→tool map
  would *hide* that gap by silently no-op-ing. The agent already gets the helped/didn't-help history.
- **E2 — deterministic department→tool map**. Rejected for the reason above (it would mask the discovery).

## Decision F — Hands: reuse the three occ-tools, no new construction

Per the ticket ("no new construction hands yet"), reuse `TOOLS` from `autonomy-loop.mjs`
(`apply_gable_roof`, `construct_walls`+skin, `add_timber_framing`) unchanged. The `refineAmplitude`
critique→amplitude path (research §4c) is *available* (it already consumes a `Critique`) but operates on
a different substrate (treatment relief specs, not occupancy) and would be a **new hand** — explicitly
deferred to S-189. The eyes-vs-hands inventory will name where these three fall short; building the
missing hands is the next story, not this one.

## The eyes-vs-hands inventory (the deliverable, derived from the run — not speculative)

For each round the runner records the critique items (department / kind / severity / missing) and the
loop's response. After the run, classify **from what actually happened**:

- **HANDS (acted-on)**: the item's department was named, the agent picked a tool, the accept-gate
  **kept** the round (score moved toward the concept). Recorded with the Δscore.
- **EYES-ONLY (named, no lever)**: the item was named but (i) no tool targets that department (the agent
  picked `done` or a non-matching tool), or (ii) a tool was tried and the gate **rolled it back** (the
  hand exists but couldn't move that defect). This is the **discovered S-189 scope** — the actual gatehouse
  critiques the three tools can't satisfy (CHIMNEY has no tool at all; standalone OPENING form/shutters;
  roof MATERIAL `replace`; sub-tool-amplitude trim). No fix list is written — only what the run surfaced.

## Outputs (Acceptance Criteria → artifacts)

1. `experiments/eval-alignment/picture-climb.mjs` — the wired loop (gradient B + gate C + restraint D +
   driver E + hands F), asset-guarded, `GUARD_ONLY=1` dry probe, no re-ask on malformed
   ([[spend-limit-reply-failure-mode]]).
2. **Per-round beside-concept renders** → `builds/gatehouse/picture-climb/round-N/` (via
   `renderBesideConcept`) + a **picture-critique trend** (score + items per round) →
   `docs/active/work/T-188-01/trajectory.json`.
3. **`eyes-vs-hands.md`** in the work dir — the inventory above, plus the honest verdict: **climbed,
   stalled, or oscillated?** and **how much was actionable** (acted-on vs eyes-only counts).
4. A small **pure** helper for the gate + stopping predicate, unit-tested (the only `npm test` addition);
   the runner itself stays out of `npm test` (GL + metered, like its siblings).
5. `measurements/` untouched; `git status` clean of frozen-instrument paths.

## Risks / open calls (named)

- **Metered cost**: ROUNDS=5 × (score before+after) × VOTES=3 strong-tier diagnoses ≈ up to ~30 paid
  calls. Mitigation: carry an accepted round's `after` score as the next round's `before` (score each
  build once, not twice) → ~VOTES×(rounds+1) ≈ 18 calls. Asset-guard + `GUARD_ONLY` first.
- **The gradient may be too coarse to steer** (the ticket's named failure mode): if the critique names
  "roof wrong" without a direction the tool can use, that is a *finding* (the critique must emit a
  direction → S-189), recorded honestly, not patched here.
- **GL must be present** ([[gl-probe-nested-render-project]], [[render-every-loop-pattern]]) — the runner
  asserts it loud before spending.
- **Autonomy-loop baseline preserved**: we fork, not mutate, so the E-38 defect-dominated
  `results/autonomy-gatehouse.json` stays as the contrast point.
