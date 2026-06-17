# T-190-01 — PLAN: ordered steps to the climb proof

Four commits: pure gate (tested) → runner wiring (dry-proof) → the metered run (evidence) → docs. Each step
is independently verifiable. The frozen instrument is never touched.

## Step 1 — `climb-gate.mjs`: the three pure additions (Commit 1)

1. `deptMajorCounts(items=[])` → `{[department]: majorCount}`. Reduce, count `severity==="major"`, skip
   falsy departments. Frozen-input safe (no mutation).
2. Extend `acceptsRound(before, after, {margin, targetDepartments, beforeDeptMajors, afterDeptMajors})`:
   - Keep the Δ≥margin / Δ≤−margin branches verbatim.
   - In the tie zone, after `breadthShrank || majorsShrank`, add the department-aware branch: if
     `targetDepartments` provided and some `d` has `beforeDeptMajors[d] > (afterDeptMajors[d] ?? 0)`,
     `accept:true, reason:"tie (Δ): <d> cleared a major"`.
   - Final `no shrink` reject unchanged. No context → new branch inert.
3. `buildDigest(cells=[])` → stable string over sorted `${pos.join(',')}|${block}` lines.

**Verify:** `npm test` (existing CG1–CG9 must stay green — proves backward compatibility).

## Step 2 — `climb-gate.test.mjs`: CG10–CG12 (Commit 1, same commit)

- **CG10** `deptMajorCounts`: majors counted per department; minors ignored; `[]`/missing → `{}`.
- **CG11** department-aware tie-break (the T-189 fixture):
  - accept: whole-build `nMajor` 1→1, breadth flat, Δ within margin, `targetDepartments:["ROOF"]`,
    before `{ROOF:1,WALL:0}` → after `{ROOF:0,WALL:1}` ⇒ `accept:true`, reason `/ROOF cleared a major/`.
  - reject: same flat whole-build, `targetDepartments:["ROOF"]`, before/after `{ROOF:1}` (no clear) ⇒
    `accept:false`, `/no shrink/`.
  - backward-compat: omit the context entirely on the CG3 inputs ⇒ identical verdicts.
- **CG12** `buildDigest`: permuted cells → equal digest; same positions / different block → different digest;
  `[]` → stable non-throwing value.

**Verify:** `npm test` green (2319 + 3 new cases all pass).
**Commit 1:** `feat(T-190-01): department-aware accept signal + no-op digest (pure, CG10-12)`.

## Step 3 — `picture-climb.mjs`: wire the gate + guard + output redirect (Commit 2)

1. Import `deptMajorCounts, buildDigest, TOOL_DEPARTMENTS` from `climb-gate.mjs`.
2. `CLIMB_OUT` env override for `outPath` (default = T-188 path).
3. In the loop body, per round:
   - Build the candidate; `candDigest = buildDigest(occToCells(cand))`.
   - **No-op guard:** if `candDigest === prevDigest`, push a no-op trajectory entry
     (`applied:true, accepted:false, gate:{accept:false, reason:"no-op (identical build)"}`), advance
     `noAcceptStreak`, **skip the diagnose**, continue (don't change `occ`).
   - Else `scoreBuild(cand)` then `acceptsRound(prev, candScore, {margin, targetDepartments:
     TOOL_DEPARTMENTS[pick.tool], beforeDeptMajors: deptMajorCounts(prev.items), afterDeptMajors:
     deptMajorCounts(candScore.items)})`.
   - On accept: `occ = cand; prevDigest = candDigest`.
   - Record `targetDepartments` + `deptMajorsBefore/After` on the trajectory entry.
4. Set `prevDigest = buildDigest(occToCells(occ))` once after the seed score.

**Verify:** `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` — assets + GL + render seam +
occ round-trip, **zero spend**. Confirm it writes round-0 renders and exits clean.
**Commit 2:** `feat(T-190-01): wire department-aware gate + no-op guard into the climb runner`.

## Step 4 — the metered sustained climb (Commit 3)

1. Run: `CLIMB_OUT=docs/active/work/T-190-01/trajectory.json node
   experiments/eval-alignment/picture-climb.mjs 2>&1 | tee docs/active/work/T-190-01/run.log`.
   - Expect ≥4–5 round-bodies (minRounds=3 floor, maxRounds=5 cap).
   - Watch: does the agent pick `recolor_roof` on the brown roof? Does the department-aware gate KEEP it?
2. Copy the glance evidence out of gitignored `builds/`:
   - first = `round-0/beside-concept.png` → `round-first-beside.png`
   - best = the highest-scoring / most-converged round's beside → `round-best-beside.png`
   - last = the final kept round's beside → `round-last-beside.png`
3. **Human-glance check** (the judge): open first/best/last beside-concept sheets and record, at full
   strength, whether the build visibly closes the gap to the picture and whether the glance **agrees** with
   the critique's "improvement" — including disagreement if that is what the renders show.
4. Write **`ceiling.md`**: trend + per-round gate decisions; what each kept hand moved; the named plateau
   (what no hand fixes → E-49 scope); the autonomy accounting (unattended vs authored/nudged).

**Verify:** `trajectory.json` present + parses; three beside PNGs in the work dir; `run.log` captured.
**Commit 3:** `feat(T-190-01): sustained picture-climb run — trajectory, beside glance, named ceiling`.

> **Fallback (anti-hedge, reported not hidden):** if the live run is blocked (GL/spend unavailable mid-run,
> repeated malformed diagnoses), capture what ran, fall back to a targeted two-build demonstration of the
> gate change (brown vs grey via the existing `ROOF_MATERIAL_DIAGNOSE` path scored through the NEW gate), and
> report the blockage plainly in `ceiling.md`. The gate-unit proof (CG11) stands regardless. GL was verified
> available this session, so the live run is the expected path.

## Step 5 — docs (Commit 4)

- **`progress.md`** — what landed, verified facts (gate behaviour, run trend, glance verdict), deviations.
- **`review.md`** — handoff: changes table, test coverage + gaps, AC check, open concerns, the named ceiling
  as the E-49 input.

**Verify:** `npm test` green; `git status` shows `measurements/` untouched.
**Commit 4:** `docs(T-190-01): progress + review — climb proof, ceiling, autonomy honesty`.

## Testing strategy

- **Unit (in `npm test`):** CG10–CG12 cover the *decisions* — per-department counting, the department-aware
  tie-break (both polarities + backward-compat), the digest (order-independence + block-sensitivity). These
  are correct independent of the run's stochastic outcome, so they gate CI; the runner does not (GL+LLM).
- **Dry-proof (free):** `GUARD_ONLY=1` exercises the wiring + render seam with zero spend.
- **The run (metered, manual):** the climb itself + the glance is the integration evidence, captured as
  artifacts (trajectory + beside renders + log), not asserted in CI.

## What "done" looks like

A ≥4–5-round trajectory on the gatehouse with the department-aware gate live; first/best/last beside renders
in the work dir; a human-glance verdict (agree/disagree, at full strength); a named ceiling with a precise
"what's missing" (E-49 scope) and an honest autonomy accounting; `npm test` green; frozen instrument
untouched.
