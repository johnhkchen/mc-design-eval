# T-197-01 — Structure

The blueprint: file-level changes, public interfaces, boundaries, ordering. Not code.

## Files

### MODIFY `src/view/wall-generate.mjs` (PURE — the wall-form substrate)
Add two exports beside the existing close/registration primitives. No change to `constructWalls` or
`registerRect` (cottage/barn route untouched).

- `export function eaveRingClosure(occ, { floor, eaveY })` → `number`
  - Collect wall-band columns `{x,z}` for `floor ≤ y ≤ eaveY`; `closureOf(perimeterColumns(cols))`.
  - Returns `0` on empty/absent band (a build with no wall band is not "ready"). `floor` defaults to
    `occ.bounds.min[1]` when omitted; `eaveY` required.
  - The single closure definition shared by the hand's report and the ordering gate's input.

- `export function closeShell(occ, params)` → `{ occ, report }`
  - `params`: `{ program, floor?, eaveY (required), wallField?, coverageFloor? }`.
  - `report`: `{ closed:boolean, closureBefore:number, closureAfter:number, ringSize:number,
    coverage:number|null, axis:string|null, reason:string }`.
  - Internal helpers (module-private, may reuse/lift from `constructWalls`):
    - band-column histogram → `cols`, `localFill(c)`, `globalFill` (LOCAL per-column material).
    - `reg = registerRect(program.masses, cols)`; **accept iff `reg && reg.coverage ≥ coverageFloor`**
      (default 0.5; the FLOOR, ambiguity ignored — documented why: square axis tie is harmless).
    - bbox of `reg.ring`; REPLACE band: delete band cells on a ring column OR outside the ring bbox; keep
      interior band cells; keep all `y<floor || y>eaveY`; solidify ring floor→eave in `localFill`.
    - rebuild via `occupancyFromCells` preserving `form`/`state` on kept cells (mirror `constructWalls` step 5).
  - **No-close path:** `reg` null or coverage < floor → return `{ occ /* unchanged */, report:{closed:false,
    closureBefore, closureAfter:closureBefore, ringSize:0, coverage:reg?.coverage??null, axis:null,
    reason:"footprint registration below trust floor (cov X < 0.5) — shell not closed (geometry wall)"} }`.
  - Throw on missing `eaveY` (match `constructWalls`).

### MODIFY `src/view/wall-generate.test.mjs` (PURE unit tests)
New tests (synthetic occupancies only, the existing `ringOcc`/`setOf` helpers + a dropped-run colonnade):
- `WG-CS1` `eaveRingClosure`: watertight `ringOcc` → 1; a `ringOcc` with `drop` runs → < 1; empty band → 0.
- `WG-CS2` `closeShell` closes a sparse colonnade: a `ringOcc` with several dropped perimeter columns + a
  matching `program.masses[0].rect` → `report.closed=true`, `closureAfter` ≥ `closureBefore`, `closureAfter`
  near 1, roof cells (y>eave) preserved count-for-count.
- `WG-CS3` `closeShell` preserves a clean shell (no regression): already-watertight `ringOcc` + matching
  program → `closed=true`, `closureAfter` == 1 (idempotent-ish; never drops below before).
- `WG-CS4` `closeShell` honest no-close: program whose rect can't register / coverage below floor (rect wildly
  mismatched to the cols) → `report.closed=false`, occ returned unchanged (size equal), reason names the wall.
- `WG-CS5` strays outside the dense rect bbox are dropped (a colonnade with a lone far-flung post → not in the
  closed shell; closure not broken by it).

### MODIFY `src/workshop/climb-gate.mjs` (PURE — the climb's decisions)
- Extend `TOOL_DEPARTMENTS` with `close_shell: ["WALL"]` (the form lever; labelled by `classifyInventory`).
- `export const FORM_READY_CLOSURE = 0.9;` — the stage threshold (calibrated: seed 0.615 ↔ closed 1.0).
- `export const TOOL_STAGE = Object.freeze({ close_shell:"form", construct_walls:"form",
  apply_gable_roof:"form", recolor_roof:"form", carve_arch:"detail", relief_walls:"detail",
  band_eave:"detail", articulate_walls:"detail", add_timber_framing:"detail", frame_arch:"detail" });`
