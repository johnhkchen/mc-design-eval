# T-190-01 — REVIEW: the climb lifts, the glance agrees, and the ceiling is the RULER

**Verdict: the M1 capstone run is done and the result is sharp.** The picture-driven loop climbed the
gatehouse from a ragged dark box to a recognizable grey gabled gatehouse (**+52, glance-agreed**), under its
own steam, with **zero human intervention during the run** and a correct, unprompted agent pick at every
step. Then it hit a ceiling that is more instructive than a missing hand: at the roof-colour step the agent
**autonomously picked the right tool** (`recolor_roof`), the tool **cleared the major it targeted**
(`deptMajors ROOF 1→0`), and the **human glance confirms the grey roof is clearly closer to the concept** —
yet the accept-gate's whole-build scalar scored it a regression (60→48) and **rolled the correct fix back**.
The binding constraint is no longer the hands or the agent; it is the **ruler** (the accept signal disagrees
with the glance). `npm test` 2322/0; the frozen instrument is untouched.

## What changed

| File | Change |
|---|---|
| `src/workshop/climb-gate.mjs` | **+3 pure exports.** `deptMajorCounts` (per-department major counts), `buildDigest` (stable order-independent block-sensitive digest), and a **department-aware tie-break** in `acceptsRound` (keeps a tool that cleared a major in a department it targets on a within-margin tie; inert with no department context → backward compatible). |
| `src/workshop/climb-gate.test.mjs` | **+CG10–CG12.** Per-department counting; the tie-break (both polarities + backward-compat + past-margin-regression-still-rejects); the digest (permutation-invariance + block-sensitivity + empty-stable). |
| `experiments/eval-alignment/picture-climb.mjs` | Threads `TOOL_DEPARTMENTS[pick]` + before/after `deptMajorCounts` into the gate; adds the **no-op digest guard** (byte-identical re-pick → rolled back, zero spend); `prevDigest` tracking; trajectory records `targetDepartments`+`deptMajorsBefore/After`; `CLIMB_OUT` env redirect. |
| `docs/active/work/T-190-01/` | `trajectory.json`, `run.log`, `round-first/best-beside.png` + `round3-grey-rolledback-beside.png` (the glance), `ceiling.md`, the RDSPI artifacts. |

Commits: `…department-aware accept signal (CG10-12)` → `…wire gate + no-op guard` → `…sustained climb run` →
this docs commit. **`measurements/`, `bakeoff-score.mjs`, `compile.mjs`, the program/pack/seed JSON, and the
hands are all untouched** — nothing is pre-corrected or hand-painted; the loop applied every change.

## The result, read honestly

**Trend `0 → 0 → 8 → 60 → 60` (Δ +52 real; stop agent-done).** `construct_walls` (+8) → `apply_gable_roof`
(+52, the box becomes a gabled gatehouse) → `recolor_roof` (rolled back) → done.

**The glance check (I read all three renders):** concept roof is dark/charcoal; the kept round-2 build has a
warm-**brown** roof (clearly wrong value); the rolled-back round-3 build has a dark-**grey** `deepslate_tiles`
roof that **matches the concept**. The glance ranks grey > brown; the gate ranked grey < brown. **They
disagree, and by the project's "the glance wins" rule the gate is wrong here.**

**Why (from the recorded `deptMajors`):** before `recolor_roof` the only major was `{ROOF:1}`; after, it was
`{WALL:1, OPENING:1}` — the roof major cleared, and the judge promoted two *pre-existing, unchanged*
WALL/OPENING items (attention-shift) while vote noise (grey 52/40/48 vs brown 60/60/52) put the median 12
below. −12 is past the margin, so the gate rejected at the regression branch.

## Acceptance criteria

- ✅ **Sustained climb run; per-round trend + beside renders (first/best/last).** 4 scoring rounds
  (0–3) on the gatehouse; `trajectory.json` + `run.log`; `round-first-beside.png` (seed),
  `round-best-beside.png` (the kept gabled build), `round3-grey-rolledback-beside.png` (the rolled-back
  grey fix — the glance-disagreement evidence). *(Stopped at agent-done after 3 applied rounds — genuine
  convergence; see Open concern 1.)*
- ✅ **Human-glance check on a before/after sample.** Done first-hand on seed / brown-gable / grey-recolor.
  The glance **disagrees** with the gate on the roof step (recorded at full strength).
