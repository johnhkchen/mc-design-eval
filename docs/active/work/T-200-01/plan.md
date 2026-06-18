# T-200-01 — Plan: ordered, atomically-committable steps

Three commits. `npm test` green after each. Frozen instrument (`measurements/**`) untouched throughout.

## Step 1 — shared parser + its falsification (commit 1)

**Edit/create:**
1. `src/workshop/agent-reply.mjs` — `parseFirstJsonObject`, lifted verbatim from picture-climb.mjs:87–103.
2. `src/workshop/agent-reply.test.mjs` — AR1–AR8 (two-object, trailing-prose, nested-brace,
   brace-in-string, escaped-quote, leading-prose, no-object-throws, unbalanced-throws).

**Verify:** `node --test "src/workshop/agent-reply.test.mjs"` green (8/8). Spot-check the crash case the
naive parser failed: `node -e "import('./src/workshop/agent-reply.mjs').then(m=>console.log(m.parseFirstJsonObject('{\"a\":1}{\"b\":2}')))"`
→ `{ a: 1 }`.

**Commit:** `feat(T-200-01): shared first-balanced-brace JSON parser + AR1–8 tests`

Rationale: the parser is a leaf dependency of both runners; landing + testing it first lets steps 2–3
import a proven module. Independent of the gate change.

## Step 2 — `isFormMove` routing + form-stability falsification (commit 2)

**Edit:**
1. `src/workshop/climb-gate.mjs`:
   - export `closureDecidedMove(tool)` after `TOOL_STAGE`.
   - `acceptsRound`: add `isFormMove = false`; hoist `const form = formCredit(...)`; insert the
     closure-only branch (guarded by `isFormMove && finite(closureBefore) &&
     closureBefore < formReadyThreshold`) before the `delta >= margin` accept; update JSDoc.
2. `src/workshop/climb-gate.test.mjs`:
   - import `closureDecidedMove`.
   - append CG-FS1 (KEEP invariant across 5 vote draws), CG-FS2 (ROLLBACK invariant across 5 draws),
     CG-FS3 (predicate truth table), CG-FS4 (roof-form keeps picture gradient), CG-FS5 (form-ready
     falls through), CG-FS6 (detail byte-stable deepEqual).

**Verify:**
- `node --test "src/workshop/climb-gate.test.mjs"` — all CG / CG-FR / CG-FC / CG-FS green (existing
  count + 6).
- **Re-run stability** is proven *inside* CG-FS1/2: the loop over `[[16,16],[0,76],[76,0],[0,0],[76,76]]`
  asserts a single decision for every picture draw — the abstracted vote-noise fixture the AC requires.
- **Detail-gradient-unchanged** is proven by CG-FS6 (deepEqual with/without the flag) **and** by every
  pre-existing CG/CG-FC case passing untouched (they omit `isFormMove`).

**Commit:** `feat(T-200-01): decide wall-shell form moves on closureOf (vote-noise-invariant)`

Rationale: mechanism + falsification in one atomic commit (the climb-gate convention; T-191/T-199 set
the precedent). The runner wiring is separate (step 3) because it is not in `npm test`.

## Step 3 — wire both runners (commit 3)

**Edit:**
1. `experiments/eval-alignment/picture-climb.mjs`:
   - import `closureDecidedMove` (extend line 50); import `parseFirstJsonObject`, drop the inline
     `parse` (re-point both to the shared module).
   - gate call (line 628): add `isFormMove: closureDecidedMove(pick.tool)`.
2. `experiments/eval-alignment/autonomy-loop.mjs`:
   - import `parseFirstJsonObject`; delete the naive `parse` (line 45); re-point call sites (132, 160).
   - harden `agentPick`: `ask(extra)` → try / re-ask-once / fall-to-`done`.

**Verify (no metered spend):**
- `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs --subject gatehouse 2>&1 | tail -5`
  resolves through the render seam without throwing (proves both imports + the `isFormMove` wiring load).
- `node -e "import('./experiments/eval-alignment/autonomy-loop.mjs')"` is NOT safe (runs `main()`), so
  instead assert the import graph resolves with a syntax/parse check:
  `node --check experiments/eval-alignment/autonomy-loop.mjs` and
  `node --check experiments/eval-alignment/picture-climb.mjs`.
- `node -e "import('./src/workshop/agent-reply.mjs').then(m=>{const r=m.parseFirstJsonObject('{\"tool\":\"close_shell\"}{\"tool\":\"done\"}');console.log(r.tool==='close_shell'?'OK':'FAIL')})"`.
- Full `npm test` green.

**Commit:** `feat(T-200-01): wire isFormMove + shared parser into both climb runners`

Rationale: wiring is grouped because it is the same conceptual change across two runners and is proven
by smoke, not unit tests. Kept out of step 2 so the unit-tested mechanism commits cleanly on its own.

## Testing strategy summary

| Concern | Test | Where |
|---|---|---|
| Parser survives two-object / prose / nested / strings | AR1–AR8 | `agent-reply.test.mjs` (npm test) |
| Form KEEP invariant to vote noise | CG-FS1 (5 draws) | `climb-gate.test.mjs` (npm test) |
| Form ROLLBACK invariant to vote noise | CG-FS2 (5 draws) | `climb-gate.test.mjs` (npm test) |
| Only wall-shell form moves are closure-decided | CG-FS3 | `climb-gate.test.mjs` (npm test) |
| Roof-form keeps the picture gradient | CG-FS4 | `climb-gate.test.mjs` (npm test) |
| Form-ready falls through to picture | CG-FS5 | `climb-gate.test.mjs` (npm test) |
| Detail gradient byte-stable (no scope leak) | CG-FS6 + all prior CG | `climb-gate.test.mjs` (npm test) |
| Runners load with the new wiring | `node --check` + `GUARD_ONLY` smoke | manual (runners excluded) |

## Risks & mitigations

- **Re-pointing picture-climb's parser** (a just-fixed metered runner): mitigated by lifting the parser
  **verbatim** + `node --check` + `GUARD_ONLY` smoke + the `node -e` crash-case spot-check.
- **Roof blind spot** (closureOf can't see roof form): handled by `closureDecidedMove` excluding ROOF
  tools; **recorded** in review.md as the named limitation, richer signal proposed not built.
- **Reject-reason drift**: the closure-only rollback distinguishes "no gain" vs "blocked", so a future
  reader isn't misled about *why* a form move was rolled back.
