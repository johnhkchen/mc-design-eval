# T-067-01 — Plan: ordered steps + testing strategy

Four commits, each independently verifiable. Steps 1–3 are PURE/deterministic (no metering). Step 4 is
the live tail (metered, honest if blocked). Testing strategy stated per step.

## Step 1 — Pure building mode module + tests (the AC core)

**Changes:** `src/config.mjs` (add `VCONCEPT_BUILDING_METHOD_ID = "vconcept-building.v1"`),
`src/building.mjs` (descriptor, scale consts, `assertBuildingSpec`, `buildingScaleCaps`,
`runIdForBuilding`, `buildingMetadata`, `composeBuildingDesignDocPrompt`,
`composeBuildingBuildPrompt`; imports `metadataPinLines` from `./sculpture.mjs`), `src/building.test.mjs`.

**Verify:**
- `npm test` green (validate-artifact self-tests + `node --test src/**/*.test.mjs`).
- New tests assert: id single-sourced + frozen; scale bounds; `assertBuildingSpec` accept/trim/reject;
  `buildingScaleCaps` ints/monotonic/range; `runIdForBuilding` infix `vBuilding` (DISTINCT from
  `vConcept`); metadata pins method id + model override, NEVER `target`; design-doc prompt has
  subject+scale + building tokens (roof/in the round/four/footprint) and NO facade-only tokens; build
  prompt has caps numbers + metadata pins + single-view limitation + single-building constraint + x/y/z
  orientation and NO facade tokens.

**Commit:** `feat(E-20 T-067-01): full-building vConcept mode — pure builders + scale wiring (unit-tested)`

## Step 2 — BAML BuildingConceptPrompt + regenerate client

**Changes:** `baml_src/conceptart.baml` (add `BuildingConceptPrompt`), regenerate `baml_client/` via
`npm run baml:gen`.

**Verify:**
- `npm run baml:gen` exits 0; `baml_client/` delta includes `BuildingConceptPrompt` in `inlinedbaml.ts`
  + `async_request.ts`/`sync_request.ts`.
- `npx tsc --noEmit` is NOT part of the repo flow; instead confirm the shim parses by a dry
  `node -e` import is not possible for `.ts` — rely on `baml:gen` success + a Step-3 dry render check.
- `npm test` still green (no JS surface changed).

**Commit:** `feat(E-20 T-067-01): BuildingConceptPrompt (single building / single 3/4 view) + baml_client`

## Step 3 — Wire the runner + shim + script (no live call)

**Changes:** `benchmarks/sculpture/baml-concept.mts` (variant `"building"` branch),
`benchmarks/sculpture/run.mjs` (`--mode` dispatch over building/sculpture builders; value-match ignored
in building mode; summary fields), `package.json` (`bench:building`).

**Verify:**
- `npm test` green (runner is not in the test glob, but building.mjs is; nothing else regresses).
- Default-path invariant: `git diff` shows the sculpture code path only gains a guarded `mode` branch;
  `--mode sculpture` is the default.
- Dry concept-prompt render check: run the shim's BAML render-only path with a tiny temp design doc and
  `variant:"building"` (BAML render needs no real key — `ANTHROPIC_API_KEY` is stubbed to
  `baml-render-only`), asserting the composed prompt text contains the single-building clause. This
  exercises Step 2's regen + Step 3's branch WITHOUT a metered Nano Banana call. *(If the render-only
  dry run is impractical headless, fall back to grepping the composed text via a minimal tsx harness.)*

**Commit:** `feat(E-20 T-067-01): wire building mode into runner + concept shim + bench:building`

## Step 4 — LIVE: concept, GLB, validation, manifest (metered; honest if blocked)

**Preconditions:** `set -a; . ./.env; set +a` (sources `GEMINI_API_KEY`, `MODAL_ENDPOINT_URL`; never
printed).

**Actions:**
1. `npm run bench:building -- --subject "<a clearly-named building, e.g. a stone gatehouse>" --scale 48
   --note "E-20 foundation: full building, single 3/4 view"`.
   → produces `runs/NNN-vBuilding-<slug>/{design-doc.md, concept.png, artifact.json, render-3q.png,
   turntable/, summary.json}`.
2. Provision the GLB: `node benchmarks/sculpture/trellis-glb.mjs runs/<runId>/concept.png
   benchmarks/sculpture/glb/<slug>.glb`. (Cold start can take minutes; Bash timeout set to max.)
3. Validate geometry + single-mass with a one-off `node -e` using `parseGlbMesh` (real glTF v2,
   `triangleCount` sane, finite bounds) and `voxelizeGlb` + `connectedComponents` (largest component is
   the overwhelming majority of occupied cells → ≈1 principal mass). Record verts/tris/size.
4. Update `benchmarks/sculpture/glb/README.md`: add the building row + a TRELLIS-handling note (bulky-
   angular form succeeded vs the thin sword; honestly list any lost fine detail — windows/cornices that
   voxelize away — flagged for the S-069 surgical pass).

**Verify:**
- Concept is one building (visual + the prompt's hard constraint); GLB parses as glTF v2; the single-
  mass check passes (or, if multiple components, that is recorded honestly with the largest-fraction).
- `npm test` still green.

**If blocked** (Nano Banana or Modal unreachable / erroring): the pipeline is complete and ready; record
the exact failure in `progress.md`/`review.md` as a follow-up live run, mirroring the sword finding —
no faked artifacts. The PURE core (Steps 1–3) fully satisfies the unit-testable ACs regardless.

**Commit:** `feat(E-20 T-067-01): provision + validate building GLB; record in glb manifest`
*(or, if blocked, fold the manifest/README note + honest finding into the Step-3 commit and document.)*

## Testing strategy summary

- **Unit (deterministic, gated by `npm test`):** all of `building.mjs` via `building.test.mjs` — the AC
  "pure mode/prompt logic unit-tested" requirement. Mirrors `sculpture.test.mjs` coverage 1:1 plus the
  single-building assertion.
- **Generated-artifact check:** `baml:gen` success + the presence of `BuildingConceptPrompt` in the
  client; a render-only dry check of the composed concept text.
- **Integration (manual, metered):** the live `bench:building` run + TRELLIS provision + GLB validation
  — not in CI (needs `.env` + GPU endpoint), verified by hand and recorded in the manifest.
- **Regression guard:** `--mode sculpture` default keeps the E-13 sculpture path byte-identical; the
  full suite stays green at each step.

## Risk register

- **baml:gen drift** — regenerated client may touch many files; commit the whole delta, don't hand-edit.
- **TRELLIS thin-subject mode** — a building is bulky-angular (favorable) but verify, don't assume; note
  lost fine detail honestly.
- **Runner reproducibility** — keep the sculpture path behind the default; the only new behavior is
  gated by `--mode building`.
- **Live metering/availability** — Step 4 is the only metered step; degrade to an honest "ready,
  follow-up run" if the endpoints are down.
