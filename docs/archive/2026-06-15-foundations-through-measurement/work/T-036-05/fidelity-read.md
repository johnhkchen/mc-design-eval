# T-036-05 — Fidelity-vs-concept read: "an anatomically correct human heart" (scale 32)

vConcept sculpture build, run `006-vConcept-an-anatomically-correct-human-heart`. AC#2
(fidelity-vs-concept, incl. the organic-curve loss line) + AC#3 (categorical judgment) deliverable.
Evidence lives in the run dir; this file is the read.

## Side by side

- **Concept (Nano Banana, 3/4):**
  [`concept.png`](../../../../benchmarks/sculpture/runs/006-vConcept-an-anatomically-correct-human-heart/concept.png)
- **3-D build — canonical 3/4 still (az 45°):**
  [`render-3q.png`](../../../../benchmarks/sculpture/runs/006-vConcept-an-anatomically-correct-human-heart/render-3q.png)
- **3-D build — turntable frames (none flattering, unlike T-036-01):**
  [`frame.006`](../../../../benchmarks/sculpture/runs/006-vConcept-an-anatomically-correct-human-heart/turntable/frame.006.png) (side) ·
  [`frame.012`](../../../../benchmarks/sculpture/runs/006-vConcept-an-anatomically-correct-human-heart/turntable/frame.012.png) (near-still) ·
  [`frame.018`](../../../../benchmarks/sculpture/runs/006-vConcept-an-anatomically-correct-human-heart/turntable/frame.018.png) (other 3/4)

## Faithfulness (one line)

**Right palette and right parts list, wrong form** — the build keeps the concept's material vocabulary
(red muscle body, yellow coronary grooves, red arteries, blue veins, stone plinth) but loses the
concept's *defining geometry*: the lobed teardrop body became a chunky rectangular block and the
aortic arch — the concept's single strongest "real heart" cue — never built as a loop, so the object
reads as an abstract red-and-lavender shrine rather than an unmistakable heart.

## Where it fell short

1. **Organic-curve loss (AC line):** the concept's smooth lobed ventricular ovoid and the **arching
   aorta with a visible hole through the loop** — the design doc's named "recognizing angle" — did not
   survive voxelization. The body built as a stacked-`fill` rectangular mass with hard right-angle
   sides (no taper to an apex, no asymmetric lobing), and the aorta built as a straight vertical
   red column/slab with **no arch and no hole**. The one curved cue that defines a real heart over a
   cartoon valentine is exactly the one the text-JSON build dropped — the predicted "large gap" landed
   on the highest-value feature.
2. **Color-value / hue gap (memory *concept-image-not-color-value-preview*):** the concept's veins are
   a cool, saturated **blue** that pops the warm red via complement. In-render, `light_blue_terracotta`
   resolves to a **muted grayish-lavender**, not blue — the complementary contrast that made the
   concept legible is gone, and the "blue vein vs red artery" separation the design doc relied on
   doesn't read. The hue survived in name only; the *value/saturation* did not, exactly the failure
   mode the memory note warns about, and it costs the heart a recognizability cue.
3. **What did survive:** the **yellow coronary grooves** are the build's one genuine anatomical tell —
   22 of 67 ops are `yellow_terracotta`, and on the body front they read as snaking channels, the
   "anatomy" signal the doc wanted. Dominant red mass + grooves keep it from being a pure red lump.
4. **Plinth over-weight:** the `polished_andesite` base is a large, coarse gray slab taking ~1/5 of
   the height and visually competing with the (already weak) heart form rather than quietly seating it.
5. **No flattering angle.** Unlike T-036-01 (where a turntable frame rescued the dancing man), **every**
   turntable angle here shows the same blocky mass + stub vessels — there is no azimuth at which the
   aortic loop or the teardrop silhouette appears, because they were never built. This is a *build*
   shortfall, not a *framing* one.

## Categorical judgment: **loose**

The object is coherent, dominantly red, and carries heart-associated parts (muscle body, coronary
grooves, vessel stubs, a couple of blue accents), so **with the concept beside it** a viewer can map
the masses to heart anatomy. **Standalone, it does not read as a heart** — no teardrop body, no aortic
arch, veins not blue — it reads as an abstract red blocky sculpture. That is the definition of
**loose**: the parts are present but the gestalt doesn't land. Above **failed** (it is a clean,
intentional, on-palette object, not noise); clearly below **recognizable** (the dancing man, by
contrast, read as its subject from a good angle — this never does). **This matches the ticket's
explicit prediction**: organic anatomy with smooth lobes and a signature curved loop is the
text-JSON archetype's worst case, and the build confirms it — the harder the organic curvature and the
more a subject depends on one curved feature, the larger the concept→build gap.

## Run facts (from summary.json — self-contained record)

| field | value |
|-------|-------|
| run id | `006-vConcept-an-anatomically-correct-human-heart` (seq 6) |
| method | `vconcept-sculpture.v1` · model `claude-opus-4-8` |
| build ops / blocks | 67 ops (`fill` + `voxel`) → **2648 blocks**, **0 unmapped** (schema-valid) |
| bounds | `[-8,0,-6] .. [8,31,6]` → 17(x) × 32(y) tall × 13(z) deep |
| style | "anatomical-realism" (model's label) |
| palette | red_terracotta (32 ops) · yellow_terracotta (22) · red_concrete (7) · light_blue_terracotta (4) · polished_andesite (2) |
| concept | Gemini `gemini-3-pro-image-preview`, ~1181-tok prompt, 21.2 s |
| cost / tokens | **$0.6406** · 21139 in / 16883 out |
| wall time | ~254 s |
| turntable | 24 frames, front-arc rock (center 45°, ±40°) |

## Note for E-13 curation (T-038-01)

This is the breadth set's **organic-curve floor**: a beautiful, highly-recognizable Nano Banana
concept (the strongest of the run dir so far) paired with the *weakest* build, because the text-JSON
build stage cannot trace a smooth lobed mass or close a curved tube into an arch — it discretizes both
into right-angle blocks. Two transferable findings: (a) **the concept↔build gap widens with organic
curvature** (moai/angular = small gap, heart/organic = large gap — exactly the predicted frontier),
and (b) **`light_blue_terracotta` is a poor "blue" at render value** — if a future build needs a
readable cool accent, a different block should be chosen; recorded as a finding, **not changed here**
(would fork the archetype and break breadth comparability across T-036-*).
