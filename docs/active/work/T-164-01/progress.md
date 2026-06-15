# T-164-01 — Progress

Layer A — the structured diagnostic judge. All plan steps executed; `npm test` green (2206/2206).

## Completed (commits on `main`)

- **Step 1 — byte-neutral exports** (`c3dc376`): `critique.mjs` now exports `ANGLE_DESCRIPTIONS` and a
  `paletteBlock({pack})` helper extracted from `critiqueRenderArgs`'s inline builder. Output byte-identical
  — `critique.test.mjs` (9/9) and FX-C1 (the fused render golden) stay green.
- **Step 2 — pure serializer** (`fb2af82`): `src/workshop/diagnose.mjs` — `diagnoseRenderArgs({program,
  pack,azimuths,maxItems})` → `{style, image_list, program_block, palette_block, departments, max_items}`;
  `programBlock`, `DIAGNOSIS_SCHEMA`, `MAX_DIAGNOSIS_ITEMS`. `diagnose.test.mjs` DG1–DG4 (content,
  determinism, single-source `DEPARTMENTS`, summary-less degradation).
- **Step 3 — prompt + bridge** (`<this run>`): rewrote `DiagnoseBuild` in `department.baml` to the
  images+grounding signature with the real diagnosis prompt (concept + recognized program, per-department
  expected/present/missing, `max_items`, `ctx.output_format`, image tail); diagnosis-only, no dispatch, no
  proportion, no gate vocabulary. `bridge.mts` `FNS.DiagnoseBuild.request` passes the new params + images.
  `baml:gen` regenerates clean; T-163-01 parse pins (CC1/CC2/CC3) + transport-guard (TG3/4/5) green.
- **Step 4 — fixtures** (`<this run>`): `fixtures/diagnose/{inputs.json, prompt.golden.txt, reply.txt,
  expected.json}` minted from the production serializer + bridge over the committed **barn** recognized
  program. FX-DB1 (render bytes pinned + grounding asserts) and FX-DB2 (parse round-trip, ≥3 departments,
  non-empty expected/present/missing, bare-prose reject) added to `fixtures.test.mjs`, appended so existing
  `R[i]` indices are stable.
- **Step 5 — live smoke** (`<this run>`): `benchmarks/sculpture/diagnose-smoke.mjs` + `npm run
  diagnose:smoke`. Ran live on barn/round-6: **3 non-vacuous items spanning ROOF/WALL/OPENING**, each with
  grounded expected/present/missing (reads the open roof, the open gable triangle, the missing wagon
  doors). Evidence: `docs/active/work/T-164-01/smoke-barn.json`.
- **Step 6 — gate**: `npm test` → 2206/2206 (was 2200; +4 DG, +2 FX-DB). Transport-guard green; fused path
  byte-identical (FX-C1, B1, S2).

## Deviations from plan

- **FX-DB2 leniency assertion corrected mid-implementation.** The plan expected bare prose to coerce to
  `{items:[]}` (the FX-D1 family). For `DiagnoseBuild`, bare prose actually **rejects** (`ok:false`) — the
  coerce-to-empty leniency is the *bad-enum JSON* case (T-163-01 CC2), not bare prose (CC3). The test now
  asserts the prose **reject**, matching the real SAP behaviour and CC3; the bad-enum drop stays pinned in
  `critique-contract.test.mjs` CC2. No code change — the contract is as T-163-01 characterized it.
- **Smoke evidence committed.** The plan left this conditional on the metered path being available; it was,
  so the witness JSON is committed.

## What this ticket does NOT do (T-164-02)

- The Layer B router `RouteCritique(Critique) → [{department, idiom, why}]` and the `departmentToIdioms`
  resolution.
- Wiring diagnose→route into the creation loop (replacing the fused action path behind a flag). The fused
  `CritiqueWorkshopRound` path is left **byte-identical and runnable** for the S-166 bake-off.

## Open items carried to Review

- The proportion/massing axis the `expected/present/missing` triple cannot carry (the known, reported gap —
  rides the mass `adjust-params` levers, not a Layer A item). Watch-point for the S-166 nuance comparison.
- The render golden is barn-only (single style, rustic) — the per-style gradient is T-165.
