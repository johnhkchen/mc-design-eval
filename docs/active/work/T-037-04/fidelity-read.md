# T-037-04 — Fidelity-vs-concept read: "a pineapple" @ scale 48 (scale study)

Run **013-vConcept-a-pineapple**, **scale 48** (the large end of S-037's organic-hero triptych).
Cross-scale partners: **run 004 @ scale 32** (mid anchor) and **run 012 @ scale 16** (small end,
T-037-03 — completed during this ticket). Slug collides across all three — disambiguated by seq +
`summary.json.scale`.

## Side by side

- Concept (Nano Banana, classic cross-hatched pineapple + dense spiky crown):
  `../../../../benchmarks/sculpture/runs/013-vConcept-a-pineapple/concept.png`
- 3/4 hero render (the canonical view — note: the fixed 45° shows a body **corner**, so the diamond
  grid reads on two faces at an angle):
  `../../../../benchmarks/sculpture/runs/013-vConcept-a-pineapple/render-3q.png`
- Best **cardinal** turntable frame (az ≈ 5°, body face-on — the diamond cross-hatch lattice reads most
  clearly here): `../../../../benchmarks/sculpture/runs/013-vConcept-a-pineapple/turntable/frame.018.png`
- Mid anchor (scale 32 — smooth ovoid, but cross-hatch washed out):
  `../../../../benchmarks/sculpture/runs/004-vConcept-a-pineapple/render-3q.png`
- Small end (scale 16 — coarse blocky body, bold alternating-block texture):
  `../../../../benchmarks/sculpture/runs/012-vConcept-a-pineapple/render-3q.png`

## Faithfulness at scale 48 (one line)

**Strong — the best of the three.** An unmistakable pineapple: faithful rounded ovoid body, faithful
palette, a spiky radiating frond crown with light-green tips, **and — for the first time across the
triptych — a cross-hatch diamond skin that actually reads** as a regular lattice rather than washing
into the body.

## Where it fell short

- **Crown is spidery, not dense.** The concept's crown is a full, packed rosette of broad blades; the
  build's is a compact dark-green core with **thin single-block radiating arms** tipped in lime. It
  reads unambiguously as a pineapple crown, but it is sparser and more "spider-like" than the concept's
  full tuft — the same radiating-arm crown morphology run 004 produced at scale 32 (a model habit, not a
  scale artifact).
- **The diamond grid is patchy, not all-over.** In the concept the cross-hatch tiles the *entire* body
  uniformly. In the build the lattice is concentrated on the lower/mid body faces and thins toward the
  shoulders and the corner edges; from the 45° hero it reads as two clustered diamond patches rather
  than a seamless wrap. Still a clear, legible improvement over scale 32, where it vanished.
- **Fixed-azimuth corner (the run-004 problem recurs).** The 45° hero centres a vertical body *edge*,
  the worst angle for a cardinal-face grid. The pattern is materially clearer in the near-frontal
  turntable frame (frame.018, az ≈ 5°) — cited above. (Azimuth lesson: dancing-man 002 / bow-and-arrow
  T-036-04 / moai@48 011.)
- **Value contrast is adequate, not generous.** The lattice reads because the darker
  orange-terracotta diamonds now sit over enough yellow rows to register, but the orange-on-yellow pair
  is still close in value (memory *concept-image-not-color-value-preview*); the grid is legible rather
  than punchy. Scale bought the pattern *room*, not *contrast*.

## Scale-48 vs scale-32 (run 004), vs scale-16 (run 012) — the cross-scale note

| | scale 16 (run 012) | scale 32 (run 004) | **scale 48 (run 013)** |
|---|---|---|---|
| blocks | 332 | 3314 | **12176** |
| bounds (x×y×z) | 9×17×9 | 17×32×17 | **25×48×25** |
| build ops | — | 213 | **124** |
| tokens out | 15,697 | 31,040 | **17,283** |
| cost | $0.606 | $0.991 | **$0.652** |
| duration | 215 s | 382 s | **229 s** |
| body ovoid | coarse — ~2 stacked cubes, barely rounded | smooth ovoid | **smooth ovoid (best, fullest)** |
| cross-hatch skin | **bold blocky checker reads** (low-res forces big contrast cells) | **washed out — vanishes** (orange≈yellow value) | **diamond lattice reads** (enough rows to register) |
| frond crown | green core + thin radiating arms | spiky radiating fronds | spiky radiating fronds (fuller core) |
| judgment | recognizable→loose / Competent (T-037-03 owns canonical) | recognizable / Competent | **faithful / Strong** |

**Did more budget close the gap? For the organic form, broadly yes — and pointedly, the opposite of the
angular moai@48 (run 011), which *regressed*.** Overall *form* fidelity rises roughly monotonically
with scale (16 coarse → 32 smooth → 48 smooth + detailed); the scale-48 build is the most faithful of
the three and is the only one where the **signature cross-hatch texture survives as a recognizable
diamond grid**. Two observations worth recording:

1. **The pattern is non-monotonic even though the form is monotonic.** Cross-hatch readability went
   **reads (16) → vanishes (32) → reads (48)** — a U-shape. At 16 the model is *forced* into large
   high-contrast cells (a coarse checker) that read as texture; at 32 it lays a fine but low-value
   orange-on-yellow lattice that washes out; at 48 there are finally enough rows for that same fine
   lattice to register as a grid. So the cross-hatch's failure at 32 was a **resolution-and-value**
   problem, and *scale* (more rows) fixed it where scale 32 could not — there is **no hard "organic
   ceiling" for this pattern**, contrary to the more pessimistic prior in Design Decision 4.

2. **Effort still did not scale up with the canvas — but the organic form tolerated it.** Output tokens
   and ops did *not* rise with scale (tokens out 15.7k → **31.0k** → 17.3k; ops 213 → **124**): scale
   **32** drew the *most* model effort, and scale 48 produced ~3.7× the blocks of scale 32 with ~half
   the build ops, via larger volumetric fills. This is the **same under-spend mechanism that wrecked the
   moai@48** — but here it was *harmless*: a rounded fruit built from big fills still reads as a rounded
   fruit, and a repeating surface pattern scales with the surface. The angular moai needed fine *relief*
   (brow, eye sockets) that big fills destroyed; the organic pineapple needed *bulk + a repeating
   texture*, which big fills happily provide. The form's tolerance to coarse spending — not extra
   diligence from the model — is why 48 succeeds for the pineapple and fails for the moai.

Feature-by-feature (concept → build @48): **body** rounded ovoid, faithful (improved over 16, on par
with / slightly fuller than 32); **cross-hatch** diamond lattice, *now reads* (the headline improvement
vs 32's wash-out); **crown** spiky radiating fronds, present and fuller-cored than 32 but still sparser
than the concept's dense tuft; **palette** faithful yellow/orange + green throughout. **Bounds** grew as
expected to 25×48×25 (full 48-tall), confirming the scale knob worked.

## Categorical judgment

**`faithful`** (lower edge) in the four-bucket scale → **`Strong`** (on form) in the project `Category`
enum. Rationale: an immediately, unmistakably recognizable pineapple whose three defining features —
rounded ovoid body, spiky green crown, **and the cross-hatch diamond skin** — all read, with a faithful
palette. It clears run 004's **`recognizable` / Competent** specifically because the signature texture
that failed at 32 succeeds here. It is held off a clean top mark only by the spidery (vs dense) crown
and the patchy (vs all-over) grid — craft gaps, not identity gaps.

This is the **commissioned measurement, not a tuned result** (Design Decision 6): the build exited
clean, schema-valid, 0 unmapped, `scale==48`, and was **not** re-run for looks. A faithful result at the
large end *is* the datum just as a coarse one would have been.

## Run facts (self-contained, from summary.json)

- runId `013-vConcept-a-pineapple`, seq **13**, **scale 48**, date 2026-06-05, model `claude-opus-4-8`.
- blocks **12176**, unmapped **0**; bounds `[-12,0,-12]..[12,47,12]` → 25(x) × 48(y) × 25(z).
- 124 build ops; tokens 20,801 in / 17,283 out; cost **$0.6518**; duration 228,501 ms (~229 s).
- concept `gemini-3-pro-image-preview`, 4541 prompt chars, 18,674 ms; turntable 24-frame rock
  (center 45°, amplitude 40°).
- palette: yellow/orange body (`yellow_terracotta` / `orange_terracotta` family) + green crown.
  note "T-037-04 scale-48 study".
