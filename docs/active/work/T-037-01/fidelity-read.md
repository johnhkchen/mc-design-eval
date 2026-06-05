# T-037-01 — Fidelity-vs-concept read: "a moai statue" @ scale 16 (scale study)

vConcept sculpture build, run **`010-vConcept-a-moai-statue`, scale 16** (the slug repeats the
scale-32 run 003; seq 010 + `summary.json.scale=16` disambiguate). AC#2 (fidelity-vs-concept, framed
for the 16/32/48 comparison) + AC#3 (categorical judgment) deliverable. This is the **angular-small**
data point of the S-037 scale study.

## Side by side

- **Concept (Nano Banana, 3/4):**
  [`concept.png`](../../../../benchmarks/sculpture/runs/010-vConcept-a-moai-statue/concept.png)
- **3-D build @16 — canonical 3/4 still (az 45°):**
  [`render-3q.png`](../../../../benchmarks/sculpture/runs/010-vConcept-a-moai-statue/render-3q.png)
- **3-D build @16 — near-frontal turntable frame (az ≈ 5°, best face read):**
  [`turntable/frame.018.png`](../../../../benchmarks/sculpture/runs/010-vConcept-a-moai-statue/turntable/frame.018.png)
- **Scale-32 anchor for comparison (run 003):**
  [`../003-…/render-3q.png`](../../../../benchmarks/sculpture/runs/003-vConcept-a-moai-statue/render-3q.png)

## Faithfulness at scale 16 (one line)

**Faithful form, graceful coarsening** — at ~⅛ the volume budget the build still carries every
signature moai cue (heavy stepped brow, two recessed eye sockets, central nose ridge, set mouth,
flat crown, weathered base); it reads unmistakably as a moai from the front, just blockier and
darker than the concept.

## Where it fell short

1. **Value drift, amplified at low res.** As at scale 32 (and per memory
   *concept-image-not-color-value-preview*), `gray_concrete` renders far **darker** than the pale tuff
   of the concept — and with fewer blocks and less surface variety to break it up, the scale-16 build
   reads near-**black/murky**, especially at the 45° still where self-shadowing compounds it. The
   near-frontal `frame.018` is much clearer (the brow ledges, both eye sockets, the nose, and the
   light cobblestone weathering streaks all resolve).
2. **The 45° hero still is the weaker view** (dark + 3/4 self-shadow merges the face). Not an azimuth
   *failure* like the bow (the moai is front-dominant and still legible at 45°), but the frontal
   turntable frame is the truer read — same lesson as 002 / T-036-04, milder here.
3. **Secondary detail dropped vs the concept** — the carved nostril/mouth channels and weathering are
   coarser; the face leans slightly tiki/totem (the same "busier face" drift noted at scale 32, here
   from *too few* blocks rather than too many recesses).
4. **No topknot (pukao).** The scale-16 *concept* itself drew a bare flat-crowned head (no pukao),
   whereas the scale-32 anchor's concept+build sport an orange topknot. So this difference originates
   at the **concept stage**, not purely from resolution — flagged to keep the cross-scale read honest.

## Scale-16 vs scale-32 (run 003) — the cross-scale note

| dimension | **@16 (run 010)** | **@32 (run 003)** | delta / reading |
|-----------|-------------------|-------------------|-----------------|
| blocks | **732** | 2402 | ~30% of the blocks (more than the ⅛ a pure volume scaling implies — the model packed the smaller head densely) |
| bounds | `[-3,0,-3]..[3,15,5]` → 7×16×9 | `[-5,0,-4]..[5,31,6]` → 11×32×11 | height halved exactly (16 vs 32); width/depth less than halved |
| ops | 37 | (—) | a compact op set still produced all features |
| cost / tok out | $0.6314 / 16752 | $0.5684 / 14273 | ~comparable (slightly *higher* at 16 — resolution did not cut cost) |
| **brow** | survived (stepped ledge) | survived, crisper | graceful |
| **eye sockets** | survived (2 recesses, deepslate) | survived, deeper | graceful |
| **nose ridge** | survived (stubbier) | survived, longer/straighter | graceful, shorter run |
| **mouth** | survived (compressed line) | survived, clearer | graceful |
| **carved torso arms/hands** | **dropped** | present | first detail casualty at 16 |
| **distinct plinth** | reduced to weathered base | clear stepped plinth | softened |
| **topknot (pukao)** | absent (concept-stage) | present (orange) | concept difference, not pure scale |
| value (gray→dark) | **worse** (murkier) | dark, but more relieved | drift amplified by fewer blocks |

**Reading:** the angular hero **degrades gracefully**, exactly the S-037 hypothesis for an angular
form — the *identity-bearing* features (brow/eyes/nose/mouth/monolith silhouette) all survive the jump
from 32→16, while *secondary* detail (carved arms, crisp plinth) is the first to go and the value-drift
murk worsens. Recognizability is essentially preserved; finesse drops a notch. This is the
angular-form curve T-038-01 will set against the organic pineapple (T-037-03) to answer "does fidelity
track resolution differently for angular vs organic?"

## Categorical judgment: **recognizable** (strong)  ·  Category-enum: **Competent** (form **Strong**, detail Weak–Competent)

Immediately a moai: correct monolithic head-over-torso proportion, the brow/eye/nose/mouth quartet
intact, monochrome stone palette carried from concept → doc → build. Not **faithful** because the
value drift murks it and secondary detail is lost; well above **loose**. Mapped to the anchor's project
`Category` vocabulary this is **Competent (form Strong)** — i.e. **on par with the scale-32 anchor's
form judgment, a notch below it on detail/value** — which is the precise, honest scale-16 datum: at
half the linear resolution the angular hero holds its form and loses its finish.

## Run facts (from summary.json — self-contained record)

| field | value |
|-------|-------|
| run id | `010-vConcept-a-moai-statue` · **scale 16** (seq 10) |
| method | `vconcept-sculpture.v1` · model `claude-opus-4-8` |
| build ops / blocks | 37 ops → **732 blocks**, **0 unmapped** (schema-valid) |
| bounds | `[-3,0,-3]..[3,15,5]` → 7(x) × 16(y) × 9(z) |
| palette | gray_concrete (body) · deepslate (eye/brow shadow) · andesite + cobblestone (weathering) |
| concept | Gemini `gemini-3-pro-image-preview`, ~1118-tok prompt, 17.3 s |
| cost / tokens | **$0.6314** · 19982 in / 16752 out |
| wall time | ~(see summary `durationMs`) |
| turntable | 24 frames, front-arc rock (center 45°, ±40°) |
| comparison anchor | run 003 (same subject, scale 32): 2402 blocks, 11×32×11, $0.5684 |

## Note for E-13 curation (T-038-01)

Angular-small leg of the moai triptych. Two findings for assembly: (1) the **45° hero still under-shows
a dark monochrome build** at low resolution — prefer the near-frontal turntable frame as the triptych's
scale-16 hero; (2) the **slug collides** with run 003 — join on seq + `summary.json.scale`, not the
slug. The 16/48 pair completes when T-037-02 (moai@48) lands; this read holds the 16-end with explicit
feature-survival and value-drift columns ready to drop into the triptych. **Nothing changed in the
archetype** — editing the shared view/palette would break breadth & scale comparability.
