# T-190-01 — STRUCTURE: the file-level blueprint

Three code touches (all pure-or-additive), one run, three reports. No file is created in `src/` — the work
extends two existing modules and the metered runner, then produces evidence + write-ups in the work dir.

## 1. `src/workshop/climb-gate.mjs` — MODIFY (pure additions)

### 1a. `deptMajorCounts(items)` — NEW exported pure helper
```
export function deptMajorCounts(items = []) → { [department]: majorCount }
```
- Reduce over `items`, counting `severity === "major"` per `item.department`. Skip falsy departments.
- Pure, no I/O. The per-department signal `critiqueEvidence` does not expose, derived from the same `items`
  the runner already carries onto every scored build and into the trajectory.

### 1b. `acceptsRound(before, after, opts)` — EXTEND (backward-compatible)
- New optional fields on the 3rd arg: `{ margin, targetDepartments, beforeDeptMajors, afterDeptMajors }`.
- Behaviour unchanged for the clear-improve (Δ ≥ margin) and clear-regress (Δ ≤ −margin) branches.
- **Tie zone only**, after the existing whole-build `breadthShrank || majorsShrank` check and *before* the
  final reject: if `targetDepartments` is provided and **any** `d ∈ targetDepartments` has
  `beforeDeptMajors[d] > (afterDeptMajors[d] ?? 0)`, return `{accept:true, delta, reason: "tie (Δ): <D>
  cleared a major"}`.
- With no `targetDepartments`/`*DeptMajors` passed, the new branch is inert → CG1–CG3 unchanged.
- Rationale comment: ties to T-189 §3 (attention-shift, not regression) and the "department-aware accept
  signal" S-190 was handed.

### 1c. `buildDigest(cells)` — NEW exported pure helper
```
export function buildDigest(cells = []) → string   // stable over sorted `${pos.join(',')}|${block}`
```
- Sort the `pos|block` strings, join with `\n`, return (a length-prefixed concat is enough; no crypto
  needed — equality is all the guard uses). Pure.
- Includes the **block id**, so `recolor_roof` (same positions, different field block) hashes *differently*
  from `apply_gable_roof` — the guard suppresses true no-ops, never the material change.

No changes to `stoppingDecision`, `classifyInventory`, `TOOL_DEPARTMENTS`, `CLIMB_DEFAULTS`, or the schema
constant.

## 2. `src/workshop/climb-gate.test.mjs` — MODIFY (new cases, keep CG1–CG9)

- **CG10 `deptMajorCounts`** — counts majors per department; ignores minors; empty/missing → `{}`.
- **CG11 `acceptsRound` department-aware tie-break** — the T-189 scenario as a fixture: whole-build `nMajor`
  flat (1→1) and breadth flat, score within margin, but `targetDepartments:["ROOF"]` with
  `beforeDeptMajors:{ROOF:1,WALL:0}` → `afterDeptMajors:{ROOF:0,WALL:1}` ⇒ **accept**, reason matches
  `/ROOF cleared a major/`. And the negative: same flat whole-build with a target department that did **not**
  clear (`ROOF:1→1`) ⇒ reject (`no shrink`). And backward-compat: no context arg ⇒ identical to CG3.
- **CG12 `buildDigest`** — order-independent (same cells permuted → equal digest); position-equal but
  block-different cells → **different** digest (the `recolor_roof` vs `apply_gable_roof` case); empty → stable.
- Verify `npm test` stays green (2319 + new).

## 3. `experiments/eval-alignment/picture-climb.mjs` — MODIFY (runner wiring; not in `npm test`)

### 3a. imports
- Add `deptMajorCounts, buildDigest` to the existing `climb-gate.mjs` import.

### 3b. output redirect
- Replace the hardcoded `outPath = …/T-188-01/trajectory.json` with
  `process.env.CLIMB_OUT ?? <T-188 default>`. T-190 runs with `CLIMB_OUT=docs/active/work/T-190-01/
  trajectory.json`. T-188's committed artifact is untouched.

### 3c. department-aware gate call + no-op guard (in the main loop, round body)
- Before scoring the candidate: `const candDigest = buildDigest(occToCells(cand))`; if it equals the kept
  build's digest, record a no-op round (`applied:true, accepted:false, reason:"no-op (identical build)"`)
  and **skip the diagnose spend** — don't advance `occ`. (Keeps the stall counter honest; an idempotent
  re-pick converges instead of phantom-accepting.)
- Otherwise score as today, then call:
  ```
  acceptsRound(prev, candScore, {
    margin,
    targetDepartments: TOOL_DEPARTMENTS[pick.tool],
    beforeDeptMajors: deptMajorCounts(prev.items),
    afterDeptMajors:  deptMajorCounts(candScore.items),
  })
  ```
- `TOOL_DEPARTMENTS` is already imported indirectly? No — import it explicitly from `climb-gate.mjs`.
- Track the kept build's digest (`prevDigest`) alongside `prev` so the guard compares against the *accepted*
  build, not the last candidate.

### 3d. trajectory metadata
- Record `targetDepartments` + `deptMajorsBefore/After` on each applied round's entry (so the report can show
  *why* the gate kept a flat-scalar round). Additive to the existing `trajectory[]` shape; `classifyInventory`
  ignores unknown fields.

No change to the hands, the MENU, the agent prompt, `scoreBuild`, or `diagnose`.

## 4. Run + evidence capture (Implement)

- `CLIMB_OUT=docs/active/work/T-190-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`
  (metered). Per-round beside sheets land under `builds/gatehouse/picture-climb/round-*/` (gitignored).
- Copy the **first / best / last** beside-concept sheets into `docs/active/work/T-190-01/` as durable
  evidence: `round-first-beside.png`, `round-best-beside.png`, `round-last-beside.png` (mirrors T-188's
  practice of preserving the glance outside gitignored `builds/`).
- `run.log` — the runner's stderr trend line + per-round gate decisions, captured to the work dir.

## 5. Reports

- **`ceiling.md`** — the named ceiling: per-round trend, what each accepted hand moved, where it plateaus,
  what no hand fixes (scopes E-49), the **human-glance check** on first/best/last (agree or disagree with the
  critique's "improvement", at full strength), and the **autonomy accounting** (what ran unattended vs what
  the human authored / nudged).
- **`progress.md`** — implementation log + verified facts + deviations.
- **`review.md`** — the handoff: what changed, test coverage + gaps, open concerns, AC check.

## Ordering / commits

1. **Commit 1** — `climb-gate.mjs` (3 pure additions) + `climb-gate.test.mjs` (CG10–CG12). `npm test` green.
2. **Commit 2** — `picture-climb.mjs` wiring (imports, CLIMB_OUT, department-aware call, no-op guard,
   trajectory metadata). `GUARD_ONLY=1` dry-proof green (no spend).
3. **Commit 3** — the metered run: `trajectory.json` + first/best/last beside renders + `run.log` +
   `ceiling.md`.
4. **Commit 4** — `progress.md` + `review.md` (docs).

## Invariants preserved

- **Frozen instrument untouched**: `measurements/`, `compile.mjs`, `bakeoff-score.mjs`, program/pack/seed
  JSON — no edits. The score term is not re-tuned (Design §D).
- **Pure core stays pure**: every `climb-gate.mjs` addition is I/O-free and unit-tested; the runner stays the
  only GL/LLM surface.
- **T-188 evidence preserved**: its `trajectory.json` + `round-*-beside.png` are not overwritten (CLIMB_OUT
  redirect).
