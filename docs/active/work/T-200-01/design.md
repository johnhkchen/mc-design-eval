# T-200-01 — Design: route wall-shell form moves onto closureOf; share the parser

Two decisions, one per item. Both additive, default-inert, frozen-instrument-free.

## Decision 1 — `isFormMove` routing branch in `acceptsRound`

### Options considered

**A. Runner-side: don't pass closure for picture-accepted form moves.** Reject — leaves the
noise-exposure in clause 1 (a picture spike still accepts a form move that didn't close), and pushes
decision logic into the runner (which the gate-is-pure architecture forbids). Doesn't make the decision
*invariant*.

**B. Gate decides closure-affecting by `closureAfter !== closureBefore`.** Reject — conflates "roof
move (closure can't see it)" with "wall move that FAILED to close". A `close_shell` that no-op'd would
fall through to the picture gradient and could be **accepted on noise** — the exact bug. The decision
must not depend on whether closure *happened* to change; it must depend on whether this is a
*closure-decided tool*.

**C (chosen). A `isFormMove` flag + a derived `closureDecidedMove(tool)` predicate.** The runner passes
`isFormMove = closureDecidedMove(pick.tool)`. When `true` **and a form gap remains**
(`closureBefore < FORM_READY_CLOSURE`), the decision is **closure-only**: `formCredit` fires → KEEP;
else → ROLL BACK. The picture delta is recorded (`delta`) but **never consulted**. When `false` (detail,
roof-form, unknown) or the shell is already form-ready, the existing flow runs **byte-unchanged**.

### Why C

- **Invariant to vote noise** — the positive branch reads only `closureBefore/closureAfter` (+ the
  major/item maps, themselves deterministic per-build item counts). `before.score`/`after.score` enter
  only as the recorded `delta`. So the *same* wall-shell form move yields the *same* keep/rollback across
  any picture draw in [0, 76]. This is the S-200 falsifiable claim, made testable (CG-FS1/2).
- **Roof blind spot handled, not faked** — `closureDecidedMove = TOOL_STAGE[tool]==="form" &&
  TOOL_DEPARTMENTS[tool].includes("WALL")`. `close_shell`, `construct_walls` → `true`;
  `apply_gable_roof`, `recolor_roof` → `false` (closure is blind to the roof → they keep the picture
  gradient). Derived from existing registries — no new hardcoded list. The blind spot is **recorded**
  in AC #3, with the richer signal (a roof-profile/ridge metric) *named* but **not built** (no
  demonstrated roof blind-spot failure in this stall — the gatehouse gap was the wall shell).
- **Form-ready guard** — the closure-only branch fires only while `closureBefore < FORM_READY_CLOSURE`.
  Once the shell is closed, the form job is done; a (rare) wall-form move on a closed shell falls through
  to the picture gradient, so a genuine skin improvement on a closed shell is **not** spuriously rejected
  for "no closure gain". This mirrors `formCredit`'s own guard (2) and keeps the closure-only regime
  exactly where it belongs — while a form gap remains.
- **Pure gate** — `isFormMove` is a boolean; the gate never sees a tool string. `closureDecidedMove`
  lives in climb-gate.mjs (next to the registries it derives from) and is *exported* for the runner and
  the test, but it is **not called inside** `acceptsRound`.
- **Additive / byte-stable detail path** — `isFormMove` defaults `false`. All existing CG / CG-FR /
  CG-FC cases (which omit it) take the unchanged path. `formCredit` stays in the non-form flow so the
  T-199 CG-FC tests (which omit `isFormMove`) keep passing — the branch is a superset entry, not a
  rewrite.

### Reject reason fidelity

`formCredit` returns `null` for three causes (gain `< margin`, a new major anywhere, a targeted-dept
net grow). The rollback reason distinguishes the common case honestly:
`gain < closureMargin → "form: no closure gain (b→a)"`, else
`"form: closure rose but blocked (new major / net-grow)"`. Debuggable, not a generic "rejected".

### Ordering inside `acceptsRound` (final)

```
delta = after.score − before.score
form  = formCredit({...})                    // computed once (pure); reused below
if (isFormMove && closureBefore < formReadyThreshold):
    return form ? KEEP "…form-credit" : ROLLBACK "form: no closure gain / blocked"
// ---- unchanged picture path below (detail / roof-form / form-ready) ----
if delta >= margin            → KEEP "improved"
if departmentDominant(...)    → KEEP "…department-dominant override"
if form                       → KEEP "…form-credit"     (T-199 clause, retained)
if delta <= −margin           → ROLLBACK "regressed"
tie zone …
```

Hoisting `form` above the branch is safe — `formCredit` is pure and side-effect-free; the non-form
returns are identical to today (verified by the unchanged CG-FC suite).

## Decision 2 — shared pure parser module

### Options considered

**A. Copy the balanced-brace `parse` + re-ask/fallback inline into `autonomy-loop.mjs`; test there.**
Reject — `npm test` globs only `src/`, and importing `autonomy-loop.mjs` runs `main()`. The test
either wouldn't run or would launch the volume runner. Also leaves two drifting copies of the parser.

**B. Add a `import.meta.main` guard to `autonomy-loop.mjs`, export `parse`, test from `src/`.** Reject
— a `src/` test importing an `experiments/` runner is an inverted dependency, and the guard is a
behavior change to a runner for test convenience. More risk than value.

**C (chosen). Extract the parser to `src/workshop/agent-reply.mjs` (pure, exported
`parseFirstJsonObject`); both runners import it; test the module in
`src/workshop/agent-reply.test.mjs`.** The re-ask/fallback stays *inline* in each `agentPick` (it is
LLM-coupled — not unit-testable without a mock; documented as smoke-only).

### Why C

- **Real coverage of production code** — the parser the AC wants tested is the *same object* both
  runners run. A copy-and-test-a-copy (option A) would test a twin, not the code, and leave
  picture-climb's copy untested. One source, one test.
- **No drift** — single balanced-brace parser; the picture-climb inline copy (origin of the idiom)
  re-points to it, gaining the test coverage it lacked.
- **Testable without a runner** — `agent-reply.mjs` has no `main()`, no I/O; pure `(string) → object`.
- **Lowest semantic risk** — the extraction is **verbatim** (same scan, same throws). Verified by the
  `GUARD_ONLY` smoke + a `node -e` two-object spot-check on picture-climb after re-pointing.

### Blast radius (accepted)

`picture-climb.mjs` is touched by **both** items (the `isFormMove` wiring + the parser re-point). T-199
already committed (`0037151`), so this is sequential, not a parallel same-file race
([[shared-file-commit-sweep]] — re-Read before each edit, verify green before commit). `autonomy-loop.mjs`
gets the import + the hardened `agentPick`. The parser is *verbatim*; the runner behavior is unchanged
except that a malformed `agentPick` reply now degrades to `done` instead of crashing the subject.

### What is explicitly NOT done (anti-over-build, per ticket Notes)

- No richer form signal beyond `closureOf` — the roof blind spot is recorded, not built (no failure
  demonstrated it in this climb).
- No re-ask hardening of `autonomy-loop`'s `evalBuild` beyond the balanced-brace parser swap (the AC
  scopes the re-ask/fallback to `agentPick`; the parser swap alone already removes the two-object crash
  from `evalBuild`).
- No timeout guard on `autonomy-loop`'s LLM calls (that is T-198's separate concern).
