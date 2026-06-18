# T-200-01 — Structure: file-level changes

## Files created

### 1. `src/workshop/agent-reply.mjs` (new — the shared parser)

A single pure export, lifted **verbatim** from `picture-climb.mjs:87–103`:

```js
// Extract the FIRST balanced-brace JSON object from a model reply (T-198-01, shared T-200-01). The naive
// slice(firstBrace,lastBrace) crashes when a model emits TWO objects (or an object + trailing prose) — the
// slice spans both → "Unexpected non-whitespace character after JSON", which crashed the climb mid-run and
// lost the trajectory. This scans for the first complete {…} (string/escape aware) and ignores the rest.
export function parseFirstJsonObject(t) {
  const s = String(t).indexOf("{");
  if (s < 0) throw new Error(`no JSON object in reply: ${String(t).slice(0, 120)}`);
  let depth = 0, inStr = false, esc = false;
  for (let i = s; i < t.length; i++) {
    const c = t[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; }
    else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(t.slice(s, i + 1));
  }
  throw new Error(`unbalanced JSON object in reply: ${t.slice(s, s + 120)}`);
}
```

No I/O, no `main`, no top-level side effect. PURE `(string) → object`.

### 2. `src/workshop/agent-reply.test.mjs` (new — the parser falsification)

`node:test` + `assert/strict`, named `AR n`:

- **AR1 (two-object reply — the crash case)** — `'{"tool":"close_shell"}{"tool":"done"}'` → returns
  `{tool:"close_shell"}` (the FIRST object); the naive parser threw here.
- **AR2 (object + trailing prose)** — `'{"tool":"done","reason":"x"}  Note: I picked done.'` → first
  object, prose ignored.
- **AR3 (nested braces)** — `'{"a":{"b":1},"c":2}'` → full object, depth tracked (a single `}` does
  not terminate early).
- **AR4 (brace inside a string)** — `'{"reason":"close the } gap"}'` → the `}` in the string does not
  terminate; returns the whole object. Guards the string/escape branch.
- **AR5 (escaped quote inside a string)** — `'{"reason":"a \\" b"}'` → escape handled, full object.
- **AR6 (leading prose then object)** — `'Here you go: {"tool":"done"}'` → finds the first `{`.
- **AR7 (no object)** — `'no json here'` → throws `/no JSON object/`.
- **AR8 (unbalanced)** — `'{"tool":"x"'` → throws `/unbalanced/`.

## Files modified

### 3. `src/workshop/climb-gate.mjs` (the routing mechanism)

**Add** an exported predicate after `TOOL_STAGE` (after line 83):
```js
// Tools whose KEEP decision is made on closureOf ALONE (T-200-01, S-200): the wall-shell FORM moves that
// move the perimeter-occupancy ring. Roof-form moves (apply_gable_roof/recolor_roof) don't change wall
// closure, so they are NOT closure-decided — they keep the picture gradient. Derived from the registries
// above (no new hardcoded list). The runner passes `closureDecidedMove(tool)` as `acceptsRound`'s
// `isFormMove`; the gate itself stays tool-string-free.
export const closureDecidedMove = (tool) =>
  TOOL_STAGE[tool] === "form" && (TOOL_DEPARTMENTS[tool] ?? []).includes("WALL");
```

**Modify** `acceptsRound` signature — add `isFormMove = false`:
```js
export function acceptsRound(before, after, {
  margin = CLIMB_DEFAULTS.margin, targetDepartments = null,
  beforeDeptMajors = null, afterDeptMajors = null, beforeDeptItems = null, afterDeptItems = null,
  closureBefore = null, closureAfter = null,
  closureMargin = CLOSURE_GAIN_MARGIN, formReadyThreshold = FORM_READY_CLOSURE,
  isFormMove = false,
} = {}) {
```

**Modify** `acceptsRound` body — hoist the `form` computation above the picture path and insert the
closure-only branch right after `delta`:
```js
const delta = num(after.score) - num(before.score);
const form = formCredit({ closureBefore, closureAfter, closureMargin, formReadyThreshold,
  targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });
// FORM-MOVE DECISION (T-200-01): a wall-shell form move with a form gap remaining is judged ENTIRELY on
// closureOf (deterministic) — never the noisy picture vote (0–76 same-seed swing). Same move → same
// decision across any vote draw. Detail / roof-form / form-ready moves fall through to the picture path.
if (isFormMove && Number.isFinite(closureBefore) && num(closureBefore) < formReadyThreshold) {
  if (form) return { accept: true, delta,
    reason: `closure +${form.gain.toFixed(3)} (${num(closureBefore).toFixed(3)}→${num(closureAfter).toFixed(3)}) form-credit` };
  const gain = num(closureAfter) - num(closureBefore);
  return { accept: false, delta, reason: gain < closureMargin
    ? `form: no closure gain (${num(closureBefore).toFixed(3)}→${num(closureAfter).toFixed(3)})`
    : `form: closure rose but blocked (new major / net-grow)` };
}
if (delta >= margin) return { accept: true, delta, reason: `improved +${Math.round(delta)}` };
```
The existing `dom` / `if (form)` / `regressed` / tie-zone lines below are **unchanged** (the hoisted
`form` const replaces the previously-inline `const form = formCredit(...)` at the old position).

