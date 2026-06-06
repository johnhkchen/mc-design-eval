# T-067-01 — Review: full-building archetype

Handoff for a human reviewer. What changed, test coverage, open concerns. The ticket adds the third
`vConcept` framing — a **building** mode (whole structure in the round) — and provisions + validates its
TRELLIS GLB, with the single-subject / single-view discipline baked into the prompt and verified on the
mesh.

## Acceptance criteria — status

1. **Full-building concept prompt + design-doc mode (sibling of `SculptureConceptPrompt` + the
   `src/sculpture.mjs` pattern).** ✅ `src/building.mjs` (pure mode surface) + `BuildingConceptPrompt` in
   `baml_src/conceptart.baml`. Single building, single 3/4 view, bold massing/roof/openings/trim — a
   HARD constraint in the prompt (no turnaround/contact sheet/grid/cluster).
2. **A building concept image generated (under a run dir).** ✅
   `runs/015-vBuilding-…-gatehouse-…/concept.png` (Nano-Banana pro).
3. **Building TRELLIS GLB provisioned + recorded + validated as real glTF v2; TRELLIS handling
   confirmed; lost detail noted.** ✅ `benchmarks/sculpture/glb/stone-gatehouse.glb` (5.02 MB, glTF v2,
   99,363 verts / 143,053 tris); recorded in `glb/README.md`. Bulky-angular → succeeded in 295.7 s, no
   thin-sword failure. Lost fine detail (slit windows, voussoir ring) noted honestly.
4. **Single-subject check: one building; GLB ≈1 connected component.** ✅ Concept is one building;
   GLB voxelized @48 is **1 component (26-conn), largestFraction 1.0000** — no duplicate masses, no
   hallucinated connectors.
5. **Pure mode/prompt logic unit-tested; `npm test` green.** ✅ `src/building.test.mjs` (9 tests);
   full suite **636 pass / 0 fail**.

## Files changed

**Created**
- `src/building.mjs` — PURE building mode: `VCONCEPT_BUILDING` descriptor; scale consts (16/96/48);
  `BUILDING_DEFAULTS` / `BUILDING_VIEW_3Q` / `BUILDING_TURNTABLE`; `assertBuildingSpec`;
  `buildingScaleCaps`; `runIdForBuilding` (`vBuilding` infix); `buildingMetadata` (no `target`);
  `composeBuildingDesignDocPrompt`; `composeBuildingBuildPrompt`. Imports `metadataPinLines` from
  `sculpture.mjs` (generic). SDK/GL-free.
- `src/building.test.mjs` — 9 unit tests mirroring `sculpture.test.mjs` + the single-building assertion
  + a `vBuilding`-distinct-from-`vConcept` run-id assertion.
- `docs/active/work/T-067-01/{research,design,structure,plan,progress,review}.md`.
- Run artifacts under `benchmarks/sculpture/runs/015-vBuilding-…/` (design-doc, concept.png,
  artifact.json, render-3q.png, turntable/, summary.json, transcripts). The `.glb` binary is gitignored.

**Modified**
- `src/config.mjs` — `VCONCEPT_BUILDING_METHOD_ID = "vconcept-building.v1"` (single-sourced).
- `baml_src/conceptart.baml` — `BuildingConceptPrompt` (sibling; single-building / single-view).
- `benchmarks/sculpture/baml-concept.mts` — `variant === "building"` branch.
- `benchmarks/sculpture/run.mjs` — `MODES` dispatch (`sculpture` default | `building`); `--mode` flag;
  per-mode scale default; value-match gated to sculpture; summary fields from the mode descriptor.
- `package.json` — `bench:building` script.
- `benchmarks/sculpture/glb/README.md` — `stone-gatehouse.glb` row + TRELLIS-handling note.
- `benchmarks/sculpture/README.md` — gallery regenerated to include the building run.

**Not committed (intentionally):** `baml_client/` is gitignored — regenerated via `npm run baml:gen`
(repo convention). Reviewers/builders must run it to get `b.request.BuildingConceptPrompt`.

## Test coverage

- **Strong / deterministic:** all of `building.mjs`'s pure surface — descriptor identity, scale bounds +
  caps, spec validation (accept/trim/reject + `building:` prefix), run-id namespace, metadata pins (incl.
  the never-`target` invariant), and both prompt builders (subject/scale/caps, embedded doc, single-view
  limit, single-building constraint, building orientation, no-facade-token guard). Mirrors the proven
  sculpture test 1:1.
- **Generated-artifact check:** `npm run baml:gen` exits 0 and emits `BuildingConceptPrompt`; a
  render-only dry check (no metered call) confirmed the composed concept text carries every key clause.
- **Integration (manual, metered — not in CI):** the full live `bench:building` run + TRELLIS provision +
  GLB validation, verified by hand and recorded in the manifest + progress.md.
- **Gaps:** the runner (`run.mjs`) and the `.mts` shim are not in the `src/**` test glob (consistent with
  the existing sculpture runner — they are the I/O/live seam). The `--mode sculpture` default-path
  invariant is argued by inspection (the building branch is fully gated; sculpture framing constants equal
  the prior literals), not by a regression test. A cheap future guard: snapshot the sculpture
  design-doc/build prompt text.

## Open concerns / TODOs for downstream E-20 stories

- **White concept background.** Nano-Banana pro produced a white field despite the prompt's `#000000`.
  TRELLIS's rembg coped (single clean mass), but a black-bg regen is the safer default; consider a
  retry-on-non-black or a stronger black-bg clause if a future building segments poorly. (Same caveat the
  cottage de-risk hit.)
- **Fine-detail loss at voxelization.** Slit windows and the dark-oak voussoir arch ring soften; 6-conn
  surface fragmentation (0.83) is a thin-shell artifact. This is exactly the target of **S-069** (surgical
  refinement) and the E-19 cleanliness metrics — flagged, not fixed here.
- **Two building GLBs now exist** (`cottage.glb` one-off de-risk + `stone-gatehouse.glb` formal mode).
  **S-068** (high-resolution voxel build from a building GLB) should consume `stone-gatehouse.glb` as the
  formal-mode source.
- **Shared `runs/` + gallery.** Building runs live in `benchmarks/sculpture/runs/` and appear in the
  sculpture gallery README. Harmless (all are `vConcept`), but if E-20 grows, a dedicated
  `benchmarks/building/` with its own gallery is a clean future split.

## Risk assessment

Low. The pure core is fully tested and isolated; the only edits to shared, reproducibility-sensitive code
(`run.mjs`, the shim) are gated behind `--mode building` / `variant === "building"`, leaving the frozen
sculpture/facade paths byte-identical. The live tail is additive provisioning. `npm test` green at 636.
