# T-164-01 — Structure

The file-level blueprint. Grounded in `design.md`. Not code — the shape of the code.

## Files MODIFIED

### `baml_src/department.baml` (rewrite the `DiagnoseBuild` function body + signature)
- Classes `Critique`, `CritiqueItem`, `enum Department` — **unchanged** (T-163-01 contract is frozen).
- Replace `function DiagnoseBuild(concept_block: string, build_block: string)` with the Decision-1
  signature: `(style, image_list, program_block, palette_block, departments, max_items, concept: image,
  renders: image[]) -> Critique`.
- Real diagnostic prompt body (Decision 3): grounds on the concept image + `program_block`, compares the
  `renders`, asks for per-department `expected/present/missing` with severity, caps at `max_items`, ends
  with `{{ ctx.output_format }}` and the `{{ concept }}` + `{% for r in renders %}{{ r }}{% endfor %}`
  image tail (mirroring `critique.baml`). NO action/decision/rationale, NO gate vocabulary, NO proportion.
- Keep the file's existing header note that this is the creation-loop contract, not the frozen judge.

### `src/baml/bridge.mts` (update `FNS.DiagnoseBuild.request`)
- `request: (a, img) => b.request.DiagnoseBuild(a.style, a.image_list, a.program_block, a.palette_block,
  a.departments, a.max_items, toImage(img.concept), (img.renders ?? []).map(toImage))`.
- `parse` line unchanged. No new import → TG3 importer set unchanged.

### `src/workshop/critique.mjs` (additive exports only — byte-neutral)
- `export const ANGLE_DESCRIPTIONS` (was module-private `const`) — the shared azimuth-label map.
- `export function paletteBlock({ pack })` — extract the existing inline palette/decoration string builder
  (the `palette` + `decoration` lines inside `critiqueRenderArgs`) into a named exported helper, and have
  `critiqueRenderArgs` call it. **Must produce byte-identical output** so FX-C1 / B1 stay green.

## Files CREATED

### `src/workshop/diagnose.mjs` (the pure Layer A serializer)
Public API:
- `export const DIAGNOSIS_SCHEMA = "critique/v1"` (or similar tag, for the runner/ledger later).
- `export const MAX_DIAGNOSIS_ITEMS = 6` (the cap; matches the fused `MAX_ISSUES` register).
- `export function diagnoseRenderArgs({ program, pack, azimuths, maxItems = MAX_DIAGNOSIS_ITEMS })` →
  `{ style, image_list, program_block, palette_block, departments, max_items }`.
  - imports `ANGLE_DESCRIPTIONS`, `paletteBlock` from `./critique.mjs`; `DEPARTMENTS` from
    `../pack/departments.mjs`.
  - `program_block`: `reading.summary` line + fenced `{ masses: program.masses }` JSON.
- Pure: no GL/IO/Date/random. Header documents Layer A vs the fused path and the creation-loop/no-gate rule.

### `src/workshop/diagnose.test.mjs` (unit pins for the serializer)
- DG1 content pins: `image_list` has "1. the CONCEPT" + an azimuth label; `program_block` embeds the
  subject's `reading.summary` and `"masses"`; `palette_block` carries a `role: block` line and `decoration:`;
  `departments` equals `DEPARTMENTS.join(", ")`; `max_items` default.
- DG2 determinism: same inputs → deepEqual; `style` === pack.style.
- DG3 single-source: `departments` is exactly `DEPARTMENTS.join(", ")` (drift tripwire vs a hand list).

### `src/baml/fixtures/diagnose/` (committed render + parse fixtures)
- `inputs.json` — the real `diagnoseRenderArgs(...)` output over the committed **barn** recognized program
  (generated, not hand-written — Step 4).
- `prompt.golden.txt` — the captured rendered prompt (generated from `inputs.json` via the bridge).
- `reply.txt` — a non-vacuous model-shaped reply (fenced JSON, ≥3 items spanning ROOF/WALL/OPENING with
  filled expected/present/missing). May reuse the T-163-01 `critique-contract/reply.txt` content.
- `expected.json` — the `dropNulls(b.parse(reply.txt))` expected object.

### `benchmarks/sculpture/diagnose-smoke.mjs` (live witness, not in `npm test`)
- Loads a committed concept PNG + one committed build render PNG for `--subject`, builds args via
  `diagnoseRenderArgs` over the recognized program, `bamlRender("DiagnoseBuild")`, one `runTieredOp`
  call, `b.parse`, prints + writes the Critique to `docs/active/work/T-164-01/smoke-<subject>.json`.
- Single un-retried call (spend-limit caution). Mirrors `workshop.mjs`'s exchange seam, trimmed.

## Files TOUCHED for wiring

### `src/baml/fixtures.test.mjs` (add FX-DB1 render golden + FX-DB2 parse round-trip)
- Add two `bamlBatch` ops (render `DiagnoseBuild` over `fixtures/diagnose/inputs.json` + parse
  `fixtures/diagnose/reply.txt`) and a prose-coercion op; add the three `test(...)` blocks. Indexing: append
  at the end of the batch so existing `R[i]` indices are unchanged.

### `package.json` (add the smoke script)
- `"diagnose:smoke": "node benchmarks/sculpture/diagnose-smoke.mjs"` (args via `--`).

## Files NOT touched (guard the blast radius)
- `baml_src/critique.baml`, `CritiqueWorkshopRound`, `critiqueRenderArgs`'s **output** — byte-identical
  (only additive exports in `critique.mjs`).
- `src/workshop/loop.mjs` and `benchmarks/sculpture/workshop.mjs` — no loop wiring (T-164-02).
- `src/pack/departments.mjs`, `baml_src/department.baml`'s classes/enum — the frozen contract.
- The frozen judge path (`multi-angle-gate.mjs`, `judge-reply.mjs`, `resemblance.mjs`) — TG4 untouched.

## Ordering (where it matters)
1. Additive exports in `critique.mjs` (unblocks the serializer's imports; FX-C1 must stay green).
2. `diagnose.mjs` + `diagnose.test.mjs` (pure, no BAML — fast feedback).
3. `department.baml` prompt/signature + `bridge.mts` request (regenerates `baml_client` on `baml:gen`).
4. Generate `fixtures/diagnose/{inputs.json, prompt.golden.txt}` from the live serializer+bridge; author
   `reply.txt`/`expected.json`; add FX-DB1/FX-DB2.
5. Smoke script + `package.json`; run the live smoke; capture evidence.

## Interfaces / boundaries
- `diagnoseRenderArgs` is the ONLY producer of `DiagnoseBuild`'s text args (pure, testable). The bridge is
  the ONLY `baml_client` importer. The smoke script is the ONLY live caller (transport on the tiered shim).
- Single composition points preserved: `DEPARTMENTS` (departments.mjs), the azimuth labels + palette format
  (critique.mjs), the enum (`ctx.output_format`).
