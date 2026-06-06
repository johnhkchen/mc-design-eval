# T-067-01 — Structure: file-level blueprint

The shape of the code, not the code. Files created/modified, public interfaces, ordering.

## Created

### `src/building.mjs` (PURE — the mode surface; mirrors `src/sculpture.mjs`)

SDK- and GL-free so `src/**/*.test.mjs` covers it. Imports `metadataPinLines` from `./sculpture.mjs`
(generic, already exported) and the building method id from `./config.mjs`.

Public exports:
- `VCONCEPT_BUILDING` — `Object.freeze({ id, version: 1, label })`; `id` = `VCONCEPT_BUILDING_METHOD_ID`.
- `BUILDING_SCALE_MIN = 16`, `BUILDING_SCALE_MAX = 96`, `BUILDING_DEFAULT_SCALE = 48`.
- `BUILDING_DEFAULTS` — `Object.freeze({ seed: 17, serverStateId: "flat-creative-superflat.v1" })`
  (matches sculpture so a Phase-2 model sweep is the only moving part).
- `BUILDING_VIEW_3Q` / `BUILDING_TURNTABLE` — reuse the sculpture framing constants (3/4 @ az45/el30;
  front-arc rock center45/amp40/24f). Re-export shapes so the runner can stay mode-agnostic.
- `assertBuildingSpec(spec) → {subject, scale}` — validates, throws `building:` prefixed.
- `buildingScaleCaps(scale) → {maxW, maxH, maxD}` — cubic longest-edge caps; validates input.
- `runIdForBuilding(seq, subject) → "NNN-vBuilding-<slug>"`.
- `buildingMetadata({runId, model}) → Metadata` — pins `prompting_method_id = VCONCEPT_BUILDING.id`,
  `model_id`, `seed`, `server_state_id`, `trial_id = runId`. **Never sets `target`** (AJV enum).
- `composeBuildingDesignDocPrompt({subject, scale}) → string` — Stage-1 imagined design doc for a WHOLE
  BUILDING in the round: read of the building (type/era/massing, the one or two features that name it);
  form & proportion in the round (footprint W×D, height, how the four elevations + roof read, a stable
  ground footing); palette (3–5 blocks, color-theory harmony); surface & trim motifs at BLOCK scale
  (cornice/banding/window rhythm/roof texture); block-budget plan across the ~scale longest edge.
- `composeBuildingBuildPrompt({subject, scale, designDoc, runId, model}) → string` — Stage-3 build
  prompt: realize the doc as a full 3-D building, grounded on the attached concept; full x/y/z, four
  sides + roof + interior-implied depth; states the single-view limitation; scale caps interpolated;
  metadata pins; "ONE complete building, not a complex/campus." NOT a facade/relief.

### `src/building.test.mjs` (PURE unit tests; mirrors `src/sculpture.test.mjs`)

- descriptor id single-sourced + frozen + version 1.
- scale constants sane; `assertBuildingSpec` accepts valid / trims subject / rejects bad subject+scale
  (empty, missing scale, < MIN, > MAX, non-integer).
- `buildingScaleCaps` positive ints, reflects scale, monotonic, rejects out-of-range.
- `runIdForBuilding` → `NNN-vBuilding-<slug>` (zero-padded, slugified) — and DISTINCT from the
  sculpture infix (assert it contains `vBuilding`, not `vConcept`).
- `buildingMetadata` pins archetype id + model override; `target` never set.
- design-doc prompt: subject + scale present; building-oriented tokens (`building`, `roof`,
  `in the round`, `four`/elevations, `footprint`); NO facade-only tokens (front elevation / relief).
- build prompt: subject/scale/caps numbers + metadata pins (method id + trial_id, no target);
  single-view limitation documented; **single-building** constraint present (one building / not a
  campus); object orientation (x/y/z, 3-D); no facade tokens.
- A `FACADE_TOKENS` guard list reused from the sculpture test's intent.

### `benchmarks/building/` (live runs land here, GLB goes to the shared store)

No new code dir needed — see runner decision. The building runs write under
`benchmarks/sculpture/runs/NNN-vBuilding-<slug>/` (shared seq, distinct infix). *(If a cleaner
separation is wanted later, a `benchmarks/building/runs/` symlink/dir is a trivial follow-up; for this
foundation ticket the shared runs dir + distinct infix is sufficient and avoids a second README gallery.)*

## Modified

### `src/config.mjs`

