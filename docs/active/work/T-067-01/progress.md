# T-067-01 — Progress

## Step 1 — Pure building mode module + tests ✅ (committed)

- `src/config.mjs`: added `VCONCEPT_BUILDING_METHOD_ID = "vconcept-building.v1"` (single-sourced, doc'd).
- `src/building.mjs`: new PURE mode surface mirroring `src/sculpture.mjs` — `VCONCEPT_BUILDING`
  descriptor; `BUILDING_SCALE_MIN/MAX/DEFAULT` (16/96/48); `BUILDING_DEFAULTS`; `BUILDING_VIEW_3Q`;
  `BUILDING_TURNTABLE`; `assertBuildingSpec`; `buildingScaleCaps`; `runIdForBuilding` (`vBuilding`
  infix); `buildingMetadata` (no `target`); `composeBuildingDesignDocPrompt`;
  `composeBuildingBuildPrompt` (in the round, single-view limit, single-building constraint). Reuses
  `metadataPinLines` from `sculpture.mjs`.
- `src/building.test.mjs`: 9 tests, mirrors `sculpture.test.mjs` 1:1 + the single-building assertion.
- Reworded the design-doc negation ("a single front wall or facade") so the proven `FACADE_TOKENS`
  guard (incl. `/front elevation/i`) holds without false positives.

**Verify:** `npm test` → **626 pass / 0 fail** (was 617; +9). Deterministic, no metering.

## Step 2 — BAML BuildingConceptPrompt + regenerate client ✅ (committed)

- `baml_src/conceptart.baml`: added `BuildingConceptPrompt(design_doc, target_blocks, attached)` — a
  sibling of `SculptureConceptPrompt`, frames a whole building in the round, and carries the HARD
  single-building / single-view constraint (exactly ONE building, ONE 3/4 view; explicitly NO
  turnaround / contact sheet / elevation grid / cluster / second building).
- `npm run baml:gen` → wrote 14 files to `baml_client`; `b.request.BuildingConceptPrompt` available.
- `baml_client/` is **gitignored** (regenerated, never committed) — only the `.baml` source is tracked.
  **Deviation from structure.md, which assumed the client was committed.** Anyone building the repo runs
  `npm run baml:gen` (existing convention). Recorded here and in review.

## Step 3 — Wire runner + shim + script ✅ (committed)

- `benchmarks/sculpture/baml-concept.mts`: added `variant === "building"` branch →
  `b.request.BuildingConceptPrompt`.
- `benchmarks/sculpture/run.mjs`: added a `MODES` dispatch (`sculpture` default / `building`) supplying
  the pure builders + run-id + concept variant + framing constants + value-match gate. `--mode`
  CLI flag; per-mode scale default (building 48 vs sculpture 32); `--value-match` ignored + logged in
  building mode. **`--mode sculpture` (default) is behaviorally byte-identical** — the sculpture
  framing constants equal the values used before.
- `package.json`: added `bench:building` script.

**Verify:**
- `npm test` → **636 pass / 0 fail**; `node --check run.mjs` clean.
- Dry render-only check (no metered call, `ANTHROPIC_API_KEY=baml-render-only`): the building concept
  prompt composes through BAML with the building variant and contains all key clauses — single
  building ✓, one 3/4 view ✓, no contact sheet ✓, no cluster ✓, roof ✓, black bg ✓, design doc
  embedded ✓.

## Step 4 — LIVE: concept, GLB, validation, manifest ✅ (committed)

Subject: **"a stone gatehouse with a peaked gable roof and an arched gate"**, scale 48. Run
`015-vBuilding-a-stone-gatehouse-…`. Env sourced from `.env` (`GEMINI_API_KEY`, `MODAL_ENDPOINT_URL`).

- **Design doc** (stage 1): a medieval gatehouse — footprint 28×20, ridge tip at 44, four elevations
  + gable roof, near-monochrome stone palette, single mass. A genuine whole-building doc (not a facade).
- **Concept image** (stage 2): Nano-Banana **pro**, 21.3 s. A clean **single building in one 3/4 view**
  (front arched gate + side slit windows + gable roof). AC #4 satisfied on the concept side.
- **3-D text build + render** (stage 3): 110 ops → **4508 blocks, 0 unmapped**; 3/4 still + 24-frame
  rock turntable rendered. $1.25, 20217/41105 tok. Coherent whole gatehouse (plainer than the doc — the
  text→JSON placement limit the GLB-voxel path closes).
- **TRELLIS GLB** (`benchmarks/sculpture/glb/stone-gatehouse.glb`): 5.02 MB, glTF v2, **99,363 verts /
  143,053 tris**, webp baseColor texture — healthy, comparable to the 7 sculpture GLBs. 295.7 s
  (bulky-angular form succeeded; **no sword-style thin-subject failure**).
- **Single-mass validation:** voxelized @48 (dims 41×48×41, 27,620 cells) → **26-conn = 1 component,
  largestFraction 1.0000** (no duplicate masses / hallucinated connectors — the moai contact-sheet
  failure does NOT recur). 6-conn fragments to 26 components / 0.83 — a surface/thin-shell artifact for
  the E-19 + S-069 passes, not a form defect.
- **Manifest:** added the `stone-gatehouse.glb` row + an honest TRELLIS-handling note (white-background
  caveat; fine-detail blur of slit windows / voussoir ring) to `benchmarks/sculpture/glb/README.md`.

**Honest caveats:** (1) the concept came back on a **white** background despite the prompt's `#000000`
— TRELLIS's rembg coped (single mass), but a black-bg regen is the safer default; (2) fine
architectural detail (slit windows, dark-oak voussoir ring) softens at voxelization — flagged for the
S-069 surgical pass.

## Deviations from plan

- `baml_client/` is gitignored → Step 2 commits only the `.baml` source, not the generated client.
