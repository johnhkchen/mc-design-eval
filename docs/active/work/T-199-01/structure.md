# T-199-01 — Structure: file-level changes

## Files modified

### 1. `src/workshop/climb-gate.mjs` (the mechanism)

**Add** near `FORM_READY_CLOSURE` (after line 67):
```js
// The minimum closure RISE that counts as a form-readiness win (T-199-01, S-199, E-49). Calibrated vs
// the measured gatehouse gap (seed 0.615 → closed 1.000 = +0.385); 0.1 sits well inside it, robust not
// a knife-edge. The runner reports the OBSERVED gain beside it, like CLIMB_DEFAULTS.margin.
export const CLOSURE_GAIN_MARGIN = 0.1;
```

**Add** a private `formCredit(...)` helper directly after `departmentDominant` (after line 175),
structurally parallel to it:
```js
function formCredit({
  closureBefore, closureAfter, closureMargin = CLOSURE_GAIN_MARGIN, formReadyThreshold = FORM_READY_CLOSURE,
  targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems,
}) {
  if (!Number.isFinite(closureBefore) || !Number.isFinite(closureAfter)) return null; // inert w/o closure
  if (!beforeDeptMajors || !afterDeptMajors) return null;          // (b′) needs major data → fail-safe
  if (closureBefore >= formReadyThreshold) return null;            // (2) only while a form gap remains
  const gain = closureAfter - closureBefore;
  if (gain < closureMargin) return null;                           // (3) real rise toward the threshold
  const depts = new Set([...Object.keys(beforeDeptMajors), ...Object.keys(afterDeptMajors)]);
  for (const d of depts) if (num(afterDeptMajors[d]) > num(beforeDeptMajors[d])) return null; // (b′) whole-build
  if (Array.isArray(targetDepartments) && beforeDeptItems && afterDeptItems) {                // (c′) net guard
    const tot = (c) => num(c?.major) + num(c?.minor);
    for (const d of targetDepartments) if (tot(afterDeptItems[d]) > tot(beforeDeptItems[d])) return null;
  }
  return { gain, closureAfter };
}
```

**Modify** `acceptsRound` signature — add four opts (all defaulting to inert):
```js
export function acceptsRound(before, after, {
  margin = CLIMB_DEFAULTS.margin, targetDepartments = null,
  beforeDeptMajors = null, afterDeptMajors = null, beforeDeptItems = null, afterDeptItems = null,
  closureBefore = null, closureAfter = null,
  closureMargin = CLOSURE_GAIN_MARGIN, formReadyThreshold = FORM_READY_CLOSURE,
} = {}) {
```

**Modify** `acceptsRound` body — insert the form clause **after** the `dom` accept (line 202),
**before** the `delta <= -margin` reject (line 203):
```js
const form = formCredit({ closureBefore, closureAfter, closureMargin, formReadyThreshold,
  targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });
if (form) return { accept: true, delta,
  reason: `closure ${form.gain.toFixed(3)}↑ (${num(closureBefore).toFixed(3)}→${num(closureAfter).toFixed(3)}) form-credit` };
```

**Update** the `acceptsRound` JSDoc to document the form-credit clause and the new opts (one paragraph,
mirroring the department-dominant note).

Public surface change: `acceptsRound` gains four optional, inert-by-default params; one new export
`CLOSURE_GAIN_MARGIN`. `formCredit` is module-private (like `departmentDominant`) — tested through
`acceptsRound`, the public seam.

### 2. `src/workshop/climb-gate.test.mjs` (the falsification)

Append a `T-199-01` section with `CG-FCn` cases:

- **CG-FC1 (KEEP, the real T-198 shape)** — reproduce round-1 counts exactly: scores 16→16 (tie),
  `closureBefore 0.6153846153846154`, `closureAfter 1.0`, majors `{ROOF:1,WALL:1,OPENING:1}` flat,
  items flat, `targetDepartments ["WALL"]` → `accept === true`, reason matches `/form-credit/`. This is
  the case the old gate rolled back as `tie (0): no shrink`.
- **CG-FC2 (REJECT — adds a major / regresses roof)** — closure rises 0.615→1.0 but
  `afterDeptMajors` promotes a new ROOF/ROOM major (e.g. `{WALL:1, ROOF:2}` or a new `ROOM:1`) → form
  clause inert via (b′); whole-build score also regressed → `accept === false`, reason `/regressed/`.
- **CG-FC3 (REJECT — net guard, targeted dept total grew)** — closure rises, no new major, but the
  targeted WALL total grows via added minors (`WALL {1,0}→{1,2}`) → (c′) blocks → reject. The
  net-minor analog of CG15.
- **CG-FC4 (REJECT — no real form gain)** — tie, no major change, but `closureAfter` only 0.62 (gain
  < margin) → clause inert (guard 3) → falls through to `tie: no shrink` reject. Proves the clause is
  not "accept any closure wobble."
- **CG-FC5 (inert / backward-compat)** — with **no** closure opts, the CG3 tie inputs reject exactly
  as before (`/no shrink/`); and `closureBefore >= 0.9` (form already ready) → inert even with a
  closure rise. Proves the new params are inert by default.
- **CG-FC6 (regression-tolerant KEEP)** — closure rises 0.615→1.0, no new major, net flat, but the
  picture score *regressed* past margin (e.g. 16→8) → form credit still KEEPS (the clause is
  regression-tolerant, like the department override). Asserts the "even at a regression" ticket clause.
- Extend the existing import line to include `CLOSURE_GAIN_MARGIN`; assert its value (0.1).

### 3. `experiments/eval-alignment/picture-climb.mjs` (the wiring — not in `npm test`)

- After `const cand = TOOLS[pick.tool](occ);` and the no-op guard, compute once:
  `const closureAfter = closureNow(cand);`
- Pass into the existing gate call (line 623):
  `acceptsRound(prev, candScore, { margin, targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems, closureBefore: closure, closureAfter });`
- Fix the trajectory record (line 633): `closureAfter` → record `closureAfter` (the candidate's true
  closure the gate saw), replacing `closureNow(gate.accept ? cand : occ)`.
- No other runner change; `GUARD_ONLY` path (returns before the loop, line 521) is untouched.

## Files NOT touched

- `src/view/wall-generate.mjs` — `eaveRingClosure`/`closureOf` reused as-is (no second metric).
- `measurements/**` — the frozen instrument. Untouched (verified in Review).
- Any pinned record / `material-map` / recognition path.

## Ordering of changes (see plan.md)

1. `climb-gate.mjs` mechanism. 2. `climb-gate.test.mjs` falsification (red→green). 3. runner wiring +
`GUARD_ONLY` smoke. Each commits atomically; `npm test` green after step 2 onward.

## Interfaces / contracts

- `acceptsRound` stays a pure `(before, after, opts) → {accept, delta, reason}`. Closure is a **scalar
  passed in**; the module never sees occupancy or GL — the runner owns `closureNow`/`eaveRingClosure`.
- `formCredit` is pure, side-effect-free, returns `{gain, closureAfter} | null`. Inert without closure
  or major data (backward compatible).
- `CLOSURE_GAIN_MARGIN` single-sourced and exported, like `FORM_READY_CLOSURE`.
