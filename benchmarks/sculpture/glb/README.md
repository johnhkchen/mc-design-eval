# `benchmarks/sculpture/glb/` — TRELLIS-2 image→3D GLBs (E-09 stage-2 seed)

Real 3-D meshes reconstructed from our `vConcept` **concept images** (3/4 view, solid-black
background — ideal TRELLIS input) by **TRELLIS 2** (Microsoft, image-to-3D) running on Modal. These
exist to feed the **E-15 form-target seam** (`src/form/form-target.mjs` `glbFormTarget`): a real 3-D
form the surgical revision loop can project per-region, instead of the flat single-view concept
silhouette that E-15 measured as too blunt for local edits to climb (see
`[[form-revision-needs-3d-target]]` / the E-15 journal section).

The `.glb` binaries are **gitignored** (~5 MB each, regenerable); this manifest is the durable record.

## The meshes

| file | subject | source concept | verts | tris | size |
|------|---------|----------------|------:|-----:|-----:|
| `koi.glb` | koi fish (the flattened S-curve) | `runs/009-vConcept-a-koi-fish/concept.png` | 95,147 | 143,664 | 4.95 MB |
| `heart.glb` | anatomical heart (the open aortic arch) | `runs/006-…-human-heart/concept.png` | 106,365 | 145,210 | 5.42 MB |
| `dancing-man.glb` | dancing man | `runs/002-vConcept-a-dancing-man/concept.png` | 80,130 | 143,727 | 4.43 MB |
| `moai.glb` | moai statue *(retired as a measurement subject, T-094-01)* | `runs/003-vConcept-a-moai-statue/concept.png` | 96,453 | 142,336 | 5.10 MB |
| `pineapple.glb` | pineapple | `runs/004-vConcept-a-pineapple/concept.png` | 93,159 | 146,617 | 4.93 MB |
| `bow-and-arrow.glb` | bow & arrow | `runs/005-vConcept-a-bow-and-arrow/concept.png` | 99,392 | 141,585 | 5.15 MB |
| `mushroom.glb` | mushroom | `runs/008-vConcept-a-mushroom/concept.png` | 90,522 | 144,487 | 5.08 MB |
| `cottage.glb` | **full building** (E-20 de-risk, one-off helper) | `runs/014-vConcept-a-cottage/concept.png` | 122,530 | 137,257 | 5.88 MB |
| `stone-gatehouse.glb` | **full building** (E-20/S-067 **formal mode**) | `runs/015-vBuilding-…-gatehouse-…/concept.png` | 99,363 | 143,053 | 5.02 MB |
| `church.glb` | **full building — the E-25 CHALLENGE subject** (T-094-01) | `runs/016-vBuilding-a-village-church-with-a-square-bell-tower/concept.png` | 132,892 | 146,118 | 6.47 MB |
| `barn.glb` | **full building — the E-29 FOURTH SUBJECT** (T-116-01) | `runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png` | 138,513 | 141,220 | 6.51 MB |

