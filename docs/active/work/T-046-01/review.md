# T-046-01 — Review: llm-form-edit-route

E-15's payoff. The LLM block-editor is wired in as **just another editor behind the cage's accept-gate**,
with **zero change to the S-045 loop**. Two commits; `npm test` 447/447; the GL-gated live proof PASSED
against the real model; the koi + heart A/B ran on real subscription calls. Handoff for a human reviewer.

## What changed (files)

**Created**
- `src/revise/form-edit.mjs` (≈300 lines) — the editor. Pure core: `applyFormEdit` (bounded
  add/remove/move/swap, tombstone-indexed, bounds-rejecting, schema-floor + `state` normalization),
  `placementInBounds`, `regionKey`. The factory `makeFormEditor` returns the loop's `diagnose`/`tweakFor`
  seams sharing a private `stash` + `proposals`. Live leaf `defaultProposeEdit` (lazy subprocess).
- `src/revise/form-edit.test.mjs` — 15 pure tests.
- `baml_src/revise.baml` — `ReviseRegion(subject, defect, region, placements, crop) -> RegionEdit` + the
  `EditAdd/Remove/Move/Swap` op union. Sibling of facade/judge/review.
- `src/revise/baml-revise.mts` — the tsx bridge (render prompt → `requestTextWithImage` → SAP-parse → ops).
- `render/test/form-edit.live.test.mjs` — GL-gated live proof.
- `benchmarks/sculpture/form-revise-ab.mjs` + committed `form-revise-ab.{json,md}` + `form-revise-ab/
  {koi,heart}/{before,proposed,after,crop}.png`.

**Unmodified (the AC #3 guarantee):** `loop.mjs`, `region.mjs`, `tweak.mjs`, `sdk-binding.mjs`,
`artifact.mjs`, `sculptor/review.mjs`, `form-fidelity.mjs`, `config.mjs`, `expand.mjs`. The LLM editor
adds **only** new files. `baml_client/` is regenerated (gitignored — see Concerns).

## How it works (the one non-obvious idea)

The loop awaits `observe`/`diagnose` but applies the tweak **synchronously**, while a model call is
async. So `makeFormEditor.diagnose` (async, already awaited by the loop) does the model work — observe
crop → `ReviseRegion` → `applyFormEdit` (bounds) → `applyRegionEdit` (lock) → `assertArtifact` (AJV) —
and **stashes** the validated in-region placements; the sync `tweakFor` for `route:"llm-edit"` simply
**replays the stash**. The loop carries `route` from diagnose to tweakFor (unchanged); the shared closure
carries the payload the `route` string cannot. The router (AC #2): `relief`/`material` → the procedural
`scopedTweakFor`; every other (form) defect → the LLM editor. Both behind the same accept-if-improved gate.

## Test coverage

- **Pure (`npm test`, 15 tests):** op application + index stability under removes; determinism +
  no-mutation; unknown-op rejection; in-/out-of-bounds add/move (rejected, not thrown); the `state`
  normalization; the schema-floor (no empty region); router dispatch (procedural vs form); stash replay;
  AJV-catch → no stash; **FE-cage** — an improving LLM edit is KEPT and a non-improving one is ROLLED BACK
  *through the unmodified `reviseLoop`* (the AC #3 proof in code); FE-imports (no top-level GL/SDK/
  subprocess). Total suite 447/447.
- **Live (GL-gated, not in `npm test`):** `form-edit.live.test.mjs` — ran the real `ReviseRegion` call
  through the loop on the koi and asserted a numeric before/after + boolean accept. **PASSED** (~49 s).
- **A/B (metered, committed output):** koi + heart, real model. Both edits applied (koi 4 ops, heart 3),
  scored, and rolled back (region IoU 0.455→0.455; 0.384→0.379). `proposed.png` shows each applied-but-
  rejected candidate.

**Gaps / not covered by automated tests:** the bridge (`baml-revise.mts`) and `defaultProposeEdit` are
exercised only by the live test + A/B (metered, by design — spec §4). BAML's SAP-parse of the op union is
validated only at runtime (it worked on every real call this session).

## Findings worth a reviewer's attention

1. **A freeform LLM editor needs the region's NUMERIC frame.** Without `min/max` in the prompt, every
   proposed coordinate fell outside R and was rejected (stashed 0). Naming the region ("the swimming
   body") is not enough — the model needs the coordinate box. Now embedded in the `{{ region }}` text.
2. **BAML optional maps render `state: null`, which the artifact schema rejects.** The AJV gate caught it
   (as designed); `normalizeAdded` drops a null/empty `state` on `add`. Any future model-emitted placement
   path should reuse this normalization.
3. **The honest result: a single-shot bounded edit did not recover line here, and the cage rejected it.**
   This is the gate working, not a failure of the wiring — the route, lock, AJV, score, and rollback all
   fired on real output. See Open concerns for how to turn this into *kept* improvements.

## Open concerns / follow-ups

- **No accepted improvement yet (the interesting one).** With `perRegion: 1` and one proposal per region,
  neither subject's edit raised the silhouette IoU. Likely levers (future ticket, not this one): (a) give
  the model several attempts (`perRegion > 1`) with the prior rejection fed back; (b) a **true
  region-vs-region IoU** — the accept signal is currently the R-framed render vs the *whole* concept (the
  3-D→2-D concept projection of R is still out of scope, T-045), which may be too coarse to reward a
  local line change; (c) larger/better-chosen regions (the curated bboxes were hand-picked from artifact
  bounds, not from the critic's `where`).
- **`baml_client/` is gitignored.** CI / a fresh checkout must run `npm run baml:gen` before the bridge or
  live test will load `ReviseRegion`. The pure `npm test` does not need it. Worth a one-line note in the
  build docs if not already implied by the other BAML functions.
- **Two model calls per region in the live router** when a real E-11 critic is used (critic + ReviseRegion).
  The A/B forces the route to a single call; a production wiring of the live critic should consider whether
  to fold diagnosis into the edit call.
- **Per-region attempts replay the same stashed edit.** One proposal per region means attempts >0 re-apply
  the identical edit (harmless no-ops). `perRegion: 1` is the right budget for the LLM route until a
  multi-proposal `propose` exists.

## Verdict

All five acceptance criteria are met and demonstrated on real models. The cage abstraction held: adding a
freeform LLM editor required no loop change, and the accept-gate correctly kept the editor honest by
rolling back edits that did not improve form. The work ready for handoff; the natural next ticket is
making the LLM editor *land* improvements (multi-attempt + a sharper local accept signal).
