# T-194-01 — PLAN: ordered, independently-verifiable steps

Six steps, each committable atomically. Steps 1–2 are the pure, unit-tested core (the gate is what makes the
charter narrowing safe — build and prove it FIRST). Step 3 wires it. Steps 4–5 run it and judge on the glance.
Step 6 records honestly, including the refute path if the gate can't keep carves clean.

Testing strategy up front: the **gate and carve target are pure → unit tests in `npm test`** (the safety
property — "is it an opening or a hole?" — must be proven deterministically, not by a render). The **hand and the
climb are GL+LLM, non-deterministic → NOT in `npm test`**; their evidence is the beside render + the gate/closure
report (the `arch-frame`/`picture-climb` precedent). The frozen instrument is never touched.

## Step 1 — The carve target + coherence gate, TDD (the safety core)
**Files:** new `src/view/aperture-carve.mjs`, new `src/view/aperture-carve.test.mjs`.
- Write `carveTargetCells`, `carvedVoidCoherence`, `apertureCoherenceGate` per structure.md, reusing
  `carveOccupancy`, `closureCheck`, `componentLabels`, `recessClosureGuard`.
- Write tests AC1–AC7 (structure.md) first / alongside: widen geometry, gate PASS (clean), gate FAIL (ragged →
  multi-component), gate FAIL (scope leak on a non-aperture wall), closure-except-aperture (door columns expected
  to drop, non-aperture column drop flagged), byte-stable, too-narrow clamp-up.
- **Verify:** `npm test` green (2335 + the new cases). The gate distinguishes opening from hole deterministically.
- **Commit:** `feat(T-194-01): aperture-carve target + coherence gate (closure-except-aperture, single+continuous void)`.

## Step 2 — Confirm the closure-except-aperture reuse is faithful
**Files:** assertions inside `aperture-carve.test.mjs` (no new file).
- Add the explicit AC5 cross-check: build a before occ (watertight wall + 1-slot), an after occ (clean wide
  carve), and a *bad* after (clean wide carve PLUS a punched non-aperture hole). Assert the gate passes the first
  and fails the second on the **closure** conjunct specifically (not coherence/scope) — proving the three
  conjuncts are independently load-bearing and the door columns are correctly exempted.
- **Verify:** `npm test` green; the closure conjunct fires on the right input.
- **Commit:** folds into Step 1 if done together; otherwise `test(T-194-01): closure-except-aperture conjunct isolation`.

## Step 3 — Wire the `carve_arch` hand + department map (no spend)
**Files:** `experiments/eval-alignment/picture-climb.mjs`, `src/workshop/climb-gate.mjs`.
- `climb-gate.mjs`: `TOOL_DEPARTMENTS += carve_arch:["OPENING"]`. Run `npm test` — CG-tests green (additive).
- `picture-climb.mjs`: add imports; write `carve_arch(occ)` (structure.md Decision-4 body, with the
  revert-to-`frame_arch` fallback on `!gate.ok`); register in `TOOLS`, `MENU`, the `agentPick` enum.
- **Verify (zero spend):** `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` exercises the wiring
  + render seam without the model; confirm `carve_arch` is selectable and runs through the gate without throwing.
  Print the per-opening + gate report to the log.
- **Commit:** `feat(T-194-01): carve_arch hand + carve_arch→OPENING department (guarded, self-reverts on gate fail)`.

## Step 4 — Build the wide arched gate on the gatehouse (scoped, evidence)
**Files:** work-dir artifacts only.
- Run `carve_arch` on the gatehouse seed (a scoped one-hand render, or a short metered climb seeded to reach the
  OPENING). Capture: the gate report (`scope/coherent/closure`), the `closureOf` before/after on non-aperture
  columns, and a **beside-concept render** of the result.
- Copy the beside render → `docs/active/work/T-194-01/arch-beside.png`; write the gate/closure numbers to
  `progress.md`.
- **Verify (the AC):** the wide arched dressed gate **reads on the glance** beside concept; `closureOf` measured
  everywhere-but-aperture is **not regressed**; `gate.ok === true`.
- **Commit:** `docs(T-194-01): wide arched gate built + beside render + closure-held report`.

## Step 5 — Judge on the glance; if the gate can't keep it clean, take the refute path
**Files:** work-dir artifacts.
- **If the carve is clean and reads** (Step-4 verify passes): record the win (the charter narrowing is
  vindicated — the loop can carve a declared opening into a coherent dressed aperture).
- **If the carve goes ragged / reopens holes / breaks non-aperture closure** (gate fails, or passes but the
  glance still says "hole not gate"): **execute the refute** — drop `carve_arch` from `TOOLS` (openings revert to
  recess-only via the still-present `frame_arch`), and name wide arches as the bounded limit. The gate code +
  tests STAY (they are the recorded discriminator that bounds the rule). This is a real result, not a failure to
  hide.
- **Verify:** the recorded verdict matches what the renders show; no leaky carve ships in `TOOLS`.
- **Commit:** `docs(T-194-01): glance verdict — <vindicated | refuted→recess-only, wide-arch bounded limit>`.

## Step 6 — Review
**Files:** `docs/active/work/T-194-01/review.md`.
- Summarize files changed, test coverage (AC1–AC7 + CG green count), the glance verdict, the closure evidence,
  and open concerns (e.g. through-passage vault deferred; scale/material handed to S-195/S-196).
- **Verify:** `npm test` green; `git status` shows no `measurements/`/frozen-instrument change.

## Verification criteria (the ticket's ACs, mapped)
- **No-air-op narrowed to an aperture-coherence gate** (carve only declared openings; closure-except-aperture;
  non-aperture surfaces still no-air-op, unit-tested) → Steps 1–2 (AC1–AC7, CG green).
- **Carve+dress hand built** (width/shape + head/jambs/sill + S-179 voussoir arch) → Step 3 (`carve_arch` →
  `frameArchPlacements`/`archConstruct`).
- **Wide arched gate reads; `closureOf` everywhere-but-aperture not regressed** → Step 4.
- **Recorded honestly; revert to recess-only if carves can't stay clean; wide arch named as bounded limit if so**
  → Step 5.
- **`npm test` green; frozen instrument untouched** → Steps 1–3, 6.

## Risk register (carried from Design, watched during Implement)
- **Coherence can't discriminate** opening from hole → gate is wrong tool → refute (Step 5), gate+tests stay as
  the bounding evidence.
- **`registerProgram` scale unreliable** on a near-square footprint → `carveTargetCells` clamps to
  `[minArchWidth, maxWidth]`; if scale is degenerate, fall back to `T=max(programW,minArchWidth)` (AC7 covers the
  clamp). The exact width is a glance call, not a metric.
- **The carve is clean but doesn't read** (scale/material wrong) → the *carve* claim still holds; the *glance*
  gap is an S-195 (relief) / S-196 (wider eyes + re-climb) input, recorded, not forced here (no scope creep past
  the gatehouse gate).
