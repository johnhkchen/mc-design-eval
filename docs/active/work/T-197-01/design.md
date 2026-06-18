# T-197-01 — Design

Two coupled deliverables: (A) a close-the-shell **form hand** that builds a dense closed shell from the
program's footprint, and (B) **form-before-detail ordering** in the climb (detail tools gated on
form-readiness). Decisions below are grounded in the measured research, not assumptions.

## Decision A — close-the-shell: a NEW form brush, reusing `registerRect`'s dense ring

### Options considered
1. **Fix `constructWalls`'s `useReg` guard in place** (drop/relax `!reg.ambiguous`). *Rejected.* T-160-04
   deliberately gated the dense-rect path on `!ambiguous` to stop the cottage/barn from regressing
   ([[wall-construct-needs-dense-shell]]: cottage REGRESSED on replace-via-occupancy). Changing the live
   brush's route risks those two subjects with no upside the ticket needs — and it conflates form (close the
   box) with detail (skin + carve openings), which is exactly what the form-before-detail ordering wants
   *separated*. High blast radius, wrong altitude.
2. **A new `closeShell` brush that builds form ONLY** (dense ring solidified floor→eave, roof + interior kept,
   strays dropped), reusing `registerRect` for the ring. *Chosen.* It is the literal deliverable ("a
   close-the-shell form hand"), composes with the existing `construct_walls`/skin/detail hands instead of
   replacing them, leaves cottage/barn untouched (different hand, opt-in), and gives the ordering gate a clean
   dedicated form lever. The probe proves it (0.615→1.0, roof preserved).
3. **Build the rect from program absolute coords directly** (no occupancy registration). *Rejected.* The
   program rect is 0-based sketch units that do NOT register to the build's negative-coord frame (the
   T-160-01 finding, restated in `wall-generate.mjs`'s header). `registerRect` already solves frame
   registration robustly (scale + offset + axis from the occupancy extent). Reuse it.

### The chosen mechanism
`closeShell(occ, {program, floor, eaveY, wallField})`:
1. Histogram the wall-band columns (floor≤y≤eave) for LOCAL per-column material + a global modal fill (reuse
   the `constructWalls` logic so closed columns keep their own stone, last-resort `wallField`).
2. `reg = registerRect(program.masses, cols)`. **Accept the dense ring iff `reg && reg.coverage ≥ FLOOR`** —
   *ignoring* `reg.ambiguous`. Rationale, documented in code: a near-square footprint's axis tie is
   immaterial (identity and swap give the same square ring), and coverage (0.69 > 0.5) already proves the
   ring traces the real posts. The `ambiguous` flag conflates "untrustworthy" (low coverage — still
   rejected) with "axis tie on a square" (harmless — now allowed).
3. **If not acceptable** (`reg` null, or coverage < FLOOR): return the occ UNCHANGED with
   `report.closed=false` and a reason naming the geometry wall. *This is the anti-hedge refute path* — never
   fake a dense shell ([[anti-hedge-falsifiable-commitment]]).
4. **Else REPLACE the band:** drop every band cell that is on a ring column OR outside the dense ring's bbox
   (stray colonnade posts that would otherwise break closure); keep band cells strictly interior; keep all
   cells with y<floor or y>eave (roof + base preserved). Solidify the dense ring floor→eave in each column's
   local material. Return `{occ, report:{closed:true, closureBefore, closureAfter, ringSize, coverage,
   axis, reason}}`.

The closure measure used in the report is a new pure primitive `eaveRingClosure(occ, {floor, eaveY})` =
`closureOf(perimeterColumns(bandCols(occ)))` — the same number the ordering gate consumes, so "what the hand
reports" and "what the gate tests" are one definition (no drift).

**Falsification for A (lead with how it fails):** if coverage on this seed were < 0.5, closeShell would
honestly NOT close and I'd name the wall. Measured: coverage 0.69, closure 0.615→1.000, roof preserved. The
claim survives its own attack on the real seed.

## Decision B — form-before-detail: a stage gate keyed on a closure scalar, decided in `climb-gate.mjs`

### Options considered
1. **Hard-block detail tools in the runner only.** *Rejected as the home of the logic.* The "is this tool
   eligible given form-readiness" decision is a climb DECISION — it belongs beside `acceptsRound`/
   `stoppingDecision` in the pure, unit-tested `climb-gate.mjs`, not buried in the metered runner. (The
   runner still *enforces* it — see wiring — but the rule is pure and tested.)
2. **Gate on the occupancy inside climb-gate.** *Rejected.* `climb-gate.mjs` is deliberately occ-free / GL-free
   so its decisions unit-test in isolation. Passing it a raw occ breaks that. Instead the runner computes the
   closure scalar (`eaveRingClosure`) and hands climb-gate the number — the same split the framing eyes use
   (geometry in `framing.mjs`, the scalar surfaced by the runner).
3. **A per-tool `stage` map + a closure threshold + a pure `formReadyGate(scalar)`.** *Chosen.*

### The chosen mechanism (all in `climb-gate.mjs`, PURE)
- `TOOL_STAGE` — every tool labelled `"form"` or `"detail"`:
  - **form:** `close_shell`, `construct_walls`, `apply_gable_roof`, `recolor_roof` (massing / envelope / roof
    shape & material — the coarse build).
  - **detail:** `carve_arch`, `relief_walls`, `band_eave`, `articulate_walls`, `add_timber_framing`,
    `frame_arch` (carve / dress / band a *finished* form). The ticket names carve_arch, relief_walls,
    band_eave explicitly; the others are the same class (they dress an envelope) so they gate identically —
    documented.
- `FORM_READY_CLOSURE = 0.9` — threshold. Calibrated against the measured gap: seed 0.615 (blocked) vs closed
  1.000 (allowed) — a wide, robust margin, not a knife-edge. Recorded so it's calibrated, not asserted.
- `formReadyGate({ tool, closure, threshold = FORM_READY_CLOSURE })` → `{allow, stage, reason}`:
  - form tool → `allow:true` (form is *always* eligible — you must be able to close the shell).
  - detail tool with `closure ≥ threshold` → `allow:true`.
  - detail tool with `closure < threshold` → `allow:false`, reason "form not ready (closure X < 0.9) — close
    the shell before detail".
  - unknown tool / `done` → `allow:true` (the gate never invents a block; `done` is always honest).
- Register `close_shell` in `TOOL_DEPARTMENTS` → `["WALL"]` (so `classifyInventory` labels it).

**Falsification for B:** the gate fails if it blocks a legit detail (false block) or passes a detail on an
open form (false allow). Unit tests assert both edges: `carve_arch` BLOCKED at closure 0.05 / 0.615, ALLOWED
at 0.95 / 1.0; `close_shell` ALLOWED at 0.05 (form is never blocked). The wide 0.615↔1.0 measured gap means
the single threshold is not knife-edge-calibrated.

## Wiring (runner) — minimal, mirrors the framing-eyes seam
- Add `close_shell(occ)` hand: loads program+pack (like `construct_walls`), calls `closeShell`, logs the
  closure rise / the honest no-close. Add to `TOOLS`, `MENU`, the agent-pick enum.
- Each round: compute `closure = eaveRingClosure(occ, {floor, eaveY})`. Surface form-readiness in the agent
  prompt (so the model picks `close_shell` first when the form is open). BEFORE applying a picked tool, run
  `formReadyGate`; if a detail tool is blocked, do NOT apply/score it — record a rolled-back "form not ready"
  round (advance the stall counter, zero spend), re-pick. Form tools and `close_shell` pass straight through.
- The gate runs *before* `acceptsRound` — it's an eligibility filter, orthogonal to keep/rollback.

## What is explicitly NOT done
- No change to `constructWalls`'s route (cottage/barn untouched). No frozen-instrument change. No new air op
  (closeShell adds mass; carving stays in `carve_arch`). No fix proposed for orientation/scale (still E-49).