All: valid binary glTF v2, 1 mesh / 1 primitive, **2 textures** (the baseColor surface texture is what
E-17's material-clean pass mines via the CIE-Lab palette technique), 1 material. Sculptures generated
2026-06-05; cottage + stone-gatehouse 2026-06-06; church 2026-06-10; barn 2026-06-11 (sha256 38de9931c26a…, smoke sign-off incl. the named single-speck deviation in runs/017-…/concept-checklist.md).

**church (T-094-01) — the checklist-gated challenge subject.** Cottage and gatehouse were both used to
develop the E-25 building pipeline, so passing on them cannot prove generalization (Rule 3 needs a
subject the code has never seen). The church was provisioned concept-first via
`provision-concept.mjs` (vConcept building mode, stages 1+2 only — deliberately **no build**), judged
against the **concept sanity checklist** recorded beside the image
(`runs/016-…/concept-checklist.md`; attempt 1 was REJECTED for a thin gold cross finial — the
moai/sword thin-member lesson applied *before* spending the TRELLIS call), then minted here and
smoke-checked with `glb-smoke.mjs` at the working scale 48: dims 48×37×40, 11,423 cells, **26-conn 1
component / largestFraction 1.0000** (6-conn 0.9552, reported only). The gate's controls: gatehouse
PASSES reproducing the numbers above; moai FAILS (3 components, largestFraction 0.5213) — the
fragmentation that retired it. *Gate semantics since T-120-01:* the strict `components === 1` check
became the **speck-tolerant** `speckVerdict` — every non-principal 26-conn component must
individually be ≤ 2% of total cells (`GLB_SMOKE_SPECK_FRACTION`); specks are reported and delegated
to the standing `shellStage` componentStrip, anything larger still fails (the barn's 1-cell speck —
the former named deviation — is in-contract; moai still fails on its duplicate mass). Committed
fixture records live in `glb/smoke/{barn,moai,church}@48.json`; the full registration order is
`docs/knowledge/registration-runbook.md`. Registered in `CHALLENGE_SUBJECTS`
(`benchmarks/sculpture/resemblance.mjs`) as paths+scale only; no material map, build, or skin exists —
the pipeline must later run it untuned.

**TRELLIS reconstructs a full BUILDING (E-20/S-067 — PASSED, mode now formalized).** Two building GLBs
confirm it. `cottage.glb` was the de-risk (one-off `building-concept.mjs` helper). `stone-gatehouse.glb`
is the **formal `vConcept` building mode** (T-067-01): `npm run bench:building` → the BAML
`BuildingConceptPrompt` (single building / single 3/4 view) → Nano-Banana **pro** → TRELLIS. It is a
single coherent medieval gatehouse — gable roof, arched dark-oak gate, cobblestone corner
buttress-pilasters. **Single-mass verified:** voxelized @48 (dims 41×48×41, 27,620 cells) it is **1
connected component (26-conn), largestFraction 1.0000** — no duplicate masses, no hallucinated
connectors (the moai contact-sheet failure does NOT recur). So the "facade only" limit is a text→JSON
*placement* bottleneck, NOT a TRELLIS limit. A building is bulky-angular — the favorable form class — and
does NOT fail like the thin sword. **Honest caveats for the surgical pass (S-069):** (1) pro again
produced a **white** background despite the prompt's #000000 — TRELLIS's internal rembg coped, but a
black-bg regen is the safer default if segmentation ever struggles; (2) fine architectural detail blurs:
the 1×3 slit windows and the dark-oak voussoir arch ring soften at voxelization, and at 6-connectivity
the surface fragments (26 components, largestFraction 0.83) — a thin-shell/surface-roughness artifact the
E-19 cleanliness work + the S-069 surgical pass address, not a form defect.

**Sword excluded — a finding, not a gap.** `runs/007-vConcept-a-sword` (the thinnest subject, an
elongated blade) **fails TRELLIS with HTTP 500 on 3 attempts**. Image→3D has a **thin-subject failure
mode** of its own — the same form class (thin members / "point") that text→JSON foreshortens to a speck.
So the E-17 sweep runs on the **7 subjects with GLBs**; sword is documented, not silently dropped.

## How they were made (reproducible)

```bash
# Contract replicated from plant-model-studio (backend/cmd/generate-models/main.go generateViaModal):
# POST { image:<b64 png>, decimation_target, texture_size, seed } → raw GLB bytes.
set -a; . ./.env; set +a          # MODAL_ENDPOINT_URL (gitignored; never printed)
node benchmarks/sculpture/trellis-glb.mjs <concept.png> glb/<name>.glb
```

- Endpoint: `MODAL_ENDPOINT_URL` (the plant-model-studio TRELLIS-2 Modal deployment), read from the
  gitignored `.env` — **never** committed or printed.
- Params: `decimation_target=150000`, `texture_size=1024`, `seed=42` (the plant pipeline defaults).
- Client: `benchmarks/sculpture/trellis-glb.mjs` (`generateGlb` + `inspectGlb`) — the E-09 stage-2 seed.

## What's next (these are the foundation)

The overnight follow-on uses these two GLBs as a real 3-D target/source: implement `glbFormTarget`
(silhouette rasterization from the build's view) → re-run the E-15 surgical loop and measure whether a
3-D target unlocks the form fidelity the flat concept couldn't; and (the E-09 closure arm) voxelize the
GLB → a `DesignArtifact` and compare head-to-head against the text-JSON build.
