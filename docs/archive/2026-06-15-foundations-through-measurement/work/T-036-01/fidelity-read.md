# T-036-01 — Fidelity-vs-concept read: "a dancing man" (scale 32)

vConcept sculpture build, run `002-vConcept-a-dancing-man`. AC#2 (fidelity-vs-concept) + AC#3
(categorical judgment) deliverable. Evidence lives in the run dir; this file is the read.

## Side by side

- **Concept (Nano Banana, 3/4):**
  [`concept.png`](../../../../benchmarks/sculpture/runs/002-vConcept-a-dancing-man/concept.png)
- **3-D build — canonical 3/4 still (az 45°):**
  [`render-3q.png`](../../../../benchmarks/sculpture/runs/002-vConcept-a-dancing-man/render-3q.png)
- **3-D build — best turntable frame (near-frontal, az ≈ 5°):**
  [`turntable/frame.018.png`](../../../../benchmarks/sculpture/runs/002-vConcept-a-dancing-man/turntable/frame.018.png)
- **3-D build — side profile:**
  [`turntable/frame.006.png`](../../../../benchmarks/sculpture/runs/002-vConcept-a-dancing-man/turntable/frame.006.png)

## Faithfulness (one line)

**Faithful palette and concept intent, recognizable dance** — the build realizes the concept's
asymmetric dance pose (one leg planted, the other high-kicked out, arms flung up/out) and its exact
warm-earth + gold palette; the figure reads unmistakably as *a dancing man* from the front and 3/4.

## Where it fell short

1. **The canonical 3/4 still under-sells it.** At the archetype's fixed `SCULPTURE_VIEW_3Q` azimuth
   (45°), the high-kicked leg cantilevers *away* from the camera (to −x) and visually merges with the
   planted leg into a single brown column, so `render-3q.png` reads as a stiffer, more static figure
   than the build actually is. The **turntable rescues the read**: `frame.018` (near-frontal) shows
   the splayed kick, the bent knee + gold shoe, and both gold-cuffed arms raised — a clearly dynamic
   dancer. This is an *angle/framing* shortfall, not a *build* shortfall.
2. **Stiff from the pure side** (`frame.006`): the limbs overlap into a near-monolithic column and the
   motion collapses — expected for a figure whose dance is a front/3-4 read (the design doc itself
   says "side: a clear lean and trailing kicked leg" but at block scale the lean is modest).
3. **Limb breakup / chunkiness.** At 1073 blocks (vs moai's 3414) the thin 2–3-block limbs and 2×2
   hand/foot caps are blocky and read more as mittens/boots than hands/feet — the predicted
   articulated-figure voxel cost. Recognizability survives; finesse does not.
4. **Pose differs from the concept in detail.** Concept: right arm out with a gold fist, left arm
   lower; one leg kicked to the side. Build: *both* arms raised, leg high-kicked to −x. Same dance
   *gesture vocabulary*, different specific pose — a coherent reinterpretation, not a copy (consistent
   with the single-view grounding: the model rebuilt the dance in the round rather than tracing one
   view).

## Categorical judgment: **recognizable** (strong)

Clearly and immediately a *dancing man*: correct masses (head, tilted torso, four limbs, plinth), a
genuine asymmetric dance pose (planted + cantilevered high-kick, asymmetric arms), and a faithful
dominant/supporting/accent palette carried verbatim from concept → doc → build. Not **faithful** only
because the build reinterprets the concept's specific pose and the fixed 3/4 still angle under-shows
the motion; well above **loose/failed**. This **meets and slightly exceeds** the ticket's predicted
"stiff but recognizable figure" — the articulated-figure form type survives voxelization better than
feared *when viewed from a flattering angle*, while confirming the stress: the dance is angle-fragile.

## Run facts (from summary.json — self-contained record)

| field | value |
|-------|-------|
| run id | `002-vConcept-a-dancing-man` (seq 2) |
| method | `vconcept-sculpture.v1` · model `claude-opus-4-8` |
| build ops / blocks | 21 ops → **1073 blocks**, **0 unmapped** (schema-valid) |
| bounds | `[-12,0,-4] .. [7,32,2]` → ~20(x) wide (the −x cantilever kick) × 32(y) tall × 7(z) deep |
| style | "heroic-cartoon figurative" (model's label) |
| palette | terracotta · red_terracotta · brown_terracotta · orange_terracotta · gold_block |
| concept | Gemini `gemini-3-pro-image-preview`, ~1114-tok prompt, 18.1 s |
| cost / tokens | **$0.4945** · 20399 in / 11363 out |
| wall time | ~181 s |
| turntable | 24 frames, front-arc rock (center 45°, ±40°) |

## Note for E-13 curation (T-038-01)

This subject is a data point that the **fixed hero-still azimuth is subject-dependent**: a figure
whose signature is a cantilevered limb can present its weakest silhouette at 45°. Curation may want to
pick the best turntable frame as the gallery hero for figures, or the archetype may later tune the
still azimuth per subject. Recorded as a finding, **not changed here** (would fork the archetype and
break breadth comparability across T-036-*).