Add, single-sourced beside the other method ids:
```
export const VCONCEPT_BUILDING_METHOD_ID = "vconcept-building.v1";
```
with a doc comment describing the building mode (whole structure in the round, single 3/4 view → GLB).

### `baml_src/conceptart.baml`

Add `BuildingConceptPrompt(design_doc: string, target_blocks: int, attached: string) -> string`
(client `ClaudeStub`), a sibling of `SculptureConceptPrompt`, kept SEPARATE so siblings stay frozen.
Body = the sculpture 3/4 / black-bg / bold-block / segmentation discipline, PLUS the hard
single-building / single-view block:
- "exactly ONE complete building shown in ONE three-quarter (3/4) view";
- "NOT a turnaround, NOT a contact sheet, NOT a multi-view elevation grid, NOT a row/cluster of
  buildings, NO second building, annex, or detached outbuilding";
- "two faces and the roof read at once; bold massing, clear roof form, framed windows/doors, chunky
  trim/cornice — block-scale only; no sub-block ornament, no text/signage".

### `baml_client/` (GENERATED — regenerated, committed)

`npm run baml:gen` regenerates `inlinedbaml.ts`, `async_request.ts`, `sync_request.ts`, `parser.ts`,
type files, etc. to expose `b.request.BuildingConceptPrompt`. Commit the delta as a generated artifact.

### `benchmarks/sculpture/baml-concept.mts`

Add a branch to the variant selector:
```
variant === "building" ? b.request.BuildingConceptPrompt(designDoc, targetBlocks, attached)
: variant === "v2"     ? b.request.SculptureConceptPromptV2(...)
:                        b.request.SculptureConceptPrompt(designDoc, targetBlocks, attached)
```
No other change; transport identical.

### `benchmarks/sculpture/run.mjs`

- `parseArgs`: add `--mode` (default `"sculpture"`).
- Import the building builders from `../../src/building.mjs` alongside the sculpture ones.
- A small mode dispatch object selects: design-doc prompt fn, build prompt fn, run-id fn, concept
  `variant`, and method-id/label for the summary. `--value-match` is ignored in building mode (logged).
- `runVConcept` takes the selected fns (or a `mode` arg) instead of importing sculpture fns directly.
- The 3/4 still + rock turntable + summary + README regen are UNCHANGED and shared. `summary.approach`
  becomes `"vConcept-building"` and `promptMethodId` the building id when in building mode.
- **Invariant:** with `--mode sculpture` (default) the file behaves byte-identically to today.

### `package.json`

Add `"bench:building": "node benchmarks/sculpture/run.mjs --mode building"`.

### `benchmarks/sculpture/glb/README.md`

Add the building row to the mesh table (`file | subject | source concept | verts | tris | size`) and a
short note on TRELLIS handling of the bulky-angular building form + any lost fine detail. The `.glb`
binary itself is gitignored (as the others are).

## Module boundaries / dependency direction

```
config.mjs ──┐
             ├─ building.mjs (pure)  ←imports metadataPinLines from sculpture.mjs (generic helper)
sculpture.mjs┘
                    ▲
   building.test.mjs┘ (pure, src/ glob)

benchmarks/sculpture/run.mjs ──uses──▶ building.mjs + sculpture.mjs (mode dispatch)
                              ──spawns─▶ baml-concept.mts ──b.request──▶ baml_client (BuildingConceptPrompt)
                              ──render──▶ render/* (unchanged)

trellis-glb.mjs (unchanged) ──▶ benchmarks/sculpture/glb/<slug>.glb  (recorded in glb/README.md)
glb-mesh.mjs / glb-voxelize.mjs / voxel-components.mjs (unchanged) ──validate──▶ the GLB
```

No existing module's public interface changes. `sculpture.mjs` exports are untouched (only newly
imported by `building.mjs`). The only behavioral edit to shared code is the guarded `--mode` branch in
the runner + the variant branch in the shim, both defaulting to existing behavior.

## Ordering of changes (so each step is independently verifiable)

1. `config.mjs` method id → `building.mjs` → `building.test.mjs`; `npm test` green. (PURE, atomic.)
2. `baml_src/conceptart.baml` + `npm run baml:gen` (regenerate `baml_client`); typecheck/compile clean.
3. `baml-concept.mts` variant branch + `run.mjs` `--mode` + `package.json` script. (Wiring, no live call.)
4. LIVE: source `.env`; `bench:building` to generate concept + render; `trellis-glb.mjs` to provision
   the GLB; validate geometry + single-mass; record in `glb/README.md`. (Metered; honest if blocked.)
