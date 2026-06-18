# T-197-01 — Plan

Three commits, each `npm test` green and independently verifiable. Steps small enough to commit atomically.

## Step 1 — close-the-shell substrate (`wall-generate.mjs` + tests)

1.1 Add `eaveRingClosure(occ, { floor, eaveY })`:
- `floor ?? occ.bounds.min[1]`; require `eaveY`; band cols for `floor ≤ y ≤ eaveY`; return `0` if no band;
  else `closureOf(perimeterColumns(cols))`.

1.2 Add `closeShell(occ, { program, floor, eaveY, wallField, coverageFloor = 0.5 })`:
- Guard `eaveY` defined (throw, matching `constructWalls`). `floor ?? occ.bounds.min[1]`.
- Build band-col histogram → `cols`, `localFill`, `globalFill` (lift the `constructWalls` step-1 logic; same
  `ns()` namespacing for `wallField` fallback).
- `closureBefore = closureOf(perimeterColumns(cols))`.
- `reg = program?.masses?.some(m=>m?.rect) ? registerRect(program.masses, cols) : null`.
- If `!reg || reg.coverage < coverageFloor` → return no-close report (occ unchanged), reason names the wall.
- Else: bbox of `reg.ring`; new cellMap from `occ.cells`; for each band cell delete iff on a ring column OR
  outside the ring bbox; solidify ring floor→eave in `localFill`; rebuild via `occupancyFromCells` preserving
  `form`/`state` (mirror `constructWalls` step 5). `closureAfter = eaveRingClosure(out,{floor,eaveY})`.
- Return `{ occ: out, report:{ closed:true, closureBefore, closureAfter, ringSize:reg.ring.size,
  coverage:reg.coverage, axis:reg.axis, reason } }`.

1.3 Tests (`wall-generate.test.mjs`) WG-CS1..CS5 per structure.md. Build a sparse colonnade fixture by
`ringOcc({...,drop:[run of columns]})` + a `program={masses:[{rect:{x0:0,z0:0,w,d}}]}` matching the ring
extent. Assert closed=true, closureAfter≈1 > closureBefore, roof-cell count preserved (add a couple of
y>eave cells to the fixture), and the no-close path on a mismatched rect.

1.4 `npm test` → green. **Commit:** `feat(T-197-01): closeShell — dense shell from program footprint + eaveRingClosure`.

## Step 2 — form-before-detail gate (`climb-gate.mjs` + tests)

2.1 Add `close_shell: ["WALL"]` to `TOOL_DEPARTMENTS`.
2.2 Add `FORM_READY_CLOSURE = 0.9`, `TOOL_STAGE` (form/detail map per structure.md), `formReadyGate`.
2.3 Tests CG-FR1..FR6 per structure.md (blocked@0.05, allowed@0.95, form always-eligible, boundary @0.9 and
   the real 0.615, done/unknown allowed, registry membership).
2.4 `npm test` → green. **Commit:** `feat(T-197-01): form-before-detail ordering gate (formReadyGate + TOOL_STAGE)`.

## Step 3 — wire the runner + evidence (`picture-climb.mjs` + `closeshell-evidence.mjs`)

3.1 Imports: `closeShell, eaveRingClosure`; `formReadyGate, TOOL_STAGE`.
3.2 `close_shell(occ)` hand (load program/pack, wallField via roleBlock, call closeShell, log rise/no-close).
3.3 `TOOLS.close_shell`, MENU line, agent enum token (prose + JSON enum string).
3.4 Per-round closure + ordering enforcement before apply (blocked-round record, re-pick, no spend) — mirror
   the no-op guard's control flow. Surface FORM READINESS in `agentPick`. Add `closure` to trajectory rounds +
   final summary.
3.5 `closeshell-evidence.mjs` (zero spend): real seed/program; closure before→after; roof preserved;
   `formReadyGate` blocked-before / allowed-after. Run it; capture output into progress.md.
3.6 `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` smoke (render seam + new wiring, zero
   spend) — confirm it exits clean.
3.7 `npm test` → green (runner not in the suite, but the imports/exports it touches must resolve). **Commit:**
   `feat(T-197-01): wire close_shell hand + form-readiness ordering into the picture-climb`.

## Testing strategy
- **Unit (in `npm test`):** `eaveRingClosure`, `closeShell` (close / preserve / honest-no-close / stray-drop),
  `formReadyGate` (both edges + boundary + form-always + done). These are the AC's "pure parts unit-tested"
  and "blocked on open / allowed on closed".
- **Evidence (zero spend, not in suite):** `closeshell-evidence.mjs` proves the closure RISE on the REAL
  gatehouse (0.615→1.0), roof preservation (compose-without-regress), and the gate firing on real numbers.
- **Smoke (zero spend):** `GUARD_ONLY=1` runner — wiring resolves, render seam intact.
- **NOT run here:** the metered re-climb (VOTES spend) — that is T-198-01's integration, which depends on this
  ticket. This ticket delivers the substrate + proves it on the seed.

## Verification criteria (maps to AC)
- [ ] closeShell built (dense closed shell from program footprint, not ragged occupancy); pure parts
      unit-tested; closureOf before/after on the gatehouse reported (target: 0.615 → ~1.0).
- [ ] form-before-detail ordering: detail gated on form-readiness; unit test detail blocked on open / allowed
      on closed.
- [ ] recorded honestly: shell DOES close on this seed (coverage 0.69 ≥ 0.5) — recorded with the numbers;
      roof composes without regressing (y>eave count equal).
- [ ] `npm test` green; `measurements/` untouched; recess-by-exclusion outside declared apertures (closeShell
      adds mass, no air op).

## Risks / mitigations
- **Cottage/barn regression** — avoided by NOT touching `constructWalls`; `closeShell` is a new opt-in hand.
- **Threshold miscalibration** — wide measured gap (0.615↔1.0); tests pin both edges + the boundary.
- **Stray-post closure break** — closeShell drops band cells outside the ring bbox (probe-verified 268 cols,
  closure 1.0).
- **Lisa concurrency** [[lisa-same-ticket-concurrency]] — re-Read each file before editing; additive changes;
  verify green before each commit [[shared-file-commit-sweep]].
