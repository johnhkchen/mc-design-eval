# T-036-06 — Fidelity-vs-concept read: "a sword" (scale 32)

vConcept sculpture build, run `007-vConcept-a-sword` (seq landed at **007**, not 006 — a concurrent
sibling claimed 006; the run id slug `a-sword` is the real join key). AC#2 (fidelity-vs-concept) +
AC#3 (categorical judgment) deliverable. Evidence lives in the run dir; this file is the read.

## Side by side

- **Concept (Nano Banana, 3/4):**
  [`concept.png`](../../../../benchmarks/sculpture/runs/007-vConcept-a-sword/concept.png)
- **3-D build — canonical 3/4 still (az 45°):**
  [`render-3q.png`](../../../../benchmarks/sculpture/runs/007-vConcept-a-sword/render-3q.png)
- **3-D build — turntable frames (front-arc rock):**
  [`turntable/frame.000.png`](../../../../benchmarks/sculpture/runs/007-vConcept-a-sword/turntable/frame.000.png) ·
  [`turntable/frame.012.png`](../../../../benchmarks/sculpture/runs/007-vConcept-a-sword/turntable/frame.012.png)

## Faithfulness (one line)

**Faithful structure and palette, unmistakable cruciform** — the build reproduces the concept's
point-up sword almost part-for-part: a tall `iron_block` blade with a `polished_andesite` fuller, a
`dark_oak_log` crossguard with `gold_block` end caps, a wrapped grip, a gold pommel, and a `stone`
plinth; the dominant-vertical-crossed-by-a-short-bar silhouette reads as *a sword* instantly from the
3/4, side, and frontal arc.

## Where it fell short

1. **No sharp point.** The design doc planned a blade "tapering to 1×1 at the tip"; the build instead
   *steps* — a 3-wide fullered base section abruptly narrows to a 1-wide white column for the upper
   half and ends in a flat, slightly notched top rather than a true taper to a point. The taper reads
   as a single step, not a gradient — the predicted "thinning loss" of an iconic thin object, showing
   up at the tip rather than along the whole blade.
2. **Fuller reads edge-on, not centered front.** The `polished_andesite` groove was specified down the
   blade's *front face*; at the canonical 45° azimuth it presents on the blade's flank as a gray
   stripe, so the "fuller down the middle" cue is weaker in the still than in the concept (which shows
   it dead-centre). The turntable's near-frontal arc recovers it.
3. **Slightly asymmetric guard/blade join.** The blade sits a touch off-centre over the crossguard and
   the two gold caps catch light unevenly, so the cross is a hair less crisply symmetric than the
   concept's perfectly mirrored guard. Voxel chunkiness, not a structural error.
4. **Blocky everything (expected at 166 blocks).** A sword at scale 32 is mostly air around a 3-thick
   blade; the guard caps and pommel are 2×2 cubes rather than shaped finials. Recognizability is
   intact; fine metalwork is not. (Lowest block count of the series so far — 166 vs moai's 3414 — and
   correctly so: a thin planar object spends almost no volume.)

## Categorical judgment: **recognizable** (strong, near-faithful)

Immediately and unambiguously *a sword*: all five named masses present in the right proportions
(blade ≈⅔ height, perpendicular guard, grip, pommel, plinth), the cruciform silhouette dominant, and
the steel/leather/gold palette carried **verbatim** from concept → doc → build. It sits at the top of
`recognizable`, just short of **faithful** only because the blade never resolves a true point (steps
instead) and the front-face fuller turns edge-on at the fixed still angle. Well above **loose/failed**.
This **meets** the ticket's predicted "reads recognizably with some thinning loss" — and confirms the
form note's thesis: a *flat/planar* thin object (the blade) voxelizes far more gracefully than the
round arrow (T-036-05), with the loss isolated to the tip taper rather than the whole shaft.

## Run facts (from summary.json — self-contained record)

| field | value |
|-------|-------|
| run id | `007-vConcept-a-sword` (seq 7; 006 taken by a concurrent sibling) |
| method | `vconcept-sculpture.v1` · model `claude-opus-4-8` |
| build ops / blocks | 10 ops → **166 blocks**, **0 unmapped** (schema-valid) |
| bounds | `[-4,0,-1] .. [4,31,1]` → 9(x) wide × 32(y) tall × 3(z) deep — exactly the doc's plan |
| orientation | point-up vertical (uses the full 32 y-budget; cruciform reads at 45°) |
| palette | iron_block (blade) · polished_andesite (fuller) · dark_oak_log (grip/guard) · gold_block (caps/pommel) · stone (plinth) |
| concept | Gemini `gemini-3-pro-image-preview`, ~1140-tok prompt, 18.7 s |
| cost / tokens | **$0.4663** · 22298 in / 9677 out |
| wall time | ~165 s |
| turntable | 24 frames, front-arc rock (center 45°, ±40°) |

## Note for E-13 curation (T-038-01)

A clean data point at the *easy* end of the thin-object axis: a planar blade keeps its silhouette
where a round shaft (arrow) loses it. Two recurring cross-subject signals reappear here: (a) **the
fixed 45° still under-shows a front-face feature** (the fuller goes edge-on) — same azimuth-dependence
the dancing-man build flagged; and (b) **models step rather than taper** thin tips at this scale.
Recorded as findings, **not changed here** (editing the shared `SCULPTURE_VIEW_3Q`/prompt would fork
the archetype and break breadth comparability across T-036-*).
