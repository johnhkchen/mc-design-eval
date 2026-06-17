# T-190-01 — RESEARCH: the sustained picture-driven climb (the M1 capstone run)

Epic **E-48** / Story **S-190**. The payoff ticket. S-188 wired the gradient (picture-anchored
DiagnoseBuild + accept-gate + restraint), S-189 built the highest-leverage missing hand (`recolor_roof`).
T-190 **runs the sustained climb** on the gatehouse and answers: does the build measurably approach its
picture, round over round, *under the loop's own steam*, in a way a human agrees with on the glance — and
where is the ceiling? This is a **run + report** ticket, but it inherits one hard engineering pre-condition
named at full strength by its predecessor (below).

## The crux inherited from T-189 (the binding constraint, not a footnote)

T-189 built `recolor_roof` and proved it **clears its named defect** (the ROOF `major/replace` "reads brown,
concept grey" fires on the brown gable, GONE on the grey gable — two metered DiagnoseBuild runs + the
glance). But its review §3/§6.1 is the headline for T-190:

> **The hand works; the climb's SCALAR accept-gate cannot see it.** When the ROOF major clears, the judge
> promotes a **pre-existing** WALL major (the cobble rubble-quoin contrast, named `minor` on the brown build
> too) to `major`, so whole-build `nMajor` stays at 1 and the graded-breadth cap pins the scalar low while
> any major remains. The same two builds scored brown 60 / grey 32 in one run and brown 24 / grey 44 in
> another — a 24↔60 swing on an unchanged build (the 0–76 vote variance T-187 measured). **So if
> `recolor_roof` were gated by `acceptsRound` on the median scalar as-is, the correct grey fix could be
> ROLLED BACK despite clearing the roof defect.** "The gradient is good enough to rank but too coarse to
> steer; the accept-gate is the sub-problem" — **this is S-190's problem.**

So a faithful sustained climb that *includes the roof-material fix* is not just "run the existing runner" —
the accept signal must be made **department-aware or less noisy** first, or the run will reproduce T-188's
plateau (the agent picks the roof fix, the scalar gate rolls it back, the climb stalls on a fix that is
actually correct). The run is the deliverable; the gate calibration is the means to a *clean* run.

## The climb harness as it stands

**`experiments/eval-alignment/picture-climb.mjs`** (metered runner, NOT in `npm test`; GL + LLM spend;
`GUARD_ONLY=1` dry-proof). The loop, per round:
1. `scoreBuild(occ)` — `renderViews` 4 azimuths (`MULTI_ANGLE_GATE.azimuths`) + `renderBesideConcept`, then
   VOTES=3 `DiagnoseBuild` diagnoses (strong tier), median by `styleFidelityScore`. Returns
   `critiqueEvidence` fields + `items` (each `{department, severity, kind, missing, styleClass}`) + `scores`.
2. `agentPick(build, history)` — sonnet-4-6 picks ONE tool from the MENU given the top-5 items + the
   kept/rolled-back history. Honest `done` when no tool addresses the worst divergence.
3. apply the tool → `scoreBuild(cand)` → `acceptsRound(prev, cand)` → keep `occ=cand` or roll back.
4. `stoppingDecision(...)` — stop on agent-done / stallK / round cap, never before `minRounds`.
5. End: `classifyInventory(trajectory)` → eyes-vs-hands + verdict; write `trajectory.json`.

**The four HANDS** (`TOOLS`): `apply_gable_roof` (roof FORM, brown spruce), `recolor_roof` (roof MATERIAL,
concept-true grey via `reconcileRoofMaterial`; geometry byte-identical to the gable — only the field block
differs), `construct_walls` (envelope + skin from pack roles), `add_timber_framing` (upper-storey studs).
All four are in `MENU` and the agent enum. The roof-material hand is **reachable** now; T-188's run predates
it.

**The output sink is hardcoded** to `docs/active/work/T-188-01/trajectory.json` (line 311) — T-190 must
redirect it to its own work dir without disturbing T-188's committed evidence.

## The gate / restraint / classifier (`src/workshop/climb-gate.mjs`, PURE, in `npm test`)

- `acceptsRound(before, after, {margin})` — accept iff median score improves past `margin` (4); on a
  within-margin tie, accept iff coverage shrank (**whole-build** `wrongStyleBreadth` OR **whole-build**
  `nMajor` fell), else roll back. **This is exactly where the roof fix dies:** the attention-shift keeps
  whole-build `nMajor` flat at 1, so neither tie-break fires.
- `stoppingDecision({round, agentDone, noAcceptStreak, stallK, maxRounds, minRounds})` — `CLIMB_DEFAULTS =
  {margin:4, stallK:2, maxRounds:5, minRounds:3}`.
- `classifyInventory(trajectory, {margin})` — acted-on (accepted tool → its `TOOL_DEPARTMENTS`) vs eyes-only
  (named department no accepted tool reached); verdict `{climbed, stalled, oscillated, actionableFrac,
  delta}`. Two known heuristic warts (T-188 review): `oscillated` mislabels an idempotent accept-then-reject;
  the +8 phantom from re-scoring a byte-identical build slipped the gate.
- 9 pure tests (CG1–CG9). `TOOL_DEPARTMENTS.recolor_roof = ["ROOF"]` already present.

## The evidence the gate has vs the evidence it needs

- `critiqueEvidence(critique)` (`bakeoff-score.mjs:209`) exposes **whole-build** `score, nItems, nMajor,
  departments` (a flat list with dups), `missing, nWrongStyle, wrongStyleBreadth, gradedCap`. It does **NOT**
  expose per-department major counts.
- But `scoreBuild` already carries `items` (per-item `{department, severity}`) onto the scored build and into
  the trajectory. **A per-department major count is therefore derivable, purely, from `items`** — the
  department-aware signal the fix needs is one `reduce` away; no new judge call, no schema change.

## Assets & environment (verified this session)

- **GL is available** (`assertGlAvailable()` → OK from `render-beside.mjs`). The metered run is feasible.
- All five guarded assets present: seed `artifact.json`, `gatehouse.program.json`, `packs/rustic.json`,
  `material-map/gatehouse.json`, the concept PNG (run 015).
- `reconcileRoofMaterial(gatehouse)` → corrected, `dark_oak_planks → deepslate_tiles` (T-189 verified). The
  grey roof renders as a distinct dark mass (no collapse into the grey walls).

## Constraints / assumptions

- **Frozen instrument untouched** (`measurements/`, `compile.mjs`, program/pack/seed JSON). The climb is a
  creation loop; nothing is pre-corrected or hand-painted — the loop applies every change.
- **The judge is the human glance** on the render (the critique is the steering proxy, validated by E-47).
  The scalar is a noisy gradient, not a destination (project-direction: numbers are diagnostics).
- **Anti-hedge (GOVERNING):** the climb must actually be RUN and reported — lift / plateau / oscillation /
  glance-disagreement at full strength. A named plateau with a precise "what's missing" is a complete result.
- **Metered & non-deterministic:** VOTES=3 strong-tier diagnoses × ~5 rounds + agent picks. Vote noise
  (0–76) is real; the median + margin tame most of it. The run exposes the residual rather than hiding it.
- **Autonomy honesty:** the AC demands an accounting of how much human the run required. The loop is
  unattended at run time (agent picks, gate decides); the human authored the hands + gate. That distinction
  is the M1→M4 honesty the ticket asks for.
