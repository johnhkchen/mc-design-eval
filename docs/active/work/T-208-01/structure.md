# T-208-01 Structure — file-level blueprint for the batch escape

Three source touchpoints + tests + work-dir evidence. The **decision** is PURE in `climb-gate.mjs` (unit-tested,
in `npm test`); the **stacking/rollback** is in the metered runner (live-exercised, not in `npm test`). The
mechanism is **gated to the cold-start floor** and **opt-in via env** so every existing climb (T-201/T-205/T-207)
re-runs byte-identically unless the escape is explicitly enabled.

## File 1 — `src/workshop/climb-gate.mjs`  (MODIFY: add pure batch decision)

Additions only; `acceptsRound` and the healthy path are untouched.

### 1a. `BATCH_DEFAULTS` constant (after `CLOSURE_GAIN_MARGIN`, ~line 77)
```js
// The cold-start batch escape (T-208-01, S-208, E-53). batchSize provisional detail moves stack un-credited,
// then the COMPOUND is judged once. scoreFloor = the saturated picture floor (0) the per-move gate can't leave;
// batchMargin = the smallest off-floor read that counts (one point — escaping 0 is the signal). Frozen; the
// runner reads CLIMB_BATCH_SIZE / CLIMB_SCORE_FLOOR env knobs (default OFF) like CLIMB_MAX_ROUNDS.
export const BATCH_DEFAULTS = Object.freeze({ batchSize: 4, scoreFloor: 0, batchMargin: 1 });
```

### 1b. `coldStartFloor(...)` — PURE entry predicate (after `formReadyGate`, ~line 116)
```js
/** Is the build stuck at the saturated picture floor on a CLOSED form? The cold-start trap (research §2):
 *  closed shell (closure ≥ threshold) but score ≤ scoreFloor, where every per-move detail gate ties at 0.
 *  Pure. NaN closure → not cold-start (fail-safe: don't batch on an unknown form). */
export function coldStartFloor({ score, closure, scoreFloor = BATCH_DEFAULTS.scoreFloor,
  formReadyThreshold = FORM_READY_CLOSURE } = {}) {
  return num(score) <= scoreFloor && Number.isFinite(closure) && num(closure) >= formReadyThreshold;
}
```

### 1c. `acceptsBatch(before, after, opts)` — PURE compound decision (after `acceptsRound`, ~line 312)
```js
/** ACCEPT-A-COMPOUND (T-208-01). Keep N provisionally-stacked detail moves vs the pre-batch build, judged by
 *  the picture score over the COMPOUND (the gradient several moves create together — the escape from the floor).
 *  Reuses departmentDominant (union of the batch's targeted depts). Guards, in order:
 *   (3) delta < 0          → REJECT "regressed" (the deliberately-bad-compound reject; moot at floor 0, kept
 *                            as a guard for scoreFloor>0 callers);
 *   (2) new whole-build major (after.nMajor > before.nMajor) → REJECT "added a major" (rubber-stamp guard —
 *                            a bad batch that paints wrong / floods openings raises a major → rejected);
 *   (1a) delta >= batchMargin → ACCEPT "compound +delta" (escaped the floor — the read several moves made);
 *   (1b) departmentDominant fires → ACCEPT "<dept> cleared a major" (a targeted major cleared though the
 *                            whole-build scalar is still saturated);
 *   else → REJECT "compound tie at floor — no read" (the honest residual: even the compound can't move the
 *                            judge off 0 → the ticket's failure-mode-3, name de-noising the judge, do NOT
 *                            rubber-stamp). Pure; same evidence bundles as acceptsRound. */
export function acceptsBatch(before, after, {
  batchMargin = BATCH_DEFAULTS.batchMargin, targetDepartments = null,
  beforeDeptMajors = null, afterDeptMajors = null, beforeDeptItems = null, afterDeptItems = null,
} = {}) {
  if (!before || !after) fail("acceptsBatch", "before and after evidence are required");
  const delta = num(after.score) - num(before.score);
  if (delta < 0) return { accept: false, delta, reason: `regressed ${Math.round(delta)}` };
  if (num(after.nMajor) > num(before.nMajor))
    return { accept: false, delta, reason: `added a major (${num(before.nMajor)}→${num(after.nMajor)})` };
  if (delta >= batchMargin) return { accept: true, delta, reason: `compound +${Math.round(delta)} (off the floor)` };
  const dom = departmentDominant({ targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });
  if (dom) return { accept: true, delta, reason: `${dom} cleared a major (department-dominant, batch)` };
  return { accept: false, delta, reason: `compound tie at floor — no read (→ de-noise the judge)` };
}
```
**Exports:** add `BATCH_DEFAULTS`, `coldStartFloor`, `acceptsBatch` to the existing named exports.
`departmentDominant` stays module-private (reused internally).

## File 2 — `test/workshop/climb-gate.test.mjs`  (MODIFY: add the CG-B batch suite)

A `describe("acceptsBatch — cold-start batch escape (T-208-01)")` block, all deterministic (no GL/LLM):
- **CG-B1 good compound escapes the floor** — `before {score:0,nMajor:3}`, `after {score:14,nMajor:3}` →
  `accept`, reason `compound +14`.
