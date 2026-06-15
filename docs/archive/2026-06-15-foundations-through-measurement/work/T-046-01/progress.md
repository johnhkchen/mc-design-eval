# T-046-01 — Progress: llm-form-edit-route

## Status: COMPLETE — both commits landed, `npm test` 447/447, live proof PASSED, A/B run on real models.

## Step 1 — pure editor core + cage proof (commit `200cd98`)

Built as planned:
- `src/revise/form-edit.mjs` — `applyFormEdit` (tombstone-indexed add/remove/move/swap, bounds-rejecting,
  schema-floor-guarded), `placementInBounds`, `regionKey`, `makeFormEditor` (router + stash + replay),
  `defaultProposeEdit` (live leaf, lazy subprocess).
- `src/revise/form-edit.test.mjs` — 14 pure tests (FE-apply/bounds/router/ajv/cage/imports/meta).
- **Verify:** `node --test` green; full `npm test` 446/446; FE-imports confirms no top-level GL/SDK.

## Step 2 — live BAML edit path + GL proof + A/B (commit `c4a3dfe`)

Built as planned, plus three deviations forced by running the real model (below):
- `baml_src/revise.baml` — `ReviseRegion` + the `EditAdd/Remove/Move/Swap` union. `baml_client/`
  regenerated with `npm run baml:gen`.
- `src/revise/baml-revise.mts` — the tsx bridge (mirrors `baml-review.mts`).
- `defaultProposeEdit` wired as the default `propose`; the live `render/test/form-edit.live.test.mjs`.
- `benchmarks/sculpture/form-revise-ab.mjs` + committed `.json`/`.md` + saved renders.

## Deviations from the plan (documented)

1. **`baml_client/` is GITIGNORED, not committed** (plan.md said "commit the regenerated client").
   Discovered via `.gitignore:13`. The committed source of truth is `baml_src/revise.baml`; consumers run
   `npm run baml:gen`. The bridge and live test load the regenerated client at runtime — no impact.

2. **The model must be told R's NUMERIC bounds.** The first A/B run stashed **0** edits: the model
   proposed adds/moves with absolute coordinates outside R, all rejected by the bounds guard. Fix:
   `defaultProposeEdit` now embeds `min […] ≤ [x,y,z] ≤ max […]` in the `{{ region }}` text the prompt
   interpolates. After the fix the model's ops landed in-bounds (koi 4/4, heart 3/3 applied, 0 rejected).
   *This is a real finding:* a freeform LLM editor needs the region's coordinate frame, not just a name.

3. **Added placements carry `state: null` → AJV reject.** With bounds fixed, edits still didn't stash:
   BAML's optional `state map<string,string>?` renders as `null`, but `blockState` must be a non-empty
   object when present, so `assertArtifact` rejected the candidate. Fix: `normalizeAdded` drops a
   null/empty/non-object `state` before bounds-checking an `add` (unit-tested — the +1 test, 447 total).
   This is exactly the "AJV-revalidated" gate AC #1 demanded, doing its job on imperfect model output.

4. **Added a `proposed.png` render + `proposals` observability** (beyond the plan). Because the A/B edits
   were rolled back, `after.png == before.png` — uninformative. The harness now also renders the *stashed
   LLM candidate* (`proposed.png`) and records per-region `{proposed, applied, rejected, stashed}` so a
   reviewer can see what the model built and why the gate rejected it. `makeFormEditor` gained a
   `proposals` array (additive; the existing `{diagnose, tweakFor, stash}` destructure is unaffected).

## The A/B result (AC #4) — honest, and it exercises the gate's negative path

| subject | route | region IoU before→after | whole IoU before→proposed→after | applied ops | kept? |
|---------|-------|------------------------|--------------------------------|------------|:-----:|
| koi  | llm-edit | 0.455 → 0.455 | 0.481 → 0.481 → 0.481 | 4 | ✗ rolled-back |
| heart| llm-edit | 0.384 → 0.379 | 0.347 → 0.345 → 0.347 | 3 | ✗ rolled-back |

The LLM proposed bounded edits, they were **applied under the region-lock + AJV**, **scored** against the
concept silhouette, and **rolled back** because neither raised the per-region IoU (heart's *lowered* it).
The headline: a single-shot bounded edit on these regions did not recover line, and the cage correctly
refused to keep a non-improving form edit — the exact guarantee E-15 is built to provide. The whole-object
IoU is byte-identical before/after (full rollback), confirming purity. Renders: `before/proposed/after/
crop.png` per subject.

## AC coverage

- **AC #1** (LLM route: observeRegion crop → bounded edit via the structured-output seam + new BAML fn;
  region-lock; AJV-revalidated; kept only if IoU improved; `claude -p` seam unchanged) — ✅. The bounds
  guard + `assertArtifact` + the accept-gate all fired on real output; `sdk-binding.mjs` untouched.
- **AC #2** (one router, two editors behind the same gate) — ✅ `makeFormEditor.diagnose` routes
  relief/material → `scopedTweakFor`, form defects → `llm-edit`; FE-router test proves both.
- **AC #3** (no S-045 loop change) — ✅ `loop.mjs` is byte-unchanged; FE-cage proves keep/roll-back of an
  LLM edit through the unmodified loop; the live test ran the real model through it.
- **AC #4** (koi + heart A/B: before/after region IoU + kept/rolled-back trace + renders) — ✅ real run,
  committed `.json`/`.md` + renders.
- **AC #5** (pure edit/bounds unit-tested; live call GL/metered; `npm test` green) — ✅ 15 pure tests; the
  live path is GL-gated/metered; 447/447.
