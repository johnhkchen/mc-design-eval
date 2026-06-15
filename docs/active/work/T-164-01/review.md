# T-164-01 — Review

**Ticket:** layer-a-diagnostic-judge (Story S-164, Epic E-39). Handoff for a human reviewer.

## What changed

Layer A of the E-39 split — the structured *diagnostic* judge `DiagnoseBuild(...) → Critique` — is now a
real, grounded, fixture-pinned BAML function with a pure render-args serializer and a live smoke witness.
The Layer B router and the creation-loop wiring are deliberately **not** here (they are T-164-02); the fused
`CritiqueWorkshopRound` path is untouched and runnable for the S-166 bake-off.

### Files modified
- `baml_src/department.baml` — rewrote the T-163-01 **carrier** `DiagnoseBuild` (same name, same `-> Critique`)
  to the signature `(style, image_list, program_block, palette_block, departments, max_items, concept: image,
  renders: image[])` with the real diagnosis prompt. Grounds on the concept image + the recognized program;
  asks for per-department `expected/present/missing` + severity; caps at `max_items`; ends with
  `{{ ctx.output_format }}` (renders the `Critique`/`Department` schema) + the image tail. The `Critique`,
  `CritiqueItem`, `enum Department` classes are **unchanged** (the frozen contract).
- `src/baml/bridge.mts` — `FNS.DiagnoseBuild.request` now passes the new params + concept/render images
  (mirrors `CritiqueWorkshopRound`). No new `baml_client` importer → TG3 unchanged. `parse` is name-keyed,
  unchanged.
- `src/workshop/critique.mjs` — additive, byte-neutral: exported `ANGLE_DESCRIPTIONS` and extracted
  `paletteBlock({pack})` from `critiqueRenderArgs` (called by it). One definition of the azimuth labels +
  palette format, shared by both judges.
- `src/baml/fixtures.test.mjs` — added FX-DB1 (render golden) + FX-DB2 (parse round-trip), appended to the
  batch so existing `R[i]` indices are stable.
- `package.json` — `diagnose:smoke` script.

### Files created
- `src/workshop/diagnose.mjs` — pure serializer `diagnoseRenderArgs` + `programBlock`, `DIAGNOSIS_SCHEMA`,
  `MAX_DIAGNOSIS_ITEMS`. No GL/IO/Date/random; runs under the src test glob.
- `src/workshop/diagnose.test.mjs` — DG1–DG4 unit pins.
- `src/baml/fixtures/diagnose/{inputs.json, prompt.golden.txt, reply.txt, expected.json}` — minted from the
  production serializer + bridge over the committed barn recognized program.
- `benchmarks/sculpture/diagnose-smoke.mjs` — live witness (not in `npm test`).
- `docs/active/work/T-164-01/smoke-barn.json` — captured smoke evidence.

## Acceptance criteria — status

- [x] **`DiagnoseBuild` fn → `Critique`; rustic prompt grounded on concept + program; valid `Department`.**
  Prompt embeds the recognized program (reading summary + per-mass JSON) and the pack vocabulary; the
  Department enum reaches the model via `ctx.output_format` and the single-sourced `departments` line. FX-DB1
  asserts the grounding (`THE RECOGNIZED PROGRAM`, `roof.gable`, the enum list).
- [x] **`b.parse` fixture vs a captured golden; smoke shows non-vacuous fields.** FX-DB2 round-trips
  `reply.txt → expected.json` (3 departments, non-empty triples). The live smoke (barn/round-6) produced 3
  non-vacuous, correctly-grounded items — evidence committed. Plus T-163-01's CC1 already pins captured-golden
  parse.
- [x] **Pure `.mjs` render-args serializer mirroring `critiqueRenderArgs`.** `diagnoseRenderArgs`,
  unit-tested (DG1–DG4) and byte-pinned through FX-DB1.
- [x] **`npm test` green; no gate vocabulary.** 2206/2206. Transport-guard TG3/4/5 green; the new `.baml`/
  `.mjs` carry no `JudgeFacade`/`same object|drifted|different object`, no actions/rounds/conformance, no
  proportion.

## Falsifiable-claim assessment (anti-hedge)

The claim: structured per-department `expected/present/missing` is a more actionable target than the freeform
`issue` prose, without losing nuance. Evidence for: the live barn smoke is concrete and addressable per
department (open roof field → ROOF, open gable triangle → WALL, missing wagon doors → OPENING) — each item
already names the department a router can dispatch. **Reported nuance the structure drops:** proportion/
massing. The triple is an *element* vocabulary (add/replace/remove); resize is none of these, so Layer A
emits no proportion item — that nuance rides the mass `adjust-params` levers (the recorded S-163 decision),
not a regression but a deliberate boundary. The fused path still carries proportion via its action shape, so
the S-166 bake-off can measure whether the split's gain outweighs this. The referee is S-166, not this ticket.

## Test coverage & gaps

- **Covered (in `npm test`):** serializer content/determinism/single-source (DG1–DG4); render bytes pinned +
  grounding (FX-DB1); parse round-trip + non-vacuous + bare-prose reject (FX-DB2); T-163-01 parse leniency
  (CC1–3); transport/judge isolation (TG3–5); fused path byte-identity (FX-C1, B1, S2).
- **Gaps / not automated:** the live smoke is non-deterministic and manual (one un-retried metered call,
  spend-limit caution) — its *output* is committed evidence, not a gating test. The golden is **barn-only,
  single-style (rustic)**; the per-style gradient and a cottage golden are T-165. The prompt's *diagnostic
  quality* (does it find the right divergences?) is judged by eye from the smoke, not asserted — appropriate
  for a creation-loop function, but worth a reviewer's glance at `smoke-barn.json`.

## Open concerns / for the next ticket (T-164-02)

1. **Reply-gate leniency must be handled by the router.** `Critique` is an all-array class: a bad-enum item
   silently drops to `{items:[]}` (CC2) and bare prose rejects (CC3/FX-DB2). T-164-02's reply gate must
   classify an emptied list as malformed — `b.parse` alone will not. Pinned and documented in both test files.
2. **Proportion axis.** If S-165/166 shows the split needs a structured proportion critique, that is a
   schema-v2 axis (a `proportion` field / `Relation` class), not a forced Department — a named follow-up.
3. **No loop wiring yet.** The creation loop still runs the fused `CritiqueWorkshopRound`; nothing calls
   `DiagnoseBuild` except the smoke. T-164-02 wires diagnose→route behind a flag.

## Risk

Low. The only edit to the live fused path is two additive exports (byte-neutral, proven by FX-C1). The
frozen instrument and its transport-guard are untouched. Reverting Step 3 restores the T-163-01 carrier and
leaves the pure serializer intact.
