# T-200-01 — Research: de-noise the form decision + port the parse hardening

Story **S-200** / Epic **E-49**. Two runner-side items, both grounded in the T-198 metered re-climb.
This maps what exists; it does not propose the fix.

## Item 1 — the form decision still rides a noisy scalar

### What T-199-01 already landed (the sibling, committed `0037151`)

`src/workshop/climb-gate.mjs` now has `formCredit(...)` (lines 207–223) — a *clause* inside
`acceptsRound` (lines 244–271). Its order today:

1. `delta = after.score − before.score >= margin` → **accept** `improved` (picture-driven).
2. `departmentDominant(...)` → **accept** (E-50 override).
3. `formCredit(...)` → **accept** `…form-credit` (T-199, closure rose toward form-ready, no new major).
4. `delta <= −margin` → **reject** `regressed` (picture-driven).
5. tie zone: coverage shrank → accept, else **reject** `no shrink`.

`formCredit` is *additive*: it can **rescue** a form move at a picture tie/regression. The runner
(`picture-climb.mjs:627–628`) computes `closureAfter = closureNow(cand)` and threads
`closureBefore/closureAfter` into the gate. So the ACCEPT side of a form move is already closure-aware.

### The gap T-200 must close

`formCredit` rescues at a tie, but a form move can still be **accepted by clause 1 on picture noise**
(a vote spike `delta ≥ margin`) even when closure did **not** move — and the picture scalar has a
documented **0–76 swing on the same seed** (S-200 context; T-198 trajectory: round 0 read 0 in one
run, 16 in another; `VOTES=3` median dampens, not removes). The decision for a wall-shell form move is
therefore **not invariant to the vote draw** — the very property S-200's falsifiable claim demands
("the close_shell keep no longer flips with vote noise").

The fix S-200 names: a wall-shell FORM move is decided **entirely on `closureOf`** (deterministic),
the picture vote removed from that decision; the **detail** stage keeps the picture gradient unchanged.

### The closure signal (already wired, reused — no second metric)

- `closureNow(o) = eaveRingClosure(o, { floor: o.bounds.min[1], eaveY: CFG.eaveY })`
  (`picture-climb.mjs:552`) — the SAME `eaveRingClosure`/`closureOf` (`src/view/wall-generate.mjs`)
  that `closeShell` reports. PURE. AC + memory [[form-revision-needs-3d-target]] forbid a parallel metric.
- `closureBefore = closureNow(occ)` (line 576); `closureAfter = closureNow(cand)` (line 627). Both
  already flow into `acceptsRound`. T-200 needs **no new closure plumbing** — only a routing flag.

### The roof blind spot (the falsifiable claim's "names it" obligation)

`closureOf` measures the **wall band** perimeter occupancy only. `TOOL_STAGE` (climb-gate.mjs:79–83)
marks four tools `form`: `close_shell`, `construct_walls` (WALL), and `apply_gable_roof`,
`recolor_roof` (ROOF). The ROOF-form moves **do not change wall closure** — `closureOf` is blind to
them. So "route every form move onto closure" is wrong: it would reject every roof move (closure flat →
no gain → reject). The ticket parenthetical is precise — "`construct_walls` **when it changes
closure**". The closure-decided set is exactly the **form moves that target WALL**
(`TOOL_STAGE==="form" && TOOL_DEPARTMENTS includes "WALL"` → `close_shell`, `construct_walls`).
Roof-form stays on the picture gradient. This blind spot is **recorded**, not papered over (AC #3).

### Inputs already in the gate / runner (nothing new to derive)

- `TOOL_STAGE`, `TOOL_DEPARTMENTS` — exported from climb-gate.mjs; the closure-decided predicate is
  *derivable* from them (no new hardcoded list).
- `closureBefore`, `closureAfter`, `beforeDeptMajors/afterDeptMajors`, `beforeDeptItems/afterDeptItems`,
  `targetDepartments` — all already passed at `picture-climb.mjs:628`.
- `FORM_READY_CLOSURE = 0.9`, `CLOSURE_GAIN_MARGIN = 0.1` — single-sourced exports.

## Item 2 — the `agentPick` parse hardening is not in `autonomy-loop.mjs`

### The hardened parser (picture-climb.mjs:91–103, T-198)

A string-aware **first-balanced-brace** scan: find the first `{`, walk tracking string/escape/depth,
return `JSON.parse` of the first complete `{…}`, ignore any trailing object or prose. Used ONLY in
`agentPick` (480, 484); the diagnose votes use `bamlParse` (a separate structured path).

### The hardened `agentPick` (picture-climb.mjs:478–489)

`ask(extra)` → try `parse`; on failure **re-ask once** with a stern "exactly one JSON object"
corrective; on a second failure **fall to a recorded `{tool:"done"}`** (the honest terminal) — never
throw. Mirrors the handle-don't-reject seam ([[same-prompt-seam-handle-dont-reject]]).

### The latent crash in `autonomy-loop.mjs`

- `parse` (line 45): `JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}")+1))` — the **naive** form.
  On a **two-object** reply the slice spans both → `Unexpected non-whitespace character after JSON` →
  throws. Used in `evalBuild` (132) and `agentPick` (160).
- `agentPick` (141–161): `return parse(text)` — **no** re-ask, **no** fallback. A malformed pick
  **crashes** the round (caught only by `main`'s per-subject `try` at line 199 → the whole subject is
  logged FAILED and dropped). The `done` terminal exists in the loop (`pick.tool === "done" ||
  !TOOLS[pick.tool]` breaks, line 178), so a fallback `done` degrades gracefully.

### Testability constraint (drives the structure)

- `npm test` → `test:unit` globs **`src/**/*.test.mjs`** ONLY. A test under `experiments/` would not
  run. The unit test the AC requires must live in `src/`.
- Both runners execute `main()` **on import** (autonomy-loop.mjs:210, picture-climb.mjs tail). A test
  cannot `import` either file without launching the volume runner (network calls). So the parser must
  be testable **without importing a runner** → it wants a **shared pure module in `src/`**.
- No existing shared parse helper (grep clean). Two inline copies (picture-climb + autonomy-loop) would
  **drift** — the exact failure the project's single-sourcing discipline avoids.

## Constraints / boundaries

- **PURE** `climb-gate.mjs`: no GL/LLM/I/O; scalar + flag in. The routing flag is a boolean the runner
  supplies; the gate never sees tool strings inside the decision.
- **Reuse** `eaveRingClosure`/`closureOf` — no second form metric.
- **Detail gradient byte-stable**: the change is additive (a new default-off flag); detail moves
  (flag off) take the existing path unchanged — asserted.
- **Frozen instrument untouched**: changes confined to `src/workshop/*` (+ a new shared parser module &
  its test) and the two runners; `measurements/**` not touched.
- `GUARD_ONLY=1 node …/picture-climb.mjs` must still resolve (wiring smoke).
- Backward compatible: no flag / no closure context → inert, exactly as `departmentDominant` /
  `formCredit` are inert without their context.

## Test conventions

`climb-gate.test.mjs` uses `node:test` + `assert/strict`, one `test()` per case, named `CGn` / `CG-FRn`
/ `CG-FCn`. New form-stability cases append as `CG-FS n`. The shared parser gets its own
`src/workshop/agent-reply.test.mjs`. The runners are excluded from `npm test`; their wiring is proven
by the `GUARD_ONLY` smoke + a `node -e` parse spot-check.
