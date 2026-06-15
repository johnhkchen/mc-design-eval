# T-036-03 — Fidelity-vs-concept read: "a pineapple" (scale 32)

vConcept sculpture build, run `004-vConcept-a-pineapple`. AC#2 (fidelity-vs-concept) + AC#3
(categorical judgment) deliverable. Evidence lives in the run dir; this file is the read.

## Side by side

- **Concept (Nano Banana, 3/4):**
  [`concept.png`](../../../../benchmarks/sculpture/runs/004-vConcept-a-pineapple/concept.png)
- **3-D build — canonical 3/4 still (az 45°):**
  [`render-3q.png`](../../../../benchmarks/sculpture/runs/004-vConcept-a-pineapple/render-3q.png)
- **3-D build — cardinal face (az ≈ 5°), where the cross-hatch reads best:**
  [`turntable/frame.018.png`](../../../../benchmarks/sculpture/runs/004-vConcept-a-pineapple/turntable/frame.018.png)

## Faithfulness (one line)

**Faithful form and palette, unmistakably a pineapple** — the build realizes the concept's rounded
ovoid body, its warm yellow-body / green-crown analogous palette, and a jagged splaying frond crown;
it reads as *a pineapple* at a glance from every angle, at moderate fidelity exactly as predicted.

## Where it fell short (the two named stressors + form)

1. **Cross-hatch skin — partially conveyed, the main shortfall.** The concept shows a bold, dense
   all-over **orange diamond lattice** ("eyes", each with a little cross). The build *did* place those
   diamonds (the rationale describes a staggered radial grid; `frame.018` shows orange cross/plus
   motifs on the cardinal face) — but they are **sparse and very low-contrast**: `orange_terracotta`
   on `yellow_terracotta` is nearly the same hue *and value*, so the lattice almost vanishes. At the
   fixed 45° hero still the camera sees a **corner**, where the cardinal-face diamonds turn away, so
   `render-3q.png` reads as a mostly plain golden ovoid with faint orange flecks. What carries the
   skin instead is **strong horizontal segmentation banding** (from the stacked disc-fill rows) —
   pineapple-ish, but as *rings*, not the diamond cross-hatch. This is the predicted "texture may
   flatten at block scale" outcome, compounded by the hue/value point (memory:
   *concept-image ≠ color value preview* — the concept oversold the orange contrast).
2. **Spiky crown — a success.** The radiating 1-block-thick green fins read clearly as **jagged
   fronds / a green star silhouette**, splaying up-and-out with lighter `lime_terracotta` tips. The
   thin stepped tips look slightly dotted/floating from some angles (the same thin-element fragility
   the dancing-man's limbs showed), but the crown unmistakably says "pineapple top" — the spike test
   passed.
3. **Rounded body — a success.** The ovoid-of-revolution built from per-row disc fills gives a genuine
   rounded barrel (bounds symmetric `[-8..8]` in x and z), not a square prism — it reads identically
   front/side/3-4, which is the right call for a fruit in the round.

## Categorical judgment: **recognizable**

Immediately and unambiguously a *pineapple*: correct two-mass form (rounded fruit body + radiating
frond crown), faithful warm-analogous palette carried verbatim concept → doc → build, and a real
rounded silhouette. Not **faithful** because the signature **cross-hatch skin only partially survives**
— the diamond lattice is present but low-contrast and sparse, so the dominant surface read is
segmentation banding plus a few orange accents rather than the concept's bold all-over diamonds.
Comfortably above **loose** (no missing or wrong masses; the subject is never in doubt). This **matches
the ticket's "moderate fidelity expected"** prediction precisely — the patterned-organic form lands in
the *middle* of the frontier: better than the articulated figure's angle-fragility, short of the
moai's faithful angular reproduction.

## Run facts (from summary.json — self-contained record)

| field | value |
|-------|-------|
| run id | `004-vConcept-a-pineapple` (seq 4) |
| method | `vconcept-sculpture.v1` · model `claude-opus-4-8` |
| build ops / blocks | **213 ops** → **3314 blocks**, **0 unmapped** (schema-valid) |
| bounds | `[-8,0,-8] .. [8,31,8]` → ~17(x) × 32(y) × 17(z), symmetric rounded body, y = scale |
| style | "Warm Analogous Pineapple — Ripe Fruit in the Round" (model's label) |
| palette | yellow_terracotta (body) · orange_terracotta (diamonds) · green_concrete (crown) · lime_terracotta (tips) |
| concept | Gemini `gemini-3-pro-image-preview`, ~1110-tok prompt, 17.9 s |
| cost / tokens | **$0.9905** · 20931 in / 31040 out |
| wall time | ~382 s |
| turntable | 24 frames, front-arc rock (center 45°, ±40°) |

The **213 ops / 3314 blocks** is the highest op-count in the set so far (moai 35, dancing-man 21) —
the cross-hatch diamond grid + per-row disc fills are op-expensive, which also drove the output tokens
(31040) and cost ($0.99) above the siblings. The pattern *was* attempted in earnest; it under-reads
for contrast reasons, not for lack of effort.

## Note for the scale study (S-037) + curation (T-038-01)

This is the **scale-study hero** (32-block midpoint). Two predictions the bracketing builds can test:
1. **At scale 48** the diamond cross-hatch likely reads *better* — more rows per band give the lattice
   room to register as a grid rather than sparse flecks (though the orange/yellow contrast ceiling
   remains; a denser pattern may still wash out).
2. **At scale 16** the cross-hatch almost certainly *disappears* and the thin frond crown is at risk of
   collapsing to a green cap — the moderate-fidelity pattern is the first thing to go.

Also a **hero-still finding** (echoing T-036-01): the fixed 45° 3/4 still shows a *corner*, which is the
**worst** angle for a cardinal-face pattern — the cross-hatch reads best head-on (`frame.018`, az ≈ 5°).
A figure's signature was off-axis; a pineapple's signature is *on* the cardinals. Curation may prefer a
cardinal turntable frame as the gallery hero for patterned subjects. Recorded as a finding, **not
changed here** (editing `SCULPTURE_VIEW_3Q` would fork the archetype and break breadth comparability).