- **CG-B2 deliberately-bad compound (adds a major) → REJECT** — `before {score:0,nMajor:3}`,
  `after {score:0,nMajor:5}` → `accept=false`, reason `added a major`. *(the AC falsification)*
- **CG-B3 deliberately-bad compound (regressed, floor>0 caller) → REJECT** — `before {score:8}`,
  `after {score:3}` → `accept=false`, reason `regressed`.
- **CG-B4 useless compound (tie at floor, no major change) → REJECT, no rubber-stamp** —
  `before {score:0,nMajor:3}`, `after {score:0,nMajor:3}` → `accept=false`, reason `tie at floor`.
- **CG-B5 department-dominant batch** — WALL major cleared (`beforeDeptMajors {WALL:1}`,
  `afterDeptMajors {WALL:0}`), scalar flat at 0, no new major, no net-grow → `accept`, reason `WALL cleared`.
- **CG-B6 net guard rejects clear-but-add-minors** — WALL major→0 but `afterDeptItems.WALL.minor` grew past
  before → `accept=false` (departmentDominant net guard (c)).
- **CG-coldStart1/2** — `coldStartFloor` true at `{score:0, closure:1.0}`; false at `{score:0, closure:0.6}`
  (form open) and at `{score:12, closure:1.0}` (already off the floor); NaN closure → false.

`npm test` must stay green (current 2416 + the new CG-B/coldStart cases).

## File 3 — `experiments/eval-alignment/picture-climb.mjs`  (MODIFY: batch sub-loop in the round loop)

NOT in `npm test`; live-exercised. Changes:

### 3a. Imports (line 50) — add `acceptsBatch, coldStartFloor, BATCH_DEFAULTS`.

### 3b. Env knobs (near `VOTES`, ~line 76)
```js
const BATCH_SIZE = Number(process.env.CLIMB_BATCH_SIZE ?? 0);        // 0 = OFF (per-move only) — opt-in escape
const SCORE_FLOOR = Number(process.env.CLIMB_SCORE_FLOOR ?? BATCH_DEFAULTS.scoreFloor);
```
Default 0 → the escape is **inert** unless the re-climb sets `CLIMB_BATCH_SIZE=4`; this keeps T-201/T-205/T-207
comparison runs byte-identical and honours the `CLIMB_MAX_ROUNDS` knob discipline.

### 3c. Batch branch (inside the `for` loop, AFTER `formReadyGate` passes, BEFORE the per-move `cand` block ~line 733)
```js
if (BATCH_SIZE > 0 && coldStartFloor({ score: prev.score, closure, scoreFloor: SCORE_FLOOR })) {
  // COLD-START BATCH ESCAPE (T-208-01): stack up to BATCH_SIZE provisional DETAIL picks as a pure occ-chain,
  // score the COMPOUND once, keep-all / roll-back-all via acceptsBatch. Escapes the score-0 floor where every
  // per-move detail gate ties at 0. occ₀ is preserved (no mutation until accept) → rollback is free.
  // ... provisional loop: apply pick (skip no-ops via buildDigest; honor self-reverting hands), re-pick on the
  //     UNCHANGED prev score, collect batchPicks + targeted depts; stop at BATCH_SIZE / done / a form move.
  // ... compound = scoreBuild(occ_N, ...); gate = acceptsBatch(prev, compound, { targetDepartments: union, dept maps });
  // ... on accept: occ = occ_N; prev = compound; advance round by batchPicks.length. else: occ unchanged (roll back all).
  // ... push ONE trajectory entry tagged { batch: { size, picks, accepted } } + closure/closureAfter.
  // ... continue;  (skip the per-move block for these rounds)
}
```
Round accounting: a batch consumes `batchPicks.length` of the `maxRounds` budget (so `CLIMB_MAX_ROUNDS=8`
still bounds spend). `stoppingDecision` is consulted after the batch with the updated `round`/`noAcceptStreak`.

### 3d. Trajectory schema — additive field `batch: { size, picks:[tool], accepted }` on batch rounds; existing
fields unchanged so `classifyInventory` and the downstream reads keep working.

## File 4 — `docs/active/work/T-208-01/` (artifacts; evidence on the re-climb)

`progress.md`, `review.md`, and — **only if T-207 confirms the stall** and the metered re-climb runs —
`trajectory.json`, `climb.log`, `beside-{first,best,final}.png`. If T-207 reached the picture, the work dir
records the **no-op** with T-207's evidence and the unit-tested-but-inert mechanism.

## Ordering of changes

1. `climb-gate.mjs` (1a→1c) — pure, no dependents break.
2. `climb-gate.test.mjs` (CG-B/coldStart) — `npm test` green proves the decision incl. the falsification.
3. `picture-climb.mjs` (3a→3d) — wire the runner; parse-check + `GUARD_ONLY=1` zero-spend smoke.
4. (contingent) the metered re-climb with `CLIMB_BATCH_SIZE=4`, then the glance verdict.

## Module boundaries preserved

- climb-gate stays **occ-free / GL-free / LLM-free** (the decision takes scalars + dept maps only).
- The runner owns all I/O, rendering, spend, and the pure-`occ` stacking.
- `measurements/` untouched; `CLIMB_DEFAULTS` frozen; the healthy per-move path unchanged.