- ✅ **The ceiling named: where it plateaus, what it can't fix, how much human.** `ceiling.md`: plateaus at
  the roof colour because the **accept-gate's scalar disagrees with the glance** (not a missing hand); the
  remaining concept gaps (arched gate, wall quoin contrast, eave banding → E-49); **zero human intervention
  during the run**, all hands/gate human-authored beforehand.
- ✅ **Recorded honestly: lift / plateau / oscillation / glance-disagreement at full strength.** Lift +52
  (real) reported beside the +8 vote-noise leg; no oscillation; the **glance-disagreement is the headline**,
  not buried. The plateau's precise "what's missing" scopes the next work.
- ✅ **`npm test` green; frozen instrument untouched.** 2322/0; `git status measurements/` clean.

## Test coverage & gaps

- **Unit (in `npm test`, +3):** `deptMajorCounts`, the department-aware tie-break (accept + reject +
  backward-compat + past-margin-still-rejects), and `buildDigest` (CG10–CG12). The gate's *decisions* are
  covered without GL/LLM. 2322/0.
- **Dry-proof (free):** `GUARD_ONLY=1` exercised the wiring + render seam, zero spend.
- **The run (metered, manual):** the integration evidence — trajectory + beside renders + log — captured as
  artifacts, not asserted in CI (GL+LLM, like every `experiments/` sibling). Reproduce:
  `CLIMB_OUT=… node experiments/eval-alignment/picture-climb.mjs`.
- **Gap (named):** the **department-dominant override** (the fix that would keep the grey roof) is *not*
  implemented, so it is not tested. Deliberate — it is the next ticket's hypothesis (below).

## Open concerns for the human reviewer

1. **The ceiling is the accept-gate, not a hand — this is the headline.** The loop has working eyes, a
   working roof-colour hand (S-189), and an agent that picks it correctly. The one broken link is the
   **accept signal**: the whole-build `styleFidelityScore` measures attention-shift + vote-noise, so a fix
   that clears its target department reads as a regression. **The next step is to make the ruler follow the
   glance**, before building more hands.
2. **My department-aware tie-break is necessary but proved insufficient — reported, not hidden.** It covers
   *within-margin ties*; the run's failure is a *past-margin regression*, so it never fired. It is still
   correct (it will fire when the scalar is flat) and its `deptMajors` instrumentation is what diagnosed the
   ceiling. The honest follow-up: a **department-dominant override** — keep a tool that cleared a major in a
   department it targets and introduced no new major in any department it targets, *even on a whole-build
   regression* (the regression then being provably attention-shift to untargeted departments). That single
   rule keeps the grey roof. **Left for its own ticket** because it trades scalar-trust for department-trust
   and must be falsified on a subject where it could wrongly keep a *bad* change (does the "no new major in a
   targeted department" guard hold?). One glance on one subject licenses naming it, not shipping it.
3. **The stop at agent-done (round 3) is genuine convergence.** The agent chose `done` only after the sole
   roof-colour tool was rolled back and `add_timber_framing` was correctly judged irrelevant to a stone
   gatehouse. The run characterises the ceiling fully; forcing 5 rounds would be theatre. If a reviewer wants
   a longer trace, lowering the margin or enriching the menu are the knobs — neither changes the finding.
4. **Vote noise remains the scalar's floor.** Grey 52/40/48 vs brown 60/60/52 overlap; the medians differ by
   −12 partly by draw. This corroborates T-187/T-189: at VOTES=3 the scalar is a coarse gradient. The
   department-cleared-a-major signal is *categorical* (1→0) and noise-immune — another reason the next gate
   should lean on it over the scalar delta.

## Handoff

Read `ceiling.md` beside the three beside renders — `round-best-beside.png` (brown roof, KEPT, score 60) next
to `round3-grey-rolledback-beside.png` (grey roof, ROLLED BACK, score 48) is the whole story: the gate kept
the build the glance calls *worse*. The engine split is unchanged — pure decisions in
`src/workshop/climb-gate.mjs` (12 tests), the metered runner in
`experiments/eval-alignment/picture-climb.mjs`. The single highest-value next move is the **department-
dominant accept override** (Open concern 2), the input S-190's accept-gate follow-up / E-49 needs. Nothing
here touches the frozen instrument.
