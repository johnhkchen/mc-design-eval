# T-197-01 — Review

**Close-the-shell form hand + form-before-detail climb ordering** (story S-197, epic E-51). The substrate the
E-51 plateau waited on: the gatehouse was an open colonnade, so the carve (T-194) and relief (T-195) hands
were mechanically correct but couldn't read. This ticket closes the shell and makes "form before detail"
structural. Handoff for a human reviewer.

## What changed (files)

| File | Change |
|---|---|
| `src/view/wall-generate.mjs` | **+** `eaveRingClosure` (the one closure metric) and `closeShell` (dense shell from program footprint) + private `bandHistogram`. `constructWalls`/`registerRect` **unchanged**. |
| `src/view/wall-generate.test.mjs` | **+** WG-CS1..CS5 (5 tests). |
| `src/workshop/climb-gate.mjs` | **+** `FORM_READY_CLOSURE`, `TOOL_STAGE`, `formReadyGate`; `close_shell` in `TOOL_DEPARTMENTS`. |
| `src/workshop/climb-gate.test.mjs` | **+** CG-FR1..FR7 (7 tests). |
| `experiments/eval-alignment/picture-climb.mjs` | **+** `close_shell` hand, TOOLS/MENU/agent-enum, per-round closure + ordering enforcement, readiness in the prompt, closure in trajectory/summary. (Not in `npm test`.) |
| `docs/active/work/T-197-01/closeshell-evidence.mjs` | **+** zero-spend real-subject proof. |

## How it works (the two coupled fixes)

1. **Close-the-shell.** Root cause located by probe: `constructWalls` *already* registers the program's
   `masses[0].rect` to a dense closure-1 ring, but **suppresses it** on the near-square 15×15 gatehouse via
   the `ambiguous` axis-tie guard → falls back to a gappy close-ring (closure 0.615). `closeShell` is a new
   **form-only** hand that accepts the dense ring on **coverage** alone (0.69 ≥ 0.5 floor), ignoring the
   axis-tie ambiguity (immaterial for a square — both axes give the same ring), solidifies it floor→eave,
   drops strays, and keeps the roof + interior verbatim. New hand, not an edit to `constructWalls` → no
   cottage/barn regression risk.
2. **Form before detail.** `formReadyGate` (pure, scalar-in) labels each tool form/detail and blocks a detail
   tool until wall-band closure ≥ 0.9. The runner computes the closure (`eaveRingClosure` — same definition
   the hand reports) and enforces the gate before applying: a blocked detail pick spends nothing, records a
   rolled-back round, and re-prompts with the form-readiness state so the agent picks `close_shell` first.

## Test coverage

- **Unit (in `npm test`, 12 new):** `eaveRingClosure` (watertight/gappy/empty); `closeShell` (closes a
  colonnade + roof preserved; no regression on a clean shell; honest no-close below floor; stray-drop);
  `formReadyGate` (both edges, boundary @0.9 + the real 0.615, form-always, done/unknown, NaN fail-safe);
  registry membership. **Full suite: 2370/2370 green.**
- **Evidence (zero spend):** `closeshell-evidence.mjs` PASSES on the real gatehouse — closure **0.615→1.000**,
  roof **1177→1177 preserved**, `carve_arch` BLOCKED@0.615 / ALLOWED@1.0, `close_shell` always eligible.
- **Smoke (zero spend):** `GUARD_ONLY=1` runner — wiring resolves, GL available, renders + beside written,
  exits clean.

## Acceptance criteria

- [x] Close-the-shell hand built (dense shell from program footprint, not ragged occupancy); pure parts
      unit-tested; closureOf before/after on the gatehouse reported — **0.615 → 1.000 (+0.385)**.
- [x] Form-before-detail ordering: detail tools gated on form-readiness; unit-tested **blocked on open**
      (0.05/0.615) and **allowed on closed** (0.95/1.0).
- [x] Recorded honestly: the shell **does** close on this seed (coverage 0.69) — recorded with numbers; the
      form stage **composes without regressing the roof** (y>eave count equal). No-close path built + tested
      for a future subject that can't register (anti-hedge: name the wall, never fake density).
- [x] `npm test` green; frozen instrument (`measurements/`) untouched; recess-by-exclusion preserved
      (`closeShell` adds mass + drops strays, **no air op** — carving stays in `carve_arch`).

## Open concerns / limitations (for human attention)

1. **The metered re-climb was NOT run.** This ticket delivers + proves the substrate (zero spend); the
   integration re-climb (LLM/VOTES) is **T-198-01**, which depends on this. The end-to-end "carve + relief now
   read against a closed wall" claim is verified only at the geometry level here, not on rendered glance.
2. **Threshold 0.9 is calibrated against one subject** (the gatehouse 0.615↔1.0 gap is wide, so robust). A
   subject whose legit closed form sits at, say, 0.85 would be falsely blocked. The constant is exported +
   unit-pinned, so re-tuning is a one-line change with a failing test to anchor it.
2b. **Quoted vs measured closure.** Ticket says ~0.05; I measured **0.615** (close-ring perimeter measure).
   The discrepancy is the measurement, not the conclusion — both recorded in progress.md; the shell was open
   and the dense rect (1.0) was being thrown away either way.
3. **`closeShell` and `construct_walls` both build envelopes** (the latter also skins + carves a derived
   opening rhythm). They are not mutually exclusive in the menu; the agent could pick either. `close_shell` is
   the clean form lever (closure→1.0, no detail); `construct_walls` remains for the skin+openings path. If the
   re-climb shows the agent oscillating between them, a follow-up could fold close-then-skin into one ordered
   form stage. Not needed for this ticket's AC.
4. **`registerRect`'s `ambiguous` flag is now bypassed by `closeShell`** (intentionally, documented). It still
   guards `constructWalls`. If a future near-square subject has genuinely ambiguous *axis-dependent* geometry
   (not a true square), `closeShell` would pick `registerRect`'s coverage-winning axis silently — acceptable
   because a square's ring is axis-invariant, but worth a note if a rectangular-but-near-square subject appears.