- `export function formReadyGate({ tool, closure, threshold = FORM_READY_CLOSURE })` → `{allow, stage, reason}`
  - `stage = TOOL_STAGE[tool] ?? null`.
  - `stage !== "detail"` (form / unknown / done) → `{allow:true, stage, reason:"<stage|non-detail> — always eligible"}`.
  - detail & `closure ≥ threshold` → `{allow:true, stage:"detail", reason:"form ready (closure X ≥ 0.9)"}`.
  - detail & `closure < threshold` → `{allow:false, stage:"detail", reason:"form not ready (closure X < 0.9) — close the shell before detail"}`.
  - `closure` coerced via the existing `num()` (NaN→0 → blocks detail safely).

### MODIFY `src/workshop/climb-gate.test.mjs` (PURE)
- `CG-FR1` detail blocked on an open form: `formReadyGate({tool:"carve_arch", closure:0.05})` → `allow:false`.
- `CG-FR2` detail allowed on a closed form: `formReadyGate({tool:"carve_arch", closure:0.95})` → `allow:true`.
- `CG-FR3` form tool always eligible: `formReadyGate({tool:"close_shell", closure:0.05})` → `allow:true`;
  same for `construct_walls`.
- `CG-FR4` boundary: closure exactly at `FORM_READY_CLOSURE` → allowed (≥). closure 0.615 (real seed) →
  blocked for `relief_walls`/`band_eave`.
- `CG-FR5` `done`/unknown tool → `allow:true` (gate never blocks the honest stop).
- `CG-FR6` `close_shell` is in `TOOL_DEPARTMENTS` (WALL) and `TOOL_STAGE` (form).

### MODIFY `experiments/eval-alignment/picture-climb.mjs` (the metered runner — NOT in npm test)
- Import `closeShell, eaveRingClosure` from `wall-generate.mjs`; `formReadyGate, TOOL_STAGE` from `climb-gate.mjs`.
- Add hand `function close_shell(occ)`: load program+pack (like `construct_walls`), `wallField` from
  `roleBlock`, call `closeShell(occ, {program, floor, eaveY:CFG.eaveY, wallField})`, `console.error` the
  closure rise (or the honest no-close), return `out.occ`.
- Register `close_shell` in `TOOLS`; add a `MENU` line; add the token to the agent-pick JSON enum (both the
  prose and the `{"tool":"<...>"}` enum string).
- In the loop, BEFORE `const cand = TOOLS[pick.tool](occ)`: compute `const closure = eaveRingClosure(occ,
  {floor: occ.bounds.min[1], eaveY: CFG.eaveY})` and `const eligible = formReadyGate({tool:pick.tool,
  closure})`. If `!eligible.allow`: record a blocked round (history + trajectory entry `applied:true,
  accepted:false, gate:{accept:false, reason:eligible.reason}, blocked:true`), advance `noAcceptStreak`, log,
  re-pick, run `stoppingDecision`, `continue` — NO apply, NO spend. (Same shape as the existing no-op guard.)
- Surface readiness in `agentPick`: pass `closure` + `eligible-detail?` into the prompt so the model picks
  `close_shell` first on an open form ("FORM READINESS: closure X/1.0 — detail tools are LOCKED until ≥0.9").
- Add `closure` to each trajectory round + the final summary (the before/after evidence on the real climb).

### CREATE `docs/active/work/T-197-01/closeshell-evidence.mjs` (zero-spend proof, not in npm test)
Pure node script (absolute-path imports, like T-196-01's `framing-evidence.mjs`): load the real gatehouse seed
+ program; print `eaveRingClosure` before; run `closeShell`; print closure after, ringSize, coverage, roof
preserved (y>eave count equal); then exercise `formReadyGate` on the before (0.615 → carve_arch blocked) and
after (1.0 → carve_arch allowed; close_shell allowed on both). The AC's "report the rise" + "gate fires
correctly" evidence, reproducible without the metered climb.

## Ordering of changes (each commit green)
1. `wall-generate.mjs` (`eaveRingClosure`, `closeShell`) + its tests. **Commit.**
2. `climb-gate.mjs` (`TOOL_STAGE`, `FORM_READY_CLOSURE`, `formReadyGate`, `close_shell` dept) + tests. **Commit.**
3. `picture-climb.mjs` wiring + `closeshell-evidence.mjs`; run evidence (zero spend) + `GUARD_ONLY=1` smoke. **Commit.**

## Boundaries (unchanged)
Geometry/measurement → `wall-generate.mjs`. Climb decisions (pure, scalar-in) → `climb-gate.mjs`. Metered
orchestration → `picture-climb.mjs`. Frozen instrument (`measurements/`) → untouched.
