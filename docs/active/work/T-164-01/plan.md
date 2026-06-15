# T-164-01 — Plan

Ordered, independently-verifiable steps. Each ends green and commits atomically. Grounded in `structure.md`.

## Step 1 — Additive byte-neutral exports in `critique.mjs`
**Do:** export `ANGLE_DESCRIPTIONS`; extract the inline palette/decoration builder inside
`critiqueRenderArgs` into `export function paletteBlock({ pack })` and call it from `critiqueRenderArgs`.
**Verify:** `node --test src/workshop/critique.test.mjs` green (FX-C1's golden comes from `fixtures.test.mjs`
— also run it); `paletteBlock` output is byte-identical to the old inline string (B1 still matches
`/wall\.field: oak_planks/` and `/decoration:\n {2}- lantern: lantern/`).
**Commit:** `refactor(T-164-01): export ANGLE_DESCRIPTIONS + paletteBlock helper (byte-neutral)`.

## Step 2 — The pure serializer `src/workshop/diagnose.mjs` + unit test
**Do:** write `diagnoseRenderArgs({ program, pack, azimuths, maxItems })` per Decision 2 and `DG1–DG3` in
`diagnose.test.mjs`. Use a synthetic recognized program (the `critique.test.mjs` S-block `SOURCE` shape) or
load the committed barn program for the content pins.
**Verify:** `node --test src/workshop/diagnose.test.mjs` green; serializer is pure (no import of GL/render/
sdk); `departments` equals `DEPARTMENTS.join(", ")`.
**Commit:** `feat(T-164-01): diagnoseRenderArgs — pure Layer A render-args serializer`.

## Step 3 — Author the `DiagnoseBuild` prompt + signature; update the bridge
**Do:** rewrite `DiagnoseBuild` in `department.baml` to the Decision-1 signature + the diagnosis prompt
(concept + `program_block` grounding, per-department expected/present/missing, `max_items`,
`{{ ctx.output_format }}`, image tail). Update `bridge.mts` `FNS.DiagnoseBuild.request` to pass the new
params + images. Run `npm run baml:gen`.
**Verify:** `npm run baml:gen` succeeds; `node --test src/baml/critique-contract.test.mjs` (T-163-01
parse pins) **stays green** — parse is name-keyed, so the signature change must not break CC1/CC2/CC3.
Grep the prompt for banned tokens (`same object|drifted|different object`, `JudgeFacade`, action/round/
conformance) → none. `npm run lint`/transport-guard: `node --test src/baml/transport-guard.test.mjs` green
(TG3/TG4/TG5).
**Commit:** `feat(T-164-01): DiagnoseBuild diagnostic prompt + bridge request (Layer A)`.

## Step 4 — Mint the diagnose fixtures (render golden + parse) and pin them
**Do:**
1. Generate `fixtures/diagnose/inputs.json` = `diagnoseRenderArgs` over the committed **barn** recognized
   program (a one-off node snippet writing the JSON — committed as the canonical input).
2. Generate `fixtures/diagnose/prompt.golden.txt` = `bamlRender("DiagnoseBuild", inputs, {concept:PX,
   renders:[PX×4]})`.prompt (the 1×1 PX placeholder; render pins are about TEXT).
3. Author `fixtures/diagnose/reply.txt` (non-vacuous, ≥3 departments) + `expected.json` =
   `dropNulls(b.parse(reply.txt))`.
4. Add FX-DB1 (render `===` golden + image count) and FX-DB2 (parse deepEqual `expected.json` + every
   `department` ∈ DEPARTMENTS + non-empty expected/present/missing + prose→`{items:[]}`) to
   `src/baml/fixtures.test.mjs`, appended to the batch so existing `R[i]` indices are stable.
**Verify:** `node --test src/baml/fixtures.test.mjs` green (FX-C1 et al. unchanged, FX-DB1/2 pass);
re-running the generation reproduces identical bytes (determinism).
**Commit:** `test(T-164-01): diagnose render golden + non-vacuous parse fixtures`.

## Step 5 — The live smoke script + npm wiring; capture evidence
**Do:** `benchmarks/sculpture/diagnose-smoke.mjs` (Decision 4): load a committed concept PNG + one committed
build render for `--subject`, `diagnoseRenderArgs` over the recognized program, `bamlRender`, ONE
`runTieredOp`, `b.parse`, print + write `docs/active/work/T-164-01/smoke-<subject>.json`. Add
`"diagnose:smoke"` to `package.json`.
**Verify:** `node -c benchmarks/sculpture/diagnose-smoke.mjs` (syntax) + a dry import. Then attempt the live
run `npm run diagnose:smoke -- --subject barn` ONCE (single un-retried call; spend-limit caution). If the
metered/GL path is available: confirm the printed Critique has non-vacuous expected/present/missing across
≥2 departments; commit the evidence JSON. If unavailable in this environment: record the script as the
witness mechanism and the committed `expected.json` (FX-DB2) as the in-suite non-vacuous proof, and note the
live run as the manual step (consistent with the repo's GL-absent handling).
**Commit:** `feat(T-164-01): diagnose:smoke live witness + evidence` (and the captured JSON if produced).

## Step 6 — Full-suite gate + Review
**Do:** `npm test`. **Verify:** green; transport-guard (TG3/4/5) green; no gate vocabulary in the new
`.baml`/`.mjs`; the fused path (FX-C1, critique.test.mjs B1/S2) byte-identical. Write `review.md`.

## Testing strategy summary
- **Unit (pure, in `npm test`):** `diagnose.test.mjs` DG1–DG3 (serializer content + determinism +
  single-source); `critique.test.mjs` (byte-neutral refactor).
- **BAML fixtures (in `npm test`):** FX-DB1 render golden (prompt bytes pinned), FX-DB2 parse round-trip +
  non-vacuous + leniency; CC1/CC2/CC3 (T-163-01) remain green.
- **Guards (in `npm test`):** transport-guard TG3/TG4/TG5; `departments.test.mjs` DPT* (unchanged).
- **Live smoke (manual, not in `npm test`):** `diagnose:smoke` — the one real (concept, render) pair
  witness. The AC's "non-vacuous" is double-covered: in-suite (FX-DB2) and live (smoke evidence).

## Risk / rollback
- A serializer or template change cascades to `prompt.golden.txt` (the decompose-cascade lesson) — regen
  via the production fns, never hand-edit the golden.
- If the live smoke's metered path is unavailable, Step 5 degrades gracefully (script + in-suite proof);
  this does not block the ticket's testable ACs.
- Each step commits independently; reverting Step 3 (the `.baml`) restores the T-163-01 carrier, leaving the
  pure serializer (Steps 1–2) intact.
