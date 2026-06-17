# T-191-01 — RESEARCH: the department-dominant accept-gate override

Epic **E-50** / Story **S-191**. Make the **creation-loop accept-gate follow the glance.** T-190-01 ran the
gatehouse climb and named the ceiling precisely: the loop SEES the roof-colour gap, HAS the hand
(`recolor_roof`), PICKS it autonomously — and the accept-gate **rolls back the correct fix** because its
whole-build scalar regressed (60→48) while the glance says the grey roof is unmistakably closer to the
concept. This ticket implements the override that lets a department-cleared-a-major signal beat a whole-build
scalar regression, **and falsifies it** (must KEEP the grey roof AND REJECT a genuinely-bad change).

This is the **creation-loop gate only** (`src/workshop/climb-gate.mjs` + the runner). It is **NOT** the
E-46/E-47 promotion term; `measurements/` is untouched.

## The gate as it stands (`src/workshop/climb-gate.mjs`, PURE, in `npm test`)

`acceptsRound(before, after, opts)` (lines 85–105) decides keep/roll-back from two `critiqueEvidence`
bundles. Current control flow:

1. `delta = after.score - before.score`.
2. `delta >= margin (4)` → **accept** `improved +N`.
3. `delta <= -margin` → **reject** `regressed N`. ← **this is where the grey roof dies (-12).**
4. tie zone (`|delta| < margin`): accept iff whole-build coverage shrank (`wrongStyleBreadth` fell OR
   `nMajor` fell), OR — the T-190 department leg — a targeted department lost a major
   (`beforeDeptMajors[d] > afterDeptMajors[d]`). Else reject `no shrink`.

The T-190 department leg already exists **but is gated behind the tie zone** (step 4). A *past-margin*
regression (step 3) returns before the override can ever be considered. T-190's `ceiling.md` named this
exactly: "the tie-break is necessary and correct … the run proves it is **insufficient** — the failure is
one notch more severe than a tie."

Supporting pure helpers already present:
- `deptMajorCounts(items)` (lines 47–54): per-department **major** counts from a critique's `items`. Skips
  no-department items and non-major severities. This is the finer-than-whole-build signal. **It counts
  majors only — there is no minor/total counterpart yet.**
- `buildDigest(cells)` (lines 64–69): the no-op guard (unrelated to this ticket, leave as-is).
- `TOOL_DEPARTMENTS` (lines 31–36): factual reach of each hand — `recolor_roof: ["ROOF"]`,
  `apply_gable_roof: ["ROOF"]`, `construct_walls: ["WALL","OPENING"]`, `add_timber_framing: ["WALL"]`.

## The runner (`experiments/eval-alignment/picture-climb.mjs`, metered, NOT in `npm test`)

The only caller of `acceptsRound`/`deptMajorCounts` (verified by repo grep — no other call sites). The
decision site is lines 303–319:

```
const targetDepartments = TOOL_DEPARTMENTS[pick.tool];
const beforeDeptMajors = deptMajorCounts(prev.items);
const afterDeptMajors  = deptMajorCounts(candScore.items);
const gate = acceptsRound(prev, candScore, { margin, targetDepartments, beforeDeptMajors, afterDeptMajors });
```

`prev.items` / `candScore.items` are per-item `{department, severity, kind, missing, present, styleClass}`
arrays carried onto each scored build by `scoreBuild` (line 187). So **before/after MINOR counts are already
available at the decision site** — the net-minor guard needs no new judge call, no schema change, just a
second `reduce` over the same `items`. The trajectory records `deptMajorsBefore/After` (majors only) per
round; the after-MINOR counts are computed live but not currently persisted.

Output sink is `CLIMB_OUT` (line 336, default `T-188-01/trajectory.json`) — T-191 redirects it to its own
work dir via the env var, leaving T-188/T-190 committed evidence intact.

## The ground truth from T-190's recorded trajectory (the case the override must KEEP)

Extracted from `docs/active/work/T-190-01/trajectory.json`, round 3 (`recolor_roof`, REJECTED):

- **Before** (round-2 kept build, score 60): ROOF items = **1 major** (`replace`: "reads brown, concept
  grey") **+ 1 minor** (`add`: "lighter stone eave/verge trim band"). → `ROOF {major:1, minor:1}`.
  `deptMajorsBefore = {ROOF:1}`.
- **After** (round-3 grey build, score 48): `deptMajorsAfter = {WALL:1, OPENING:1}` — **ROOF major 1→0**
  (the hand cleared exactly its target); the judge promoted pre-existing WALL + OPENING items (neither
  touched by `recolor_roof`, which only edits y ≥ eave) from minor to major. The eave/verge ROOF minor
  persists (it is about missing banding, independent of colour). → `ROOF {major:0, minor:1}`.
- `delta = -12` (past margin 4), votes 52/40/48 vs the brown 60/60/52 — overlapping bands, median
  difference partly vote-noise.

So for the targeted department ROOF: **major fell (1→0)** and **total burden fell (2→1)**. The promoted
majors are in **untargeted** departments. This is the signature the override must recognize as KEEP.

## The case the override must REJECT (the falsification, ticket-named)

The ticket's anti-hedge failure mode: the "no new **major** in a targeted dept" guard **leaks** — a fix that
clears one targeted major but adds new **minors** in its own target (net degradation) survives. A major-only
guard cannot see the new minors. The adversarial fixture is therefore: a tool that clears a targeted ROOF
major **but ends with more total ROOF items than it started** (e.g. cleared 1 major, added 2 minors:
`{1,0}` → `{0,2}`). The override must REJECT this; if major-only keeps it, tighten to a **net** (total-item)
guard.

## Constraints / assumptions

- **Frozen instrument untouched** — `measurements/`, `compile.mjs`, program/pack/seed JSON. The override
  is a *creation-loop* decision rule.
- **Pure & unit-tested** — all gate logic stays in `climb-gate.mjs` (no GL, no LLM, no I/O); decisions are
  tested in `climb-gate.test.mjs` (currently 12 pass).
- **`acceptsRound` has exactly one caller** (the runner) — the signature can be extended additively without
  ripple. CG3/CG11 fixtures pin the current tie-zone behavior and must stay green (or be updated where the
  ticket *intends* a semantic change — the CG11 past-margin-regression case is one such intended change).
- **Anti-hedge (GOVERNING):** a one-sided "it keeps the roof" result is NOT validation. The adversarial
  REJECT is mandatory (unit fixture), and the KEEP must be shown on the real re-run (metered) or honestly
  reported if the run cannot be executed in this environment.
- **Metered & non-deterministic** for the KEEP re-run: VOTES=3 strong-tier diagnoses × rounds. Report the
  observed vote bands so the keep/reject is calibrated, not asserted; if major/minor is too vote-noisy to
  drive the decision, name vote-noise reduction as the co-lever.
