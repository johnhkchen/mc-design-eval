---
id: E-09
title: image-to-3d-voxel-pipeline
type: epic
status: open
priority: high
depends_on: [E-01, E-02, E-04]
spec: "§1, §5, §6, §7, §9"
stories: []
---

## Goal

Replace text-JSON geometry — which has hit diminishing returns (the medium caps it, P6; the detail
ceiling; proportion wobble) — with a **stronger geometry engine** while keeping the LLM where it's
strong (design *reasoning*: grounding, style, palette) and keeping the **measurement instrument**
(palette discipline, survival-buildability, the categorical rubric) intact. New pipeline:

```
LLM design reasoning ─▶ concept-art image ─▶ 3D mesh ─▶ voxelize + palette-match ─▶ DesignArtifact
   (KEEP, our strength)   Nano Banana          TRELLIS 2      the reusable core         (KEEP — §5)
                                                (Modal)                                  ↓
                                                          render · judge · validate · Litematica export
                                                                     (KEEP — E-02/E-04/§6)
```

The LLM stops typing voxel coordinates and instead *directs* a design that a 3D pipeline realizes; we
score the result on the same rubric and the same survival/palette constraints. The artifact contract
(§5) is the unchanged seam — a voxelized mesh is just placements + a palette manifest + style intent.

## Why it matters

Text-JSON was the wrong tool for *geometry* (§1's object — "spatial and material design capability" — was
operationalized as coordinate-emission, which fights the medium). A mesh gives real form for free and
attacks our two weakest dimensions (detail, geometry) head-on. Crucially, our differentiation from a raw
Falcraft-style toy **survives the swap**: we constrain the color-match to the LLM-chosen **survival
palette** (not 100+ arbitrary blocks), run our **buildability validator** on the voxels, and score with
**our rubric**. We keep the instrument; we change the engine. Cost moves from "free `claude -p`
iteration" to metered Modal+Gemini, but at **~3–5¢/run that is negligible** — less than the tokens a
text-JSON build already spent.

## Design principle: the voxelizer is REUSABLE, not hard-locked

The mesh→voxel→palette-match step is built as a **generic core with zero mc-design-eval / DesignArtifact /
Minecraft dependencies**:

- **Core (portable):** `(mesh, palette: [{key, color}], resolution, options) → { dims, cells: [{x,y,z,key}] }`.
  Pure geometry + color science (CIE-LAB nearest-match). Knows nothing about temples, schematics, or our
  schema.
- **Adapter (project-specific):** mc-design-eval supplies the survival-block palette + colors, calls the
  core, and maps `cells → DesignArtifact`. A *different* project (e.g. plant-model-studio voxelizing a
  TRELLIS plant model into a blocky asset) writes its own adapter against the same core, or replicates the
  pattern from our documented interface.

This is the "inherit the DNA but stay portable" requirement: the core is **extractable to a shared package
with no rewrite**, and the porting path for another repo is a documented, first-class concern — not an
afterthought.

## How it runs (the stages)

1. **Concept art** — the finalized design doc (our reference-grounding output) → a Nano Banana (Gemini)
   prompt → a head-on concept-art image. The facade framing (single front elevation) is deliberately the
   *best case* for the next step.
2. **Image → 3D** — POST the concept image to the deployed **TRELLIS 2** endpoint (Modal,
   `MODAL_ENDPOINT_URL`) → a textured GLB mesh. (Background-cleanup like plant-model-studio's rembg if
   needed.) **SAM-3D is a later swap behind this same seam; TRELLIS 2 first, to get going fast.**
3. **Voxelize + palette-match** — the reusable core: voxelize the GLB at a target resolution, CIE-LAB
   match each occupied cell to the LLM-chosen survival palette → a block grid.
4. **Adapter → DesignArtifact** — map the grid to placements + palette manifest + style intent + metadata
   (§5). Everything downstream (render, judge, palette/buildability validators, Litematica export) is
   reused unchanged.

## Scope

