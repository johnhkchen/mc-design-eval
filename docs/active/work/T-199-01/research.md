# T-199-01 — Research: form-credit accept term (E-49 spine)

## The bug, exactly

The T-198 metered re-climb **stalled at a colonnade**. Trajectory
(`docs/active/work/T-198-01/trajectory.json`):

- round 0: seed, score **16** (`16/16/16`), closure **0.615**, agent picks `close_shell`.
- round 1: `close_shell` applied. candidate re-scored **16** (`16/16/16`) — a **tie** (delta 0).
  Gate verdict: `tie (0): no shrink` → **ROLLED BACK**.
- rounds 2–3: `construct_walls` craters (−16, rolled back), `apply_gable_roof` ties (rolled back).
- verdict: `climbed=false, stalled=true, delta=0`, `closureFirst=closureLast=0.615`.

`close_shell` is the **form** hand (`TOOL_STAGE.close_shell="form"`). On the real build it raises
band closure **0.615 → 1.000** (T-197 evidence; the design doc seed measurement). But the
**picture-score gate** (`acceptsRound`) sees only a 16→16 tie and rolls it back. With the shell never
closed, the **form-before-detail gate** (`formReadyGate`, closure ≥ 0.9) keeps every DETAIL hand
(carve/relief/band) **locked forever** — the climb cannot reach the detail that would move the score.
Deadlock: the one move the ordering gate *demands* is the one the accept gate *rejects*.

## Where the recorded `closureAfter` lies

`picture-climb.mjs:633` records `closureAfter: closureNow(gate.accept ? cand : occ)`. Because the gate
**rejected**, it measured `occ` (the rolled-back build) → recorded `closureAfter = 0.615`, identical to
before. The candidate's *true* closure (1.000) was never recorded and **never fed to the gate**. So the
gate had no form signal at all — it decided on the noisy picture scalar alone. This is the seam: the
runner must compute `closureNow(cand)` **before** the gate and pass it in.

## The accept gate today (`src/workshop/climb-gate.mjs`)

`acceptsRound(before, after, opts)` decides keep/rollback in this order:

1. `delta = after.score - before.score >= margin` → **accept** (`improved`).
2. `departmentDominant(...)` → **accept** (`department-dominant override`) — fires even on regression.
3. `delta <= -margin` → **reject** (`regressed`).
4. tie zone: `wrongStyleBreadth` shrank OR `nMajor` shrank → accept, else **reject** (`no shrink`).

`departmentDominant` (T-191/E-50) is the existing precedent for "credit a real structural win over the
noisy whole-build scalar." Its three guards:
- **(a) cleared** — some targeted dept's *major* count fell;
- **(b) no new major** — no *targeted* dept's major count rose;
- **(c) net guard** — no *targeted* dept's *total* (major+minor) count rose (the S-191 net-minor
  tightening; active only when `*DeptItems` supplied; without item data it degrades to (a)+(b), which
  **leaks** — documented in test CG15).

The form clause is the **form-analog**: replace guard (a) "cleared a major" with "**closure rose by a
margin toward 0.9**", keep guards (b) and (c).

## Inputs already available in the runner loop (`picture-climb.mjs:610-633`)

Per round the runner already derives, purely from items on each scored build:
- `targetDepartments = TOOL_DEPARTMENTS[pick.tool]` (close_shell → `["WALL"]`).
- `beforeDeptMajors / afterDeptMajors = deptMajorCounts(prev.items / candScore.items)`.
- `beforeDeptItems / afterDeptItems = deptItemCounts(...)`.
- `closure = closureNow(occ)` (the **before** closure) at line 576.
- `closureNow(o) = eaveRingClosure(o, { floor: o.bounds.min[1], eaveY: CFG.eaveY })` — **the same
  definition** `closeShell` reports (`src/view/wall-generate.mjs`), so no second metric is introduced.

Missing: `closureAfter = closureNow(cand)`, computed before the gate, and threaded into `acceptsRound`.

## `closureOf` / `eaveRingClosure` (`src/view/wall-generate.mjs`)

- `closureOf(ring)` = fraction of the ring's bbox-rectangle perimeter the ring actually occupies. A
  watertight rectangle = 1; a colonnade with straight-run gaps < 1. PURE.
- `eaveRingClosure(occ, {floor, eaveY})` = `closureOf(perimeterColumns(cols))` over the wall band. The
  ticket mandates **reuse** of this — no second metric. The runner owns the occ→scalar reduction;
  `climb-gate` stays occ-free / GL-free and takes the scalar.

## Real counts to reproduce as the KEEP fixture (from trajectory.json round 1)

```
before.score 16, after.score 16          (tie, delta 0)
closureBefore 0.6153846153846154         (the real 0.615 seed band)
closureAfter  1.000                       (close_shell closes the shell — T-197; NOT the buggy recorded 0.615)
deptMajorsBefore { ROOF:1, WALL:1, OPENING:1 }
deptMajorsAfter  { ROOF:1, WALL:1, OPENING:1 }   (no major rose)
deptItemsBefore  { ROOF:{1,0}, WALL:{1,0}, OPENING:{1,0} }
deptItemsAfter   { ROOF:{1,0}, WALL:{1,0}, OPENING:{1,0} }  (WALL total flat → net guard OK)
targetDepartments ["WALL"]
```
Expected: form clause fires → **ACCEPT** (where today it is `tie (0): no shrink` → reject).

## Constraints / boundaries

- **PURE** decision: no GL, no LLM, no I/O in `climb-gate.mjs`; scalar-in only (closure computed by the
  runner). Mirrors `formReadyGate` / `acceptsRound`.
- **Reuse** `eaveRingClosure`/`closureOf` — no second form metric (AC + memory
  [[form-revision-needs-3d-target]] caution against inventing parallel metrics).
- **Structure-scoped**, never a whole-build scalar bypass — that is what keeps it noise-robust
  regardless of S-200's signal work (ticket Notes).
- **Frozen instrument untouched**: changes confined to `src/workshop/climb-gate.mjs`,
  `src/workshop/climb-gate.test.mjs`, and the runner's accept path; `measurements/` not touched.
- `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` must still resolve (wiring smoke).
- Backward compatibility: with no closure context the form clause is **inert** (returns null), exactly
  as `departmentDominant` is inert without department context.

## Test conventions

`climb-gate.test.mjs` uses `node:test` + `assert/strict`, one `test()` per case, named `CGn` /
`CG-FRn`. New cases append as `CG-FCn` (form-credit). The runner is excluded from `npm test`
(metered); its wiring is proven only by the `GUARD_ONLY` smoke.
