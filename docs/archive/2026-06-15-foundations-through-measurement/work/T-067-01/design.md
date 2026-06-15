# T-067-01 — Design: full-building archetype

Decide the shape of the building `vConcept` mode, grounded in Research. The AC has a PURE,
unit-testable core (mode module + BAML concept prompt) and a LIVE tail (generate the concept, provision
+ validate the GLB, record it). This document picks one approach per axis with rationale.

## Decision 1 — A new `src/building.mjs` module (mirror sculpture.mjs), NOT a parameter on sculpture

**Options.**
- (A) Add a `framing: "sculpture"|"building"` parameter threaded through `src/sculpture.mjs`'s prompt
  builders.
- (B) A new sibling module `src/building.mjs` with its own descriptor, scale constants, spec validator,
  scale caps, run-id, metadata, and two prompt builders. **(chosen)**

**Why B.** The sculpture prompts are FROZEN for reproducibility (E-13 runs must replay byte-identical);
threading a flag risks perturbing them and couples two archetypes' versioning. The ticket explicitly
says "sibling of `SculptureConceptPrompt` … + the `src/sculpture.mjs` mode pattern" — a sibling, not a
fork. A building's prompts differ in substance (whole structure in the round, four elevations + roof +
trim + openings; the single-building hard constraint) not just a word, so a separate module reads
clearly and tests independently. The generic helper `metadataPinLines` is already exported from
`sculpture.mjs`; `building.mjs` imports it (DRY) rather than re-implementing the pin formatting.

## Decision 2 — A new BAML `BuildingConceptPrompt`, regenerate the client

**Options.**
- (A) Compose the building concept prompt text in plain JS in `building.mjs` and hand it straight to
  Nano Banana, bypassing BAML.
- (B) Add `BuildingConceptPrompt(design_doc, target_blocks, attached)` to `baml_src/conceptart.baml`
  (sibling of `SculptureConceptPrompt`), regenerate `baml_client`, route via the existing shim. **(chosen)**

**Why B.** The AC names `baml_src/conceptart.baml` as the home and the codebase's invariant is that
concept-art prompt TEXT is versioned in BAML and frozen per function. baml-cli 0.222.0 is installed and
`npm run baml:gen` works; the regenerated `baml_client/` delta is committed like any other generated
artifact. Bypassing BAML would split the concept-prompt source of truth and break the established
transport the shim already implements.

The new function is **single-building / single-view hard-constrained**: it copies the
`SculptureConceptPrompt` 3/4-view + black-background + bold-block + segmentation discipline, and ADDS
the load-bearing clauses — exactly ONE complete building, ONE 3/4 view; explicitly NO turnaround, NO
contact sheet, NO multi-view elevation grid, NO second building or detached annex; show all four sides
implied by the single 3/4 angle (two faces + roof) with bold massing, a clear roof form, framed
openings (windows/doors) and chunky trim/cornice — block-scale only.

## Decision 3 — Building scale envelope

A building is bigger and not cubic. **Chosen:** `BUILDING_SCALE_MIN=16`, `BUILDING_SCALE_MAX=96`,
`BUILDING_DEFAULT_SCALE=48`, with `buildingScaleCaps(scale) → {maxW:scale, maxH:scale, maxD:scale}` —
a cubic longest-edge envelope, same PURE shape as `sculptureScaleCaps`.

**Why.** A whole structure in the round needs more extent than a tabletop object (32); 48 along the
longest edge gives footprint + height room while staying inside what TRELLIS/the render budget handle.
The cap stays cubic because (a) it is the proven, testable shape, (b) the longest edge is what the size
brief and TRELLIS care about, and (c) a non-cubic cap (e.g. height < footprint) would bake an
architectural assumption that excludes towers. The prompt narrates footprint-vs-height proportion in
prose; the numeric cap stays simple. Max 96 leaves headroom for E-20's "high-resolution voxel build"
story without inviting the >64 single-view degradation the sculpture README warns about (the building
will typically run at 48–64).