**Update** the `acceptsRound` JSDoc — one paragraph: the `isFormMove` closure-only branch and the
`closureDecidedMove` derivation; note the roof blind spot (closure is wall-band only).

Public surface: `acceptsRound` gains one optional inert-by-default param (`isFormMove`); one new export
`closureDecidedMove`. No behavior change when `isFormMove` is omitted.

### 4. `src/workshop/climb-gate.test.mjs` (the form-stability falsification)

Extend the existing import to include `closureDecidedMove`. Append a `T-200-01` section, `CG-FS n`:

- **CG-FS1 (KEEP invariant)** — closure `0.615→1.0`, no new major, net flat, `targetDepartments
  ["WALL"]`, `isFormMove:true`. For **every** picture draw in `[[16,16],[0,76],[76,0],[0,0],[76,76]]`:
  `accept===true`, reason `/form-credit/`. Proves a form KEEP does not flip with vote noise.
- **CG-FS2 (ROLLBACK invariant)** — same but `closureAfter:0.615` (no gain). For the same draws:
  `accept===false`, reason `/no closure gain/`. Proves a noisy picture spike cannot accept a form move
  that didn't close.
- **CG-FS3 (closureDecidedMove predicate)** — `close_shell`/`construct_walls` → `true`;
  `apply_gable_roof`/`recolor_roof`/`relief_walls`/`carve_arch`/`done`/`undefined` → `false`.
- **CG-FS4 (roof-form keeps the picture gradient)** — `isFormMove:false` (a roof-form move),
  `delta:+10` → `accept===true reason /improved/`; `delta:-10` → `/regressed/`. The picture path still
  governs roof-form (closure is blind to it).
- **CG-FS5 (form-ready falls through to picture)** — `isFormMove:true` but `closureBefore:0.95`
  (≥ threshold) → the closure-only branch is skipped; with `delta:+10` → `/improved/`. A wall-form move
  on an already-closed shell is judged on the picture, not rejected for "no gain".
- **CG-FS6 (detail gradient byte-stable)** — take CG3's tie inputs; assert `acceptsRound(…, {…})` is
  `deepEqual` whether `isFormMove:false` is passed or omitted. Proves additivity / no scope leak.

### 5. `experiments/eval-alignment/picture-climb.mjs` (wiring — not in `npm test`)

- Extend the climb-gate import (line 50) to add `closureDecidedMove`.
- Replace the inline `parse` const (lines 87–103) with `import { parseFirstJsonObject } from
  "../../src/workshop/agent-reply.mjs"` and a local `const parse = parseFirstJsonObject;` (keeps the two
  `parse(...)` call sites at 480/484 untouched), OR re-point the two call sites directly. Either keeps
  behavior identical.
- At the gate call (line 628), add `isFormMove: closureDecidedMove(pick.tool)`.

### 6. `experiments/eval-alignment/autonomy-loop.mjs` (the parse port — not in `npm test`)

- Add `import { parseFirstJsonObject } from "../../src/workshop/agent-reply.mjs";`.
- Delete the naive `parse` (line 45); replace its two call sites (132, 160) with `parseFirstJsonObject`
  (or `const parse = parseFirstJsonObject;`).
- Harden `agentPick` (141–161): wrap the request in the `ask(extra)` → try / re-ask-once / fall-to-`done`
  structure, mirroring picture-climb.mjs:478–489 (no timeoutMs — out of scope).

## Files NOT touched

- `src/view/wall-generate.mjs` — `eaveRingClosure`/`closureOf` reused as-is.
- `measurements/**` — the frozen instrument. Untouched (verified in Review).
- Any pinned record / `material-map` / recognition path.

## Ordering (see plan.md)

1. `agent-reply.mjs` + `agent-reply.test.mjs` (parser, red→green). 2. `climb-gate.mjs` +
`climb-gate.test.mjs` (routing, red→green). 3. runner wiring (both runners) + `GUARD_ONLY` smoke +
`node -e` parse spot-check. Each commits atomically; `npm test` green after every commit.

## Interfaces / contracts

- `acceptsRound` stays pure `(before, after, opts) → {accept, delta, reason}`. `isFormMove` is a
  boolean flag; the gate never sees a tool string. Closure is a scalar passed in.
- `closureDecidedMove(tool) → boolean`, pure, derived from `TOOL_STAGE` + `TOOL_DEPARTMENTS`.
- `parseFirstJsonObject(string) → object`, pure; throws on no-object / unbalanced. Single source for
  both runners.