**In:**
- The four-stage pipeline above, end to end, producing a valid DesignArtifact from a concept image.
- A **Gemini/Nano Banana image client** and a **TRELLIS 2 HTTP client** (thin; reuse plant-model-studio's
  patterns, but JS — call the Modal endpoint over HTTP, no Go port).
- The **portable voxelizer core** (mesh→voxel→CIE-LAB palette match) + the **mc-design-eval adapter**.
- A **block→LAB color table** built from `minecraft-assets` textures (the Minecraft-specific palette input
  to the matcher; reusable data).
- A new harness **approach** (`vImage3D`) so the result is comparable on the existing rubric, and a clean
  **A/B vs the text-JSON champion** (run 015) on the facade — the experiment that tests the whole premise.
- Secrets via gitignored `.env` (`GEMINI_API_KEY`, `MODAL_ENDPOINT_URL`); names in `.env.example`.

**Out:**
- Replacing the LLM design-reasoning front-end — it stays (it *drives* stage 1).
- SAM-3D, multi-view / multi-image reconstruction, and full-building (non-facade) 3D — later, behind the
  stage-2 seam.
- Publishing the voxelizer as a shared npm/workspace package — this epic makes it *extractable* and
  documents the port; actual extraction is a follow-up if a second consumer commits to it.
- The pairwise/Elo metric (dropped — no judging crowd; the categorical rubric remains the arbiter).

## Candidate stories

- **Concept-art stage** — design doc → Nano Banana prompt → image (Gemini client + prompt composer).
- **Image→3D client** — TRELLIS 2 Modal HTTP client (image → GLB), with optional bg-cleanup.
- **Portable voxelizer core** — generic GLB→voxel→CIE-LAB palette-match; zero project deps; documented API.
- **Block→LAB color table** — survival-block representative colors from `minecraft-assets`.
- **mc-design-eval adapter + `vImage3D` approach** — palette in, voxelizer, DesignArtifact out; wired into
  the harness so render/judge/validate/export reuse unchanged.
- **A/B evaluation** — `vImage3D` vs text-JSON champion (run 015) on the facade, same rubric + palette
  constraint; quantify detail/proportion gain vs any palette/buildability loss.
- **Portability proof** — extractability check: the core builds/runs with no mc-design-eval import; ship a
  porting note (and ideally a minimal non-Minecraft example, e.g. voxelizing a plant GLB) so
  plant-model-studio can adopt the core or replicate it.

## Definition of done

- An end-to-end trial produces a **valid DesignArtifact** via image→3D→voxel, scored on the existing
  categorical rubric and passing (or measurably failing, with counts) the palette + survival-buildability
  validators (§6/§9) — exported to a Litematica schematic like any other artifact.
- The **voxelizer core has no mc-design-eval/Minecraft dependency** (verified) and is exercised through the
  adapter; a porting note shows how another repo consumes it.
- A reproducible **A/B vs the text-JSON champion** on the facade exists, so "is image+voxel stronger than
  text-JSON?" is answered on the rubric, not by impression.

## Notes / risks

- **The failure mode inverts.** Text-JSON was too flat/blocky; mesh-voxelization risks too *lumpy/soft* —
  blurred cornices, misaligned bays (architecture is crisp planes; meshes smear them). The single-view
  **facade** task is the best case and de-risks stage 2, but watch precision.
- **Palette-vs-color tension.** Faithful CIE-LAB color wants many blocks; palette discipline wants few. The
  matcher negotiates this against the LLM's chosen palette — and *how* it does is itself a measurable
  design-quality lever.
- **Buildability is harder to guarantee** for a voxelized mesh (floating cells, single-block connections)
  than for an authored placement list — the validator earns its keep here.
- **Instrument reframes, stays valid.** The object of study shifts from "emit good coordinates" to "give
  good design direction that realizes well" — arguably a *truer* proxy for design capability, and §5/§6/§9
  (the contract, the constraints, the rubric) are untouched.