## Decision 4 — Distinct run-id namespace: `NNN-vBuilding-<slug>`

**Chosen:** `runIdForBuilding(seq, subject) → NNN-vBuilding-<slug>` (vs sculpture's `NNN-vConcept-`).

**Why.** `[[scale-study-cost-and-slug-collision]]`: same-subject runs collide by slug. A distinct
infix keeps building runs from colliding with sculpture runs and makes provenance greppable. The method
id is `vconcept-building.v1` (single-sourced in config), pinned on the artifact for attribution.

## Decision 5 — Runner integration: a guarded `--mode` switch in the existing run.mjs

**Options.**
- (A) Fork a whole `benchmarks/building/run.mjs` (own runs/, own README gallery regen).
- (B) Add `--mode sculpture|building` (default `sculpture`) to `benchmarks/sculpture/run.mjs`: when
  `building`, swap the three pure functions (doc/build prompts + run-id), pass `variant:"building"` to
  the concept shim, and skip the `.v2` value-match path. Default path stays byte-identical. **(chosen)**

**Why B.** The runner's value is its rendering/turntable/summary/README plumbing; forking duplicates
~280 lines that will bit-rot. The 3/4 still + front-arc rock turntable suit a building in the round as
well as a sculpture. A mode switch defaulted to `sculpture` preserves E-13 reproducibility (the only
behavior change is gated behind `--mode building`). Building runs reuse the `runs/` dir but never
collide because the run-id infix differs and `nextSeq()` is shared/monotonic. A `bench:building` script
(`… --mode building`) gives an ergonomic entry point.

The concept shim gains one branch: `variant === "building"` → `b.request.BuildingConceptPrompt`.

## Decision 6 — GLB provisioned into the shared store, validated programmatically

**Chosen:** provision the building GLB into `benchmarks/sculpture/glb/<slug>.glb` (the canonical store
downstream E-20 reads), record it in `benchmarks/sculpture/glb/README.md` with verts/tris/size, and
validate it with `parseGlbMesh` (real glTF v2, sane bounds, triangleCount) + a single-mass check via
`voxelizeGlb` + `connectedComponents` (count ≈ 1, modulo legitimately separate parts). Honestly note any
lost fine architectural detail (windows/cornices voxelize away) for the surgical pass (S-069).

**Why.** The glb manifest is the single source of truth E-20's high-res-voxel story consumes; one store
avoids a second manifest. Validation reuses existing PURE parsers — no new geometry code. The single-
mass check is the programmatic form of the AC's single-subject requirement and the moai-contact-sheet
guard (`[[moai-glb-3-components]]`).

## Decision 7 — Live execution policy (honest about metering)

The concept image and TRELLIS GLB are metered + network-dependent (`.env` must be sourced). The PURE
core (module + BAML + tests) is committed first and is fully self-verifying. The live tail is then
attempted by sourcing `.env`; if Nano Banana or the Modal endpoint is unreachable/erroring, that is
documented honestly in `progress.md`/`review.md` as a follow-up run (the pipeline is in place and
ready), rather than faking artifacts. This mirrors the sword finding: a real outcome, recorded, not a
silent gap.

## Rejected, briefly

- Threading a framing flag through sculpture.mjs (Decision 1A) — perturbs frozen prompts.
- Bypassing BAML for the concept (Decision 2A) — splits the concept-prompt source of truth.
- Non-cubic scale cap — bakes in an architectural assumption, excludes towers, harder to test.
- A forked building runner — duplicates render/summary/README plumbing that will diverge.
- A second GLB manifest under `benchmarks/building/glb/` — fragments the store E-20 consumes.

## What this buys E-20

A reusable `building` mode + a real building GLB in the canonical store, with the single-subject/
single-view discipline baked into the prompt and verified on the mesh — the foundation S-068 (high-res
voxel build) and S-069 (surgical refinement) build on.
